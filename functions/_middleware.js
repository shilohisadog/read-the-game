/**
 * The per-game unfurl — the only server-side code on this site.
 *
 * ⭐ THE PROBLEM IT EXISTS FOR. `preview.html` is one static file, so every game
 * link a reader pastes into X or a group chat unfurls identically: one generic
 * title, one generic description, for all 1,300-odd games a season. Kevin wants
 * this page to be a gateway people post. A gateway that says nothing about the
 * game behind it is a link nobody clicks.
 *
 * ⛔⛔ IT COMPUTES NOTHING. DOCTRINE keeps analysis off the server, and that line
 * does not move for a convenience: this file copies two club names and a start
 * time into a `<head>` and renders no figure of any kind. A number here would be
 * a second implementation of a measurement, which is the failure this project has
 * spent months not making. If you ever want a figure in the unfurl, publish it
 * from the pipeline and read it here — do not compute it here.
 *
 * ⛔ IT TOUCHES ONE PATH, AND ONLY WITH A `game=`. Everything else is returned
 * untouched, byte for byte. That is not tidiness: the deploy's *fetch the live
 * site and diff it against the repo* gate compares every page's published bytes
 * to its committed bytes, and it fetches `/preview.html` with no query string.
 * So the gate keeps passing unweakened, and a separate step proves the injected
 * path works — see `.github/workflows/deploy.yml`.
 *
 * ⛔ AND IT ADDS NO TAGS. The shell already emits `<title>`, `og:title`,
 * `og:description`, `og:url` and the twitter pair; this rewrites their values.
 * Nothing is inserted, nothing is removed, so the document's shape is identical
 * whether or not the middleware ran, and `document.test.js`'s claim about the
 * page being a complete document cannot be broken from here.
 *
 * ⛔ PASS THROUGH ON ANY ERROR. A generic unfurl beats a 500 by a mile. Every
 * path through this file that can throw is wrapped, and the untouched asset is
 * returned instead.
 *
 * ⚠️ NAMES ARE IMPORTED, NEVER RESTATED. `nameOf` is the same function the page
 * itself uses. Typing "Boston Bruins" into this file would be a second club table
 * free to drift from the first — the exact shape of defect this repo keeps
 * finding. It is why `src/lib/` is importable from here at all.
 */
import { nameOf } from '../src/lib/teams.js';

/** Where the published documents live. The page reads the same origin. */
const DATA = 'https://data.readthegame.co';

/**
 * ⚠️ CACHED AT THE EDGE, BECAUSE AN UNFURL IS A STAMPEDE. A link posted to a
 * large account is fetched by every platform's crawler at once; without this each
 * one would pull `schedule.json` again. Five minutes is short enough that a
 * fixture correction shows up the same morning and long enough that a burst costs
 * one origin read.
 */
const TTL = 300;

async function doc(name) {
  const r = await fetch(`${DATA}/${name}`, { cf: { cacheTtl: TTL, cacheEverything: true } });
  return r.ok ? await r.json() : null;
}

/**
 * The two clubs and when they play, from the same documents the page reads.
 *
 * ⭐ THE SCHEDULE FIRST, THEN THE ARCHIVE — the same order `preview()` uses, and
 * for the same reason: a fixture that has not been played is only in the
 * schedule, and a game already played is only in the catalog. A link posted at
 * 6pm is read again next week, and both readings have to unfurl.
 */
async function gameOf(id) {
  const [schedule, catalog] = await Promise.all([doc('schedule.json'), doc('catalog.json')]);
  const fix = ((schedule && schedule.upcoming) || []).find(g => g && Number(g.id) === id);
  if (fix) {
    return { away: fix.away, home: fix.home, startTimeUTC: fix.startTimeUTC,
             date: fix.date, preseason: fix.gameType === 1, played: false };
  }
  const held = ((catalog && catalog.games) || []).find(g => g && Number(g.id) === id);
  if (held) {
    return { away: held.a, home: held.h, startTimeUTC: null, date: held.d,
             preseason: held.t === 1, played: true };
  }
  return null;
}

/**
 * ⚠️ THE DATE IS RENDERED IN UTC AND SAYS SO BY NOT SAYING A TIME.
 *
 * The page localises a start time in the reader's browser, which is the only
 * place that can. An unfurl is rendered by a crawler in a datacentre and read by
 * someone in an unknown timezone, so a clock face here would be wrong for most
 * readers and there is nothing to correct it with. So the unfurl names the DAY
 * from the league's own date field — the one `fetch_nhl.py` carries precisely
 * because no UTC instant names an NHL night — and leaves the hour to the page.
 */
export function dayOf(g) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(g.date || '');
  if (!m) return null;
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'];
  return `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}`;
}

/**
 * ⭐ THE ROUTING DECISION, PULLED OUT SO IT CAN BE TESTED. "It touches one path"
 * is the claim the deploy's byte-diff gate depends on, and a claim that load
 * bearing may not live only inside an edge handler node cannot run. Returns the
 * game id when this request should be rewritten, and null for everything else.
 */
export function targetGame(urlString, contentType) {
  const url = new URL(urlString);
  if (url.pathname !== '/preview.html' && url.pathname !== '/preview') return null;
  if (!/text\/html/i.test(contentType || '')) return null;
  const id = Number(url.searchParams.get('game'));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function tagsFor(g, url) {
  const title = `${nameOf(g.away)} at ${nameOf(g.home)} — what to watch for`;
  const day = dayOf(g);
  const when = [g.preseason ? 'Preseason' : null,
                day ? (g.played ? `played ${day}` : day) : null].filter(Boolean).join(' · ');
  /* ⛔ NO PROMISE OF VIDEO AND NO FORECAST, which are the two things pre-render
     metadata on this site may not do (`test/shell.test.js`, and the card's own
     rule). It says what the page holds, in the page's own words. */
  const description = (when ? when + '. ' : '')
    + 'What each club does more than the league this season, and what is normal '
    + 'in hockey. Nothing forecast, and no video.';
  return { title, description, url };
}

export async function onRequest(context) {
  const { request, next } = context;
  const res = await next();
  try {
    /* ONE PATH, AND `/preview` is the same page: Cloudflare Pages serves the
       extensionless route and 308s the .html form to it, so a reader's pasted
       link can be either. */
    const id = targetGame(request.url, res.headers.get('content-type'));
    if (id == null) return res;

    const g = await gameOf(id);
    if (!g || !g.away || !g.home) return res;      // a game we do not hold stays generic

    const t = tagsFor(g, `https://readthegame.co/preview?game=${id}`);
    const setContent = (el, v) => el.setAttribute('content', v);
    return new HTMLRewriter()
      .on('title', { element: el => el.setInnerContent(t.title) })
      .on('meta[property="og:title"]', { element: el => setContent(el, t.title) })
      .on('meta[name="twitter:title"]', { element: el => setContent(el, t.title) })
      .on('meta[name="description"]', { element: el => setContent(el, t.description) })
      .on('meta[property="og:description"]', { element: el => setContent(el, t.description) })
      .on('meta[name="twitter:description"]', { element: el => setContent(el, t.description) })
      .on('meta[property="og:url"]', { element: el => setContent(el, t.url) })
      .transform(res);
  } catch (err) {
    /* ⛔ THE WHOLE POINT OF THIS BRANCH. A data document that moved, a schedule
       row with no clubs, a rewriter that threw — none of them may cost a reader
       the page. The untouched asset is already in hand, so hand it back. */
    return res;
  }
}
