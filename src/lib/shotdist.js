/**
 * How often a shot from a given distance goes in.
 *
 * A band is a 5-foot span of shots that were not blocked and whose location the
 * feed records. Five feet is the policy: wide enough to quote, narrow enough
 * that a shot from the crease and a shot from the blue line are not one number.
 * Blocked shots are left out because the feed records where the puck was
 * stopped, not where it was shot. Shots at an empty net are left out too:
 * they inflate long-range rates and mislead a newcomer. Every situation is
 * counted, and shots are not split by type: those bands would be too thin to
 * quote (Kevin, 2026-10-28).
 */
import { corsiTeam, SHOT_TYPES } from './attribution.js';
import { attackDirection, distanceToNet } from './rink.js';
import { EMPTY_NET, standing } from './strength.js';

/** Width of one band, in feet. */
export const BAND_FT = 5;
/**
 * Fewest attempts before a band's rate is quoted.
 * Below this, one more goal moves the percentage too far to say.
 */
export const MIN_BAND_N = 30;

/** Rounded feet from the shot to the net it was aimed at, or null when the feed has no location. */
export function shotFeet(e, shooter, homeId) {
  if (!e || shooter == null || e.x == null || e.y == null) return null;
  return Math.round(distanceToNet(e.x, e.y, attackDirection(shooter, homeId)));
}

/** The start of the band that holds `ft`. `width` is the published band, defaulting to the policy. */
export function bandFrom(ft, width = BAND_FT) {
  return Math.floor(Math.max(0, ft) / width) * width;
}

/**
 * True when the shot is at a net with no goalie in it.
 * standing() names the team that pulled; that team is not the shooter.
 */
export function atEmptyNet(e, shooter, ctx) {
  const s = standing(e && e.sit, ctx);
  return !!(s && s.kind === EMPTY_NET && shooter != null && s.id !== shooter);
}

/**
 * Tally unblocked, located attempts in `counted` (a Control reducer's counted set)
 * into 5-foot bands. `counted` is that set so this cannot grow a second definition
 * of what an attempt is.
 */
export function countBands(events, counted, ctx) {
  const bands = new Map();
  const leftOut = { goals: 0, n: 0 };
  for (const id of counted) {
    const e = events[id];
    if (!e || !SHOT_TYPES.has(e.type)) continue;
    const shooter = corsiTeam(e, ctx.roster);
    const ft = shotFeet(e, shooter, ctx.homeId);
    if (ft == null) continue;
    if (atEmptyNet(e, shooter, ctx)) {
      leftOut.n++;
      if (e.type === 'goal') leftOut.goals++;
      continue;
    }
    const from = bandFrom(ft);
    let b = bands.get(from);
    if (!b) bands.set(from, b = { goals: 0, n: 0 });
    b.n++;
    if (e.type === 'goal') b.goals++;
  }
  return {
    rows: [...bands.entries()].sort((a, b) => a[0] - b[0]).map(([from, b]) => [from, b.goals, b.n]),
    leftOut,
  };
}

const POLICY = `Counted in ${BAND_FT}-foot bands over every situation, with no split by `
  + 'shot type. A blocked shot is left out because the feed records where it was '
  + 'stopped, not where it was taken. Shots at an empty net are left out because '
  + 'they inflate long-range rates and mislead a newcomer. '
  + `A band with fewer than ${MIN_BAND_N} attempts is not quoted. n counts attempts, not games.`;

/** The archive document: one row per band that occurred, plus the policies that built it. */
export function shotDistance(rows) {
  const acc = new Map();
  let games = 0, leftN = 0, leftGoals = 0;
  for (const g of rows) {
    if (!g.dist) continue;
    games++;
    for (const [from, goals, n] of g.dist.rows) {
      let b = acc.get(from);
      if (!b) acc.set(from, b = { goals: 0, n: 0 });
      b.goals += goals;
      b.n += n;
    }
    leftN += g.dist.leftOut.n;
    leftGoals += g.dist.leftOut.goals;
  }
  const bands = [...acc.keys()].sort((a, b) => a - b).map(from => {
    const b = acc.get(from);
    return { from, to: from + BAND_FT, goals: b.goals, n: b.n, rate: b.n ? b.goals / b.n : null };
  });
  return { bandFt: BAND_FT, minN: MIN_BAND_N, games, bands,
           leftOut: { n: leftN, goals: leftGoals }, what: POLICY };
}

/** The band `ft` falls in, or null when nothing is published. */
function bandOf(ft, doc) {
  if (ft == null || !doc || !doc.bands) return null;
  const width = doc.bandFt || BAND_FT, from = bandFrom(ft, width);
  return doc.bands.find(x => x.from === from) || { from, to: from + width, goals: 0, n: 0, rate: null };
}

/** True when the band holds enough shots to quote. */
const quotable = (b, doc) => !!b && b.n >= (doc.minN || MIN_BAND_N);

/** The sentence under a located goal, or '' when there is nothing to say. */
export function distanceSentence(ft, doc) {
  const b = bandOf(ft, doc);
  if (!b) return '';
  const span = `${b.from} to ${b.to} feet out`, n = b.n.toLocaleString('en-US');
  if (!quotable(b, doc)) return `Too few shots from ${span} to say how often they go in: ${n} counted.`;
  if (!b.goals) return `None of the ${n} shots from ${span} has gone in.`;
  return `About 1 in ${Math.round(b.n / b.goals)} shots from ${span} goes in: `
    + `${b.goals.toLocaleString('en-US')} of ${n}.`;
}

/** The line under a goal in Goals, and whether it quotes a published band. An empty net is a sentence, not a rate. */
export function goalRead(e, ctx, doc) {
  if (!e || e.type !== 'goal') return { say: '', quoted: false };
  const shooter = corsiTeam(e, ctx.roster);
  if (atEmptyNet(e, shooter, ctx)) return { say: 'The net was empty, so there’s no goalie to beat.', quoted: false };
  const ft = shotFeet(e, shooter, ctx.homeId);
  return { say: distanceSentence(ft, doc), quoted: quotable(bandOf(ft, doc), doc || {}) };
}

/** The line under a goal in Goals. */
export const goalLine = (e, ctx, doc) => goalRead(e, ctx, doc).say;
