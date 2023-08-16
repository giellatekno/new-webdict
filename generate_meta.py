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
from collections import defaultdict
from pathlib import Path
from time import perf_counter_ns
from shutil import which
from shutil import copy2 as copyfile


def check_programs_installed():
    for program in ["xmllint", "sha1sum", "gzip"]:
        if which(program) is None:
            print(f"{program} not found on system")
            exit(2)


def print_dict(d, level=0):
    for k, v in d.items():
        if not isinstance(v, dict):
            print(" " * level + f"{k}: {v}")
        else:
            print(" " * level + f"{k}:")
            print_dict(v, level=level + 2)


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


def run(cmd):
    return subprocess.run(
            cmd, text=True, shell=True, capture_output=True)


@log("minimizing xmls")
def minimize_xmls(originals):
    files = defaultdict(dict)
    for file in originals:
        min_file = file.with_suffix(".min.xml")
        if not min_file.exists():
            run(f"xmllint --noblanks {file} > {min_file}")
        files[min_file]["ds"] = min_file.stat().st_size
    return files


@log("calculating sha1sums")
def run_sha1sums(files, folder):
    sums = run(f"sha1sum {folder}/*.min.xml").stdout.split("\n")[:-1]
    for line in sums:
        sha1sum, filename = line.split("  ")
        files[Path(filename)]["h"] = sha1sum


@log("counting lemmas")
def count_words(files):
    for f in files:
        root = ET.parse(f)
        files[f]["n"] = sum(1 for _ in root.iter("l"))


@log("copying zips to static/tries")
def copy_gzipped_files(files, originals_folder):
    for file in files:
        zipped = file.with_suffix(".xml.gz")
        Path("static/tries").mkdir(parents=True, exist_ok=True)
        copyfile(zipped, "static/tries")


@log("cleaning up")
def clean(originals_folder):
    run(f"rm -f {originals_folder}/*.min*")
    run("rm -f src/lib/dict_metas.js")
    run("rm -f static/tries/*")


@log("gzipping xmls")
def gzip_files(files, folder):
    run(f"rm -f {folder}/*.gz")
    run(f"gzip -k {folder}/*.min.xml")
    for zipped in Path(folder).glob("*.gz"):
        min_xml_file = zipped.with_suffix("")
        files[min_xml_file]["cs"] = zipped.stat().st_size


@log("finding originals")
def find_originals(original_folder):
    folder = Path(original_folder)
    if not folder.is_dir():
        print(f"{folder} is not a directory")

    originals = []
    for file in folder.iterdir():
        if file.name.endswith("-lr-trie.xml"):
            originals.append(file)

    if not originals:
        print("error: no *-lr-trie.xml files in originals-folder")
        exit(1)

    return originals


def gather_dates(files):
    # TODO this depends on when the dictionary was generated,
    # and we don't have that information now, so will have
    # to accomodate the original build steps
    pass


@log("writing metafile src/lib/dict_metas.js")
def write_metafile(files):
    dict_list = []
    for filename, d in files.items():
        lang1, lang2, *_ = filename.name.split("-")
        d["f"] = filename.name + ".gz"
        d["l1"] = lang1
        d["l2"] = lang2
        dict_list.append(d)

    dump = json.dumps(dict_list, separators=(",", ":"))
    with open("src/lib/dict_metas.js", "w") as f:
        f.write(f"export default {dump}")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--originals", default="original_tries")
    parser.add_argument("--only-clean", action="store_true")

    args = parser.parse_args()
    return args


def main():
    check_programs_installed()

    args = parse_args()

    clean(args.originals)

    if args.only_clean:
        exit(0)

    originals = find_originals(args.originals)
    files = minimize_xmls(originals)
    gzip_files(files, folder=args.originals)
    run_sha1sums(files, folder=args.originals)
    count_words(files)
    gather_dates(files)
    copy_gzipped_files(files, args.originals)
    write_metafile(files)


if __name__ == "__main__":
    raise SystemExit(main())
