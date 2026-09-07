/**
 * ⛔ A RULE FOR A CLASS NOTHING CARRIES IS A DESCRIPTION OF A PAGE THAT NO LONGER
 * EXISTS.
 *
 * `docs/status.md` §0.00-α, item 2: sweep the CSS only the deleted layer menu
 * used. The menu went on 2026-09-07 and its stylesheet did not, which is the
 * ordinary half. The interesting half is what enumerating found.
 *
 * ⚠️⚠️ THE NOTE THAT ASKED FOR THIS SWEEP NAMED THE ONE CLASS THAT MUST SURVIVE.
 * It said *"`#zLayersOn` is gone; its `.zon` CSS and any siblings were not
 * swept."* `.zon` is the little count badge on a zone's summary — and it is also
 * worn by `#zTrailsOn` and `#zCueOn`, which are live. **That is the `.lds`
 * mistake, second time, inside the note written after the first one.** A blanket
 * strip of `.zon` would have taken the Trails and next-play badges with it, and
 * no test in this repo looks at a badge.
 *
 * ⭐ SO THE SWEEP IS DERIVED RATHER THAN LISTED, and the derivation is the point:
 * a class is swept because **no page can produce it**, never because it was in a
 * block somebody deleted. Run against the tree as the menu left it, this named
 * twelve — six from the menu and six older ones, orphaned by three separate
 * commits between 7 and 27 August and never noticed:
 *
 *   .zlayers .lrows .lrow .lon .lat .st    the layer menu (2026-09-07)
 *   .man .srv                              the penalty box's servers (2026-08-27)
 *   .bkrow .bkt .bklab                     the blocked scoreboard row (2026-08-17)
 *   .fbtn                                  the figure switcher (2026-08-07)
 *
 * ⚠️ AND THE FIRST DRAFT REPORTED A THIRTEENTH, `.bad`, WHICH IS LIVE. The shell
 * writes `className='shellmsg'+(bad?' bad':'')` — a class assembled from pieces,
 * on the page this file was not reading. Both app pages are read now, and the
 * producer side counts every WORD inside every shipped string, not just whole
 * `class="…"` attributes. That is deliberately generous: a rule wrongly kept
 * costs some dead bytes, a rule wrongly deleted costs a viewer something they can
 * see, and this suite is blind on layout.
 *
 * ⛔ ITS LIMIT, STATED. A class assembled from pieces that are not string
 * literals — `'k-'+id` where the tail is computed — is invisible to this and will
 * be reported. That has not happened yet, so there is no ledger; when it does,
 * the answer is a ledger line with a reason, the shape `park.test.js` already
 * uses, not a loosened scan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { walk } from '../tools/jslex.mjs';

const ROOT = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');

/** The two pages `app.css` dresses. Both, because a class may live on only one. */
const PAGES = ['src/read-the-game.html', 'src/game.html'];

/**
 * Every class and id token the pages can put on an element.
 *
 * Markup contributes its `class` and `id` attributes; each `<script>` contributes
 * every word inside every string body and template run, which is how a name
 * spliced together at runtime still counts as produced.
 */
function produced() {
  const out = new Set();
  for (const p of PAGES) {
    const html = read(p);
    const markup = html.replace(/<script[\s\S]*?<\/script>/g, ' ');
    for (const m of markup.matchAll(/class="([^"]+)"/g))
      for (const c of m[1].split(/\s+/)) out.add(`.${c}`);
    for (const m of markup.matchAll(/id="([^"]+)"/g)) out.add(`#${m[1]}`);
    for (const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))
      walk(s[1], t => {
        if (t.t !== 'str' && t.t !== 'tstr') return;
        for (const w of (t.v || '').matchAll(/[\w-]+/g)) { out.add(`.${w[0]}`); out.add(`#${w[0]}`); }
      });
  }
  return out;
}

/** Every class and id token any selector in `css` reaches for. */
function targeted(css) {
  const out = new Set();
  /* ⭐ COMMENTS FIRST, AND THIS IS THE SIXTH TIME. `app.css` quotes whole rules
     inside comments explaining them — `park.test.js` says so at the top of its
     own scanner — and a selector scan that reads an explanation as a declaration
     reports classes nobody wrote. */
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    if (/^\s*@/.test(m[1])) continue;               // @media, @keyframes, @supports
    for (const t of m[1].matchAll(/([.#])([\w-]+)/g)) out.add(t[1] + t[2]);
  }
  return out;
}

test('⭐ the scan can see both sides — a broken one reports a clean sheet', () => {
  /* WITHOUT THIS, EVERY ASSERTION BELOW IS SATISFIED BY A SCANNER THAT MATCHES
     NOTHING: no targets found means no orphans found, and it reads identically to
     a swept stylesheet. Both counts are floors against a dead pattern, sitting in
     the gap between hundreds and zero rather than pinning a number that moves
     every time a rule is written. */
  const targets = targeted(read('src/app.css'));
  const live = produced();
  assert.ok(targets.size > 150, `only ${targets.size} class/id tokens found in app.css`);
  assert.ok(live.size > 150, `only ${live.size} tokens found on the pages`);

  /* AND A CLASS KNOWN TO BE ON BOTH SIDES RESOLVES. `.puck` is drawn on every
     played frame and styled by name; if this stops matching, the two sides are
     being read in incompatible shapes and the emptiness below means nothing. */
  assert.ok(targets.has('.puck') && live.has('.puck'),
    'the mark on the ice is not visible to both halves of this check');
});

test('⛔ every rule in app.css targets something a page can carry', () => {
  const live = produced();
  const orphans = [...targeted(read('src/app.css'))].filter(t => !live.has(t)).sort();

  assert.deepEqual(orphans, [],
    'these selectors dress elements that no page produces — dead rules describing '
    + 'a page that no longer exists:\n  ' + orphans.join('  ') + '\n'
    + 'Delete them, or if one is assembled at runtime from pieces this cannot see, '
    + 'say so in a ledger here with the reason. Do NOT sweep by block: `.zon` and '
    + '`.lds` each serve a surface beyond the one being removed.');
});

test('⭐⭐ …and the checker separates a dead rule from a shared one', () => {
  /* THE CONTROL, and its second case is the defect this file exists because of.
     A scan that reports nothing is this project's most-repeated failure wearing
     green, so the checker is shown telling the two apart rather than merely being
     quiet. */
  const orphansOf = (css, live) => [...targeted(css)].filter(t => !live.has(t)).sort();

  const css = '#rg .lrow{display:grid}#rg .zon{color:#fff}#rg .zon:empty{display:none}'
            + '/* #rg .ghost{display:none} */';
  // `#rg` is the app's root element and every selector here is scoped to it, so
  // it is part of the fixture's live set rather than a finding.
  const live = new Set(['#rg', '.zon', '.puck']);

  assert.deepEqual(orphansOf(css, live), ['.lrow'],
    'the checker misses a rule for a class nothing carries');

  /* ⚠️ `.zon` IS THE CASE THAT MATTERS. It was named for deletion because it sat
     in the menu's block, and it is worn by two live badges outside it. A checker
     that decides by BLOCK reports it; one that decides by what the page produces
     does not, and that difference is the whole design. */
  assert.ok(!orphansOf(css, live).includes('.zon'),
    'the checker reports a class that IS carried, just not by the block it sits in');

  /* AND A RULE QUOTED INSIDE A COMMENT IS NOT A RULE. */
  assert.ok(!orphansOf(css, live).includes('.ghost'),
    'the checker reads commented-out CSS as live CSS');
});
