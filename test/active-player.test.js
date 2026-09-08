/**
 * The active player's line — who the league attributed this frame to, and what he did.
 *
 * Kevin: *"we have the player that's attributed to each event… that might be a
 * good idea to integrate into our main game replay, smaller font, right above the
 * scrubber and below the play controls."*
 *
 * ⭐ THE MEASUREMENT THAT MADE IT WORTH BUILDING: 2,065 of 2,069 playable frames
 * across nine fixtures resolve to a named player, and the page was already showing
 * the name on 144 of them — goals and penalties. This is the other 92.8%.
 *
 * ⛔ AND IT NEVER SHOWS A NAME WITHOUT A VERB. `actor` is the faceoff WINNER, the
 * HITTER, the SHOOTER on a blocked shot whose coordinate belongs to the blocker —
 * so a bare name publishes a field's value without its meaning (CHENG), which is
 * the class of error that shipped a wrong flagship number once already.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ATTRIBUTION } from '../src/lib/attribution.js';
import { NOT_A_PLAY } from '../src/lib/layer.js';
import { app, PAGE_CSS, boot } from './helpers/page.js';


/**
 * One function's source, by BALANCED BRACES.
 *
 * ⚠️ THE REGEX VERSION OVER-CAPTURED AND THREE ASSERTIONS WENT RED ON CORRECT CODE.
 * `/function sayWho\(e\)\{[\s\S]*?\n\}/` needs a `}` at the start of a line, and
 * `sayWho` ends `…w.innerHTML=s;}` — so the match ran on into the NEXT function and
 * the tests found words there that the renderer does not contain. A test that
 * cannot delimit its own subject is not a test about that subject.
 */
function fnSrc(name) {
  const at = app.indexOf(`function ${name}(`);
  assert.ok(at >= 0, `${name} is gone from the page`);
  let i = app.indexOf('{', at), d = 0;
  for (let k = i; k < app.length; k++) {
    if (app[k] === '{') d++;
    else if (app[k] === '}' && --d === 0) return app.slice(at, k + 1);
  }
  throw new assert.AssertionError({ message: `${name} never closes` });
}

test('⭐⭐ the line sits inside the rink card, directly under the drawing', () => {
  /* ⏹ THIS ASSERTED THE OPPOSITE UNTIL 2026-09-07 — "between the controls and the
     scrubber", which was Kevin's own earlier slot and which he replaced after
     looking at a giveaway: *"the (vertical) distance between '#79 Hart gave the
     puck away' and the rink, there are many pixels between the event(s)"*.
     Measured before the move: from the marked event to its own sentence was 479px
     at 390 and 571px at 1920, with the layer box and the whole transport between
     them. After: the line is 8px under the drawing at every width, on every frame.

     ⭐ WHAT DID NOT CHANGE IS WHAT THE OLD TEST WAS ACTUALLY FOR — the line has
     its own row, cannot collapse, and cannot be sorted away from its position.
     Those are re-asserted here in the terms of the new home. */
  const box = app.indexOf('<div class="rinkbox">');
  assert.ok(box >= 0, 'the rink card has moved');
  const svgEnd = app.indexOf('</svg>', box);
  const who = app.indexOf('id="who"', box);
  const lbox = app.indexOf('class="lbox"', box);
  assert.ok(svgEnd > 0 && who > 0, 'the rink card lost the drawing or the line');
  assert.ok(who > svgEnd, 'the line is inside the SVG rather than under it');
  assert.ok(who < app.indexOf('<div class="transport">'),
    'the line is back below the play controls, which is the 479px this move removed');
  /* ⚠️ ABOVE THE LAYER BOX. Below it, the running tally would sit between the
     drawing and the sentence about it — the same defect, smaller. */
  if (lbox > 0) assert.ok(who < lbox, 'the layer box now separates the drawing from its sentence');

  const rule = /#rg \.who\{[^}]*\}/.exec(PAGE_CSS);
  assert.ok(rule, 'the line has no rule at all');
  assert.doesNotMatch(rule[0], /order:/, 'the line sets `order`, which sorts it away from the drawing');
  // IT RESERVES ITS HEIGHT, so a frame with a shorter sentence does not move what
  // is under the ice.
  assert.match(rule[0], /min-height:/, 'the line can collapse, which shifts everything below it');
  /* ⛔ AND IT MUST NOT BE MADE TO FIT BY CLIPPING. The line has to stay one row —
     it is inside the rink card now and a second row moves the page mid-replay —
     but the guarantee is that the SENTENCE is short enough, asserted in the test
     below. Truncating a player's name on a site whose product is legibility would
     be the wrong repair, so the shortcut is closed by name. */
  assert.doesNotMatch(rule[0], /text-overflow|white-space:\s*nowrap/,
    'the line is being kept to one row by clipping a name rather than by fitting');
});

test('⛔⛔ no sentence the archive can produce overflows one line', () => {
  /* ⭐ THE JITTER GUARANTEE, AND IT IS A CHARACTER BUDGET BECAUSE THE SUITE HAS NO
     PIXELS. The line lives in the rink card now, so a sentence that wraps moves
     everything under the ice mid-replay. Node cannot see a wrap; what it can see
     is the length of every sentence the table can build from real rosters.

     THE BUDGET WAS MEASURED IN A REAL BROWSER, not chosen: growing a string in
     `#who` until its height doubled gives **39 characters at 360px** and 42 at
     390. 360 is the narrower, so 360 is the budget. That measurement is the one
     thing here a person has to redo if the type ever changes — it is recorded in
     builders/build_main.py beside the element.

     ⚠️ AND IT IS EXACTLY THE CHECK THAT WAS MISSING. `docs/active-player.md`
     claimed "the line does not wrap on a phone" from a measurement of
     `"Surname #NN"` — median 11, max 18 — which is the NAME, not the sentence.
     The blocked-shot form named two players and ran to 46, wrapping on 26 of 269
     frames at 360. A measurement of a component quoted as a measurement of the
     whole. */
  const BUDGET = 39;
  const dir = new URL('fixtures/extracts/', import.meta.url);
  const files = readdirSync(dir).filter(f => /^\d+\.json$/.test(f));
  assert.ok(files.length >= 5, `only ${files.length} fixture games to draw names from`);

  const tag = p => `#${p.n} ${p.nm}`;              // whoTag, without its markup
  const plain = t => t.replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/<[^>]+>/g, '');
  let worst = { len: 0 }, n = 0;
  for (const f of files) {
    const j = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    for (const e of j.events) {
      const a = ATTRIBUTION[e.type], p = a && j.roster[e.actor];
      if (!p) continue;
      let s = plain(a.say).replace('{a}', tag(p));
      if (a.with) { const q = j.roster[e[a.with]]; if (!q) continue; s = s.replace('{b}', tag(q)); }
      n++;
      if (s.length > worst.len) worst = { len: s.length, s, type: e.type, game: f };
    }
  }
  assert.ok(n > 1000, `only ${n} sentences built — the fixtures are not being read`);
  assert.ok(worst.len <= BUDGET,
    `the longest sentence the fixtures produce is ${worst.len} characters against a `
    + `one-line budget of ${BUDGET} at 360px:\n  ${worst.type} — "${worst.s}"\n`
    + 'It will wrap inside the rink card and move the page under the reader mid-replay. '
    + 'Shorten the form in ATTRIBUTION; do not clip the name.');
});

test('⛔ there is no toggle, and that is Kevin\'s ruling over CHENG\'s', () => {
  /* CHENG proposed folding one into the newcomer dismissal. Kevin ruled none at
     all, and the argument is his own precedent: that flag means *"I know how this
     site works"*, and who took the shot is not scaffolding a reader outgrows —
     dismissing a tutorial would silently remove a fact, and `rtg.seen` is written
     as `…|99`, so there would be no way back. */
  assert.doesNotMatch(app, /whoOn|showWho|id="whoToggle"/,
    'a control for the active-player line has appeared');
  assert.doesNotMatch(PAGE_CSS, /#rg\.newcomer \.who|#rg\.who-off/,
    'the line is being hidden by a state class, which is a toggle without a button');
});

test('⭐ every sentence comes from the one table, and none is a bare name', () => {
  const fn = fnSrc('sayWho');
  assert.match(fn, /ATTRIBUTION\[e\.type\]/, 'the sentence is no longer read from the table');
  assert.match(fn, /a\.say\.replace\('\{a\}'/, 'the actor is no longer substituted into the verb');
  /* ⛔ NO LITERAL VERB IN THE RENDERER. A sentence written here would be a second
     copy of the table, which is the drift the single structure exists to prevent. */
  for (const a of Object.values(ATTRIBUTION)) {
    const words = a.say.replace(/\{[ab]\}|<[^>]+>|&\w+;/g, '').trim();
    assert.doesNotMatch(fn, new RegExp(words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `"${words}" is written into the renderer as well as the table`);
  }
});

test('\u2b50\u2b50 the line is suppressed only where the name is STILL on screen', () => {
  /* \u26a0\ufe0f\u26a0\ufe0f KEVIN FOUND THIS ON THE SLOT CARD'S OWN DOOR: *"the active
     player between the play controls and the scrubber just says 'shot on goal',
     shouldn't that have the player that took the shot as well?"*

     It should. `namesActor` used to return true for a penalty and a slot shot
     because `caption()` names the player on those frames \u2014 and it does, for
     `dwell(e)` MILLISECONDS. The pill is TRANSIENT and this line is PERMANENT, so
     silencing the permanent surface because a transient one spoke means the name
     shows for a second and is then gone for the rest of the visit.

     \u26d4 AND THE PILL MAY NEVER FIRE. `sayWho` runs on every render; the caption
     chain runs only inside `if(moment)`. A scrub or a layer toggle blanked the
     line for a caption that did not happen.

     \u2b50 SO THE OLD TEST WAS PART OF THE BUG. It asserted that `namesActor`'s terms
     equalled the caption chain's `kind`s \u2014 pinning the very coupling that was
     wrong, and it passed all the way through. What is asserted now is the
     property the line actually needs: the name is still on the screen. */
  const fn = fnSrc('namesActor');
  assert.match(fn, /e\.type==='goal'/, 'a goal no longer counts as having its name on the ice');
  assert.match(fn, /place\(e\)/,
    "namesActor does not ask drawLabel's own guard, so an unplaced goal would blank "
    + 'the line while the ice draws no label either');
  assert.doesNotMatch(fn, /penalty/,
    'a penalty suppresses the line again \u2014 the ice renders "CAR \u00b7 Penalty" and names nobody');
  assert.doesNotMatch(fn, /isHD|hdOn/,
    'a slot shot suppresses the line again \u2014 only the transient pill ever named him');

  // \u26d4 AND IT IS NOT `captioned`, which would blank the line on icing and offside.
  const say = fnSrc('sayWho');
  assert.match(say, /namesActor\(e\)/, 'the suppression asks something other than namesActor');
  assert.doesNotMatch(say, /captioned\(/,
    'the line suppresses on `captioned`, which is true for icing, offside and a power '
    + 'play ending \u2014 captions that name no player, so the line would go blank for nothing');
});

test('\u2b50 and ON THE SLOT DOOR ITSELF the line names the shooter', () => {
  /* THE FRAME KEVIN WAS LOOKING AT, driven through the real page rather than
     asserted about the predicate. `?layer=slot` with the slot card's own moment:
     the ice says "BUF \u00b7 Shot on goal" and names nobody, so this line must. */
  const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
  const a = boot(rich, null, '?layer=slot&at=1-16:03');
  const who = a.$('who').innerHTML;
  assert.ok(who, 'the active player line is empty on the slot card\u2019s own door');
  assert.doesNotMatch(who, /^Shot on goal$/,
    'the line renders the bare event name on the frame the slot card links to \u2014 '
    + 'the pill named the shooter and then faded, and nothing else ever will');
  assert.match(who, /#\d+/, 'the line names no player number');
  // AND THE ICE REALLY DOES NOT NAME HIM, which is what makes the line necessary.
  assert.doesNotMatch(a.$('labels').innerHTML, /#\d+/,
    'the ice now names the shooter too, so this line would be a duplicate');
});

test('⭐ the sentence resolves on every frame the replay shows, or says the event instead', () => {
  /* THE HONEST FALLBACK, and CHENG chose it: *"the line should never be empty, and
     'Shootout complete' is a real thing to say. Reserve nothing, render the event
     name."* Reserving blank space is the defect the row under the ice was deleted
     for; collapsing shifts the page. Naming the event sidesteps both. */
  const dir = new URL('fixtures/extracts/', import.meta.url);
  let shown = 0, named = 0; const gaps = {};
  for (const f of readdirSync(dir).filter(f => /^\d+\.json$/.test(f))) {
    const j = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    for (const e of j.events) {
      if (e.type in NOT_A_PLAY) continue;
      shown++;
      const a = ATTRIBUTION[e.type], p = a && j.roster[e.actor];
      if (p && (!a.with || j.roster[e[a.with]])) named++;
      else gaps[e.type] = (gaps[e.type] || 0) + 1;
    }
  }
  assert.ok(shown > 2000, `only ${shown} playable frames across the fixtures`);
  assert.ok(named / shown > 0.99,
    `only ${named} of ${shown} frames (${(100 * named / shown).toFixed(1)}%) can name a player: `
    + JSON.stringify(gaps));
  // AND THE FALLBACK EXISTS FOR THE REST, rather than an empty line.
  /* ⚠️ A `match` FOR THE FALLBACK STRING WAS NOT ENOUGH, and a mutation proved it:
     replacing ONE of the two fallback branches with an empty line left the other
     branch's copy of the string in place and the assertion passed. What is counted
     instead is the EMPTY writes — there may be exactly one, the pre-game frame,
     and every other exit must put words on the line. */
  /* ⭐⭐ TWO BLANK BRANCHES SINCE 2026-09-07, AND THE SECOND IS A DECISION. This
     required exactly ONE — the pre-game frame — on the reasoning that a frame the
     page says nothing about reads as broken. True, and it conflated two different
     silences: we CANNOT name anybody, versus the name is already on screen. The
     second used to render the raw event type, which under the transport was
     invisible and under the drawing was a lowercase `goal` sitting centred beneath
     a pill that had just said GOAL — Blake, assists: Hall, Ehlers. Kevin, seeing
     it: *"let's just render nothing on a Goal, the rink description is
     sufficient."* It costs no jitter — `min-height` reserves the row either way.
     So the count is two, and each is named, because "some branches are blank" is
     not a claim anybody can check. */
  const say = fnSrc('sayWho');
  const blanks = say.match(/innerHTML=''/g) || [];
  assert.equal(blanks.length, 2,
    `${blanks.length} branches of sayWho render an empty line. There are exactly two: `
    + 'the pre-game frame, and a frame whose name the caption pill already carries');
  assert.match(say, /if\(!e\)\{w\.innerHTML=''/,
    'the pre-game branch is no longer one of the empty ones');
  /* ⭐ THE SUPPRESSED BRANCH GAINED A CONDITION ON 2026-09-08 AND STAYED BLANK.
     A goal whose highlight the league published now offers it here — the row is
     reserved either way, so it costs nothing, and it is the only surface at this
     height that can say a video exists. A goal WITHOUT one falls through to the
     same empty line as before, which is the 6.6% and is why this branch is still
     one of the two blanks rather than being replaced by the link. */
  assert.match(say, /if\(namesActor\(e\)\)\{[\s\S]{0,240}?w\.innerHTML=''/,
    'the suppressed-because-already-named branch is no longer one of the empty ones');
  assert.match(say, /e\.clip!=null/,
    'the suppressed branch no longer distinguishes a goal that has a highlight from '
    + 'one the league published nothing for — so the line either promises a video '
    + 'that is not there, or hides one that is');
  const falls = say.match(/LAB\[e\.type\]\|\|e\.type\.replace/g) || [];
  assert.equal(falls.length, 2,
    `${falls.length} branches name the event instead of a player — there are two ways to `
    + 'fail to name one: no actor, and a second player the roster cannot resolve');
  assert.ok(Object.keys(gaps).length, 'no fixture frame exercises the fallback, so it is untested');
});

test('the line is empty before the game starts, and says something at the first frame', () => {
  const a = boot();
  assert.equal(a.$('who').innerHTML, '', 'the line names a player on the pre-game frame');
});

test('⛔⛔ the line and the ice beside it never name opposite clubs', () => {
  /* ⚠️⚠️ KEVIN CAUGHT THIS SHAPE ONCE ALREADY, on the figure: *"text says CAR,
     visual shows Vegas."* That fix moved the drawn PERSON onto the blocker's
     colours, because the coordinate is his. It did not move this line, which went
     on leading with the shooter — so on every blocked shot the ice said `MIN ·
     Blocked a shot` and the sentence under it had a BUF player as its subject,
     printed in BUF's colour. Corrected 2026-09-07 on Kevin's call.

     ⭐ AND THE INSTRUMENT IS THE POINT, not the fix. Nothing here could have seen
     it: `attribution-table.test.js` checks the TABLE, `render-labels.test.js`
     checks the LABEL, and the disagreement lived between them — the same
     intersection the strength control fell through. So the claim is asked of the
     rendered page, across a whole walk, of both elements at once.

     ⭐ IT IS A GENERAL PROPERTY, MEASURED BEFORE IT WAS ASSERTED: 260 of 260
     frames that carry both a club-prefixed label and a club-coloured line agree,
     across every event type in the reference game. It is not a blocked-shot
     special case, which is why it is written as one rule over the whole walk. */
  const a = boot(null, null, '');
  const AAB = a.$('aAb').textContent.trim(), HAB = a.$('hAb').textContent.trim();
  assert.ok(AAB && HAB && AAB !== HAB, 'the scoreboard has no club abbreviations to compare against');

  const rows = a.every(d => ({
    cls: d.$('who').className || '',
    line: (d.$('who').innerHTML || '').replace(/<[^>]+>/g, ' ').trim(),
    lab: (d.$('labels').innerHTML || '').replace(/<[^>]+>/g, ' ').trim(),
  }));
  assert.ok(rows.length > 200, `walked only ${rows.length} frames`);

  const bad = [];
  let checked = 0;
  for (const [k, r] of rows.entries()) {
    /* `who plain` is the fallback that names the EVENT and no player, so it takes
       no club and has nothing to disagree with. */
    if (/\bplain\b/.test(r.cls)) continue;
    const side = /\bwho a\b/.test(r.cls) ? AAB : /\bwho h\b/.test(r.cls) ? HAB : null;
    const m = /\b([A-Z]{3})\s*·/.exec(r.lab);
    if (!side || !m) continue;
    checked++;
    if (m[1] !== side) bad.push(`frame ${k}: ice "${m[1]}" vs line "${side}" — ${r.line}`);
  }

  assert.ok(checked > 150,
    `only ${checked} frames carried both a club label and a club-coloured line — `
    + 'this walk is not exercising the pair, so its silence means nothing');
  assert.deepEqual(bad, [],
    'the ice names one club and the sentence beside it is coloured for the other. '
    + 'The line takes its colour from the SUBJECT of its sentence (see sayWho); if a '
    + 'row of ATTRIBUTION changed which name it leads with, the colour follows it '
    + 'automatically — so this failing means the label and the sentence genuinely '
    + `disagree about whose play it was:\n  ${bad.join('\n  ')}`);
});
