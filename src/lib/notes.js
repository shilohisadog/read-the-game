/**
 * THE SENTENCES THE PAGE SAYS ABOUT ITS OWN STATE.
 *
 * Three notes that sat inline in `render`, each one a CLAIM a reader is invited
 * to check — which is this project's whole product — and none of them reachable
 * by a test without booting a page and reading a DOM node.
 *
 * ⭐ COHESION PREDICTS INTERFACE WIDTH, and this cluster is the evidence beside
 * `marks.js`. That one needed nineteen inputs for fifty-seven lines, because
 * drawing a mark reads half the world. These three need seven inputs between
 * them, because a sentence about the strength filter depends on the strength
 * filter and nothing else. **A wide interface is a measurement of the cluster,
 * not of the method** — the same split gave both numbers.
 *
 * ⛔ THE WORDING IS COPIED EXACTLY, punctuation included. `iceNote` carries a
 * typographic apostrophe and a doctrine sentence — "never a guess" — that
 * `test/notes.test.js` requires by name.
 */

/**
 * The strength filter's note, which describes THE OTHER CHOICE when it is off.
 *
 * ⭐ THAT ASYMMETRY IS DELIBERATE AND WAS ONCE THE BUG. Both controls used to say
 * nothing until they had already been used, so "Even strength only" described
 * itself only once you were in it. A sentence belongs beside the thing it is
 * about AT THE MOMENT OF USE — which is right for a caption and wrong for a
 * CONTROL, because a button has to be predictable before the click or it is a
 * dare. Off, it says what pressing it would do; on, it carries the live count.
 */
export function situationsNote(evenOnly, dropped) {
 return evenOnly
   ?`${dropped} ${dropped===1?'attempt has':'attempts have'} dropped out so far. Power plays and an empty net are still hockey — but they aren't even hockey.`
   :'Even strength only drops the attempts made on a power play or against an empty net, and says how many it dropped.';
}

/** The trails control's note. It follows the ENDS MODE, because the old sentence
 *  promised a whole-game chart and as-played cannot deliver one. */
export function trailsNote(trails, ASPLAYED) {
 return trails!=='all'
   ?'Current moment shows the latest event only. Keep every mark leaves the attempts on the ice as they happen.'
   :ASPLAYED
   ?'Every attempt in this period stays on the ice. It clears when the teams change ends, because after that they are shooting the other way.'
   :'Every attempt stays on the ice, which builds into a shot chart by the third period — good to study, busy to watch.';
}

/**
 * Which club has pulled its goaltender, said only while it is true.
 *
 * ⭐ `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie] — the same code
 * `drawNetmen` draws by. A MISSING code is not evidence of an empty net, so it
 * produces no note, on the same rule. One sentence per pulled team, mapped
 * rather than branched: both nets empty at once is legal and rare, and a
 * has/have ternary for it would be a branch no game in the archive can reach,
 * which is a branch no test can honestly kill.
 */
export function iceNote(sit, AAB, HAB) {
 const pulled=[];
 if(sit&&sit[0]==='0')pulled.push(AAB);
 if(sit&&sit[3]==='0')pulled.push(HAB);
 return pulled.length
   ?pulled.map(ab=>`${ab} has pulled the goaltender for an extra attacker.`).join(' ')
    +' An empty net here is the feed’s own situation code, never a guess.'
   :'';
}
