import argparse
import sys
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET


def read_file(path, words):
    tree = ET.parse(path)
    root = tree.getroot()
    for entry in root.iter("e"):
        lemmas = entry.findall("lg/l")
        assert len(lemmas) == 1, "only 1 <l> in an <lg>"
        lemma = lemmas[0]
        translations = []
        for mg in entry.findall("mg"):
            for tg in mg.findall("tg"):
                for t in tg.findall("t"):
                    text = t.text
                    if text:
                        translations.append({"pos": t.get("pos"), "t": t.text})

        words[lemma.text].append({
            "pos": lemma.get("pos"),
            "translations": translations,
        })


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="src folder or a single xml file")

    args = parser.parse_args()

    return args


def handle_args(args):
    inp = Path(args.input)
    if not inp.exists():
        sys.exit(f"no such file or directory: {inp}")

    if inp.is_file():
        return [inp]
    else:
        return list(inp.iterdir())


def main():
    files = handle_args(parse_args())

    words = defaultdict(list)
    for f in files:
        read_file(f, words)

    lines = []
    for word, translations in words.items():
        col2 = ""
        for tr in translations:
            col2 += ", ".join(t["t"] for t in tr["translations"])
        lines.append(f'{word}\t{col2}')
    lines.sort()
    for line in lines:
        print(line)


if __name__ == "__main__":
    raise SystemExit(main())
