# Goals page — layout spec

One replay page. Goals is the page. All events is an instrument that opens inside it. Do not add a second page, and do not rewrite the replay.

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

The Goals / All events switch stays. It is how All events opens.

- Goals shows Play, that switch, the tracking speed (¼ / ½ / real time), previous, next, and the scrubber.
- Slower and Faster belong to the event walk. Show them in All events. Hide them in Goals.
- Lesson links and shared moments that ask for every event (`replay=all`, or a link to a moment) still open All events, with the instrument column present on a wide screen.

## Leave alone

- The replay engine, tracking, and the zone-stay recount.
- The front-door preview (`#rg.preview`). It does not take this grid.
- Landscape-phone column widths.
- Games with no tracked goals: they never enter the Goals shell.

## Check

Update any test that assumes the layer picker, Other games, the copy link, and whole-game metrics are one column.

In a browser, on a tracked game: Goals at a wide window has no layer column and a wider rink; All events brings the column back and the rink narrows; Other games, Copy link, and Whole-game metrics stay put across the switch. On a landscape phone in Goals, the layer list is gone and the rink is still beside the controls.
