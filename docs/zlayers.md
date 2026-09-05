# `#zLayers` — what is actually in the parked menu

**For CHENG. 2026-09-05. Short, because the finding is short and one part of it
is live.**

Kevin asked me to delete `#zLayers`, on my description of it as dead markup left
over from the 2026-08-27 layer rebuild. **I stopped, because it is not dead**, and
enumerating it turned up something that should not wait for this decision.

`app.css` carries `#rg .zlayers{display:none}` — the whole block, 4,189 bytes,
on every game page.

---

## 1. ⛔ THE LIVE DEFECT: the strength control is not reachable

The **only** *All situations / Even strength only* control on the page is inside
that hidden block:

```
<details class="zone zlayers">   ← display:none
  <div class="lrows">
    <div class="figpick sit"><div class="grp" aria-label="Which situations are counted">
      <button class="lyr sbtn" data-s="all"  aria-pressed="true">All situations</button>
      <button class="lyr sbtn" data-s="even" aria-pressed="false">Even strength only</button>
    </div><span class="fnote" id="nSit"></span></div>
```

It is **still wired** — `#rg .sbtn` gets its click listeners at boot — and
`render` writes its explanatory sentence into `#nSit` on every frame:

> *"Even strength only drops the attempts made on a power play or against an
> empty net, and says how many it dropped."*

Both the control and that sentence are invisible. **The filter is reachable only
by typing `?strength=even` into the URL.**

⚠️ **And this is B2 running backwards.** B2's whole finding was that *Situations*
was the one control that reported an effect it was not having, and its fix was
*the control follows the layer*. The layer menu was then parked, and the control
went with it — into a container nobody enumerated. **Second instance of *when you
hide a container, enumerate what was inside it*, and the first one is already a
rule in this repo.** Nothing in `status.md` records a decision to retire the
strength control; §B2 still describes it as shipped.

---

## 2. The block is three different things in one hidden box

| | what it is | state |
|---|---|---|
| **the teaching copy** | `.lds` 396 chars, `.lon` 981, `.lat` 679 — five layers' definitions, what each draws, and how each attributes | ⭐ **LIVE**, read by two surfaces |
| **the strength control** | the `sbtn` pair and `#nSit` | ⛔ **live, wired, invisible** — §1 |
| **the control machinery** | five `<button class="lrow">` with `aria-pressed`, five `Off` spans, `#zLayersOn` | genuinely dead as a *control* — but see §3 |

**The copy is not decoration.** `renderWork` reads `.lds` and `.lat` out of the
hidden rows and prints them in show-me-the-work; the layer-box note reads `.lds`
and `.lon`. Today's panel says *"Counted 21 attempts **from within 33 ft of the
net, between the face-off dots**. **Credited to the club that shot.**"* — both
strings come from markup no visitor can see. Delete the block and the site's
flagship verification surface loses its definitions.

---

## 3. ⚠️ And the dead machinery is load-bearing anyway

`setCorsi()` → `lyrState('stCorsi', on)` → `zoneState()` → **`syncPick()`**, and
`syncPick` is what repaints the **visible** chip row. `zoneState` counts on-layers
by reading `[aria-pressed="true"]` **off the hidden rows** — deliberately, and its
comment says why: *"DERIVED FROM THE DOM, NOT FROM A LIST OF LAYERS… a sixth layer
is covered the day it is added."*

That was right when the rows were the control. It now means **the visible
selector derives its state from an invisible one.**

Removing the block makes the page throw at boot:

```
TypeError: Cannot read properties of null (reading 'addEventListener')
```

⚠️ **And the test harness cannot see that.** `fakeDom().getElementById` invents an
element for any id (`if (!byId.has(id)) byId.set(id, el())`), so booting the
deleted page against it reports success. I ran exactly that and got "booted"
before checking the fake — the documented hazard of *a fake more permissive than a
browser*, from this repo's own notes. The `TypeError` above comes from re-running
it with `getElementById` returning `null` for the removed ids, which is what a
browser does.

---

## 4. What I would do, and the one question that is yours

**Immediately, independent of any cleanup: give the strength control a visible
home.** It is a shipped feature the page describes and nobody can press.

**Then the block splits along what each part is:**

- **the dead control** — the five `.lrow` buttons, the `Off` spans, `#zLayersOn`,
  and the `lyrState`/`zoneState` chain — deleted, with `syncPick` driven directly
  by the five booleans it already reads. `zoneState`'s DOM-derivation stops being
  a virtue once the DOM it derives from is hidden.
- **the copy** — has to land somewhere, and that is the question.

**Q11 — where does a layer's own description live?**

**A. A plainly-named hidden block.** `<div class="lcopy" data-pick="slot">` with
the three fields. Smallest change, same readers, and it stops teaching copy hiding
inside a fake control. Still prose parked in markup because that is where it
happens to be.

**B. The layer module owns it.** `danger.js` exports its definition and
attribution beside its `id` and its rule, and the panel *asks the layer* — the
pattern this page already uses for `summarise(near)` and `marks(result, …)`. The
description then travels with the rule it describes and cannot drift from it.

**I prefer B and cannot rule on it**, because it puts user-facing prose in the
analysis tier. Your Q2 model was *no DOM, no network, no filesystem* — prose
breaks none of those, and a sentence is not markup. But it is the tier boundary,
and "the layer knows how to describe itself" is either the cleanest application of
*one implementation, two callers* or the first crack in it.

⭐ A smaller version of the same question, in case it changes the answer: `.lon`
(*what this layer puts on screen*) is **presentation** in a way `.lds` (*what it
counts*) is not. B may be right for the definition and wrong for the rest.
