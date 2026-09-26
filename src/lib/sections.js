/**
 * A FIGURE'S SECTION, AS MARKUP — THE RENDERERS, SHARED BY BOTH SURFACES.
 *
 * ⭐⭐⭐ WHY THIS IS A MODULE AND NOT PAGE SCRIPT. It was page script: these
 * functions lived inside `build_index.py`'s `HOW_BODY` string, which is
 * JavaScript embedded in Python and reachable from exactly one page. Kevin,
 * 2026-09-25: *"It takes 3 or 4 mouse clicks to get to 'how we counted this'
 * from a replay-layer and it takes us away from the replay page."* The fix is a
 * second door on the replay that draws THIS section over the rink — and the
 * moment two pages draw it, a copy written for the overlay would be a SECOND
 * IMPLEMENTATION of the block whose entire job is being the one place a figure's
 * arithmetic is stated. That is the drift the whole door architecture exists to
 * remove ([[show-the-work-or-do-not-print-it]]).
 *
 * So the renderers moved here unchanged, `how-we-measure.html` inlines them, and
 * the game page inlines them too. Neither page owns them.
 *
 * ⭐⭐ THERE ARE TWO, BECAUSE THE SITE HAS TWO KINDS OF FIGURE. `figureSection`
 * draws one whose numerator and denominator are described in PROSE we wrote
 * (`derivation.js`); `printedSection` draws one that travels with its own
 * published description in `measures.json`, and therefore has no `count`/`of`
 * written anywhere in our source. The header over `PRINTED` in `printed.js` says
 * why that asymmetry is deliberate.
 * ⛔ THE OVERLAY NEEDED BOTH AND I SHIPPED IT WITH ONE. Four of the replay's
 * seven layer doors land on the first kind and three on the second; the panel
 * opened on `Control`, named the layer in its heading and drew an empty body.
 * A design note written from the doors' NAMES rather than from what renders
 * them — the same reading-instead-of-measuring this file's `where` field has
 * already cost a morning.
 *
 * ⭐⭐⭐ AND IT IS HANDED ITS ELEMENT-MAKER RATHER THAN REACHING FOR `document`.
 * `src/lib` is the tier `tools/tiers.mjs` COUNTS as pure, and the first version
 * of this file named `document.createElement` — which made the generated block
 * in `docs/architecture.md` read *"sections.js reach outside pure computation —
 * the boundary §1 claims is broken."* It was right. `work.js` keeps the same
 * boundary by returning markup STRINGS; this keeps it by taking the primitive as
 * an argument, which is the arrangement `boot(G, RATES)` already uses and states:
 * *"RATES ARRIVES AS AN ARGUMENT AND IS NEVER REQUESTED IN THIS FUNCTION."*
 * The renderers are therefore a function of their inputs, testable with a
 * `create` that builds anything at all, and the tier's claim survives the move.
 *
 * ⚠️ THE NAMES ARE DELIBERATELY NOT `el`, `num`, `r2`. `_module()` strips the
 * import lines and drops the file's body into the page script's TOP LEVEL, and
 * `how-we-measure.html` already declares all three there. A redeclaration in
 * that scope does not throw — the later one silently wins — so a collision here
 * would not break the build, it would quietly change what another part of the
 * page prints. `mk`, `commas` and `two` cannot collide.
 *
 * ⚠️ AND IT TAKES `layerFor` RATHER THAN READING IT. The methods page injects
 * `LAYER_FOR` from `data/layer-rules.json` at build time; the game page knows
 * which layer is on because the reader just pressed it. A module that reached
 * for a page global would work on one surface and be undefined on the other.
 */

const commas = n => (n == null ? '—' : n.toLocaleString());
const two = v => (v == null ? '—' : v.toFixed(2));

/* ⭐⭐⭐ THE ARITHMETIC OF A FIGURE PRINTED SOMEWHERE ELSE, AND NOTHING HERE
   DIVIDES. Numerator, denominator and result are three published fields; this
   places them side by side and rounds for the page. Rounding is presentation
   — the division happened in `census.js` or `archive.js` and is not repeated.

   ⛔ TWO SHAPES, BECAUSE A RATE PER SIXTY MINUTES IS NOT A QUOTIENT. Writing
   "67,517 ÷ 42,615.7 = 95.06" would put a false sum on the page whose whole
   subject is checkable arithmetic: that division is 1.58, and the 60 is the
   scaling the published sentence describes. So a scaled figure says "in", and
   a true ratio says "÷".

   ⚠️ AND `fig()` IS NOT USED HERE. It reads anything under 1 as a share and
   multiplies by 100 — correct for every figure it was written for, and wrong
   for 0.765 shot attempts per face-off, which it would print as 76.5. The
   unit decides, and the unit is published beside the figure. */
export function readLine(l) {
  const right = l.unit === '%' ? (l.value * 100).toFixed(1) + '%'
                               : two(l.value) + ' ' + l.unit;
  return l.as === 'scaled'
    ? commas(l.count) + ' in ' + commas(l.n) + ' ' + l.denUnit + ' = ' + right
    : commas(l.count) + ' ÷ ' + commas(l.n) + ' = ' + right;
}

/** ⭐ HOW A MEASURED FIGURE IS PRINTED, IN ONE PLACE. A count of seconds is an
    integer and reads wrong as "46.00"; a share reads wrong as "0.22" beside a
    unit that says "for every 100". Three shapes, one rule, no per-row config.
    ⚠️ NOT USED BY `readLine`: see the note over it for the 0.765 this would
    print as 76.5. */
export function figFmt(v) {
  if (v == null) return '\u2014';
  return Number.isInteger(v) ? String(v) : (v < 1 ? (v * 100).toFixed(1) : v.toFixed(2));
}

/**
 * THE RENDERERS, BOUND TO A WAY OF MAKING AN ELEMENT.
 *
 * `create(tag)` is the only thing either page supplies: `how-we-measure.html`
 * hands over its own `el`'s primitive, the replay hands over a one-line lambda,
 * and a test can hand over anything with `className`, `textContent`, `href` and
 * `appendChild`. See the header for why this is a parameter.
 */
export function sections(create) {
    /** One element. See the header for why this is not called `el`. */
    const mk = (tag, cls, text) => {
      const n = create(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

  /* ⭐⭐ WHICH LAYERS ON THE REPLAY OPEN THIS SECTION, READ RATHER THAN TYPED.
     `where` is prose and this is the half of it that can be derived: the layer
     descriptors record which figure each one opens, node writes that into
     `data/layer-rules.json`, and this is its inverse. A sentence typed here would
     be the second statement of a pairing the layers already own — and the one on
     the methods page that claimed a surface the figure is not printed on survived
     a whole morning.

     ⭐ IT RETURNS NULL WHERE THE READER IS ALREADY THERE. On the replay the layer
     is on and the rink is behind the panel, so "on a game page, this is what the
     Control layer is counting" is telling a reader what they are looking at. The
     game page passes no `layerFor` and gets no sentence. */
  function onTheReplay(anchor, layerFor) {
    const ls = layerFor && layerFor[anchor];
    if (!ls || !ls.length) return null;
    /* ⚠️ A LIST, NOT A JOIN. The first version read "the Control (Corsi) layer,
       the Blocked shots layers are counting" — two layers open the same section,
       which was never going to be the common case and so was never read aloud.
       Found by looking at the rendered page. */
    const named = ls.length > 1
      ? ls.slice(0, -1).join(', ') + ' and ' + ls[ls.length - 1]
      : ls[0];
    return mk('p', 'hmwhere', 'On a game page, this is what the ' + named
      + (ls.length > 1 ? ' layers are' : ' layer is')
      + ' counting — for one night rather than for the archive.');
  }

  /**
   * ⭐⭐⭐ A FIGURE THE REST OF THE SITE PRINTS. Same block as the methods page's
   * `figure()` with one deliberate difference: there is no "Counted / Out of" pair
   * written in `methods.js`, because these figures travel with their own
   * description in the published document. The page prints THAT sentence, names
   * the path it read it from, and a reader can open the same file and check. See
   * the header over `PRINTED` in `src/lib/methods.js` for why that asymmetry is on
   * purpose.
   *
   * `e` is one entry from `printed(measures)`. `ctx` carries what differs between
   * the two surfaces and nothing else:
   *
   *   labelOf   {anchor: label} — for the "counted exactly as …" cross-reference
   *   layerFor  {anchor: [layer names]}, or omitted on the replay (see above)
   *   href      how a cross-reference addresses another section. The methods page
   *             has them all on one page and uses `#anchor`; the overlay has ONE,
   *             so a bare fragment there would scroll the game page to nothing.
   */
  function printedSection(e, ctx) {
    const labelOf = (ctx && ctx.labelOf) || {};
    const href = (ctx && ctx.href) || (a => '#' + a);
    const s = mk('section', 'hmf');
    s.id = e.anchor;
    s.appendChild(mk('h3', null, e.label));
    /* ⛔ A FIGURE MUST SAY WHERE A READER MET IT, AND EITHER HALF WILL DO. Most
       are printed in prose a builder substituted and name their surfaces in
       `where`; one is printed only by the replay, and for that one the sentence
       is derived from the layer rather than written twice. A test requires one
       of the two to be present. */
    if (e.where) s.appendChild(mk('p', 'hmwhere', 'Where this appears: ' + e.where));
    const rep = onTheReplay(e.anchor, ctx && ctx.layerFor);
    if (rep) s.appendChild(rep);
    const box = mk('div', 'hmev');
    /* ⭐⭐ ONE GROUP PER PUBLISHED SENTENCE: the figures that sentence describes,
       and then the sentence. The published `what` for the slot ends "…this many
       were goals", and "this many" needs its number directly above it.

       ⭐⭐ AND A SENTENCE IS PRINTED ONCE PER PAGE. Two of these figures are cut
       out of a single published measurement, and printing its description under
       both would be the same paragraph twice — the defect the front door's
       `FIGURE_CLAUSE` closed the day before this was written, arriving from the
       other direction. `sameAs` is the anchor of the section that has it. */
    e.groups.forEach(g => {
      const ul = mk('ul');
      g.lines.forEach(l => {
        const li = mk('li');
        li.appendChild(mk('b', null, readLine(l)));
        li.appendChild(mk('span', null, ' — ' + l.is));
        ul.appendChild(li);
      });
      box.appendChild(ul);
      if (g.sameAs) {
        const p = mk('p', null, 'Counted exactly as ');
        const a = mk('a', null, labelOf[g.sameAs] || 'the figure above');
        a.href = href(g.sameAs);
        p.appendChild(a);
        p.appendChild(mk('span', null, ' — one published measurement cut a '
          + 'different way, so its description is there rather than repeated here.'));
        box.appendChild(p);
        return;
      }
      const src = mk('p', 'hmsrc');
      src.appendChild(mk('span', null, 'What that counts, published beside the '
        + 'figure itself — measures.json, at '));
      src.appendChild(mk('code', null, g.from));
      src.appendChild(mk('span', null, ':'));
      box.appendChild(src);
      box.appendChild(mk('p', null, g.what));
    });
    s.appendChild(box);
    /* ⛔ AND IT SAYS WHICH HALF IS MISSING, IN THE WORDS OF WHICH HALF IT IS. A
       document that predates a field is ordinary here; a page that quietly drew
       three lines where four belong is not.

       ⚠️ ONE SENTENCE WHEN THE WHOLE FIGURE IS GONE, one per line when part of
       it is. A dead document would otherwise print the same confession three
       times under a block that has nothing in it, under a banner at the top of
       the page already saying the counts could not be loaded. */
    if (e.missing && !e.lines) {
      s.appendChild(mk('p', 'hmnone', 'The published figures for this one could '
        + 'not be read, so the counts are not shown. What follows does not '
        + 'depend on them.'));
    } else {
      (e.missing || []).forEach(mi => {
        s.appendChild(mk('p', 'hmnone', mi.why === 'description'
          ? 'The published document carries no description for ' + mi.path
            + ' yet, so that line is not shown — we do not print a figure here '
            + 'without the sentence that says what it counted.'
          : 'The published document carries no figures at ' + mi.path
            + ' yet, so that line is not shown.'));
      });
    }
    s.appendChild(mk('p', 'hmwhy', e.why));
    /* ⛔ THE CAVEAT IS UNCONDITIONAL IN THE DATA AND SO IT IS HERE. Every entry in
       `PRINTED` carries one; a figure that reached a page without one would render
       a block that reads as though nothing is wrong with it, which is the one
       thing these surfaces may not do. A test holds the data side.

       ⚠️ "COULD BE", NOT "IS". Kevin: *"could (or should?) this say 'What could be
       wrong with it', mainly to soften the decisiveness of saying it's flat out
       wrong (then why would we include it on our site?)"* He is right, and it is
       not a hedge: the heading is an invitation to doubt the figure, and "what is
       wrong with it" is a confession that argues against printing the figure at
       all. Where something IS measurably wrong the body still says so flatly, so
       nothing is softened except the promise the heading makes. */
    const c = mk('p', 'hmcav');
    c.appendChild(mk('b', null, 'What could be wrong with it. '));
    c.appendChild(mk('span', null, e.caveat));
    s.appendChild(c);
    return s;
  }


  /* ---------------------------------------------------------------------------
     THE OTHER KIND OF FIGURE: one whose count and denominator are prose we wrote.
     --------------------------------------------------------------------------- */

  function workRow(m) {
    const w = m.work;
    if (!w || w.value == null) return null;
    const p = mk('p', 'hmwork');
    if (w.count != null) {
      p.appendChild(mk('span', null, commas(w.count) + ' \u00f7 ' + commas(w.n) + ' = '));
    }
    p.appendChild(mk('b', null, figFmt(w.value)));
    /* ⛔ A MEDIAN HAS NO NUMERATOR, so it says what it is instead of pretending
       to be a ratio — and it still names the population it is the middle of. */
    p.appendChild(mk('span', null, ' ' + m.unit
      + (w.count == null ? ', the middle value of ' + commas(w.n)
          + (m.population ? ' ' + m.population : '') : '')));
    return p;
  }

  /* ⭐⭐⭐ WHY A MEASURE IS DEFINED THE WAY IT IS, IN COUNTS RATHER THAN IN PROSE.
     The CF% row's score condition used to be explained by a mechanism we do not
     measure. The archive had counted the EFFECT since the site began — it is the
     front door's own headline — so the explanation is now two published figures
     and their own published descriptions. Nothing here divides or names a rate:
     `what` travels with the count from `archive.js`. */
  function evidenceBox(m) {
    if (!m.evidence || !m.evidence.length) return null;
    const box = mk('div', 'hmev');
    if (m.evidenceLead) box.appendChild(mk('span', null, m.evidenceLead));
    const ul = mk('ul');
    m.evidence.forEach(e => {
      const li = mk('li');
      li.appendChild(mk('b', null, commas(e.count) + ' of ' + commas(e.n)));
      li.appendChild(mk('span', null, ' \u2014 ' + e.what));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    if (m.evidenceTail) box.appendChild(mk('span', null, m.evidenceTail));
    return box;
  }

  /** A labelled number. The first argument is the figure, the rest says what it is.
      ⭐ `q` MAKES THE CROSS-REFERENCE A LINK RATHER THAN AN INSTRUCTION. Kevin,
      reading the page: *"We refer to question numbers, but the questions aren't
      until the very bottom, we need to point readers to them."* A page about
      showing the work cannot answer "see question 2" with a scroll. Only the
      methods page passes one — the overlay's cells are bare counts, and a `#q2`
      on the game page would scroll to nothing. */
  function cell(value, said, q) {
    const li = mk('li');
    li.appendChild(mk('b', null, value));
    li.appendChild(mk('span', null, said));
    if (q) {
      li.appendChild(mk('span', null, ' \u2014 see '));
      const a = mk('a', null, 'question ' + q);
      a.href = '#q' + q;
      li.appendChild(a);
    }
    return li;
  }

  function cellList(cls, cells) {
    if (!cells.length) return null;
    const ul = mk('ul', cls);
    cells.forEach(c => ul.appendChild(c));
    return ul;
  }

  /** The cells a LEAGUE row gets: what it was counted over, and nothing else.
      ⭐ ONE STATEMENT, because both surfaces draw these rows now. */
  function leagueNums(r) {
    return cellList('hmnums', r.over ? [cell(commas(r.over.n), r.over.unit + ' counted')] : []);
  }

  /**
   * ⭐ ONE BLOCK PER FIGURE, AND ITS `id` IS WHAT THE CARD'S DOOR POINTS AT.
   *
   * ⚠️ `nums` IS NULL WHEN THERE IS NOTHING TO SAY, RATHER THAN AN EMPTY LIST.
   * This asked `nums.childNodes.length` once and the page's own test harness has
   * no `childNodes` — which is not the harness being wrong. A renderer that reads
   * a DOM property to find out what it just built is asking the browser a question
   * it already knows the answer to.
   */
  function figureSection(m, nums, ctx) {
    const s = mk('section', 'hmf');
    s.id = m.anchor;
    s.appendChild(mk('h3', null, m.label));
    const rep = onTheReplay(m.anchor, ctx && ctx.layerFor);
    if (rep) s.appendChild(rep);
    const dl = mk('dl', 'hmfrom');
    dl.appendChild(mk('dt', null, 'Counted'));
    dl.appendChild(mk('dd', null, m.count));
    dl.appendChild(mk('dt', null, 'Out of'));
    dl.appendChild(mk('dd', null, m.of));
    s.appendChild(dl);
    const work = workRow(m);
    if (work) s.appendChild(work);
    s.appendChild(mk('p', 'hmwhy', m.why));
    const ev = evidenceBox(m);
    if (ev) s.appendChild(ev);
    if (nums) s.appendChild(nums);
    /* ⛔ THE CAVEAT IS UNCONDITIONAL IN THE DATA AND SO IT IS HERE — see the same
       note in `printedSection`, which is the one place that argument is written. */
    const c = mk('p', 'hmcav');
    c.appendChild(mk('b', null, 'What could be wrong with it. '));
    c.appendChild(mk('span', null, m.caveat));
    s.appendChild(c);
    return s;
  }

  return { onTheReplay, printedSection, figureSection, cell, cellList, leagueNums };
}
