/**
 * THE GOALTENDING CARDS — one per goaltender, and every one of them a refusal.
 *
 * ⭐ WHAT THIS SURFACE IS FOR IS SAYING WHAT IT IS NOT. It prints a FRACTION and
 * never a save percentage, because ".943" invites a comparison across a season
 * and "33 of 35" cannot. There used to be a threshold — a percentage above twenty
 * shots faced, a fraction below — and twenty was a number we chose, which is the
 * defect this project refuses everywhere else. A fraction carries its own
 * denominator, so it needs no cutoff to be honest at.
 *
 * ⭐ AND THE LIMIT IS ON EVERY CARD, not only the small ones. Showing it only
 * where the sample was thin is selective honesty (DOCTRINE §9) — it makes a
 * 35-shot game look like a rate you could compare, which is the belief the whole
 * site exists to correct. One game is one game.
 *
 * ⛔ THE WORDING AND MARKUP ARE COPIED EXACTLY. `test/fixtures/dom-golden.json`
 * pins `#goaliePanel` across 61 states of the goaltending walk, and
 * `test/goalie-card.test.js` asserts the refusals by name.
 */

/**
 *   goalies  ids, in the order the page shows them
 *   roster   id -> {nm, n, tid}
 *   stats    id -> {f, s, gl, hf, hs} from the goaltending layer
 *   AID AAB HAB   which club is which, for the two-tone card
 *   mode     "all situations" or "even strength", already rendered
 */
export function goalieCards(goalies, roster, stats, { AID, AAB, HAB, mode }) {
  return goalies.map(id=>{const p=roster[id];if(!p)return '';const tid=p.tid,side=tid===AID?'a':'h',ab=tid===AID?AAB:HAB;const st=stats[id]||{f:0,s:0,gl:0,hf:0,hs:0};
 // A FRACTION, ALWAYS, AND THE THRESHOLD IS GONE. This used to print .943 and
 // switch to "18/20" below twenty shots faced -- and twenty was a number we
 // chose, the same defect this project refuses everywhere else. A fraction
 // carries its own denominator, so it needs no cutoff to be honest at: 33 of 35
 // and 18 of 18 both say exactly what they are, and 1.000 does not.
 //
 // The limit is stated on EVERY card for the same reason. Showing it only when
 // the number was small was selective honesty (Doctrine §9) -- it made a
 // 35-shot game look like a rate you could compare, which is the belief the
 // whole site exists to correct. One game is one game.
 const faced=st.f?`${st.s} of ${st.f}`:'—';
 return `<div class="gcard"><div class="gname ${side}">${p.nm} <span class="sub">${ab} · #${p.n}</span></div><div class="gsv">${faced}</div><div class="gline">${st.s} saves · ${st.gl} goals · ${st.f} shots faced (${mode})${st.hf?` · from the slot ${st.hs} of ${st.hf}`:''}<br><span class="lim">one game — what happened, not how unusual it was</span></div></div>`;}).join('');
}
