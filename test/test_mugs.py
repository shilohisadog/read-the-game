#!/usr/bin/env python3
"""
`builders/mugs.py` — the headshots, and the trap the whole file exists for.

⛔⛔⛔ A MISSING HEADSHOT IS NOT A 404. Ask the league's CDN for a player who does
not exist and it answers **302 to `/mugs/nhl/default-skater.png`**, which answers
**200** with a good 11,875-byte grey silhouette, byte-identical for every club.
So the two obvious implementations are both wrong in the same direction:

  - `curl -L` / urllib's default follows the redirect and downloads a stranger;
  - a status check sees 200 and calls it a headshot.

Either ships a card showing a generic outline under a named player, with every
gate green. These tests drive the two cases directly, with an injected transport,
because the only honest way to check "what does it do when there is no picture"
is to hand it the answer the CDN actually gives.

⚠️ NO NETWORK. The transport is a dict of canned replies.
"""
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("mugs", ROOT / "builders" / "mugs.py")
mugs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mugs)

from PIL import Image                                    # noqa: E402


def png(colour):
    """A real image, so `shrink` is exercised rather than mocked."""
    b = io.BytesIO()
    Image.new("RGBA", (336, 336), colour).save(b, format="PNG")
    return b.getvalue()


REAL = png((12, 34, 56, 255))
PLACEHOLDER = png((200, 200, 200, 255))          # what the CDN serves for nobody


def doc(**over):
    d = {"season": 2026, "qualify": 41, "target": 0.7, "range": {}, "need": {},
         "clubs": {"PIT": [{"p": 111, "nm": "Real", "t": "PIT", "gp": 5, "g": 2}],
                   "WSH": [{"p": 222, "nm": "Missing", "t": "WSH", "gp": 5, "g": 1}]}}
    d.update(over)
    return d


class Harness:
    """A canned CDN. `replies` maps a URL to (status, body)."""

    def __init__(self, replies):
        self.replies = replies
        self.asked = []

    def __call__(self, url):
        self.asked.append(url)
        return self.replies.get(url, (404, b""))


def world(real=REAL, missing=(302, b"")):
    return {
        mugs.DEFAULT: (200, PLACEHOLDER),
        f"{mugs.HOST}/20252026/PIT/111.png": (200, real),
        f"{mugs.HOST}/20252026/WSH/222.png": missing,
    }


class Base(unittest.TestCase):
    def setUp(self):
        self.dir = pathlib.Path(tempfile.mkdtemp())
        (self.dir / "players.json").write_text(json.dumps(doc()))

    def run_with(self, replies):
        h = Harness(replies)
        rep = mugs.run(self.dir, fetch=h, sleep=lambda _s: None)
        after = json.loads((self.dir / "players.json").read_text())
        return rep, after, h

    def flag(self, after, pid):
        for rows in after["clubs"].values():
            for r in rows:
                if r["p"] == pid:
                    return r.get("mug")
        raise AssertionError(f"no row for {pid}")


class TheTrap(Base):
    def test_a_redirect_is_NOT_followed_and_means_no_headshot(self):
        """⛔ The case that would have shipped a stranger's face."""
        rep, after, _ = self.run_with(world())
        self.assertEqual(rep["fetched"], 1)
        self.assertEqual(rep["none"], 1)
        self.assertEqual(self.flag(after, 111), 1)
        self.assertIsNone(self.flag(after, 222),
                          "a player with no headshot must carry no mug flag")
        self.assertFalse((self.dir / "mug" / "222.webp").exists())

    def test_a_200_THAT_IS_THE_PLACEHOLDER_is_also_no_headshot(self):
        """⛔⛔ THE SECOND DOOR INTO THE SAME ROOM. Today the CDN redirects. A CDN
        that stops redirecting and serves the default directly would defeat a
        check that only knew about redirects — so the body is compared too."""
        rep, after, _ = self.run_with(world(missing=(200, PLACEHOLDER)))
        self.assertEqual(rep["none"], 1, "the placeholder was accepted as a face")
        self.assertIsNone(self.flag(after, 222))

    def test_the_placeholder_is_READ_each_run_rather_than_typed(self):
        """⭐ A hash in the source would be a measurement frozen into a literal.
        It is fetched, so it is asked for — and if the default itself moved, the
        run still works off the redirect rule."""
        _, _, h = self.run_with(world())
        self.assertIn(mugs.DEFAULT, h.asked)

    def test_an_unreadable_default_does_not_take_the_run_down(self):
        w = world()
        w[mugs.DEFAULT] = (503, b"")
        rep, after, _ = self.run_with(w)
        self.assertEqual(self.flag(after, 111), 1, "the real headshot still lands")
        self.assertEqual(rep["none"], 1, "and the redirect rule still catches the other")


class WhatItWrites(Base):
    def test_the_image_is_a_112px_webp(self):
        """The size is the measurement in the module header: 3.5KB against the
        source's 178,650."""
        self.run_with(world())
        f = self.dir / "mug" / "111.webp"
        self.assertTrue(f.exists())
        im = Image.open(f)
        self.assertEqual(im.format, "WEBP")
        self.assertEqual(im.size, (mugs.SIDE, mugs.SIDE))
        self.assertLess(f.stat().st_size, 20000, "a headshot this big defeats the point")

    def test_transparency_survives_the_resize(self):
        """⚠️ The league's mugs are CUT-OUTS. Flattening them onto white would put
        a white box on a tinted card — the defect that only looking finds, so it
        is asserted instead."""
        b = io.BytesIO()
        Image.new("RGBA", (336, 336), (0, 0, 0, 0)).save(b, format="PNG")
        self.run_with(world(real=b.getvalue()))
        im = Image.open(self.dir / "mug" / "111.webp").convert("RGBA")
        self.assertEqual(im.getpixel((0, 0))[3], 0, "the alpha channel was lost")

    def test_bytes_that_are_not_an_image_are_refused_rather_than_written(self):
        rep, after, _ = self.run_with(world(real=b"<html>nope</html>"))
        self.assertIsNone(self.flag(after, 111))
        self.assertFalse((self.dir / "mug" / "111.webp").exists())
        self.assertEqual(rep["none"], 2)


class TheCache(Base):
    def test_a_second_run_asks_the_league_for_nothing(self):
        self.run_with(world())
        rep, _, h = self.run_with(world())
        self.assertEqual(rep["fetched"], 0)
        self.assertEqual(rep["cached"], 2)
        self.assertEqual([u for u in h.asked if "/20252026/" in u], [],
                         "a warm cache must not re-ask for a single player")

    def test_a_known_ABSENT_headshot_is_not_asked_for_again_either(self):
        """Otherwise every run re-asks for every man the league has never shot,
        which is the majority of the fetches on a warm cache."""
        self.run_with(world())
        _, _, h = self.run_with(world())
        self.assertNotIn(f"{mugs.HOST}/20252026/WSH/222.png", h.asked)

    def test_a_TRADE_refetches_because_the_club_is_in_the_url(self):
        """⚠️ The cache key carries the club. Keyed on the id alone, a traded
        player would wear his old sweater until the season rolled over."""
        self.run_with(world())
        moved = doc()
        moved["clubs"] = {"BOS": [{"p": 111, "nm": "Real", "t": "BOS", "gp": 5, "g": 2}]}
        (self.dir / "players.json").write_text(json.dumps(moved))
        w = world()
        w[f"{mugs.HOST}/20252026/BOS/111.png"] = (200, REAL)
        _, after, h = self.run_with(w)
        self.assertIn(f"{mugs.HOST}/20252026/BOS/111.png", h.asked)
        self.assertEqual(self.flag(after, 111), 1)

    def test_a_TRANSPORT_failure_is_retried_rather_than_recorded_as_absent(self):
        """⛔ A timeout is not a fact about the player. Recording it as "no
        headshot" would make one bad minute permanent."""
        w = world()
        w[f"{mugs.HOST}/20252026/PIT/111.png"] = (0, b"connection reset")
        rep, _, _ = self.run_with(w)
        self.assertEqual(rep["failed"], 1)
        _, _, h = self.run_with(world())
        self.assertIn(f"{mugs.HOST}/20252026/PIT/111.png", h.asked,
                      "a failed fetch must be asked again next run")


class TheSeason(Base):
    def test_the_season_tag_is_the_league_s_two_year_form(self):
        """`players.json` says 2026; the asset path says 20252026."""
        _, _, h = self.run_with(world())
        self.assertTrue(any("/20252026/" in u for u in h.asked), h.asked)


if __name__ == "__main__":
    unittest.main()
