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

test('⭐ the line sits between the controls and the scrubber, and takes its own row', () => {
  /* Kevin named the slot. ⚠️ AND `order` IS THE THING THAT BREAKS IT: every other
     child of `.transport` is `order:0`, so any positive value sorts this last and
     it renders BELOW the scrubber. The first build did exactly that. Source order
     is the whole placement, which is why the markup position is asserted too. */
  /* ⚠️ INDEXES INTO THE WHOLE PAGE, NOT A SLICE. Slicing "the transport block"
     needed a regex for its closing tag, and the transport CONTAINS `<div
     class="grp">` — so the first `</div>` closed a control group and the block
     was three elements long. These three ids are unique on the page. */
  const start = app.indexOf('<div class="transport">');
  assert.ok(start >= 0, 'the transport block has moved');
  const who = app.indexOf('id="who"', start), scrub = app.indexOf('id="scrub"', start);
  const grp = app.lastIndexOf('class="grp"', who);
  assert.ok(who > 0 && scrub > 0 && grp > 0, 'the transport lost the line, the scrubber or the controls');
  assert.ok(grp < who, 'the line is above the play controls');
  assert.ok(who < scrub, 'the line is below the scrubber');

  const rule = /#rg \.who\{[^}]*\}/.exec(PAGE_CSS);
  assert.ok(rule, 'the line has no rule at all');
  assert.match(rule[0], /flex:0 0 100%/, 'the line shares a row with a control instead of taking its own');
  assert.doesNotMatch(rule[0], /order:/,
    'the line sets `order`, which sorts it past the scrubber — see the note above it');
  // AND IT RESERVES ITS HEIGHT, so a frame with a shorter sentence does not move
  // the scrubber under a finger already reaching for it.
  assert.match(rule[0], /min-height:/, 'the line can collapse, which shifts the scrubber under the reader');
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

test('⭐ the line is suppressed exactly where a name is already on screen', () => {
  /* CHENG: *"a caption naming the scorer already carries the sentence, and echoing
     it below is the duplicated-clause defect in a new place."* 144 of 2,069 frames.

     ⚠️⚠️ AND HE NAMED THE HAZARD IN THE FIX ITSELF: *"what would be dangerous is a
     third reader with a SLIGHTLY DIFFERENT predicate"*, which is the
     `dwell(isHD(e))` versus `hdOn && isHD(cur)` bug exactly. `captioned()` is the
     wrong predicate here — it is true for icing, offside and a power play ending,
     whose captions name NO player — so `namesActor()` is a separate function, and
     what this asserts is that its terms are exactly the `kind`s the caption chain
     passes to `caption(e,kind)`. Add a fourth caption kind that names somebody and
     forget this predicate, and it goes red. */
  const fn = fnSrc('namesActor');
  const kinds = [...app.matchAll(/caption\((?:cur|e),'(\w+)'\)/g)].map(m => m[1]).sort();
  assert.deepEqual([...new Set(kinds)], ['goal', 'hd', 'penalty'],
    `the caption chain passes ${[...new Set(kinds)].join(', ')} — namesActor must cover exactly these`);
  assert.match(fn, /e\.type==='goal'/, 'a goal is no longer treated as naming its player');
  assert.match(fn, /e\.type==='penalty'/, 'a penalty is no longer treated as naming its player');
  assert.match(fn, /hdOn&&isHD\(e\)/, 'a slot shot is no longer treated as naming its player');
  // ⛔ AND IT IS NOT `captioned`, which would blank the line on icing and offside.
  const say = fnSrc('sayWho');
  assert.match(say, /namesActor\(e\)/, 'the suppression asks something other than namesActor');
  assert.doesNotMatch(say, /captioned\(/,
    'the line suppresses on `captioned`, which is true for icing, offside and a power '
    + 'play ending — captions that name no player, so the line would go blank for nothing');
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
  const say = fnSrc('sayWho');
  const blanks = say.match(/innerHTML=''/g) || [];
  assert.equal(blanks.length, 1,
    `${blanks.length} branches of sayWho render an empty line. Only the pre-game frame `
    + 'may be blank; a frame with no resolvable player says the event\'s own name');
  assert.match(say, /if\(!e\)\{w\.innerHTML=''/,
    'the one empty branch is not the pre-game one');
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
