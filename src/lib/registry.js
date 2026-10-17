/**
 * THE LIST OF MEASURES — one entry per thing the site counts. Definitions only;
 * values stay in measures.json, teams.json, players.json and the extracts.
 * `docs/measures-audit.md` §7 is the design; `test/registry.test.js` holds every
 * surface to it.
 *
 * `keys` claims each name the code already uses for this measure, one per naming
 * system (they collide today: `zonestart` the layer vs `zoneStarts` the printed
 * figure). `name` and `says` are a row's label and line; `heading` is the methods
 * page's question, `layer` the layer's label, `chip` the button over the rink, `tile`
 * the line under a preview tile's number. `pending` is an open
 * or ruled-but-unbuilt change to this entry, named by its ruling in the audit §6.
 */

import { HIGH_DANGER_FT, SLOT_HALF_WIDTH } from './rink.js';

const SLOT_POLICY = { slot: `slot = within ${HIGH_DANGER_FT} ft of the net and ${SLOT_HALF_WIDTH} ft either side of centre — ours, unsourced` };

export const MEASURE_UNITS = ['count', 'share', 'perGame', 'per60', 'seconds', 'record', 'rate'];
export const MEASURE_CREDITS = ['shooter', 'defender', 'blocker', 'goaltender', 'winner', 'team', 'player', 'none'];
export const MEASURE_STATUS = ['live', 'proposed'];

export const MEASURES = [
  // Possession — one family: shown together, never as separate evidence.
  { id: 'attempts', name: 'shot attempts', chip: 'Attempts', layer: '＋ Control (Corsi)',
    says: 'Every puck a team put at the net — on goal, missed, or blocked by a body.',
    counts: 'goals + shots on goal + missed + blocked', of: 'game', credit: 'shooter',
    unit: 'count', strength: 'all', score: 'any', scopes: ['game', 'season'],
    typical: 'middle half', witness: null, family: 'possession',
    keys: { lens: 'corsi', perTeam: 'corsi' },
    pending: [{ ruling: '5', what: 'level possession folds in as a filter' },
              { ruling: 'wording', what: 'the layer label says "Control (Corsi)", the chip says "Attempts"' }] },
  { id: 'level5', name: '5-on-5 CF% while the score was tied', layer: 'control while the score was tied',
    says: 'Of every 100 shot attempts at 5-on-5 with the score tied in this team\u2019s own games — both sides counted — this many were its own.',
    counts: 'own attempts at strict 5-on-5, score tied', of: 'both sides’ attempts, same filter',
    credit: 'shooter', unit: 'share', strength: '5v5', score: 'level', scopes: ['season'],
    typical: 'league figure', witness: null, family: 'possession',
    keys: { row: 'level5', derivation: 'level5', lens: 'tied-control' } },
  { id: 'corsiShare', name: 'shot-attempt share, all situations', says: 'Of every 100 shot attempts in a team’s games, this many were its own.',
    counts: 'own attempts', of: 'both sides’ attempts', credit: 'shooter', unit: 'share',
    strength: 'all', score: 'any', scopes: ['season'], typical: 'league figure',
    witness: null, family: 'possession', keys: { withheld: 'corsi' } },
  { id: 'fenwickShare', name: 'unblocked shot-attempt share', says: 'The same share, leaving out attempts that were blocked.',
    counts: 'own unblocked attempts', of: 'both sides’ unblocked attempts', credit: 'shooter',
    unit: 'share', strength: 'all', score: 'any', scopes: ['season'], typical: 'league figure',
    witness: null, family: 'possession', keys: { withheld: 'fenwick' } },
  { id: 'sogShare', name: 'share of the shots on goal', says: 'Of every 100 shots on goal in this team\u2019s own games — both sides counted — this many were its own.',
    counts: 'own shots on goal', of: 'both sides’ shots on goal', credit: 'shooter',
    unit: 'share', strength: 'all', score: 'any', scopes: ['season'], typical: 'league figure',
    witness: 'boxscore (quoted)', family: 'possession', keys: { row: 'sogShare', derivation: 'sogShare' } },
  { id: 'shotsOnGoal', name: 'shots on goal, per game', status: 'proposed',
    says: 'Pucks a team put on net that the goaltender had to deal with, per game.',
    counts: 'shots on goal', of: 'games', credit: 'shooter', unit: 'perGame', strength: 'all',
    score: 'any', scopes: ['game', 'season'], typical: 'league figure',
    witness: 'boxscore (quoted)', family: 'possession', keys: {} },
  { id: 'attemptsAgainst', name: 'shot attempts against, per game', says: 'How many shot attempts the other team aimed at this team\u2019s net, per game — the other side of having the puck.',
    counts: 'opponent’s attempts', of: 'games', credit: 'defender', unit: 'perGame',
    strength: 'all', score: 'any', scopes: ['season'], typical: 'league figure',
    witness: null, family: 'possession', keys: { row: 'attemptsAgainst', derivation: 'attemptsAgainst' } },
  { id: 'blocks', name: 'shot attempts blocked, per game', chip: 'Blocked', layer: '＋ Blocked shots',
    says: 'How many of the other team\u2019s shot attempts this team got in front of before they reached the net, per game.',
    counts: 'blocked shots credited to the blocker’s team', of: 'games', credit: 'blocker',
    unit: 'perGame', strength: 'all', score: 'any', scopes: ['game', 'season'],
    typical: 'league figure', witness: 'boxscore player rows', family: 'possession',
    keys: { row: 'blocks', derivation: 'blocksMade', lens: 'blocked', perTeam: 'blocked' },
    pending: [{ ruling: 'audit §2 #6', what: 'the whole-game scale also counts teammate blocks and blocks with no blocker recorded' }] },
  { id: 'zoneStarts', name: 'offensive-zone face-offs', chip: 'Zone starts', layer: '＋ Zone starts',
    says: 'Face-offs a team won in the other team’s end.',
    counts: 'face-offs in the attacking end', of: 'face-offs', credit: 'winner', unit: 'count',
    strength: 'all', score: 'any', scopes: ['game', 'season'], typical: 'middle half',
    witness: null, family: 'possession', keys: { lens: 'zonestart', perTeam: 'ozStarts' } },

  // Independent of possession.
  { id: 'slotShots', name: 'shots from the slot', chip: 'Slot shots', layer: '＋ Shots from the slot',
    says: 'Shots taken from the slot, the area in front of the net.',
    counts: 'unblocked attempts with a location, inside the slot', of: 'attempts with a location',
    credit: 'shooter', unit: 'count', strength: 'all', score: 'any', scopes: ['game', 'season'],
    typical: 'middle half', witness: null, policy: SLOT_POLICY.slot, keys: { lens: 'slot', perTeam: 'slot' } },
  { id: 'slotShare', name: 'shot attempts from the slot', heading: 'How many shot attempts are taken from the slot',
    says: 'Of every 100 shot attempts this team took from a spot the feed records, this many came from the slot.',
    counts: 'unblocked attempts with a location, inside the slot', of: 'unblocked attempts with a location',
    credit: 'shooter', unit: 'share', strength: 'all', score: 'any', scopes: ['season', 'archive'],
    typical: 'league figure', witness: null, policy: SLOT_POLICY.slot,
    keys: { row: 'slot', derivation: 'slotShare', printed: 'slotAttempts' } },
  { id: 'slotGoals', name: 'how often a shot from the slot goes in', heading: 'How often a shot from the slot goes in',
    says: 'Goals per shot from inside the slot and from outside it, and the share of goals scored from it.',
    counts: 'goals', of: 'unblocked attempts, inside vs outside', credit: 'none', unit: 'share',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null,
    policy: SLOT_POLICY.slot, keys: { printed: 'slotGoals' } },
  { id: 'dmen', name: 'shot attempts taken by defencemen', says: 'Of every 100 shot attempts this team took, this many came from one of its own defencemen.',
    counts: 'attempts by a defenceman', of: 'own attempts', credit: 'shooter', unit: 'share',
    strength: 'all', score: 'any', scopes: ['season'], typical: 'league figure', witness: null,
    keys: { row: 'dmen', derivation: 'dmen' },
    pending: [{ ruling: '5', what: 'add the Who shoots layer' }] },
  { id: 'shiftLength', name: 'average shift length', says: 'How long this team\u2019s skaters stay on the ice each time they go out, on average, in seconds.',
    counts: 'skater seconds on the ice', of: 'skater shifts', credit: 'team', unit: 'seconds',
    strength: 'all', score: 'any', scopes: ['game', 'season', 'archive'], typical: 'mean',
    witness: null, family: 'shift', keys: { row: 'shiftLength', derivation: 'shiftLength' } },
  { id: 'shiftArchive', name: 'how long a shift lasts', heading: 'How long a shift lasts',
    says: 'How long a skater stays on the ice each time, on average, over every game we hold.',
    counts: 'skater seconds on the ice', of: 'skater shifts', credit: 'none', unit: 'seconds', strength: 'all',
    score: 'any', scopes: ['archive'], typical: 'mean', witness: null, family: 'shift',
    keys: { league: 'shift', derivation: 'shift' } },

  // Goaltending.
  { id: 'shotsFaced', name: 'shots the goaltenders faced', says: 'Shots on goal and goals against, with a goaltender in the net.',
    counts: 'shots on goal + goals, goalie in net', of: 'game', credit: 'goaltender', unit: 'count',
    strength: 'all', score: 'any', scopes: ['game', 'season'], typical: 'middle half',
    witness: 'boxscore', keys: {} },
  { id: 'saveFraction', name: 'how often a goaltender makes the save',
    chip: 'Goaltending', layer: '＋ Goaltending', heading: 'How often a goaltender makes the save',
    says: 'Of every 100 shots a goaltender faced, this many he stopped.',
    counts: 'saves', of: 'shots faced', credit: 'goaltender', unit: 'share', strength: 'all',
    score: 'any', scopes: ['game', 'archive'], typical: 'league figure', witness: 'boxscore',
    holds: false, keys: { lens: 'goaltending', printed: 'saves', perTeam: 'savePct' },
    pending: [{ ruling: '5', what: 'stays on the rink, never ranked as a team figure' }] },
  { id: 'goalieRecord', name: 'a goaltender’s record', status: 'proposed',
    says: 'Wins, losses and overtime losses credited to a goaltender.',
    counts: 'the league’s decision', of: 'games', credit: 'goaltender', unit: 'record',
    strength: 'all', score: 'any', scopes: ['season'], typical: null,
    witness: 'boxscore decision (not yet kept — check the field)', keys: {} },

  // Face-offs.
  { id: 'faceoffWins', name: 'face-offs won', status: 'proposed',
    says: 'Face-offs a team won, and its share of all the draws.',
    counts: 'face-offs won', of: 'face-offs', credit: 'winner', unit: 'share', strength: 'all',
    score: 'any', scopes: ['game', 'season'], typical: 'league figure', witness: 'right rail',
    holds: false, keys: {} },
  { id: 'playerFaceoffs', name: 'face-off win percentage', status: 'proposed',
    says: 'Of every 100 draws a player took, this many he won.',
    counts: 'draws won', of: 'draws taken', credit: 'player', unit: 'share', strength: 'all',
    score: 'any', scopes: ['season'], typical: 'median', witness: 'boxscore faceoffWinningPctg',
    keys: {}, pending: [{ ruling: '7', what: 'needs the losing player, which extract.py drops' }] },
  { id: 'endZoneWorth', name: 'what a face-off in one end is worth', heading: 'What a face-off in one end is worth',
    says: 'Shot attempts that follow a face-off in one end, per face-off.',
    counts: 'attempts after the draw', of: 'face-offs in that end', credit: 'none', unit: 'rate',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null,
    keys: { printed: 'zoneStarts' } },

  // League rows — archive-wide, never counted for a team.
  { id: 'penalties', name: 'penalties a team takes', heading: 'How many penalties a team takes', tile: 'penalties a team takes',
    says: 'Penalties called on one team, per game.',
    counts: 'penalty events', of: '2 × games', credit: 'team', unit: 'perGame', strength: 'all',
    score: 'any', scopes: ['archive'], typical: 'league figure', witness: null, holds: false,
    keys: { league: 'penalties', derivation: 'penalties' } },
  { id: 'ppGoalRate', name: 'power plays that produce a goal', heading: 'How often a power play produces a goal', tile: 'power plays produce a goal',
    says: 'Of every 100 power plays, this many end with a goal.',
    counts: 'power-play goals', of: 'power plays, counted the league’s way', credit: 'team',
    unit: 'share', strength: 'pp', score: 'any', scopes: ['archive'], typical: 'league figure',
    witness: 'boxscore + right rail', holds: false, keys: { league: 'powerplay', derivation: 'powerplay' } },
  { id: 'powerPlays', name: 'power plays a team gets', says: 'Power plays one team gets, per game — printed inside the power-play row.',
    counts: 'power plays, counted the league’s way', of: '2 × games', credit: 'team',
    unit: 'perGame', strength: 'pp', score: 'any', scopes: ['archive'], typical: 'league figure',
    witness: 'boxscore + right rail', holds: false, keys: {} },
  { id: 'offside', name: 'times a team is offside', heading: 'How often a team is offside', tile: 'times a team is offside',
    says: 'Offside calls against one team, per game.',
    counts: 'stoppages for offside', of: '2 × games', credit: 'team', unit: 'perGame',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null,
    holds: false, keys: { league: 'offside', derivation: 'offside' } },
  { id: 'icing', name: 'times a team ices the puck', heading: 'How often a team ices the puck', tile: 'times a team ices the puck',
    says: 'Icing calls against one team, per game.',
    counts: 'stoppages for icing', of: '2 × games', credit: 'team', unit: 'perGame',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null,
    holds: false, keys: { league: 'icing', derivation: 'icing' } },
  { id: 'stoppages', name: 'why play stopped', chip: 'Stoppages', layer: '＋ Why play stopped',
    says: 'Every stoppage, named by its reason. A stoppage names a rule, never a team.',
    counts: 'stoppages + delayed penalties, by reason', of: 'game', credit: 'none', unit: 'count',
    strength: 'all', score: 'any', scopes: ['game', 'season'], typical: 'middle half',
    witness: null, keys: { lens: 'whistle' } },
  { id: 'attemptMix', name: 'where a shot attempt ends', heading: 'Where a shot attempt ends', tile: 'shot attempts reach the goalie',
    says: 'Of every 100 attempts, how many reached the goalie, were blocked, or missed.',
    counts: 'attempts by how they ended', of: 'all attempts', credit: 'none', unit: 'share',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null,
    keys: { league: 'attempts', derivation: 'attempts' } },
  { id: 'pace', name: 'shot attempts in an hour', heading: 'How many shot attempts a team takes in an hour',
    says: 'Attempts per 60 minutes, at even strength, on the power play and short-handed.',
    counts: 'attempts in the situation', of: 'minutes in the situation', credit: 'none',
    unit: 'per60', strength: 'by situation', score: 'any', scopes: ['archive'],
    typical: 'league figure', witness: null, keys: { printed: 'pace' } },
  { id: 'paceByScore', name: 'what the scoreboard does to the same number',
    heading: 'What the scoreboard does to the same number',
    says: 'Attempts per 60 minutes at even strength when trailing, tied and leading.',
    counts: 'even-strength attempts', of: 'even-strength minutes, by score', credit: 'none',
    unit: 'per60', strength: 'even', score: 'trailing / tied / leading', scopes: ['archive'],
    typical: 'league figure', witness: null, keys: { printed: 'scoreEffects' } },
  { id: 'paceByTime', name: 'shot attempts in an hour, by time of game', status: 'proposed',
    says: 'Attempts per 60 minutes by period and by minute of the game.',
    counts: 'attempts', of: 'minutes, by period / minute', credit: 'none', unit: 'per60',
    strength: 'all', score: 'any', scopes: ['archive'], typical: 'league figure', witness: null, keys: {} },
  { id: 'hits', name: 'hits a team lands', heading: 'How many hits a team lands',
    says: 'Hits recorded for one team, per game. Follows the home arena’s scorer more than the team.',
    counts: 'hits', of: '2 × games', credit: 'team', unit: 'perGame', strength: 'all', score: 'any',
    scopes: ['archive'], typical: 'league figure', witness: 'right rail', holds: false,
    keys: { league: 'hits', derivation: 'hits' } },

  // Outcomes and base rates.
  { id: 'record', name: 'record', says: 'Wins, losses and overtime losses — three counts, regular season and playoffs apart.',
    counts: 'decided games', of: 'games', credit: 'team', unit: 'record', strength: 'all',
    score: 'any', scopes: ['season'], typical: null, witness: 'standings (nightly)', keys: {} },
  { id: 'leaderLost', name: 'the team with more attempts lost', says: 'Of games where one team had more shot attempts, how many it lost.',
    counts: 'games the attempts leader lost', of: 'games with an edge', credit: 'none',
    unit: 'share', strength: 'all', score: 'any', scopes: ['archive'],
    typical: null, witness: null, keys: {} },
  { id: 'levelLeaderLost', name: 'the team that controlled play while the score was tied lost', says: 'Of games where one team led tied-score attempts by k or more, how many it lost.',
    counts: 'games the tied-score leader lost', of: 'games led by k or more', credit: 'none',
    unit: 'share', strength: '5v5', score: 'level', scopes: ['archive'], typical: null,
    witness: null, keys: {} },

  // Players — per game played, current season; typical is the median skater.
  ...[['playerGoals', 'goals per game', 'goals', 'How many of this team\u2019s goals he has scored himself, per game played.'],
      ['playerAssists', 'assists per game', 'assists', 'The passes the league credited to him on somebody else\u2019s goal.'],
      ['playerShots', 'shots on goal per game', 'shots on goal', 'Pucks he put on net that the goaltender had to deal with.'],
      ['playerAttempts', 'shot attempts per game', 'shot attempts', 'Every puck he put at the net \u2014 on goal, missed, or blocked by a body.'],
  ].map(([id, name, what, says]) => ({
    id, name, heading: 'What a player does in a game', says,
    counts: what, of: 'games played', credit: 'player', unit: 'perGame', strength: 'all',
    score: 'any', scopes: ['season'], typical: 'median',
    witness: id === 'playerAttempts' ? null : 'boxscore', keys: { row: id, derivation: 'playerRate' },
    pending: [{ ruling: 'audit §2 #8', what: 'steadiness is measured by a different instrument from the team rows' }] })),
];

/** The entry called `id`; an unknown id throws, so a typo fails the build, not a page. */
export function measure(id) {
  const m = MEASURES.find(x => x.id === id);
  if (!m) throw new Error(`registry: no measure called ${id}`);
  return m;
}

/** The entry that claims `key` in naming system `system`, or undefined. */
export function claimOf(system, key) {
  return MEASURES.find(m => m.keys[system] === key);
}
