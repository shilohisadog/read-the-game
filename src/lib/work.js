/**
 * THE SHOW-ME-THE-WORK PANEL, AS MARKUP. Cluster two out of `boot()`.
 *
 * This is the surface the project's promise rests on: every event the layer saw,
 * counted or excluded with a reason, adding up. `docs/architecture.md` calls the
 * truth of our claims the quality of the project, and this panel is where a
 * reader checks one.
 *
 * ⭐ SPLIT AT `return markup` / `write to document`, which is CHENG's tier rule.
 * Everything here is computation and composition; `renderWork` in `src/app.js`
 * reads the two label strings off the page, calls this, and performs the single
 * `innerHTML` assignment. So the panel is testable without a document, and the
 * purity `tools/tiers.mjs` verifies over this directory survives the move.
 *
 * ⛔ TWO THINGS THAT LOOK LIKE PART OF THIS CLUSTER AND ARE NOT, both found by
 * measuring rather than reading:
 *
 *   `lboxFor` — SHARED. It also renders the layer box under the rink, and the
 *   two surfaces must agree: a reader who sees 36 below the ice, opens this
 *   panel expecting 36 and finds 33 has caught us contradicting ourselves. Its
 *   output arrives as `box`.
 *
 *   `cardsFor` — CANNOT MOVE. It reads `LEARNCARDS`, which the builder injects
 *   as a top-level constant derived from `data/learn-doors.json` and
 *   `build_index.LEARN_CARDS`. There is no module to import it from, so a
 *   library module naming it would resolve in the browser and be undefined under
 *   node. Its output arrives as `cards`.
 *
 * ⚠️ 41 of `boot`'s 79 functions have more than one caller, so "a cluster is a
 * function and everything it calls" is not available here. What moved is this
 * function plus `PLURAL`, which nothing else uses.
 *
 * ⛔ THE TEMPLATE LITERALS ARE COPIED BYTE FOR BYTE. Their continuation lines
 * carry leading spaces that are part of the emitted string.
 * `test/fixtures/dom-golden.json` pins the result across five layers and 269
 * frames — 1,345 renderings, none of which were guarded before this move.
 */
import { ESC } from './esc.js';
import { isNearMiss, summarise } from './layer.js';

const PLURAL={faceoff:'faceoffs',hit:'hits',giveaway:'giveaways',takeaway:'takeaways',
 penalty:'penalties',stoppage:'whistles',goal:'goals','shot-on-goal':'shots on goal',
 'missed-shot':'missed shots','blocked-shot':'blocked shots','period-start':'period starts',
 'period-end':'period ends','game-end':'the final horn','delayed-penalty':'delayed penalties'};

/**
 * `ctx` is written out because naming what this needs is the point of the move.
 *
 *   id        the layer's id, for the learn-card row and nothing else
 *   L         the ledger: {counted, surprising, excluded}
 *   sl        the event slice, for looking up an excluded event's type
 *   name      the layer's chip label, already resolved
 *   lds lat   the layer's description and attribution note, read off the page
 *   box       `lboxFor`'s output — the SAME figures the layer box shows
 *   cards     the learn-card row, or ''
 *   mode      "ALL SITUATIONS" or "EVEN STRENGTH", already rendered
 *   when      "through P2 11:17" or "pre-game"
 *   evenOnly  whether the strength filter is on, for the footnote
 *   AAB HAB   the two club abbreviations
 */
export function workMarkup({ id, L, sl, name, lds, lat, box: b, cards, mode, when, evenOnly, AAB, HAB }) {
 /* ⭐ ONE EXAMPLE PER GROUP, so a categorical reason keeps a real measurement
    beside it. CHENG on the specific form: "36 against 33 teaches the rule
    better than the rule statement does" -- right, and the way to keep that
    without a 49-row wall is to say the rule once and show one shot that met it.
    `detail` is set only where the reducer has a per-event measurement, so
    layers without one render exactly as before. */
 const rows=g=>Object.entries(g).sort((a,b)=>b[1].n-a[1].n)
   .map(([why,{n,eg}])=>`<div><b>${n}&times;</b> ${ESC(why)}`
     +(eg?` <span class="weg">e.g. ${ESC(eg)}</span>`:'')+`</div>`).join('');
 /* ⭐ THE LEDGER STOPS PRETENDING TO TEACH. Kevin: "what is the Not Counted
    column teaching the new viewer? That faceoffs, giveaways, period starts are
    NOT shots from the slot? I don't think there's much value there." Measured
    and he is right: over the reference game, 100% of the exclusions for
    Attempts, Goaltending and Stoppages are events that were never candidates.

    ⭐ CHENG'S RULE DECIDES WHAT STAYS: an exclusion teaches when a viewer could
    plausibly have expected it to COUNT -- the exact mirror of the `surprising`
    admission rule. It is not derivable from the events, but it IS derivable
    from the DIMENSION that rejected them, which is what `dims` is for: `type`
    means a different kind of event entirely, and everything else means a real
    candidate that failed a test.

    ⚠️ CONSERVATION IS NOT WEAKENED, AND MUST NOT BE (Doctrine §9 -- selective
    honesty is worse than none). The collapsed line carries its own count and
    the footer still closes over every event, so a reader adds three numbers
    instead of two. Nothing is hidden; the bookkeeping stops occupying the
    position that teaching should have. */
 /* ⭐ THE RULE IS `isNearMiss` IN layer.js, WHICH IS WHERE IT BELONGS. It was
    written here as "has any dimension that is not `type`" and restated a second
    time in the test that guards it; the version in the library says what `type`
    disqualifying means and why, and both readers now share it. */
 const isNear=isNearMiss;
 const near=L.excluded.filter(isNear), plain=L.excluded.filter(x=>!isNear(x));
 const exc=rows(summarise(near));
 /* AND THE COLLAPSED LINE STILL NAMES WHAT IS IN IT, from the events rather
    than from prose -- CHENG's one defence of the noise is that a novice might
    think a hit counts toward "controlling play", and that survives as three
    named kinds rather than ten rows. */
 const kinds={};
 for(const x of plain){const e=sl[x.id]; if(e)kinds[e.type]=(kinds[e.type]||0)+1;}
 const top=Object.entries(kinds).sort((a,b)=>b[1]-a[1]);
 const named=top.slice(0,3).map(([t,n])=>`${n} ${PLURAL[t]||t}`);
 const restN=top.slice(3).reduce((a,[,n])=>a+n,0);
 const plainLine=plain.length
   ? `${plain.length} other event${plain.length===1?'':'s'} ${plain.length===1?'was':'were'} not this kind of play at all`
     +(named.length?` — ${named.join(', ')}${restN?`, and ${restN} more`:''}`:'')+'.'
   : '';
 /* ⚠️ SURPRISING IS NOT GROUPED, AND EXCLUDED IS, because the reducers author
    them differently and it shows the moment you try. An EXCLUDED reason names a
    RULE -- "a hit — physical play, but not a shot attempt" -- so nine rules
    cover 183 events. A SURPRISING reason names the EVENT, player and all:
    "blocked, but it still counts — an attempt belongs to the SHOOTER, Kaprizov,
    not the player who blocked it". Grouping those produced TWENTY near-identical
    rows, one per shooter, which is a wall wearing the shape of detail.
    So: the total, and ONE case labelled as an example. The old panel printed
    `surprising[0].why` beside the number 44 with no such label, which reads as
    though all 44 were that one thing -- the defect this avoids without
    reintroducing the wall. */
 const sur=L.surprising&&L.surprising.length?L.surprising[0].why:null;
 /* `box` and `when` are computed by the caller -- see the signature. */
 /* `box` and `when` are computed by the caller -- see the signature. */
 /* ⚠️ ZERO IS A FIGURE, AND `&&` DROPPED IT. `b.h` is a NUMBER, so a club with
    none of something was falsy and vanished: the footer read "1 WSH." on a
    1-0 slot count, silently omitting the club that had none. On a panel whose
    closing sentence is "nothing is dropped quietly", that is the one number
    that must never go missing. Stoppages still shows no figures, because there
    the fields are EMPTY STRINGS -- a real absence, which is a different thing
    from zero and is now distinguished by the test rather than by truthiness. */
 const has=v=>v!==''&&v!=null;
 /* ⭐ JOINED WITH A PLUS, BECAUSE THEY ADD UP — Kevin, looking at Goaltending:
    the two club figures sat behind a slash and a full stop, orphaned from the
    arithmetic in the same line that they are the parts of. They are not a list;
    they are the parts of the counted number.

    ⚠️ AND THAT IS WHY TWO LAYERS NEEDED MORE THAN A NEW SEPARATOR. A slash
    promises nothing and a plus is an equation, so both places where the club
    figures do not account for everything counted became visible the moment the
    separator changed: Goaltending shows FRACTIONS, where the denominators sum
    to the counted events and a reader adding numerators is one short per goal;
    Blocked credits a teammate's block to NEITHER club, 7.8% of them. So a layer
    says what its figures add to (`sums`) and what is credited to nobody
    (`rest`), and the one thing a `+` may never do here is invite a sum that
    does not close. */
 const fig=[has(b.a)&&`${b.a} ${AAB}`,has(b.h)&&`${b.h} ${HAB}`,
   ...(has(b.a)||has(b.h)?(b.rest||[]).map(r=>`${r.n} ${r.say}`):[])]
   .filter(Boolean).join(' + ');
 return (
  `<h2>How ${ESC(name)} is counted <span class="wsub">(${mode}, ${when})</span></h2>`
 +`<div class="wg">`
 +`<div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3>`
 /* ⚠️ AND THE SENTENCE IS CLOSED HERE. `.lds` is a FRAGMENT -- it is written to
    follow "Slot &mdash; " in the caption, which supplies the full stop -- so in
    this card it ran straight into the attribution line: "between the face-off
    dots Credited to the club that shot." The caption already appends the stop;
    this does the same rather than 15 copies of the row text gaining one. */
 /* ⚠️ THESE ARRIVE AS TEXT, NOT AS ELEMENTS. They were `lds.textContent` while
    this lived in `boot` and could reach the document; the caller reads them off
    the page now and hands over strings. The extraction left the `.textContent`
    behind on the first pass and the panel rendered the word "undefined" to a
    reader -- caught by the golden's layer walk, which had existed for an hour. */
 +`<p>${lds?ESC(lds)+'.':''}</p>`
 +(lat?`<p class="wattr">${ESC(lat)}</p>`:'')+`</div>`
 +(sur?`<div class="wc flag"><h3>Counted, surprisingly <span class="n">${L.surprising.length}</span></h3>`
   /* ⚠️ AND THIS SENTENCE IS CLOSED TOO — the same fragment defect `.lds` had one
      card to the left, seen in the same screenshot. A reducer's `why` is a
      CLAUSE ("…so neither club is credited with the block"), so it ran straight
      into the line below it: "…credited with the block The other one carries
      its own reason." The stop is added HERE rather than in fifteen reasons,
      and only when the clause has not already ended itself. */
   +`<p><em>For example:</em> ${ESC(sur)}${/[.!?]$/.test(sur)?'':'.'}</p>`
   /* ⚠️ AND IT AGREES WITH ITSELF WHEN THERE IS ONE. "The other 1 each carry
      their own reason" is what a plural written once and never re-read looks
      like — and it is the COMMONEST case, not an edge: the surprising bucket
      opens at two the moment a second one lands, so every layer passes through
      it. Seen in a 360px screenshot of the very card this session was tidying,
      on both the layers that were open. */
   +(L.surprising.length>1?`<p class="wexc">${L.surprising.length===2
     ?'The other one carries its own reason, written by the layer that counted it.'
     :`The other ${L.surprising.length-1} each carry their own reason, written by the layer that counted them.`}</p>`:'')
   +`</div>`:'')
 +(near.length?`<div class="wc"><h3>Close, but not counted <span class="n">${near.length}</span></h3>`
   +`<p class="wexc">${exc}</p></div>`:'')+`</div>`
 +(plainLine?`<p class="wplain">${plainLine}</p>`:'')
/* ⚠️ ONE `=` IN THE LINE, AND A DASH WHERE THE SECOND ONE WANTED TO GO. Written
   as `A + B = 10 counted + 35 other = 45 events`, a chain of equals asserts
   10 = 45 — and the conservation sentence is the one place on this page that
   cannot afford arithmetic a reader can catch out. The dash reads "that is",
   the club figures stay welded to the number they are the parts of, and the
   single equation left standing is the one Doctrine §9 is about. */
 +`<p class="wfoot">${fig?`<em>${ESC(fig)}</em> &mdash; `:''}`
 +`${L.counted.length} ${b.sums||'counted'}${near.length?` + ${near.length} close`:''}`
 +` + ${plain.length} other = `
 +`<b>${L.counted.length+L.excluded.length}</b> events, which is every event in `
 +`the game so far. Nothing is dropped quietly.`
 +`${evenOnly?' <b>Even strength only</b> &mdash; the power-play and empty-net '
   +'events are in the not-counted list above, with the situation that removed '
   +'each one.':''}</p>`
 /* ⭐ THE WAY BACK OUT, AND UNTIL NOW THE TRIP WAS ONE-WAY. Kevin: "aligning
    show me the work with learning cards, and making them bi-directional." Nine
    cards deep-link INTO a game, each carrying `&layer=`; the game linked back
    only through the site header, to the top of a page with no anchors on it at
    all. A reader who met "Blocked credits the blocker" here and wanted to know
    why had nowhere to go.

    ⭐ EVERY CARD FOR THIS LAYER, NOT ONE PICKED. The map is 9 cards onto 5
    layers -- Stoppages is taught by four of them (icing, offside, faceoffs,
    penalties) and Attempts by two -- so choosing one would mean choosing
    inside a set the data does not rank. Listing them all dissolves that, and
    says what else this layer teaches.

    ⚠️ AND IT IS ABSENT, NOT EMPTY, WHEN A LAYER HAS NO CARD. `Blocked` has
    none: the card called "blocked" opens the Attempts layer, because its door
    is the first blocked shot the CONTROL reducer counts. An empty "Learn More"
    row would advertise a gap; no row says nothing, which is true. The gap
    itself is a content question, not a layout one.

    ⭐ AND IT SITS BELOW THE LEDGER, which is Kevin's call and the right one:
    this panel is a VERIFICATION surface and the link is the first thing in it
    that is not evidence. It goes after the arithmetic closes, never beside it. */
 +cards);}
