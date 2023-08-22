#!/usr/bin/env python

# dictionary meta data structure:
# s: file size of minified, uncompressed .xml file
# f: filename of the minified, compressed, .gz file
# n: number of lemmas in dictionary
# h: sha1 hash of the minified .xml file
# l1: language 1 (iso code)
# l2: language 1 (iso code)

import argparse
import json
import subprocess
import xml.etree.ElementTree as ET
import os
import gzip
import concurrent.futures
import multiprocessing
import traceback
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from time import perf_counter_ns
from hashlib import sha1

from trie import Trie

VALID_LANG = set([
    "chr", "crk", "dan", "deu", "eng", "est", "fin", "fkv", "gle",
    "hdn", "hun", "izh", "kal", "koi", "kpv", "lav", "liv", "mdf", "mhr",
    "mns", "mrj", "myv", "nob", "non", "olo", "otw", "rom", "ron",
    "rup", "rus", "sjd", "sjt", "sma", "sme", "smj", "smn", "sms", "som",
    "spa", "srs", "swe", "udm", "vep", "vot", "vro", "yrk",
])


# os.sched_getaffinity(0) is not available for MacOS, solution for it from
# https://stackoverflow.com/questions/74048135/alternatives-to-os-sched-getaffinity-for-macos
def _get_core_count() -> int:
    try:
        # NOTE: only available on some Unix platforms
        return len(os.sched_getaffinity(0))  # type: ignore[attr-defined]
    except AttributeError:
        return multiprocessing.cpu_count()


N_AVAILABLE_CPUS = _get_core_count()
CPU_CHOICES = {
    **{str(n): n for n in range(1, N_AVAILABLE_CPUS + 1)},
    **{
        "some": int(N_AVAILABLE_CPUS * 0.25),
        "half": int(N_AVAILABLE_CPUS * 0.5),
        "most": int(N_AVAILABLE_CPUS * 0.75),
        "all": N_AVAILABLE_CPUS,
    },
}


class NCpus(argparse.Action):
    """An argparse action for adding the common argument of "number of cpus"
    to use.

    Example usage:
        parser = argparse.ArgumentParser()
        parser.add_argument("--ncpus", action=NCpus)

        This will expose an optional argument --ncpus, which can have values
        of 1-<number of cpus on system>, as well as "some", "half", "most", and
        "all", which corresponds to 25%, 50%, 75% and 100% of the cpus,
        respectively. The parsed argument is always an int in range 1-<n cpus>.
    """

    def __init__(self, option_strings, dest, nargs=None, **kwargs):
        if nargs is not None:
            raise ValueError("nargs not allowed")

        some, half = CPU_CHOICES["some"], CPU_CHOICES["half"]
        most, all = CPU_CHOICES["most"], CPU_CHOICES["all"]
        kwargs["default"] = most
        self.CHOOSE_BETWEEN_STR = (
            f"Choose between 1-{N_AVAILABLE_CPUS}, "
            f"some ({some}), half ({half}), most ({most}) or all ({all})."
        )
        if "help" not in kwargs:
            kwargs["help"] = (
                "The number of cpus to use. If unspecified, defaults to using "
                f"as many cpus as it can. {self.CHOOSE_BETWEEN_STR}"
            )
        super().__init__(option_strings, dest, **kwargs)

    def __call__(self, parser, namespace, values, option_string=None):
        try:
            value = CPU_CHOICES[values]
        except KeyError:
            parser.error(
                f"argument '{option_string}': invalid choice "
                f"'{values}'. {self.CHOOSE_BETWEEN_STR}"
            )
        setattr(namespace, self.dest, value)


def find_gthome():
    try:
        gthome = Path(os.environ["GTHOME"])
    except KeyError:
        exit("GTHOME environment variable not set, don't know where to find dictionary sources, aborting")

    if not gthome.is_dir():
        exit("GTHOME set to something that is not a directory, aborting")

    return gthome


def log(msg):
    def wrapper(f):
        def decorated(*args, **kwargs):
            print(msg, end="...", flush=True)
            t0 = perf_counter_ns()
            result = f(*args, **kwargs)
            t1 = perf_counter_ns()
            t = (t1 - t0) / 1_000_000
            print(f"done ({t:.2f}ms)")
            return result
        return decorated
    return wrapper


@contextmanager
def logg(msg):
    print(msg, end="...", flush=True)
    t0 = perf_counter_ns()

    message = "done"

    class Thing:
        def done(self, msg):
            nonlocal message
            message = msg

    try:
        yield Thing()
    finally:
        t1 = perf_counter_ns()
        t = (t1 - t0) / 1_000_000
        print(f"{message} ({t:.2f}ms)")


def find_gt_dictionaries(GTHOME):
    dictionaries = []
    for entry in (GTHOME / "words" / "dicts").iterdir():
        if not entry.is_dir():
            continue
        if len(entry.name) != 6:
            # only directories whose name is 6 characters long
            continue
        if (entry.name[0:3] not in VALID_LANG) or (entry.name[3:6] not in VALID_LANG):
            continue
        dictionaries.append(entry)

    return dictionaries


def parse_gtxml_entry(e):
    """Parses an <e> in a GT .xml dictionary file, and
    Returns lemma, pos, translations"""
    l_node = e.find("lg/l")
    if l_node is None:
        # so here we have an <e> without an inner <lg><l></l></lg>
        # shouldn't happen, but it does, so we ignore it if it happens
        raise ValueError("<e> without inner <lg><l></l></lg>...")
    lemma = l_node.text
    pos = l_node.get("pos")

    translations = ""

    mgs = e.findall("mg")
    if len(mgs) == 0:
        raise ValueError("<e> has no <mg> (no translations)")
    if len(mgs) == 1:
        # not numbered, just 1 meaning group
        for mg in mgs:
            # could there be more than 1 tg? sure, and each one may or may not
            # have a <re>
            for tg in mg.findall("tg"):
                re = tg.find("re")
                if re is not None:
                    translations += f"({re.text}) "
                t_elements = []
                for t in tg.findall("t"):
                    if t.text is None or t.text.strip() == "":
                        # shouldn't happen, but in the dict files, it does..
                        continue
                    t_elements.append(t.text)
                translations += ", ".join(t_elements)
    else:
        # numbered, so we enumerate from 1
        for n, mg in enumerate(mgs, start=1):
            translations += f" {n}. "
            for tg in mg.findall("tg"):
                re = tg.find("re")
                if re is not None:
                    translations += f"({re.text}) "
                t_elements = []
                for t in tg.findall("t"):
                    if t.text is None or t.text.strip() == "":
                        # shouldn't happen, but in the dict files, it does..
                        continue
                    t_elements.append(t.text)
                translations += ", ".join(t_elements)

    return lemma, pos, translations.strip()


def langcode_to_3iso(langcode):
    if len(langcode) == 3:
        return langcode
    if langcode == "se":
        return "sme"
    elif langcode == "no":
        return "nob"


class Metas:
    def __init__(self, data):
        self.data = data

    @classmethod
    def from_metafile(cls, path):
        try:
            with open(path) as f:
                file_contents = f.read()
        except FileNotFoundError:
            return cls([])
        else:
            data = json.loads(file_contents[len("export default "):])
            assert isinstance(data, list)
            return cls(data)

    def write_metafile(self, path):
        assert isinstance(self.data, list)
        dump = json.dumps(self.data, separators=(",", ":"))
        with open("src/lib/dict_metas.js", "w") as f:
            f.write(f"export default {dump}")

    def find_by_langs(self, lang1, lang2):
        for meta in self.data:
            if meta["l1"] == lang1 and meta["l2"] == lang2:
                return meta

    def find_by_ref(self, meta):
        for m in self.data:
            if meta is m:
                return m

    def apply(self, other):
        """Merge in a meta object. That is, if other doesn't exist in our list,
        then append it, otherwise do nothing. If other is None, do nothing."""
        if other is not None:
            existing = self.find_by_ref(other)
            if not existing:
                self.data.append(other)


def run_in_parallel(function, max_workers, dictionaries, metas):
    futures = {}

    try:
        with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as pool:
            for dictionary in dictionaries:
                lang1, lang2 = dictionary.name[0:3], dictionary.name[3:6]
                meta_entry = metas.find_by_langs(lang1, lang2)
                future = pool.submit(function, dictionary, meta_entry)
                futures[future] = dictionary

            completed = concurrent.futures.as_completed(futures)
            for i, future in enumerate(completed):
                new_or_updated_meta_entry = future.result()
                metas.apply(new_or_updated_meta_entry)
                dictionary = futures.pop(future)
                lang1, lang2 = dictionary.name[0:3], dictionary.name[3:6]

                exc = future.exception()
                if exc is not None:
                    print(f"{lang1}{lang2} failed!")
                    print(exc)
                    print(traceback.format_exc())
    except concurrent.futures.ProcessPoolExecutor:
        print("Processing was terminated unexpectedly")
    except KeyboardInterrupt:
        print("Cancelled by user")


def process_meta_xml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    meta = {}

    public = root.find("public")
    if public is None:
        meta["public"] = False
    else:
        public = public.text
        if public.lower() == "yes":
            meta["public"] = True
        else:
            meta["public"] = False

    descriptions = {}
    description_elements = root.findall("description")

    for el in description_elements:
        lang = el.attrib.get("{http://www.w3.org/XML/1998/namespace}lang")
        desc = "".join(el.itertext())
        if lang is not None:
            lang = langcode_to_3iso(lang)
            descriptions[lang] = desc
        else:
            descriptions["default"] = desc

    meta["description"] = descriptions

    return meta


def read_gt_dictionary(lang_src_directory):
    last_modified = datetime.fromtimestamp(0)
    dict_meta = None
    file_list = []

    for file in lang_src_directory.glob("*.xml"):
        if file.name == "meta.xml":
            dict_meta = process_meta_xml(file)
            continue

        modified_at = file.stat().st_mtime_ns / 1_000_000_000
        modified_at = datetime.fromtimestamp(modified_at)
        if modified_at > last_modified:
            last_modified = modified_at
        file_list.append(file)

    return last_modified, dict_meta, file_list


def parse_gtdict(lang_src_folder, check_unique_lemmas=False):
    """Parses all dictionary files, and
    Returns a dictionary of (lemma, pos) -> translation string"""
    lemmas = {}

    for file in lang_src_folder:
        root = ET.parse(file)
        for e in root.iter("e"):
            try:
                lemma, pos, translations = parse_gtxml_entry(e)
            except ValueError:
                # something wrong when parsing this <e>, so we skip it
                continue
            # if check_unique_lemmas and (lemma, pos) in lemmas:
            #     other_file = lemmas[(lemma, pos)][0]
            #     msg = f"warning: multiple <e> with same (lemma, pos): ({lemma}, {pos})"
            #     if file == other_file:
            #         msg += f" file: {file}"
            #     else:
            #         msg += f" file1: {other_file}, file2: {file}"
            #     print(msg)
            lemmas[(lemma, pos)] = translations

    return lemmas


def lemmas_into_trie(lemmas):
    trie = Trie()
    for (lemma, pos), translations in lemmas.items():
        if lemma is None:
            continue
        node = trie._find_exact_node(lemma)
        if node is None:
            trie.insert(lemma, [(pos, translations)])
        else:
            if node.data is not None:
                node.data.append((pos, translations))
            else:
                node.data = [(pos, translations)]
    return trie


def run(cmd, echo=False):
    if echo:
        print(cmd)
    return subprocess.run(
            cmd, text=True, shell=True, capture_output=True)


def process_gtdict(directory_path, meta_entry):
    lang1, lang2 = directory_path.name[0:3], directory_path.name[3:6]

    src_dir = directory_path / "src"
    if not src_dir.is_dir():
        return

    if meta_entry is None:
        meta_entry = {}

    last_modified, dict_meta, xml_source_files = read_gt_dictionary(src_dir)

    if ("d" in meta_entry) and (last_modified >= datetime.fromisoformat(meta_entry["d"])):
        print(f"skipping {lang1}{lang2} (not modified since last run)")
        return

    lemmas = parse_gtdict(xml_source_files, check_unique_lemmas=False)

    if not lemmas:
        print(f"no lemmas in {lang1}{lang2}, skipping")
        return

    trie = lemmas_into_trie(lemmas)
    json_bytes = trie.into_json().encode("utf-8")
    gzipped_bytes = gzip.compress(json_bytes)
    filename = f"{lang1}-{lang2}.json.gz"

    with open(f"static/tries/{filename}", "wb") as f:
        f.write(gzipped_bytes)

    meta_entry.update({
        "n": len(lemmas),
        "cs": len(gzipped_bytes),
        "ds": len(json_bytes),
        "f": filename,
        "h": sha1(json_bytes).hexdigest(),
        "d": last_modified.isoformat(timespec="seconds"),
        "l1": lang1,
        "l2": lang2,
    })

    print(f"done processing {lang1}{lang2}")
    return meta_entry


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clean", action="store_true")
    parser.add_argument(
        "--ncpus", action=NCpus, default="most"
    )
    parser.add_argument("--only")
    # parser.add_argument("--check-unique-lemmas", action="store_true")

    args = parser.parse_args()
    return args


def main():
    GTHOME = find_gthome()

    args = parse_args()

    if args.clean:
        run("rm -f static/tries/*", echo=True)
        run("rm -f src/lib/dict_metas.js", echo=True)
        exit(0)

    onlylangs = set() if not args.only else set(args.only.split(","))

    metas = Metas.from_metafile(Path("./src/lib/dict_metas.js"))
    print("metas:", metas)
    Path("./static/tries").mkdir(parents=True, exist_ok=True)

    t0 = perf_counter_ns()
    dictionaries = list(find_gt_dictionaries(GTHOME))
    if onlylangs:
        dictionaries = [d for d in dictionaries if d.name in onlylangs]

    if args.ncpus == 1:
        for dictionary in dictionaries:
            lang1, lang2 = dictionary.name[0:3], dictionary.name[3:6]
            meta = metas.find_by_langs(lang1, lang2)
            updated_meta = process_gtdict(dictionary, meta)
            metas.apply(updated_meta)
    else:
        run_in_parallel(process_gtdict, args.ncpus, dictionaries, metas)

    metas.write_metafile(Path("./src/lib/dict_metas.js"))

    t1 = perf_counter_ns()
    t = (t1 - t0) // 1_000_000_000
    print(f"all done (in {t}s)")


if __name__ == "__main__":
    raise SystemExit(main())
