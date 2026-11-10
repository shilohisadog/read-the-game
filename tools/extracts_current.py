#!/usr/bin/env python3
"""
Was every extract built from its game's CURRENT raw?

    python3 tools/extracts_current.py POINTER_DIR EXTRACT_DIR

POINTER_DIR holds `raw/{game}/latest.json` as the bucket has them now, fetched
into an empty directory so nothing cached can stand in for them. EXTRACT_DIR
holds `{game}.json`. Each extract names the digests it was built from in
`game.src`; that must equal the game's pointer. Exit 1 on any mismatch, on an
extract whose game has no pointer, or when nothing was compared.

Why: derive.yml restored `ingest/raw` from a cache and `aws s3 sync` does not
re-download a same-sized file that is newer at the source, so an amended
pointer stayed stale and the weekly published extracts from superseded raw.
Found 2026-11-10; see the pull step in derive.yml.
"""
import json
import pathlib
import sys


def pointers(root):
    out = {}
    for p in pathlib.Path(root).glob("raw/*/latest.json"):
        out[p.parent.name] = json.loads(p.read_text())
    return out


def check(pointer_dir, extract_dir):
    """Return (compared, problems)."""
    ptr = pointers(pointer_dir)
    compared, problems = 0, []
    for f in sorted(pathlib.Path(extract_dir).glob("*.json")):
        gid = f.stem
        src = json.loads(f.read_text()).get("game", {}).get("src")
        if gid not in ptr:
            problems.append(f"{gid}: an extract with no pointer")
        elif src != ptr[gid]:
            problems.append(f"{gid}: built from {src}, current raw is {ptr[gid]}")
        compared += 1
    return compared, problems


def main(argv):
    compared, problems = check(argv[1], argv[2])
    if compared == 0:
        print("::error::no extract was compared, so this checked nothing")
        return 1
    if problems:
        print(f"::error::{len(problems)} of {compared} extracts were not built "
              "from their game's current raw")
        for p in problems[:20]:
            print(f"  {p}")
        return 1
    print(f"  {compared} extracts, each built from its game's current raw")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
