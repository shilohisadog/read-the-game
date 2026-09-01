/**
 * The one table — a field and a sentence per event type, and they cannot drift.
 *
 * ⭐⭐ WHY IT IS ONE TABLE (CHENG): *"the verb has to come from one table, and that
 * table is `ACTOR`'s mirror. If `ACTOR` ever changes which field a type reads, the
 * verb has to change with it or the sentence becomes false silently. Put them in
 * one structure — {field, verb} per type — rather than two tables that have to
 * agree."*
 *
 * ⚠️ AND THE DEFECT UNDERNEATH IS THE ONE THIS MODULE WAS WRITTEN FOR. `actor` does
 * not mean "who did this": it is the faceoff WINNER, the HITTER, and on a blocked
 * shot the SHOOTER while the coordinate belongs to the blocker. Getting that
 * backwards once shipped a wrong number on the project's flagship claim.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ATTRIBUTION } from '../src/lib/attribution.js';

const JSONF = JSON.parse(readFileSync(new URL('../data/attribution.json', import.meta.url), 'utf8'));
const PY = readFileSync(new URL('../builders/extract.py', import.meta.url), 'utf8');

test('⭐ the extractor READS the table rather than restating it', () => {
  /* ⭐ THE POINT IS THE ABSENCE OF A SECOND COPY, so what is asserted is that the
     literal is gone. A test comparing two dicts would PASS on two tables that
     happen to agree today, which is the arrangement CHENG ruled out — the failure
     is not disagreement, it is having somewhere for disagreement to live. */
  assert.match(PY, /ACTOR = json\.loads\(\(DATA \/ "attribution\.json"\)/,
    'extract.py no longer reads data/attribution.json');
  assert.doesNotMatch(PY, /ACTOR = \{/,
    'extract.py has its own ACTOR literal again — a second table to drift from the verbs');
  // AND THE SPECIAL CASE THAT USED TO SIT OUTSIDE THE TABLE IS STILL FOLDED IN.
  assert.doesNotMatch(PY, /if t in \("giveaway", "takeaway"\) and d\.get\("playerId"\)/,
    'giveaway/takeaway are a special case again, so a type can gain a verb with no field');
});

test('⭐ the committed JSON is exactly the field half of the table', () => {
  assert.deepEqual(JSONF,
    Object.fromEntries(Object.entries(ATTRIBUTION).map(([t, a]) => [t, a.field])),
    'data/attribution.json is stale — run: node builders/attribution.mjs');
  // ⛔ AND IT CARRIES NO SENTENCES. Emitting `say` too would put the wording in
  // two places, which is the drift the single table exists to prevent.
  for (const v of Object.values(JSONF))
    assert.equal(typeof v, 'string', 'the JSON grew past the field half');
  assert.doesNotMatch(readFileSync(new URL('../data/attribution.json', import.meta.url), 'utf8'),
    /\{a\}|say/, 'the sentence has been copied into the JSON');
});

test('⭐ every entry has a field AND a sentence, and the sentence names its actor', () => {
  const types = Object.keys(ATTRIBUTION);
  assert.ok(types.length >= 8, `${types.length} event types — the table has lost most of itself`);
  for (const [t, a] of Object.entries(ATTRIBUTION)) {
    // `playerId` on a giveaway, `shootingPlayerId` on a shot — the feed uses both
    // capitalisations, so the check is for the noun rather than for a suffix.
    assert.match(a.field, /^[a-z]+([A-Z][a-z]+)*$/, `${t}.field is not a feed key: "${a.field}"`);
    assert.match(a.field, /[Pp]layerId$/, `${t}.field is "${a.field}", which is not a player field`);
    assert.ok(a.say, `${t} has a field and no sentence — a name with no verb is an `
      + 'attribution claim with no stated relationship');
    assert.match(a.say, /\{a\}/, `${t}'s sentence never mentions its actor: "${a.say}"`);
    /* ⭐ A SECOND NAME NEEDS A SECOND FIELD, both ways. `{b}` with nothing to fill
       it renders a placeholder; `with` and no `{b}` reads a field it never says. */
    assert.equal(/\{b\}/.test(a.say), !!a.with,
      `${t}: "${a.say}" and with=${a.with} disagree about a second player`);
  }
});

test('⭐ the blocked shot says BOTH halves, because that is the one that has bitten us', () => {
  /* On a blocked shot `actor` is the SHOOTER and the coordinate is the BLOCKER's
     position — two attributions in one frame pointing at different people, and the
     pair that shipped a wrong flagship number. A bare name there would reconstitute
     the confusion in a new medium (CHENG). */
  const b = ATTRIBUTION['blocked-shot'];
  assert.equal(b.field, 'shootingPlayerId', 'the blocked shot no longer credits the shooter');
  assert.equal(b.with, 'blk', 'the blocked shot no longer names the blocker');
  assert.match(b.say, /\{a\}[\s\S]*\{b\}/, 'the shooter must be named before the blocker');

  // AND THE FIELD IT PROMISES IS ON EVERY BLOCKED SHOT WE HOLD.
  const dir = new URL('fixtures/extracts/', import.meta.url);
  let n = 0, have = 0;
  for (const f of readdirSync(dir).filter(f => /^\d+\.json$/.test(f))) {
    const j = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    for (const e of j.events) {
      if (e.type !== 'blocked-shot') continue;
      n++;
      if (e[b.with] != null && j.roster[e[b.with]]) have++;
    }
  }
  assert.ok(n > 100, `only ${n} blocked shots across the fixtures`);
  assert.equal(have, n, `${n - have} of ${n} blocked shots cannot name their blocker, `
    + 'so the sentence would render a gap where the second player should be');
});

test('⭐ every type the table claims is a type the archive actually produces', () => {
  /* ⚠️ AND THE OTHER DIRECTION IS DELIBERATELY NOT ASSERTED. A type in the archive
     with no entry here yields a null actor, which is how extraction has always
     behaved and is the honest fallback — `shootout-complete` and the period
     markers have no player and should not acquire one. What must not happen is a
     verb for a type nobody plays, which would be a sentence about nothing. */
  const dir = new URL('fixtures/extracts/', import.meta.url);
  const seen = new Set();
  for (const f of readdirSync(dir).filter(f => /^\d+\.json$/.test(f)))
    for (const e of JSON.parse(readFileSync(new URL(f, dir), 'utf8')).events) seen.add(e.type);
  assert.ok(seen.size > 8, `only ${seen.size} event types across the fixtures`);
  const orphan = Object.keys(ATTRIBUTION).filter(t => !seen.has(t));
  /* `failed-shot-attempt` is a shootout miss and is genuinely rare — it is the one
     type allowed to be absent from a nine-game sample, and it is named rather than
     tolerated by a loose rule. */
  assert.deepEqual(orphan.filter(t => t !== 'failed-shot-attempt'), [],
    `the table gives a verb to ${orphan.join(', ')}, which no fixture contains`);
});

test('⭐ the actor the table names is on the team the event is attributed to', () => {
  /* ⚠️ THE MUTATION THAT SURVIVED THE FOUR TESTS ABOVE, and what actually catches
     it. Flipping `hit` from `hittingPlayerId` to `hitteePlayerId` leaves the table
     perfectly self-consistent — the JSON regenerates, every entry still has a
     field and a verb — while "delivered a hit" becomes a sentence about the man
     who GOT hit. One structure makes the two halves get edited together; it cannot
     make a wrong pairing detectable on its own.

     ⭐ WHAT CATCHES IT IS ALREADY IN `npm run gates`: `extract:verify` re-extracts
     the reference game and compares byte for byte, so a changed field changes an
     `actor` and the comparison fails. Confirmed by running it — "DIFFERS, gate
     FAILED", pointing at the exact hit.
     ⚠️ ITS LIMIT, STATED: it re-extracts ONE game, so a flip on a type that game
     does not contain would pass.

     ⭐ THIS IS THE SECOND INSTRUMENT AND IT IS INDEPENDENT. `own` and `actor` come
     from different feed fields, and across nine fixtures the actor is on `own`'s
     team in 2,309 of 2,309 events, every type at 100%. A field flipped to the
     opposing player puts the actor on the other side and this fires — on the
     fixtures, without re-extracting anything. */
  const dir = new URL('fixtures/extracts/', import.meta.url);
  const per = {};
  for (const f of readdirSync(dir).filter(f => /^\d+\.json$/.test(f))) {
    const j = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    for (const e of j.events) {
      if (!ATTRIBUTION[e.type] || e.actor == null || e.own == null) continue;
      const p = j.roster[e.actor];
      if (!p) continue;
      const t = (per[e.type] = per[e.type] || { n: 0, bad: 0, eg: null });
      t.n++;
      if (p.tid !== e.own) { t.bad++; t.eg = t.eg || `${f} P${e.per} ${e.rem}`; }
    }
  }
  const types = Object.keys(per);
  assert.ok(types.length >= 8, `only ${types.length} types carried an actor and a team`);
  for (const [t, v] of Object.entries(per)) {
    assert.ok(v.n >= 20, `only ${v.n} ${t} events — too few to say anything`);
    assert.equal(v.bad, 0,
      `${v.bad} of ${v.n} ${t} events name an actor who is NOT on the team the event `
      + `is attributed to (first: ${v.eg}). Either ATTRIBUTION.${t}.field reads the `
      + 'wrong player, or the sentence for it describes the wrong one');
  }
});
