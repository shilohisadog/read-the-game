---
name: mlb-second-sport
description: "Kevin's idea (2026-08-11): the same legibility treatment for MLB — surface the 'game within the game' in each at-bat for casual fans who find baseball boring. NOTED, NOT STARTED. Records why the architecture transfers cheaply, the strongest argument AGAINST, and the one condition that should gate it."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-11T13:09:44.518Z
---

**Raised by Kevin 2026-08-11, explicitly as "initial thoughts," not a decision.**
Sibling idea to [[hockey-legibility-build]]. **Noted, not started** — see the gate
at the bottom, which Kevin has not yet ruled on.

His framing: a lot of casual fans think baseball is boring, but every at-bat has a
"game within the game," and surfacing it might find an audience.

## Why it fits better than it looks

- **The name was already chosen for this.** "Read the Game" is sport-agnostic on
  purpose (Kevin, 2026-08-07), and the reducer/lens seam was kept from hard-coding
  hockey for the same reason.
- **The whole pipeline is sport-agnostic already**: fetch (never interprets) →
  derive (never opens a socket) → catalog, content-addressed raw, two gates
  (vocabulary and an independent witness), the three-way published/refused/absent
  ledger, layers as deterministic reducers with `countedEvents`. Only the rink
  geometry, the situation-code decode and the layer definitions are hockey.
- **Baseball is natively discrete, which is our doctrine's happy case.**
  "Discreteness IS the honesty" — the puck hops between real events and never
  glides. A pitch sequence *is* a list of events; there is no interpolation
  temptation to resist.
- **The at-bat is a better shareable unit than a hockey game.** Ninety seconds,
  self-contained, with a real narrative. Kevin's open funnel problem ("what makes
  a stranger click?") is genuinely easier here.
- **Base rates are baseball's native language.** Doctrine §8 costs nothing — every
  fan already accepts "he hits .270," so "this pitch in this count" lands without
  teaching a new idea first.

## The strongest argument AGAINST, and it is a product-fit argument

**"Baseball is boring" is a PACING complaint, not a comprehension complaint.** The
hockey novice says *it is too fast, I cannot see what happened* — and a replay
theater is the literal answer to that sentence. The baseball novice says *nothing
is happening* — and our answer would be to make them watch it more slowly. We
would be a superb solution to a question that audience did not ask. This is the
objection to beat before anything else, and I do not think it is beaten yet.

Three more, in descending force:

- **The market is the most crowded in sports analytics.** Savant, FanGraphs,
  Brooks, and a strike-zone box already on every broadcast. Hockey analytics for
  novices is thin; baseball is the opposite.
- **The moat weakens.** "Honest, inspectable, deterministic" differentiates in
  hockey because the competition ships xG black boxes. In baseball the official
  measurement is public and documented, so showing your work is table stakes.
- **Statcast's most attractive fields are MODELS** — xBA, catch probability, and
  friends are estimates. Doctrine §1 forbids them, so we would refuse exactly the
  numbers the competition leads with. Good discipline, smaller surface.
- **Data terms are UNVERIFIED and must be checked before any commitment.** The NHL
  endpoints are undocumented-but-open; MLB's StatsAPI and Baseball Savant carry
  notices I have not read. Do not assert this either way — [[doc-claim-integrity]].

## The gate I proposed (Kevin has not ruled on it)

**Do not start MLB until a novice has actually used the hockey one.** Not focus
for its own sake: October is the first real market test, and *nobody has ever
watched a novice use this product.* Building a second sport first spends the
strongest evidence we could get — and if the format does not land for novices, we
would have built the same wrong thing twice. If it does land, the architecture
transfers cheaply and the second build is much faster than the first.

**The cheap thing worth doing meanwhile:** when the layer seam is touched for base
rates, keep it sport-neutral where that is free. Not a refactor — a bias.
