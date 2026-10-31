# Goals page — layout spec

One replay page. A game with tracked goals is Goals only; a game without is the event walk (All events) only. There is no switch between them (Kevin, 2026-10-31: they are two replay approaches, and a switch presents them as one). Do not add a second page, and do not rewrite the replay.

The class that already means Goals is `#rg.trkgoals` (`trkPaint` in `src/app.js`). A game with no tracked goals never gets that class, and All events stays the page.

## Split the side column

`.side` in `builders/build_main.py` is one box. Break it.

**Instrument** — the left column, All events only:

- the layer picker (`#pickrow`)
- the layer note (`#lcap`)
- “The next play” shading (`details.zone.zcue`)

**Goals page** — always in the rink’s column, both modes, so these do not jump when the mode changes:

- the newcomer note (`#newcomer`)
- Other games (`#nextup`)
- Copy a link to this moment (`#share`)
- Whole-game metrics (`#sum`)

Put those four after the transport, as siblings, not inside the instrument. The video clip block stays where it is.

`src/*.html` is generated. Edit the builder, then `python3 builders/build_main.py`.

## Wide screen (min-width 1360px)

Today `.wrap` is `340px` plus the rink, with a 28px gap. `.side` is that 340px column.

- **Goals:** do not render the instrument. One column. The rink takes the full row, including the 340px and the gap. Leave the wrap’s max-width at 1360px.
- **All events:** the instrument is the 340px column, as now. The rink goes back to the width it has today. The four controls above stay under the transport.

## Below 1360px

The page is already one column (`.side` is `display: contents`). Hiding the instrument removes the layer block from the stack. The rink is already the width of the page. Do not invent a second column here.

## Landscape phone (`orientation: landscape` and `max-height: 500px`)

Do not change this grid. The left track stays about 230px because Play, previous, and next share one row. The rink stays in column two.

In Goals, hide the instrument so that column is the controls and not a scrolling layer list. Do not give the rink the full width: a full-width ice gets taller in proportion and pushes the sentence and Play off the screen.

## Transport

There is no Goals / All events switch.

- Goals shows Play, the tracking speed (¼ / ½ / real time), previous, next, and the scrubber.
- Slower and Faster belong to the event walk. They show only on a game with no tracked goals.
- A link to a moment on a tracked game opens Goals at that moment, with any layer it names turned off; `replay=` is ignored. Lesson links all point at games with no tracking, so they open the event walk as before.

## Leave alone

- The replay engine, tracking, and the zone-stay recount.
- The front-door preview (`#rg.preview`). It does not take this grid.
- Landscape-phone column widths.
- Games with no tracked goals: they never enter the Goals shell.

## Check

Update any test that assumes the layer picker, Other games, the copy link, and whole-game metrics are one column.

In a browser, on a tracked game: Goals at a wide window has no layer column and a wider rink, and no Replay switch. On a game with no tracked goals the layer column is present. On a landscape phone in Goals, the layer list is gone and the rink is still beside the controls.
