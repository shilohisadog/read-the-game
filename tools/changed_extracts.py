"""Stage only the extracts whose bytes differ from the published copy.

    python3 tools/changed_extracts.py LOCAL_DIR LISTING_JSON STAGE_DIR

LISTING_JSON is `aws s3api list-objects-v2 --prefix extract/` output. R2's ETag for
a single-part upload is the MD5 of the body, so an equal MD5 means the same bytes.
A multipart ETag (it carries a `-`) cannot be compared and is staged. Prints the
counts, so a run shows whether the comparison is doing any work.
"""
import hashlib, json, os, shutil, sys


def published_etags(listing):
    out = {}
    for o in listing.get("Contents") or []:
        key = o.get("Key", "")
        if key.startswith("extract/"):
            out[key[len("extract/"):]] = o.get("ETag", "").strip('"')
    return out


def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def stage(local, etags, dest):
    """Copy every changed or new file into dest; return the counts."""
    counts = {"unchanged": 0, "changed": 0, "new": 0, "incomparable": 0}
    os.makedirs(dest, exist_ok=True)
    for name in sorted(os.listdir(local)):
        src = os.path.join(local, name)
        if not os.path.isfile(src):
            continue
        tag = etags.get(name)
        if tag is None:
            kind = "new"
        elif "-" in tag:
            kind = "incomparable"
        elif tag == md5_of(src):
            counts["unchanged"] += 1
            continue
        else:
            kind = "changed"
        counts[kind] += 1
        shutil.copy2(src, os.path.join(dest, name))
    return counts


def main(argv):
    local, listing_path, dest = argv[1:4]
    raw = open(listing_path).read().strip()
    etags = published_etags(json.loads(raw) if raw else {})
    c = stage(local, etags, dest)
    print(f"  extracts: {c['unchanged']} unchanged, {c['changed']} changed, "
          f"{c['new']} new, {c['incomparable']} incomparable — "
          f"{c['changed'] + c['new'] + c['incomparable']} to upload")
    if len(etags) > 100 and c["unchanged"] == 0:
        print("::warning::no published extract matched its MD5 — the ETag is not a "
              "plain MD5 here, so every extract is being uploaded")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
