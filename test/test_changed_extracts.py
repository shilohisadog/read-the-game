"""tools/changed_extracts.py stages exactly the files whose bytes differ."""
import hashlib, json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
import changed_extracts as C  # noqa: E402


def md5(b):
    return hashlib.md5(b).hexdigest()


class Staging(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.local = os.path.join(self.tmp, "extract")
        self.dest = os.path.join(self.tmp, "stage")
        os.makedirs(self.local)
        self.files = {"1.json": b'{"a":1}', "2.json": b'{"b":2}', "3.json": b'{"c":3}', "4.json": b'{"d":4}'}
        for n, b in self.files.items():
            with open(os.path.join(self.local, n), "wb") as f:
                f.write(b)

    def listing(self, tags):
        return {"Contents": [{"Key": "extract/" + n, "ETag": '"%s"' % t} for n, t in tags.items()]
                + [{"Key": "catalog.json", "ETag": '"x"'}]}

    def test_only_differing_and_new_files_are_staged(self):
        tags = {"1.json": md5(self.files["1.json"]),    # same bytes
                "2.json": md5(b"older bytes"),           # changed
                "3.json": "abc-2"}                       # multipart: cannot compare
        etags = C.published_etags(self.listing(tags))   # 4.json is not published yet
        counts = C.stage(self.local, etags, self.dest)
        self.assertEqual(counts, {"unchanged": 1, "changed": 1, "new": 1, "incomparable": 1})
        self.assertEqual(sorted(os.listdir(self.dest)), ["2.json", "3.json", "4.json"])
        with open(os.path.join(self.dest, "2.json"), "rb") as f:
            self.assertEqual(f.read(), self.files["2.json"])

    def test_keys_outside_extract_are_ignored(self):
        self.assertNotIn("catalog.json", C.published_etags(self.listing({})))

    def test_an_empty_listing_uploads_everything(self):
        listing = os.path.join(self.tmp, "listing.json")
        open(listing, "w").close()
        self.assertEqual(C.main(["x", self.local, listing, self.dest]), 0)
        self.assertEqual(len(os.listdir(self.dest)), 4)


if __name__ == "__main__":
    unittest.main()
