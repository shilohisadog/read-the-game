/**
 * Pipeline-time analysis: the archive, measured.
 *
 * THIS FILE IS A DRIVER AND NOTHING ELSE. It reads extracts, calls the SAME
 * reducers the browser calls, and writes one document. Every rule it applies —
 * what an attempt is, whose it is, what even strength means, what the shootout is
 * not — lives in src/lib and is imported, never restated.
 *
 * WHY THAT MATTERS ENOUGH TO CROSS A LANGUAGE BOUNDARY. The plan of record put
 * this computation in derive.py, in Python, which would have been a second
 * implementation of the domain rules in a second language. That is the defect
 * this project argued from in docs/catalog.md §3 to make the catalog quote the
 * boxscore — and it had already begun: the scratch script this grew out of opened
 * by promising to "mirror src/lib/strength.js exactly", which is a claim with no
 * check behind it. KNOWN_SITUATIONS has gained codes twice. See
 * docs/architecture.md §2.
 *
 * A Python copy plus a differential test was the tempting alternative and is
 * worse: a differential test validates on the games it runs, which is a rule
 * checked against a sample. One implementation cannot drift.
 *
 *   node builders/measure.mjs --out ingest
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { corsi } from '../src/lib/layers/corsi.js';
import { tiedControl } from '../src/lib/layers/tied.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { danger } from '../src/lib/layers/danger.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { shootingTeam, SHOT_TYPES } from '../src/lib/attribution.js';
// The SAME two functions danger.js calls at line 118 — a distance measured here
// cannot disagree with a distance measured by the layer.
import { attackDirection, distanceToNet } from '../src/lib/rink.js';
import { inScope, summarise } from '../src/lib/archive.js';
import { teamSeasons } from '../src/lib/team-season.js';
import { censusGame, censusAdd, censusRates } from '../src/lib/census.js';
import { TEAMS } from '../src/lib/teams.js';

/**
 * How the game ended, read from the league's own period type.
 *
 * NOT from the period NUMBER, and the difference is the whole point: a regular
 * season shootout is recorded in a period past 3 and so is an overtime that
 * ended in a goal, which makes the number ambiguous exactly where the W-L-OTL
 * split needs it to be sharp. `pt` says which it was.
 *
 * The field is present on 33,202 of 33,202 events across a 103-game sample and
 * takes three values, and on every one of them it agrees with the period number
 * about REG versus past-REG — so the two witnesses are checked against each
 * other in test/measure.test.js rather than one being trusted.
 */
export function endedIn(events) {
  let ot = false;
  for (const e of events) {
    if (e.pt === 'SO') return 'SO';        // a shootout outranks the overtime it followed
    if (e.pt === 'OT') ot = true;
  }
  return ot ? 'OT' : 'REG';
}

/** One game's measurements, in the shape src/lib/archive.js consumes. */
export function measureGame(g) {
  const ctx = {
    roster: g.roster,
    homeId: g.teams.home.id, awayId: g.teams.away.id,
    homeAb: g.teams.home.ab, awayAb: g.teams.away.ab,
  };
  // Attempts at ALL strengths — this is the raw Corsi total, and the base rate
  // built on it is the one that inverts. evenOnly is deliberately off here and
  // deliberately not a parameter in tiedControl.
  const all = corsi.reduce(g.events, { ...ctx, evenOnly: false });
  const level = tiedControl.reduce(g.events, ctx);
  // WHAT THE ATTEMPTS WERE MADE OF, read back off corsi's OWN counted set.
  //
  // Not off `g.events` by type, and the difference is not cosmetic: corsi
  // decides what an attempt IS — it drops shootout attempts, delayed-penalty
  // events and everything else that is not a play. Counting raw types here
  // would be a second answer to a question src/lib already answers, which is
  // the one thing this file exists not to do. It would also silently include
  // the shootout, where every attempt is unblocked and from the slot.
  const mix = { goal: 0, 'shot-on-goal': 0, 'missed-shot': 0, 'blocked-shot': 0 };
  for (const id of all.counted) mix[g.events[id].type]++;

  // THE OTHER THREE LAYERS, IMPORTED AND NOT RESTATED. Every rule below —
  // who is credited with a block, what counts as the slot, what a goalie
  // actually faced — lives in src/lib and is called here exactly as the browser
  // calls it. `evenOnly: false` is stated on each rather than inherited, because
  // a season aggregate that silently dropped special teams would look right.
  const lay = { ...ctx, evenOnly: false };
  const blk = blocked.reduce(g.events, lay);
  const slotted = danger.reduce(g.events, lay);
  const nets = goaltending.reduce(g.events, lay);
  /* ⭐ AND THE FIFTH LENS, WHICH NOTHING HAS EVER MEASURED. `measures.json`
     could say a shot attempt is blocked 27.7% of the time and could not say
     whether 55 stoppages is a normal night — §32.6's blocker, and the reason no
     surface can call a game unusual. The whistle layer counts nothing about a
     club, so it appears in the per-game distribution and nowhere else. */
  const stops = whistle.reduce(g.events, lay);
  const sideOf = tid => tid === ctx.homeId ? 'h' : tid === ctx.awayId ? 'a' : null;

  const slot = { h: 0, a: 0 };
  for (const id of slotted.counted) {
    const s = sideOf(shootingTeam(g.events[id], g.roster));
    if (s) slot[s]++;
  }
  // THE SLOT'S OWN DENOMINATOR, counted over the same events danger.js could
  // have counted: an unblocked attempt whose location the feed records. Using
  // total attempts would divide by a population containing blocked shots, whose
  // origin is not in the feed at all — the numerator and the denominator have to
  // mean the same thing, which is the lesson extract.py's SOG check paid for.
  const located = { h: 0, a: 0 };
  for (const id of all.counted) {
    const e = g.events[id];
    if (!SHOT_TYPES.has(e.type) || e.x == null) continue;
    const s = sideOf(shootingTeam(e, g.roster));
    if (s) located[s]++;
  }

  /* ⭐ THE GOALS, AND THEIR OWN DENOMINATOR — a different population from
     `slot`/`located` above, which are about ATTEMPTS. The question a reader asks
     of the shaded area is "of the goals, how many came from in there", and
     answering it with the attempt figures beside it would be the third quantity
     nobody sanctioned that `saveShare` exists to head off.

     COUNTED OVER THE EVENTS `danger` COULD HAVE JUDGED. A goal the feed gives no
     coordinate for is neither inside the slot nor outside it, and dividing by
     every goal would silently score it as "not from the slot" — the numerator
     and the denominator have to mean the same thing. The unplaced ones are
     carried rather than dropped, so the published share can say how many it
     could not speak for. */
  const inSlot = new Set(slotted.counted);
  const goals = { slot: 0, placed: 0, unplaced: 0 };
  for (const id of all.counted) {
    const e = g.events[id];
    if (e.type !== 'goal') continue;
    if (e.x == null) { goals.unplaced++; continue; }
    goals.placed++;
    if (inSlot.has(id)) goals.slot++;
  }

  /* ⭐⭐ HOW FAR OUT EACH KIND OF ATTEMPT IS RECORDED — the number that makes the
     blocked-shot coordinate legible instead of merely disclaimed.

     `src/lib/attribution.js` has said for months that a blocked shot's
     coordinate is the BLOCKER's and therefore nearer the net than the shot was
     taken, citing a median 24.2 ft against 33.4 for a shot on goal — over an
     EIGHTY-GAME SAMPLE, in a comment, published nowhere. It is the site's
     sharpest piece of self-disclosure and no page could read it.

     ⭐ THE DIRECTION RULE IS `danger.js`'s, IMPORTED. `attackDirection` and
     `distanceToNet` are the same two functions the slot layer calls at
     danger.js:118, so a distance measured here cannot disagree with a distance
     measured there. Restating either would be a second answer to a question
     src/lib already answers, which is the one thing this file exists not to do.

     ⛔ AND A MEDIAN NEEDS NO THRESHOLD. "Beyond 50 ft" was the tempting form and
     50 is a number we would have chosen — a parameter with no source, which is
     the defect `docs/game-sentence.md` §3 removed from the goalie card. The
     distances are published as a distribution and the reader picks the cut. */
  const reach = {};
  for (const id of all.counted) {
    const e = g.events[id];
    if (e.x == null || e.y == null) continue;
    const team = shootingTeam(e, g.roster);
    if (team == null) continue;          // unresolvable, and never guessed at
    (reach[e.type] ||= []).push(
      Math.round(distanceToNet(e.x, e.y, attackDirection(team, ctx.homeId))));
  }

  const goalies = [];
  for (const [pid, v] of Object.entries(nets.g)) {
    const p = g.roster[pid];
    const s = p ? sideOf(p.tid) : null;
    if (!s) continue;                  // unresolvable, and never guessed at
    goalies.push({ pid: Number(pid), nm: p.nm || p.n, side: s,
                   faced: v.f, saves: v.s, date: g.game.date || null });
  }
  goalies.sort((x, y) => x.pid - y.pid);

  return {
    id: g.game.id,
    date: g.game.date || null,
    end: endedIn(g.events),
    homeAb: ctx.homeAb, awayAb: ctx.awayAb,
    mix,
    // Blocks CREDITED to each side — the team that did the blocking, which is
    // the defending team and therefore NOT the event's owner.
    blocks: { h: blk.t[ctx.homeId], a: blk.t[ctx.awayId] },
    slot, located, goals, goalies, reach,
    /* ⭐ THE FIVE LENS COUNTS, AS THE CHIPS COUNT THEM. The selector under the
       rink puts a live count on each lens, and it is `LEDGER[id](sl)
       .counted.length` for every one of them — so a reference class built on
       any other quantity would be a number about a different thing wearing the
       same label. These ARE that quantity: the same reducers, the same field.
       `test/measure.test.js` asserts the identity against the page's own table
       rather than trusting this comment. */
    /* ⚠️ KEYED BY THE PAGE'S OWN LENS IDS — `corsi`, not `attempts`, and `whistle`,
       not `stoppages`. The first version renamed two of the five to their human
       labels, which is a SECOND VOCABULARY for one set of things: the same shape
       as `play` meaning two different things in two layers, which had just cost
       a day. The chip is `data-l="corsi"` and the reducer table is keyed the
       same, so this is too, and the human wording lives in `what` where a
       reader meets it. */
    lens: {
      corsi: all.counted.length,
      slot: slotted.counted.length,
      blocked: blk.counted.length,
      goaltending: nets.counted.length,
      whistle: stops.counted.length,
    },
    // THE LEAGUE'S OWN LINE, quoted from the boxscore and stored in the extract
    // so nothing here re-derives a score. If it is missing we do not guess.
    score: { h: g.quoted.home.score, a: g.quoted.away.score },
    sog: { h: g.quoted.home.sog, a: g.quoted.away.sog },
    attempts: { h: all.t[ctx.homeId], a: all.t[ctx.awayId] },
    level: level.diff,
  };
}

/**
 * A property of how the LEAGUE records hockey, watched across the whole archive.
 *
 * A faceoff always follows the stoppage that caused it, recorded at the SAME
 * second — so a faceoff is never the first event at its clock. 0 of 4,851 in
 * one sample and 0 of 4,874 in an independent playoff sample
 * (docs/deep-link-seam.md §4). The deep-link resolver relies on it: a bare
 * `?at=2-14:32` naming a draw lands on the stoppage, which is why the grammar
 * carries an ordinal at all.
 *
 * IT REPORTS AND DOES NOT REFUSE, and the distinction is the whole reason it
 * lives here rather than in extract.py's --validate. Every check in --validate
 * asks whether OUR EXTRACT is wrong about the game, and failing one means we
 * must not publish. This asks whether the LEAGUE'S RECORDING CONVENTION still
 * holds. A game that broke it would be perfectly good hockey, correctly
 * extracted, where only our link resolution degrades — and refusing to show it
 * would be exactly the overreach derive.py warns against: "a refusal is a
 * statement about what we can SHOW".
 */
export function firstAtClock(events) {
  const first = new Map();
  const offenders = [];
  events.forEach((e, i) => {
    const k = e.per + '|' + e.rem;
    if (!first.has(k)) first.set(k, i);
    else return;
    if (e.type === 'faceoff') offenders.push(i);
  });
  return offenders;
}

export function measureAll(dir) {
  const records = [];
  const skipped = [];
  const drawFirst = [];
  /* ⭐ THE CENSUS, ACCUMULATED IN INTEGERS ACROSS THE WHOLE ARCHIVE.
     Four claims are waiting on it, all of them currently measured on eight games
     or fewer and none of them publishable: what a faceoff win is worth by zone,
     what winning it adds once the zone is held constant, whether a draw is worth
     more on a power play, and whether hits run inverse to having the puck.
     IT RIDES THE SAME WALK. The extracts are already being read and parsed here;
     a second pass would be a second answer to "which games count" and half an
     hour of I/O for nothing. `inScope` gates it exactly as it gates the records,
     so no preseason or Olympic game reaches a published rate. */
  const census = {};
  /* EVERY CLUB THE ARCHIVE CONTAINS, so the one table nobody derives can be
     checked against it HERE rather than against a hand-pinned list in a unit
     test. teams.js claims "the next relocation or expansion team fails loudly
     instead of rendering a blank chip" and that was not true: its completeness
     test compares TEAMS to a fixture a human has to re-pin, so a new club
     renders as a grey chip and everything stays green until someone notices.

     This is the same hole `gameType` sat in. The rule it cost us: a value the
     LEAGUE can invent needs a check where the whole archive is walked, not in a
     unit test holding a copy of last year's answer. Collected over every
     extract, in scope or not — a club that only ever played a preseason game
     still gets a chip. */
  const clubs = new Set();
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const g = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    // Watched on EVERY extract, in scope or not: the recording convention is
    // not a rule about which games count, and a deep link into a preseason
    // game resolves through the same code as any other.
    const bad = firstAtClock(g.events);
    if (bad.length) drawFirst.push({ id: g.game.id, at: bad });
    clubs.add(g.teams.home.ab); clubs.add(g.teams.away.ab);
    // Out of scope is not a fault and not a skip — it is the settled rule that
    // preseason, the Olympics and the 4 Nations never enter a computed number.
    if (!inScope(g.game.id)) continue;
    if (!g.quoted) { skipped.push(g.game.id); continue; }
    records.push(measureGame(g));
    censusAdd(census, censusGame(g.events, {
      roster: g.roster,
      homeId: g.teams.home.id, awayId: g.teams.away.id,
      homeAb: g.teams.home.ab, awayAb: g.teams.away.ab,
    }));
  }
  return { records, skipped, drawFirst, census,
           unnamedClubs: [...clubs].filter(ab => !TEAMS[ab]).sort() };
}

/** JSON with object keys sorted, so the file is a function of its input alone. */
export function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort()
      .map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function main(argv) {
  const i = argv.indexOf('--out');
  const out = i === -1 ? 'ingest' : argv[i + 1];
  const dir = join(out, 'extract');
  if (!existsSync(dir)) {
    console.error(`::error::no extracts at ${dir} — nothing to measure`);
    process.exit(1);
  }
  const { records, skipped, drawFirst, census, unnamedClubs } = measureAll(dir);
  /* THE DIVISION HAPPENS ONCE, HERE, on the finished totals. Every tally that
     reached this point is an integer, so the archive folds in exactly and no
     game is weighted by how many events it happened to contain. */
  const doc = { ...summarise(records), measured: records.length,
                census: censusRates(census) };
  // NO TIMESTAMP, and KEYS SORTED. Same extracts in, same bytes out, so any diff
  // on a re-run is a real change of opinion or of data — the same property
  // catalog.json holds through `sort_keys=True`. Freshness is index.json's job.
  writeFileSync(join(out, 'measures.json'), stable(doc));
  // A SECOND DOCUMENT, and deliberately not a bigger first one. measures.json is
  // fetched by the home page and by every game page; the per-team seasons are
  // read by one surface that neither of them shows. Freshness is index.json's
  // job here too — no timestamp, keys sorted, same extracts in, same bytes out.
  const teams = teamSeasons(records);
  writeFileSync(join(out, 'teams.json'), stable(teams));
  /* LOUD, AND AFTER EVERYTHING IS WRITTEN. A club with no entry cannot change a
     number — the rates are computed from ids, not abbreviations — so this is a
     naming gap and not a data fault, and withholding the archive over one would
     be the mistake the 73 refused games already were. Same shape and same
     reason as the unnamed gameType check in derive.py. */
  if (unnamedClubs.length) {
    console.error(`::error::the archive contains ${unnamedClubs.join(', ')} and `
      + 'src/lib/teams.js has no entry — they render as grey chips with no name. '
      + 'Add them; the measures are written and correct.');
  }
  const r = doc.baseRates;
  console.log(JSON.stringify({
    measured: records.length,
    skippedNoQuote: skipped.length,
    featured: doc.featured[0],
    rates: Object.fromEntries(Object.entries(r).map(([k, v]) =>
      [k, v.rate == null ? null : `${(v.rate * 100).toFixed(1)}% of ${v.n}`])),
    seasons: Object.fromEntries(Object.entries(teams.seasons).map(([y, t]) =>
      [y, `${Object.keys(t).length} teams`])),
    clubs: [...new Set(records.flatMap(r => [r.homeAb, r.awayAb]))].length,
    unnamedClubs,
    archive: Object.fromEntries(Object.entries(teams.archive).map(([k, v]) =>
      [k, v.rate == null ? null : `${(v.rate * 100).toFixed(2)}% of ${v.n}`])),
    /* PRINTED, because a number nobody reads is a number nobody checks. These
       are the four claims the census exists to settle, in the run's own log. */
    census: {
      draw: `zone worth ${doc.census.endZone.zoneWorth} attempts, winning it adds `
          + `${doc.census.endZone.winningWorth} (n=${doc.census.endZone.n})`,
      drawOnPP: `${doc.census.drawStrength.pp.ratio}x on the power play vs `
          + `${doc.census.drawStrength.even.ratio}x at even strength`,
      goalsPer60: `even ${doc.census.state.even.per60}, power play ${doc.census.state.pp.per60}`,
      hits: `r=${doc.census.hits.r}, opposite in ${doc.census.hits.opposite} of games`,
      unreadableStrength: `${doc.census.state.unknown.minutes} min of play whose `
          + `situation code strength.js does not know`,
    },
  }, null, 2));
  // LOUD, because a silent change here is a wrong landing on every teaching
  // link into the affected game rather than a missing number.
  if (drawFirst.length) {
    console.log(`::warning::a faceoff was recorded before its own stoppage in `
              + `${drawFirst.length} game(s) — deep links resolving on a bare `
              + `clock will land on the draw instead of the whistle: `
              + `${drawFirst.slice(0, 5).map(d => d.id).join(', ')}`);
  }
  if (skipped.length) {
    console.log(`  ${skipped.length} in-scope extracts carry no quoted boxscore `
              + `and were NOT measured: ${skipped.slice(0, 5).join(', ')}…`);
  }
  // THE EXIT CODE IS THE ALERT. An `::error::` line with a zero exit is a green
  // check with a red message in it, which is the same "recorded but nobody is
  // told" gap this guard exists to close — measures.json and teams.json are
  // already on disk by the time we get here.
  if (unnamedClubs.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
