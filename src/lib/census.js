/**
 * The census — four questions asked of every game in the archive.
 *
 * WHY THIS IS A LIBRARY AND NOT A BLOCK INSIDE measure.mjs. That file's own
 * header says it "is a driver and nothing else... every rule it applies lives in
 * src/lib and is imported, never restated." These are rules. They also have to
 * be unit-testable against a fixture, and a function buried in a driver is only
 * testable by running the driver.
 *
 * ⭐ EVERY TALLY HERE IS AN INTEGER, AND THAT IS DELIBERATE. A per-game record
 * of counts sums across 4,553 games exactly; a per-game record of RATES does
 * not, because a mean of means weights a 40-event game like an 80-event one.
 * Nothing is divided until the whole archive has been added up, and the division
 * happens once, in `censusRates`.
 *
 * WHAT EACH QUESTION IS FOR, since a measurement with no claim behind it is just
 * arithmetic:
 *
 *   faceoffZone   Is a draw worth different amounts in different places? An
 *                 8-game sample said 2.71x in the offensive zone against 0.61x
 *                 in the defensive — which would explain why the archive's
 *                 faceoff-share result is a null (50.4%): the season total adds
 *                 up quantities with opposite signs.
 *   endZone       THE CONTROL FOR THAT. The first table cannot separate "being
 *                 in the attacking end" from "winning the puck there", because
 *                 the same physical draw lands in the O row or the D row
 *                 depending only on who won. This fixes the end and splits by
 *                 who won, so the place is held constant.
 *   drawStrength  Is a draw worth more on the power play? 8 games said 4.50x
 *                 against 1.29x at even strength.
 *   state         Goals per sixty minutes of even strength against the same on
 *                 a power play. 8 games said 4.65 and 7.40.
 *   club          Per club-game hits and attempts, so the "you hit the team that
 *                 has the puck" hypothesis can be tested. CHENG proposed it and
 *                 killed it on one game; 8 games gave r = -0.15, which is
 *                 nothing either way.
 *
 * ⚠️ EVERY ONE OF THOSE NUMBERS IS FROM AT MOST EIGHT GAMES AND NONE OF THEM MAY
 * BE PUBLISHED. They are recorded here as what the archive is being asked to
 * confirm or refute, not as findings.
 */
import { corsi } from './layers/corsi.js';
import { situation, EVEN, POWER_PLAY, EMPTY_NET } from './strength.js';
import { attackDirection, BLUE_LINE_X } from './rink.js';

/**
 * Which zone a point is in, for the club attacking in `dir`.
 *
 * GEOMETRY, NOT A FEED FIELD. The extract carries `zone` on PENALTIES ONLY —
 * measured at 100% there and absent everywhere else — so every other event's
 * zone has to be derived. That is not a compromise: `BLUE_LINE_X` is the same
 * constant the blue-line band is drawn from, so a reader can check the answer
 * against the paint. Doctrine 7's rule, applied to a different line.
 */
export function zoneOf(x, dir) {
  const ax = x * dir;
  return ax > BLUE_LINE_X ? 'O' : ax < -BLUE_LINE_X ? 'D' : 'N';
}

/**
 * The run of play a faceoff opens: every event until play stops again.
 *
 * ⭐ BOTH ENDS ARE RECORDED, WHICH IS THE WHOLE POINT. A window of "the next N
 * events" or "the next 20 seconds" would be a parameter with no source in the
 * data — CHENG's own phrase for it is a model wearing a UI control — and the
 * answer would move with the number chosen. A faceoff and a whistle are both
 * events the league recorded, so this window is a fact about the game.
 *
 * A PERIOD BOUNDARY ENDS IT TOO, and so does the next faceoff: a run that
 * crossed either would credit one draw with play that a different draw started.
 */
export function runAfter(events, i) {
  const from = events[i];
  const out = [];
  for (let j = i + 1; j < events.length; j++) {
    const e = events[j];
    if (e.per !== from.per) break;
    if (e.type === 'stoppage' || e.type === 'period-end' || e.type === 'game-end') break;
    if (e.type === 'faceoff') break;
    out.push(e);
  }
  return out;
}

const zeroSplit = () => ({ n: 0, aw: 0, al: 0, gw: 0, gl: 0 });

/**
 * One game, censused. Returns integers only.
 *
 * @param {Array} events   the game's events, in play order
 * @param {{homeId:number, awayId:number, roster:object}} ctx
 */
export function censusGame(events, ctx) {
  const { homeId } = ctx;

  /* ⭐ WHAT AN ATTEMPT IS COMES FROM corsi, NEVER FROM A TYPE CHECK.
     The reducer drops shootout attempts, delayed-penalty events and everything
     else that is not a play, and it is the same function the chip counts with.
     A local `['shot-on-goal','goal',...]` test here would be a second answer to
     a question src/lib already answers — and it would silently admit the
     shootout, where every attempt is unblocked and from the slot. */
  const attempts = new Set(corsi.reduce(events, { ...ctx, evenOnly: false }).counted);
  const isAttempt = j => attempts.has(j);

  const faceoffZone = { O: zeroSplit(), N: zeroSplit(), D: zeroSplit() };
  const endZone = { won: { n: 0, atk: 0, def: 0, g: 0 }, lost: { n: 0, atk: 0, def: 0, g: 0 } };
  const drawStrength = { even: zeroSplit(), pp: zeroSplit() };
  const state = { even: { secs: 0, goals: 0 }, pp: { secs: 0, goals: 0 },
                  en: { secs: 0, goals: 0 }, unknown: { secs: 0, goals: 0 } };
  const club = { h: { hits: 0, attempts: 0 }, a: { hits: 0, attempts: 0 } };

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    // ---- per-club totals, for the hits-against-attempts question ------------
    if (e.own != null && e.pt !== 'SO') {
      const side = e.own === homeId ? 'h' : 'a';
      if (e.type === 'hit') club[side].hits++;
      if (isAttempt(i)) club[side].attempts++;
    }

    // ---- time in each strength state ---------------------------------------
    /* ⚠️ THE STATE IS KNOWN AT AN EVENT AND ASSUMED TO HOLD UNTIL THE NEXT ONE.
       That is an assumption and it is stated rather than hidden. It is
       defensible because the things that change strength — a penalty, a goal, a
       goaltender pulled — are themselves events, so the state cannot change in
       a gap without an event marking it. Intermissions are excluded by the
       same-period test: the clock does not run between periods. */
    if (e.pt !== 'SO') {
      const nx = events[i + 1];
      if (nx && nx.per === e.per && nx.pt !== 'SO') {
        const d = nx.s - e.s;
        if (d >= 0) {
          const s = situation(e.sit, ctx);
          const key = s == null ? 'unknown'
            : s.kind === EVEN ? 'even' : s.kind === POWER_PLAY ? 'pp' : 'en';
          state[key].secs += d;
          if (e.type === 'goal') state[key].goals++;
        }
      }
    }

    // ---- the faceoff questions ---------------------------------------------
    if (e.type !== 'faceoff' || e.own == null || e.x == null || e.pt === 'SO') continue;

    const dir = attackDirection(e.own, homeId);
    const z = zoneOf(e.x, dir);
    const run = runAfter(events, i);
    let aw = 0, al = 0, gw = 0, gl = 0;
    for (let j = i + 1; j <= i + run.length; j++) {
      const x = events[j];
      if (!isAttempt(j) || x.own == null) continue;
      if (x.own === e.own) { aw++; if (x.type === 'goal') gw++; }
      else { al++; if (x.type === 'goal') gl++; }
    }
    const add = (t) => { t.n++; t.aw += aw; t.al += al; t.gw += gw; t.gl += gl; };
    add(faceoffZone[z]);

    // The control: end-zone draws, seen from the club ATTACKING that end, so the
    // place is fixed and only the winner varies.
    if (Math.abs(e.x) > 60) {
      const atk = e.x > 0 ? homeId : ctx.awayId;
      const won = e.own === atk;
      const t = endZone[won ? 'won' : 'lost'];
      t.n++;
      t.atk += won ? aw : al;
      t.def += won ? al : aw;
      t.g   += won ? gw : gl;
    }

    // Was the draw won by a club that had the advantage?
    const s = situation(e.sit, ctx);
    if (s != null) {
      if (s.kind === EVEN) add(drawStrength.even);
      else if (s.kind === POWER_PLAY && e.own === s.advantage) add(drawStrength.pp);
    }
  }

  /* ⭐ THE CORRELATION IS CARRIED AS SUFFICIENT STATISTICS, NOT AS A RATE.
     r cannot be averaged across games -- a mean of per-game correlations is not
     the correlation of the archive, and a mean of per-game rates weights a
     40-event game like an 80-event one. These six sums are exactly additive, so
     4,553 games fold into them with no loss and r is computed once at the end.
     The pair is the HOME-MINUS-AWAY differential, which removes anything that
     scales a whole game (a fast night, a blowout) from both terms at once. */
  const dh = club.h.hits - club.a.hits;
  const da = club.h.attempts - club.a.attempts;
  const hitCorr = { n: 1, sx: dh, sy: da, sxx: dh * dh, syy: da * da, sxy: dh * da,
                    opposite: dh * da < 0 ? 1 : 0 };

  return { faceoffZone, endZone, drawStrength, state, club, hitCorr };
}

/** Add one game's census into a running total, in place. */
export function censusAdd(total, one) {
  const walk = (t, o) => {
    for (const k of Object.keys(o)) {
      if (typeof o[k] === 'number') t[k] = (t[k] || 0) + o[k];
      else { t[k] = t[k] || {}; walk(t[k], o[k]); }
    }
  };
  walk(total, one);
  total.games = (total.games || 0) + 1;
  return total;
}

/**
 * The division, done ONCE, on the whole archive.
 *
 * ⭐ AND IT REFUSES RATHER THAN DIVIDING BY ZERO. A season with no five-on-three
 * is not a season where five-on-three produced nothing; `null` says we cannot
 * speak, which is the same standing `situation()` takes on a code it does not
 * know. A 0 here would be published as a fact.
 */
export function censusRates(t) {
  const per60 = s => s.secs > 0 ? +(s.goals / (s.secs / 3600)).toFixed(3) : null;
  const ratio = (a, b) => b > 0 ? +(a / b).toFixed(3) : null;
  const perDraw = z => z.n > 0 ? +(z.aw / z.n).toFixed(3) : null;

  const ez = t.endZone || { won: {}, lost: {} };
  const wonPer = ez.won?.n > 0 ? ez.won.atk / ez.won.n : null;
  const lostPer = ez.lost?.n > 0 ? ez.lost.atk / ez.lost.n : null;

  return {
    games: t.games || 0,
    // What a draw is worth where it happens, and who it is worth it to.
    faceoffZone: Object.fromEntries(['O', 'N', 'D'].map(k => {
      const z = t.faceoffZone?.[k] || { n: 0 };
      return [k, { n: z.n || 0, winnerPerDraw: perDraw(z),
                   loserPerDraw: z.n > 0 ? +(z.al / z.n).toFixed(3) : null,
                   ratio: ratio(z.aw, z.al) }];
    })),
    /* THE CONTROLLED ANSWER, and the one a sentence may quote. `zoneWorth` is
       what the attacking club generates having LOST the draw — that is what
       being there is worth on its own — and `winningWorth` is what winning it
       adds on top. An 8-game sample put those at 1.29 and 0.30. */
    endZone: {
      n: (ez.won?.n || 0) + (ez.lost?.n || 0),
      zoneWorth: lostPer == null ? null : +lostPer.toFixed(3),
      winningWorth: (wonPer == null || lostPer == null) ? null : +(wonPer - lostPer).toFixed(3),
      lift: (wonPer == null || lostPer == null || lostPer === 0) ? null
            : +((wonPer - lostPer) / lostPer).toFixed(3),
    },
    drawStrength: Object.fromEntries(['even', 'pp'].map(k => {
      const z = t.drawStrength?.[k] || { n: 0 };
      return [k, { n: z.n || 0, ratio: ratio(z.aw, z.al) }];
    })),
    state: Object.fromEntries(['even', 'pp', 'en', 'unknown'].map(k => {
      const s = t.state?.[k] || { secs: 0, goals: 0 };
      return [k, { minutes: +(s.secs / 60).toFixed(1), goals: s.goals, per60: per60(s) }];
    })),
    /* DOES HITTING RUN INVERSE TO HAVING THE PUCK? CHENG's hypothesis, killed on
       one game and unmeasurable on eight (r = -0.15). A NEGATIVE r supports it.
       `opposite` is the same question asked without any distributional
       assumption at all -- the share of games where the club with more hits had
       fewer attempts -- and it is here because a correlation on a heavy-tailed
       differential can be carried by a handful of blowouts. */
    hits: (() => {
      const c = t.hitCorr;
      if (!c || !c.n) return { n: 0, r: null, opposite: null };
      const num = c.n * c.sxy - c.sx * c.sy;
      const den = Math.sqrt(c.n * c.sxx - c.sx * c.sx) * Math.sqrt(c.n * c.syy - c.sy * c.sy);
      return { n: c.n, r: den > 0 ? +(num / den).toFixed(3) : null,
               opposite: +(c.opposite / c.n).toFixed(3),
               totalHits: (t.club?.h?.hits || 0) + (t.club?.a?.hits || 0) };
    })(),
  };
}
