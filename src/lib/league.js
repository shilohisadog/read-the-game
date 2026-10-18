/**
 * Our per-player figures for one game, and the league's own figures for the same
 * game (copied by extract.py into `quoted.players` / `quoted.pp`, SCHEMA 6), so
 * every surface can show both where they differ (Kevin, 2026-10-13: count from
 * the play-by-play, and show the league's boxscore figure beside ours).
 */
/**
 * One row per dressed skater: who he is, and what he did in THIS game.
 *
 * ⭐ THE ACTORS ARE READ THROUGH THE SAME FIELDS THE REPLAY READS. `actor` is
 * what `attribution.js` resolves for every event type and `a1`/`a2` are the
 * assists -- so a goal counted here is the same goal the page writes a name
 * beside. Counting from raw `details` would be a second reading of the feed.
 */
export function playersIn(g) {
  const out = new Map();
  // ⚠️ THE CLUB IS THE ABBREVIATION, NOT THE LEAGUE'S TEAM ID. Everything
  // downstream -- the catalog, the preview, `teams.js` -- names a club by its
  // three letters, and carrying the id here would make `playerSeasons` the one
  // place that has to translate, from a table it would have to be handed.
  const ab = { [g.teams.home.id]: g.teams.home.ab, [g.teams.away.id]: g.teams.away.ab };
  for (const [pid, r] of Object.entries(g.roster || {})) {
    if (r.pos === 'G') continue;
    out.set(Number(pid), { p: Number(pid), t: ab[r.tid], nm: r.nm, n: r.n, pos: r.pos,
                           g: 0, a: 0, s: 0, c: 0, fw: 0, ft: 0 });
  }
  const bump = (id, k, by) => { const r = out.get(id); if (r) r[k] += by; };
  for (const e of g.events) {
    switch (e.type) {
      case 'goal':
        // ⚠️ A SHOOTOUT GOAL IS NOT A GOAL IN THE RUN OF PLAY, and the league's
        // own boxscore does not count it as one. `pt` is the period type.
        if (e.pt === 'SO') break;
        bump(e.actor, 'g', 1); bump(e.actor, 's', 1); bump(e.actor, 'c', 1);
        bump(e.a1, 'a', 1); bump(e.a2, 'a', 1);
        break;
      case 'shot-on-goal':
        if (e.pt === 'SO') break;
        bump(e.actor, 's', 1); bump(e.actor, 'c', 1);
        break;
      // AN ATTEMPT IS ALL THREE. `blocked-shot` credits `actor` to the SHOOTER,
      // which is the field attribution.js resolves and validate() checks against
      // rosterSpots every night -- see the second witness.
      case 'missed-shot':
      case 'blocked-shot':
        if (e.pt === 'SO') break;
        bump(e.actor, 'c', 1);
        break;
      // `fw` face-offs won, `ft` taken; both players are named since SCHEMA 7.
      case 'faceoff':
        if (e.pt === 'SO' || e.actor == null || e.lose == null) break;
        bump(e.actor, 'fw', 1); bump(e.actor, 'ft', 1); bump(e.lose, 'ft', 1);
        break;
      default: break;
    }
  }
  return [...out.values()];
}

/** The boxscore's skater rows: {pid: {g, a, s, ppg}}, or null before SCHEMA 6. */
export function leagueSkaters(g) {
  const q = g && g.quoted && g.quoted.players;
  if (!q) return null;
  const out = {};
  for (const [pid, [goals, assists, sog, ppg]] of Object.entries(q.skaters || {})) {
    out[pid] = { g: goals, a: assists, s: sog, ppg };
  }
  return out;
}

/** The boxscore's goaltender rows: {pid: {saves, faced}}, or null. */
export function leagueGoalies(g) {
  const q = g && g.quoted && g.quoted.players;
  if (!q) return null;
  const out = {};
  for (const [pid, [saves, faced]] of Object.entries(q.goalies || {})) out[pid] = { saves, faced };
  return out;
}

/**
 * Our rows with the league's figures for the same player beside them, as `lg`
 * ({g, a, s}), or `lg: null` where the boxscore has no row for him. Rows are
 * unchanged when the game predates SCHEMA 6.
 */
export function withLeague(rows, g) {
  const lg = leagueSkaters(g);
  if (!lg) return rows;
  return rows.map(r => {
    const l = lg[String(r.p)];
    return { ...r, lg: l ? { g: l.g, a: l.a, s: l.s } : null };
  });
}

/**
 * Every figure where our count of one game and the league's boxscore differ:
 * [{pid, fig, ours, league}], fig one of g, a, s (skaters) or sv, sa
 * (goaltenders). `nets` is `goaltending.reduce(...).g`, our goaltender counts.
 * Empty when the game predates SCHEMA 6.
 */
export function leagueDiffs(g, nets) {
  const out = [];
  const lg = leagueSkaters(g);
  if (lg) {
    for (const r of playersIn(g)) {
      const l = lg[String(r.p)];
      if (!l) continue;
      for (const fig of ['g', 'a', 's']) {
        if (l[fig] !== r[fig]) out.push({ pid: r.p, fig, ours: r[fig], league: l[fig] });
      }
    }
  }
  const lk = leagueGoalies(g);
  if (lk && nets) {
    for (const [pid, l] of Object.entries(lk)) {
      const o = nets[pid] || { f: 0, s: 0 };
      if (o.s !== l.saves) out.push({ pid: Number(pid), fig: 'sv', ours: o.s, league: l.saves });
      if (o.f !== l.faced) out.push({ pid: Number(pid), fig: 'sa', ours: o.f, league: l.faced });
    }
  }
  return out;
}
