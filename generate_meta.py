#!/usr/bin/env python
"""Generate tries from all giellatekno dictionaries, and store them in
static/tries/, as gzipped, jsonified tries that will be used by the frontend.
Additionally, create a metadata file src/lib/dict_metas.js with information
about the dictionaries, such as the number of lemmas, file size, etc."""

# dictionary meta data structure:
# s: file size of minified, uncompressed .xml file
# f: filename of the minified, compressed, .gz file
# n: number of lemmas in dictionary
# h: sha1 hash of the minified .xml file
# l1: language 1 (iso code)
# l2: language 1 (iso code)

import argparse
import concurrent.futures
import gzip
import json
import multiprocessing
import os
import re
import subprocess
import sys
import traceback
import xml.etree.ElementTree as ET
from contextlib import contextmanager
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from time import perf_counter_ns
from hashlib import sha1

from trie import Trie

VALID_LANG = set([
    "chr", "crk", "dan", "deu", "eng", "est", "fin", "fit", "fkv", "gle",
    "hdn", "hun", "izh", "kal", "koi", "kom", "kpv", "lav", "liv", "mdf",
    "mhr", "mns", "mrj", "mul", "myv", "nob", "non", "olo", "otw", "rom",
    "ron", "rup", "rus", "sjd", "sje", "sjt", "sma", "sme", "smj", "smn",
    "sms", "som", "spa", "srs", "swe", "udm", "vep", "vot", "vro", "yrk",
])


def warn(*msg):
    print("Warning: ", *msg, file=sys.stderr)


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
                "The number of cpus to use. If unspecified, defaults to most "
                f"(={most}). {self.CHOOSE_BETWEEN_STR}"
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


def langcode_to_3iso(langcode):
    if len(langcode) == 3:
        return langcode
    if langcode == "se":
        return "sme"
    elif langcode == "no":
        return "nob"


def find_gut_root():
    proc = subprocess.run(["gut", "show", "config"], capture_output=True, text=True)
    if proc.returncode != 0:
        raise Exception("running gut failed. (gut not installed?)")
    for line in proc.stdout.splitlines(keepends=False):
        if line.startswith("Root directory:"):
            line = line[15:].strip()
            gutroot = Path(line).resolve()
            if not gutroot.exists:
                msg = ("gut root specified, but folder doesn't exist "
                       "(you can try to reinitialze gut)")
                raise FileNotFoundError(msg)
            if not gutroot.is_dir():
                msg = ("gut root specified, but the path it points to is "
                       "not a directory (..for some reason) "
                       "(you can try to reinitialze gut)")
                raise NotADirectoryError(msg)
            return gutroot
    msg = ("root directory not found in config that gut reported."
           " (you can try to re-initialize gut)")
    raise Exception(msg)


def find_gt_dictionaries():
    """Yield all ((lang1, lang2), entry) tuples, where
    (lang1, lang2) are languages, and entry is a Path to
    that directory of all dictionaries in giellalt that
    follows the "dict-xxx-yyy" format, where xxx and yyy
    are language codes.
    """
    GUTHOME = find_gut_root()

    giellalt_dir = GUTHOME / "giellalt"
    if not giellalt_dir.exists():
        return
    if not giellalt_dir.is_dir():
        warn("Your gut root directory has errors: Expected <gutroot>/giellalt "
             "to be a directory, but it isn't.")
        return

    # in git, dictionaries are named "dict-xxx-yyy"
    dict_re = re.compile(r"^dict-(?P<lang1>[a-z]{3})-(?P<lang2>[a-z]{3})$")
    for entry in giellalt_dir.iterdir():
        if m := dict_re.fullmatch(entry.name):
            lang1, lang2 = m["lang1"], m["lang2"]
            if not entry.is_dir():
                warn("Your gut folder has errors: "
                     f"Expected $GUTHOME/giellalt/{m.string} to be a "
                     "directory, but it isn't!")
                continue
            if (lang1 not in VALID_LANG) or (lang2 not in VALID_LANG):
                print(f"skipping {m.string}, as one of the two language codes "
                      "were not recognized")
                continue
            if lang2 != "mul":
                yield (lang1, lang2), entry
            else:
                print(f"skipping {lang1}-{lang2}, because we don't know which "
                      "specific lang2 we want ('{lang2}')")
                # lang2 == "mul", so we need to somehow figure out which
                # langs there are..
                pass


def should_include_translation(l_node, t_node):
    """Should this translation be included, or no?"""
    lpos = l_node.get("pos")
    tpos = t_node.get("pos")

    tx = t_node.text
    if (tx is None or tx.strip() == "" or tx == "None" or "_" in tx):
        # shouldn't happen, but in real world dict files, it does...
        return False

    if (tpos is None) and (t_node.attrib.get("t_type") == "expl"):
        # <t> has no pos, but it has attribute t_type == "expl", so include it
        return True

    if lpos == tpos:
        # <l> pos == <t> pos, so always include this <t>
        return True

    if tpos == "Phrase" or lpos == "Phrase":
        # <t> pos is "Phrase", always included
        return True

    if (lpos == "Pr" and tpos == "Po") or (lpos == "Po" and tpos == "Pr"):
        # Pr and Po are okay both ways
        return True

    # TODO legge til Det -> Adv ???
    # if lpos == "Det"

    l_is_adv = lpos == "Adv"
    t_is_adv = tpos == "Adv"
    t_is_interj = tpos == "Interj"
    l_is_interj = lpos == "Interj"

    if (l_is_adv and t_is_interj) or (l_is_interj and t_is_adv):
        return True

    return False


def parse_gtxml_entry(e, lang2):
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
                lang = tg.attrib.get("{http://www.w3.org/XML/1998/namespace}lang")
                if lang is not None and lang != lang2:
                    # not target lang we're after
                    continue
                t_elements = []
                for t in tg.findall("t"):
                    if should_include_translation(l_node, t):
                        t_elements.append(t.text)
                if t_elements:
                    re = tg.find("re")
                    if re is not None:
                        translations += f"({re.text}) "
                    translations += ", ".join(t_elements)
    else:
        # numbered, so we enumerate from 1
        for n, mg in enumerate(mgs, start=1):
            current_translations = ""
            for tg in mg.findall("tg"):
                lang = tg.get("{http://www.w3.org/XML/1998/namespace}lang")
                if lang is not None and lang != lang2:
                    # not target lang we're after
                    continue
                t_elements = []
                for t in tg.findall("t"):
                    if should_include_translation(l_node, t):
                        t_elements.append(t.text)
                if t_elements:
                    re = tg.find("re")
                    if re is not None:
                        translations += f"({re.text}) "
                    current_translations += ", ".join(t_elements)

            if current_translations:
                translations += f" {n}. {current_translations}"

    if not translations:
        raise ValueError("no translations")
    return lemma, pos, translations.strip()


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
            for (lang1, lang2), dictionary_path in dictionaries.items():
                meta_entry = metas.find_by_langs(lang1, lang2)
                future = pool.submit(function, lang1, lang2, dictionary_path, meta_entry)
                futures[future] = (lang1, lang2, dictionary_path)

            completed = concurrent.futures.as_completed(futures)
            for i, future in enumerate(completed):
                exc = future.exception()
                if exc is not None:
                    print(f"{lang1}{lang2} failed!")
                    print(exc)
                    print(traceback.format_exc())
                else:
                    new_or_updated_meta_entry = future.result()
                    metas.apply(new_or_updated_meta_entry)
                    dictionary = futures.pop(future)
                    lang1, lang2 = dictionary[0], dictionary[1]

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


def parse_gtdict(lang_src_folder, check_unique_lemmas=False, lang2=""):
    """Parses all dictionary files, and
    Returns a dictionary of (lemma, pos) -> list of translation strings"""
    lemmas = defaultdict(list)

    for file in lang_src_folder:
        root = ET.parse(file)
        for e in root.iter("e"):
            try:
                lemma, pos, translations = parse_gtxml_entry(e, lang2=lang2)
            except ValueError as err:
                # something wrong when parsing this <e>, so we skip it
                #s = ET.tostring(e, encoding="unicode")
                #print(f"skipped (or failed) entry ({err}):\n{s}", file=sys.stderr)
                continue
            # if check_unique_lemmas and (lemma, pos) in lemmas:
            #     other_file = lemmas[(lemma, pos)][0]
            #     msg = f"warning: multiple <e> with same (lemma, pos): ({lemma}, {pos})"
            #     if file == other_file:
            #         msg += f" file: {file}"
            #     else:
            #         msg += f" file1: {other_file}, file2: {file}"
            #     print(msg)
            lemmas[(lemma, pos)].append(translations)

    return lemmas


def lemmas_into_trie(lemmas):
    trie = Trie()
    for (lemma, pos), translations in lemmas.items():
        if lemma is None:
            continue
        node = trie._find_exact_node(lemma)
        if node is None:
            trie.insert(lemma, [(pos, "...".join(translations))])
        else:
            for translation in translations:
                if node.data is not None:
                    node.data.append((pos, translation))
                else:
                    node.data = [(pos, translation)]
    return trie


def run(cmd, echo=False):
    if echo:
        print(cmd)
    return subprocess.run(
            cmd, text=True, shell=True, capture_output=True)


def process_gtdict(lang1, lang2, dictionary_path, meta_entry):
    src_dir = dictionary_path / "src"
    if not src_dir.is_dir():
        warn(f"When processing dictionary ({lang1}, {lang2}): dictionary has "
             "no src/ folder")
        return

    if meta_entry is None:
        meta_entry = {}

    last_modified, dict_meta, xml_source_files = read_gt_dictionary(src_dir)
    #print(f"dict: ({lang1}, {lang2}). {last_modified=}, {datetime.fromisoformat(meta_entry['d'])=}")

    if ("d" in meta_entry) and (last_modified < datetime.fromisoformat(meta_entry["d"])):
        print(f"skipping ({lang1}, {lang2}) (not modified since last run)")
        return

    lemmas = parse_gtdict(xml_source_files, check_unique_lemmas=False, lang2=lang2)

    if not lemmas:
        print(f"no lemmas in ({lang1}, {lang2}), skipping")
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

    print(f"done processing {lang1}-{lang2}")
    return meta_entry


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clean", action="store_true")
    parser.add_argument("--ncpus", action=NCpus)
    parser.add_argument("--only")
    # parser.add_argument("--check-unique-lemmas", action="store_true")

    args = parser.parse_args()

    if args.only:
        args.only = set(args.only.split(","))

    return args


def main():
    args = parse_args()

    if args.clean:
        run("rm -f static/tries/*", echo=True)
        run("rm -f src/lib/dict_metas.js", echo=True)
        exit(0)

    metas = Metas.from_metafile(Path("./src/lib/dict_metas.js"))
    Path("./static/tries").mkdir(parents=True, exist_ok=True)

    t0 = perf_counter_ns()
    dictionaries = dict(find_gt_dictionaries())

    if args.only:
        only_dicts = {}
        for langpair in args.only:
            langpair = (langpair[0:3], langpair[3:6])
            if langpair in dictionaries:
                only_dicts[langpair] = dictionaries[langpair]
            else:
                warn(f"Language pair ({langpair[0]}, {langpair[1]}) requested "
                     "throgh --only, but that dictionary does not exist on "
                     "this system.")
        dictionaries = only_dicts

    if args.ncpus == 1:
        for (lang1, lang2), dictionary_path in dictionaries.items():
            meta = metas.find_by_langs(lang1, lang2)
            updated_meta = process_gtdict(lang1, lang2, dictionary_path, meta)
            metas.apply(updated_meta)
    else:
        run_in_parallel(process_gtdict, args.ncpus, dictionaries, metas)

    metas.write_metafile(Path("./src/lib/dict_metas.js"))

    t1 = perf_counter_ns()
    t = (t1 - t0) // 1_000_000_000
    print(f"all done (in {t}s)")


if __name__ == "__main__":
    raise SystemExit(main())
