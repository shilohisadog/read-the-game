/**
 * Team identity — the one table on this site that is not derived from the feed.
 *
 * WHAT THIS IS AND IS NOT. Colours and names are public reference data, entered by
 * hand (Kevin, 2026-08-11). Nothing here is a measurement, so nothing here can be
 * wrong in the way a number can be wrong — but it CAN be incomplete, and that is
 * the failure this file's test exists to catch.
 *
 * NO LEAGUE OR CLUB MARKS. Colours and three-letter abbreviations identify a team;
 * logos and wordmarks do not appear anywhere on this site and must not be added
 * here. The site says so on its own front page.
 *
 * THIRTY-THREE, NOT THIRTY-TWO. Arizona relocated to Utah inside the window this
 * archive covers: ARI played 82 games in 2023-24 and none after, UTA begins in
 * 2024-25. A "32 NHL clubs" list would have been wrong on the first day. The set
 * the page renders is read from the CATALOG, never from this file — this file only
 * has to be able to answer for whatever the catalog contains, and the test asserts
 * exactly that. The next relocation or expansion team fails loudly instead of
 * rendering a blank chip.
 */

/** ab -> { name, colour }. `colour` is the club's primary, for a chip background. */
export const TEAMS = {
  ANA: { name: 'Anaheim Ducks',          colour: '#F47A38' },
  ARI: { name: 'Arizona Coyotes',        colour: '#8C2633' },
  BOS: { name: 'Boston Bruins',          colour: '#FFB81C' },
  BUF: { name: 'Buffalo Sabres',         colour: '#003087' },
  CAR: { name: 'Carolina Hurricanes',    colour: '#CC0000' },
  CBJ: { name: 'Columbus Blue Jackets',  colour: '#002654' },
  CGY: { name: 'Calgary Flames',         colour: '#D2001C' },
  CHI: { name: 'Chicago Blackhawks',     colour: '#CF0A2C' },
  COL: { name: 'Colorado Avalanche',     colour: '#6F263D' },
  DAL: { name: 'Dallas Stars',           colour: '#006847' },
  DET: { name: 'Detroit Red Wings',      colour: '#CE1126' },
  EDM: { name: 'Edmonton Oilers',        colour: '#041E42' },
  FLA: { name: 'Florida Panthers',       colour: '#C8102E' },
  LAK: { name: 'Los Angeles Kings',      colour: '#111111' },
  MIN: { name: 'Minnesota Wild',         colour: '#154734' },
  MTL: { name: 'Montreal Canadiens',     colour: '#AF1E2D' },
  NJD: { name: 'New Jersey Devils',      colour: '#CE1126' },
  NSH: { name: 'Nashville Predators',    colour: '#FFB81C' },
  NYI: { name: 'New York Islanders',     colour: '#00539B' },
  NYR: { name: 'New York Rangers',       colour: '#0038A8' },
  OTT: { name: 'Ottawa Senators',        colour: '#C52032' },
  PHI: { name: 'Philadelphia Flyers',    colour: '#F74902' },
  PIT: { name: 'Pittsburgh Penguins',    colour: '#FCB514' },
  SEA: { name: 'Seattle Kraken',         colour: '#001628' },
  SJS: { name: 'San Jose Sharks',        colour: '#006D75' },
  STL: { name: 'St. Louis Blues',        colour: '#002F87' },
  TBL: { name: 'Tampa Bay Lightning',    colour: '#002868' },
  TOR: { name: 'Toronto Maple Leafs',    colour: '#00205B' },
  UTA: { name: 'Utah Mammoth',           colour: '#71AFE5' },
  VAN: { name: 'Vancouver Canucks',      colour: '#00205B' },
  VGK: { name: 'Vegas Golden Knights',   colour: '#B4975A' },
  WPG: { name: 'Winnipeg Jets',          colour: '#041E42' },
  WSH: { name: 'Washington Capitals',    colour: '#C8102E' },
};

/**
 * A note a team's own page owes the reader, or null.
 *
 * Only where the archive itself would otherwise mislead: a fan clicking ARI finds
 * one season and then nothing, and the honest answer is a fact, not an empty page.
 */
export const NOTES = {
  ARI: 'Relocated to Utah after the 2023-24 season.',
  UTA: 'Began play in 2024-25, after the Arizona club relocated.',
};

/** Readable ink for a chip of this colour — contrast, not taste. */
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  // Rec. 601 luma. The threshold is where black stops being the readable choice.
  const luma = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luma > 0.6 ? '#0f1a23' : '#ffffff';
}

/** The label for a team, falling back to the abbreviation we were given. */
export function nameOf(ab) {
  return (TEAMS[ab] && TEAMS[ab].name) || ab;
}
