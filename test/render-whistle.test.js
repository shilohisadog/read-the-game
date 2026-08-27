/**
 * The whistle layer on the ice, and the trails control that governs what stays
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { WHY, whistle } from '../src/lib/layers/whistle.js';
import { rich, app, PAGE_CSS, prose, boot, rings, evMarks, panel } from './helpers/page.js';

test('the shipped app boots, and the reference game is in it', () => {
  const a = boot();
  // WAS /at .* final/ -- the game line no longer states the result, because a
  // replay that prints its ending before you press play is a recap. What still
  // has to be true is the claim this assertion was always making: the line comes
  // from the game, not from a literal. Both clubs and the date, none of which
  // this file supplies.
  assert.match(a.$('gl').textContent, /^MIN at BUF · .*2023/,
    'the game line is written from the data');
  assert.doesNotMatch(a.$('gl').textContent, /final/,
    'and it does not give the ending away');
});

test('NOTHING draws whistle marks until the layer is turned on', () => {
  // THE MUTATION, and it comes first: a page that drew whistle marks
  // unconditionally would satisfy every other assertion in this file. If this
  // one cannot fail, none of them mean anything.
  const a = boot();
  assert.deepEqual([...new Set(a.sweep(rings))], [0]);
  assert.equal(panel(a), '', 'and the panel says nothing at all');
});

test('turning the layer on puts marks on the ice and a sentence under it', () => {
  const a = boot();
  a.$('lyWhistle').click();
  const drawn = a.sweep(rings);
  assert.ok(Math.max(...drawn) >= 1,
    'the layer is on and never drew a mark anywhere in the game');
  const p = panel(a);
  assert.ok(p.length > 40, `the panel explained nothing: "${p}"`);
  assert.doesNotMatch(p, /undefined|null|NaN/, 'a hole in the copy is worse than no copy');
});

test('the sentence on screen is the rule, and it names where it comes from', () => {
  // The whole argument for the layer: a novice has watched a hundred icings and
  // never had one named. If the page shows the reason code and not the rule, the
  // layer has delivered nothing.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.sweep(panel).join('\n');
  assert.match(seen, /centre line|blue line ahead of the puck|goaltender/i,
    'no whistle in a whole NHL game produced a teaching sentence');
  assert.match(seen, /rule: NHL Rule|field: rsn/, 'and the provenance travels with it');
});

test('every known stoppage is CALLED something, on every surface that shows one', () => {
  // "Goalie Stopped After Sog" — the raw feed key with its hyphens swapped and
  // then title-cased by the stylesheet, in front of the one audience that does
  // not know what SOG means. `say` existed and was correct the whole time; it is
  // a full teaching sentence and the wrong length for a heading, which is why
  // WHY gained a third field rather than the heading being re-pointed at `say`.
  //
  // MORE THAN ONE SURFACE, AND ONLY ONE OF THEM IS THE HEADING (CHENG). A
  // heading-only fix would have left the others rendering `Sog`, and nobody
  // would have found the ring's <title>, because nobody hovers while watching.
  //
  // IT WAS THREE UNTIL THE TALLY WENT. Kevin removed the running count of every
  // reason from the card on 2026-08-18, so the surfaces are now the heading, the
  // ring titles, and the restart label on the ice. The name of this test said
  // "three" and would have kept saying it — a count of other elements inside a
  // test's own title is the same rotting dependency as one in prose.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.every(d => panel(d) + d.$('whistles').innerHTML
                          + d.$('labels').innerHTML).join('\n');

  // Whatever this game happened to contain, every reason it showed must be a
  // written label — read out of WHY rather than listed here, so a reason added
  // to the vocabulary without a name is caught rather than missed.
  const named = Object.entries(WHY).filter(([, v]) => v.name);
  assert.ok(named.length >= 12, `WHY carries ${named.length} written names`);

  /* ⭐ AND A THIRD GRAMMATICAL FORM, GUARDED. `name` starts a card; `clause`
     goes mid-sentence, because the on-ice label composes "Won the faceoff
     after …". An entry added with a name and no clause falls back to the
     heading and reintroduces "after Goaltender covered the puck" for that one
     reason only — invisible in every game that does not contain it, which is
     precisely how a vocabulary gap hides. */
  for (const [key, v] of named) {
    assert.ok(v.clause, `${key} has a heading but no mid-sentence form`);
    assert.match(v.clause, /^[a-z]/,
      `${key}'s clause starts with a capital, so it reads as a heading again`);
    assert.doesNotMatch(v.clause, /\.$/, `${key}'s clause ends in a full stop`);
  }
  for (const [key, v] of named) {
    if (!seen.includes(v.name) && !seen.includes(key.replace(/-/g, ' '))) continue;
    assert.ok(seen.includes(v.name),
      `${key} reached a surface as the raw key rather than "${v.name}"`);
    /* ⚠️ AND THIS CHECK CAN ONLY SEE THE DEFECT WHERE THE DEFECT IS VISIBLE.
       "The de-hyphenated key appears" was a proxy for "a machine string reached
       a reader", and it holds only while the de-hyphenated key differs from the
       copy we authored. It does not for `offside` (the clause reads "an offside
       call") or `hand-pass` ("a hand pass") — there, the words being on screen
       is the copy working, not leaking. Asserting it anyway is a check that
       cannot tell its subject from its background, and it went red on correct
       copy the moment the clause form landed.
       So it applies where it discriminates, which includes the case it was
       written for: `goalie-stopped-after-sog` de-hyphenates to "goalie stopped
       after sog" and appears in no authored string. */
    const raw = key.replace(/-/g, ' ');
    const authored = `${v.name} ${v.clause || ''} ${v.say || ''}`.toLowerCase();
    if (!authored.includes(raw))
      assert.ok(!seen.includes(raw),
        `${key} still renders as the raw feed key somewhere`);
  }
  // And the specific one from the screenshot, so this cannot pass vacuously on a
  // game that happens to contain none of the ugly keys.
  assert.match(seen, /Goaltender covered the puck/, 'the reference game has these stoppages');
  assert.doesNotMatch(seen, /goalie stopped after sog/i, 'and it still shows the key');
  assert.doesNotMatch(seen, /\bsog\b/i, 'unexpanded jargon reached the page');

  // THE STYLESHEET WAS DOING THE TITLE-CASING, and on a written label
  // `capitalize` gives "Goaltender Covered The Puck".
  assert.doesNotMatch(PAGE_CSS, /\.rsn\{[^}]*text-transform:capitalize/,
    'the heading still title-cases every word of a written label');
  assert.doesNotMatch(PAGE_CSS, /\.whtally\{[^}]*text-transform:capitalize/,
    'the tally still title-cases every word');
});

test('a reason we have never seen still renders, and renders raw', () => {
  // The fallback is the HONEST branch, not the default one: the feed can emit a
  // reason absent from WHY, and a label we invented for it would be a guess in
  // our own voice. Unreachable from the reference game, so the game is re-coded
  // — the same fix as the host-goalie branch on the game page.
  const g = JSON.parse(JSON.stringify(rich));
  let touched = 0;
  for (const e of g.events) if (e.type === 'stoppage' && e.rsn) { e.rsn = 'krakens-on-ice'; touched++; }
  assert.ok(touched > 5, `only ${touched} stoppages to re-code`);
  const a = boot(g);
  a.$('lyWhistle').click();
  const seen = a.every(d => panel(d)).join('\n');
  assert.match(seen, /krakens on ice/, 'an unknown reason vanished instead of falling back');
  assert.doesNotMatch(seen, /undefined|\[object/, 'and it fell back to something broken');
});

test('the card says it is looking BACKWARDS, because it usually is', () => {
  // Kevin: "the card becomes disjointed with the event by event action." Measured
  // live across a game: the event the card describes is a median 29 SECONDS
  // behind the playhead, 102s at the 90th percentile, and more than five seconds
  // behind on 78% of frames — while the card sat in present tense, in the
  // position of a caption, with a timestamp a reader had to compare against the
  // scoreboard to discover was history. The card was never wrong; its currency
  // was invisible.
  const a = boot();
  a.$('lyWhistle').click();
  //
  // AND THE EXEMPTION IS CHENG'S OWN RULE, NOT A HOLE IN THE TEST. Before the
  // first whistle the card reads "No whistle yet — play has not stopped in what
  // you have watched so far", which is a CONDITION: recomputable from the state
  // at the playhead, with no reference to when it started. It cannot drift, so
  // it needs no retrospective framing. Every card that names a past stoppage
  // does. The two are separated here by whether they name one.
  const frames = a.every(d => panel(d)).filter(Boolean);
  assert.ok(frames.length > 50, `only ${frames.length} frames carry a card`);
  const naming = frames.filter(p => /class="rsn"/.test(p));
  const waiting = frames.filter(p => !/class="rsn"/.test(p));
  assert.ok(naming.length > 40, `only ${naming.length} cards name a stoppage`);
  assert.ok(waiting.length > 0, 'the pre-whistle state is unreachable, so its arm is untested');
  for (const p of naming)
    assert.match(p, /Last stoppage/,
      'a card naming a past event competes with the scoreboard for "now"');
  for (const p of waiting) {
    assert.match(p, /No whistle yet/);
    assert.doesNotMatch(p, /Last stoppage/,
      'a condition that cannot drift was labelled as history');
  }
});

test('the whistle ring is NAMED, and only while the layer draws it', () => {
  // below-the-rink.md §3 found this for k-blk and k-hd and fixed those two; the
  // whistle layer kept drawing a ring on every game with nothing naming it. The
  // only naming was an SVG <title> — no hover on a phone, and nobody hovers
  // while watching, which is why it read as clutter beside a card that spent
  // three sentences on the same stoppage.
  // ⭐ THE KEY IS THE LAYER'S OWN ROW NOW (2026-08-25). It was a `lk-wh` entry in
  // the legend, gated on `#rg.whistle`; it is the `.lon` half of the whistle row,
  // gated on that row being pressed. The claim did not move — a mark is named,
  // and only while the ice is drawing it.
  const row = app.match(/<button class="lrow" id="lyWhistle"[\s\S]*?<\/button>/)[0];
  assert.match(row, /<i class="k-wh">/, 'the ring has no swatch on its own control');
  assert.match(row, /<span class="lon">[^<]*ring marks where play restarted/,
    'the ring is not named where a viewer meets its control');
  // ⚠️ AND SINCE 2026-08-26 IT IS PARKED, NOT SHOWN. Kevin trimmed the rows to a
  // name and a switch. The sentence still ships and is hidden, so what carries
  // the naming while the layer is on is `.whistlepanel` — which restates the
  // restart spot for the current whistle, with provenance. That gate is what is
  // asserted here now; when the descriptions get a home (docs §20) this points
  // at the home instead. The mark is still named while the ice draws it, by a
  // different element, which is the claim — not the mechanism.
  assert.match(PAGE_CSS, /#rg \.lrow \.lds,#rg \.lrow \.lon\{display:none\}/,
    'the row note is displayed again — this test is describing a page that moved on');
  assert.match(PAGE_CSS, /#rg\.whistle \.whistlepanel\{display:block/,
    'the row note is hidden AND the whistle panel is gone — the ring is on the ice with nothing naming it');
  assert.match(PAGE_CSS, /#rg \.k-wh\{/, 'the key has no swatch');

  const a = boot();
  assert.equal(a.$('rg').classList.contains('whistle'), false);
  a.$('lyWhistle').click();
  assert.ok(a.$('rg').classList.contains('whistle'), 'the key can never appear');
  a.$('lyWhistle').click();
  assert.equal(a.$('rg').classList.contains('whistle'), false,
    'the key would stay after its marks left');
});

test('with trails off the ice holds the current moment and nothing else', () => {
  // Kevin's observation: by the third period the surface is a wall of dots. This
  // is the fix, asserted over the whole game rather than at a flattering moment.
  const a = boot();
  const drawn = a.sweep(evMarks);
  assert.ok(Math.max(...drawn) <= 1,
    `trails are off and up to ${Math.max(...drawn)} marks persisted`);
});

test('keep-every-mark really does keep them', () => {
  // The paired half. Without it, "trails off shows one mark" is also satisfied by
  // a renderer that has stopped drawing anything at all.
  const a = boot();
  const off = Math.max(...a.sweep(evMarks));
  a.GROUPS['#rg .tbtn'][1].click();          // data-t="all"
  const all = Math.max(...a.sweep(evMarks));
  assert.ok(all > 50, `keep-every-mark peaked at ${all} marks`);
  assert.ok(all > off, 'and it must be more than the current moment holds');
});

test('the trails control reports its own state to a screen reader', () => {
  const a = boot();
  const [offBtn, allBtn] = a.GROUPS['#rg .tbtn'];
  assert.equal(offBtn['aria-pressed'], true, 'the default is the current moment');
  allBtn.click();
  assert.equal(allBtn['aria-pressed'], true);
  assert.equal(offBtn['aria-pressed'], false);
});

test('the whistle layer changes no other layer\'s numbers', () => {
  // The recorded gate for a new layer: adding it touches nothing existing.
  const a = boot(), b = boot();
  b.$('lyWhistle').click();
  const read = d => [d.$('cA').textContent, d.$('cH').textContent,
                     d.$('aSc').textContent, d.$('hSc').textContent].join('/');
  assert.deepEqual(b.sweep(read), a.sweep(read));
});

/* ------------------------------------------------------------------ *
 * Team colour. Kevin: "WSH is Red on the home page, but then Green on
 * the game page." Every visitor was green, because the page carried
 * Minnesota's and Buffalo's colours as literals and used them as roles.
 * ------------------------------------------------------------------ */
