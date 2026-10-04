# The two figure languages — evidence for Kevin's ruling, 2026-10-04

Kevin: *"the stick figures on the penalties and empty net diagrams just don't
work for me anymore. We need to update them to something more, I dunno,
consistent with the replay figures?"*

**`two-species.png`** — today's three diagram tokens (top) and today's replay
figure (bottom), drawn at the same apparent height in the same box, on the same
ice. The top row is a wireframe: a circle, a capsule, a line for a stick. The
bottom row is a character: face, hair, sweater, pants, skates, stick, shadow.

**`live-rink-collision.png`** — readthegame.co, game 2023020204 at 1-18:40.1.
⛔⛔ **THE TWO LANGUAGES ALREADY MEET ON THE MAIN SURFACE.** The shooter is the
mascot. **Both goaltenders, in their creases, are the wireframe** — `app.js`
draws them with `goalieGlyph`, the same function the diagrams use. So this is not
"the diagrams disagree with the replay"; it is one project with two drawings of a
person, and they are already side by side in front of readers.

## What each surface needs

| person | replay | diagrams |
|---|---|---|
| skater | `FIG.mascot` | `skaterGlyph` |
| goaltender | **`goalieGlyph`** | `goalieGlyph` |
| official | — | `officialGlyph` |

⭐ **THE RECORDED OBJECTION TO THE MASCOT IS PARAMETERISED, AND LOOKING PROVED
IT.** `rinkart.js` argues the mascot cannot be borrowed because its jersey means
"recorded" and its pose encodes the outcome. Both are arguments:
`figMascot(pen, x, y, size, jersey, out, opts)`. A neutral fill with a non-goal
`out` renders a player making no claim — the middle cell of the bottom row.

⚠️ **AND CONSISTENCY MAY NOT MEAN IDENTICAL.** The goaltenders are context; the
shooter is the subject. One family at two weights may be the right answer rather
than the same figure everywhere. That is the part nobody can settle by reading.
