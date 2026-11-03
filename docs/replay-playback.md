# Replay playback — one clock, one door

**Written 2026-11-03. BUILT the same day** (Kevin: straight to tests and
implementation). §2's line numbers are pinned to `19524b2`, the code before it.
§9 says where the build differs from the design.

## 1. Why

Kevin hit the same freeze twice in two days (EDM at NYR after the McDavid goal;
COL at CHI from the front page): Play turned to Pause and the rink sat on a goal's
first tracked frame until he pressed Pause and Play again.

The `&trace=1` log found the cause on its first run. The drawing loop received two
frames carrying the same time, treated the second as "time has stopped", and asked
for no more frames, while the page still said it was playing. `19524b2` fixed that
one rule. The design that let it happen is still there, and this note is about
that design.

The fix before it (`90deb45`, "Play restarts a tracking whose booked frame never
came") was built on a guess about the cause, and the trace showed the guess was
wrong. This design removes it.

## 2. How playback works today

There are five ways a goal's tracking plays, and one way the untracked games play:

| Path | Who starts it | Who decides it is over |
|---|---|---|
| Goals, Play | `step` → `trkGoalsNext_` (app.js:3138) → `trkStart` | the step timer, after a duration **predicted** at start (`left()`, :3037) |
| Goals, Prev/Next | `trkStep` / `trkOpen` (:3154, :3165) | the reader (paused) |
| Speed change | `trkSpeed` (:3196) restarts the goal from its first frame | as Goals, Play |
| "See it tracked" (reduced motion) | `trkSeeIt` (:3125), `free` | its own 1.5 s `setTimeout` after the goal frame |
| Front-page hero | `goals` (:5583), `free` | its own `setTimeout`, also a **predicted** duration |
| Event walk (untracked games) | `play` / `step` (:2962, :2951) | the step timer, `dwell` (:2941) |
| The scrubber | `oninput` pauses and draws each position; `onchange` jumps (:3353, :3357) | the reader; any tracking on screen ends |

**The 20-second pause after a goal is a third clock.** When the replay lands on a
goal, two separate things start together:
- the step timer is set to `GOAL_READ_MS` (20,000 ms, src/lib/goal-read.js) and
  moves on when it fires;
- `greadArm` (:2938) records its own end time and starts a 200 ms `setInterval`
  that redraws the countdown under centre ice.

They agree only because they start at the same moment. Pause clears the
countdown and stays on the goal with no limit; Play then moves on at once.

**Two clocks run during a goal.**
- The **step timer** (`setTimeout`) moves to the next stop. It's set at the start
  to how long the goal *should* take: 37,900 ms for the COL goal at ¼ speed.
- The **drawing loop** (`requestAnimationFrame`) adds up the time between frames
  (`played += now - prev`, :3066) to decide what to draw.

Neither clock checks the other. If the drawing loop stops, the timer still moves
on at 37.9 s. If drawing runs slow (a phone, a busy tab), the timer can still cut
to the next goal before the puck reaches the line.

**Four pieces of state must agree:** `playing`, `timer`, `TRK.run`, `TRK.hold`.

| State | Writes |
|---|---|
| `playing` | 3 |
| `timer` | 3 |
| `TRK.run` | 3 |
| `TRK.hold` | 9, in 6 functions |

Nothing checks that the four agree after a change. Each path keeps them
consistent by its own care.

**Adding up time is the root weakness.** Because the position is a running total
of frame gaps, every frame matters: a repeated, missing or late frame stalls or
shifts it. Two guards exist only to protect that total:
- the "time has not moved" stop (now `TRK_SAME`, :3071);
- the "frame never came" rebook (`TRK_STALL_MS`, :3079).

## 3. The design

### 3.1 The position is calculated, never added up

A playing clip remembers three numbers: where it started (game time), when it
started (`performance.now()`), and its rate (speed).

```
position = from + (performance.now() - startedAt) × rate      while playing
position = from                                               while paused
```

Pause stores the current position into `from`. Play resets `startedAt`. Seek sets
`from`. A speed change stores the position and changes the rate, so the goal
**carries on from where it is** rather than restarting (today it restarts; see §6).

Each frame draws the picture for `position` and nothing else. Drawing never
changes state.
- A repeated frame draws the same picture again.
- A late or missing frame means one picture was skipped; the next one is correct.
- Neither guard in §2 is needed, and both are removed.

The frame time the browser passes in is not used.

### 3.2 One clock at a time

At any moment exactly one thing drives the replay forward:

- **on an event frame:** one timer, for that frame's reading time (as today,
  `dwell`);
- **on a goal frame after its clip (or a goal with no tracking):** one timer, for
  the 20-second reading pause. The state records when the pause ends (`until`),
  and the countdown under centre ice is drawn **from that same `until`**, the way the
  rink is drawn from the clip's clock. The countdown's 200 ms redraw becomes
  something to draw rather than a clock: the door starts and stops it with the timer,
  so the two can't drift apart;
- **in a tracked clip:** the drawing loop. When `position` reaches the goal line,
  the loop reports **clip done** and the replay moves to the goal frame. Nothing
  predicts how long a clip takes.

The two never run together, so they can't disagree. The `TRK.hold` durations,
`trkExtra` (:3127) and `left()` go.

### 3.3 One state, one door

The four variables become one object:

```
playback = {
  playing,                                  // what the button shows
  where:  { kind: 'event', i }              // an event frame
        | { kind: 'goal',  g, until }       // a goal frame in its reading pause
        | { kind: 'clip',  g, from, startedAt, rate }   // a goal's tracking
        | { kind: 'loading', g, since },    // waiting for a goal's file
  driver: the one timer or frame booking that is live, or none
}
```

It changes only through one function, `pbGo(action)`, which runs that action's
entry in the table `PB` (app.js). The actions are:
- from the reader: `play`, `pause`, `next`, `prev`, `jump(i)`, `seek(t)`, `speed(v)`,
  and `scrub(i)` (the scrubber while it is dragged);
- from the replay itself: `timerDone`, `clipDone`, `loaded(g, file)`.

`pbGo` does four things:
1. cancels the live driver;
2. works out the new state from a table (§4);
3. starts the one driver that state needs;
4. checks the rules in §5.

With `&trace=1` it records every action, the state before and after, and any rule
broken.

The paths in §2 become callers of `pbGo`:
- Prev/Next calls `pbGo('step', dir)`.
- The speed buttons call `pbGo('speed')`.
- The hero loop and "See it tracked" run a clip that drives itself (`free`) and
  calls its own `done` at the goal line: the hero goes round again; "See it
  tracked" clears 1.5 s later.

### 3.4 Failures, each with a set outcome

| What goes wrong | What happens | What the reader sees |
|---|---|---|
| Frames repeat, arrive late or skip | nothing; the next frame draws from the clock | smooth or briefly choppy motion, never a stop |
| Drawing one frame throws | caught inside the loop and traced; the loop carries on | at most one stale picture |
| Drawing fails 3 times in one goal | the clip ends there | the goal frame, and "The tracking could not be drawn." |
| The goal's file is missing or unreadable | `loaded(g, null)` | the goal frame, and "No tracking for this goal." (as today) |
| The goal's file never arrives (the fetch has no timeout today) | after 8 s, the same as missing | as above. Today Play waits for it indefinitely |
| The reader presses Next while a file loads | the load result is applied only if `where` is still that goal | Next works; the late file does nothing |
| The tab is hidden | the browser stops frames; see §6 | — |
| A frame from an old clip arrives | ignored; only the newest booking runs (already in `19524b2`) | — |

The 3 frames and the 8 s are our choices, not measurements, and are named
constants.

**There is no watchdog.** Nothing polls the state. Every failure is handled where
it happens, and the trace records what happened without fixing anything.

## 4. The transitions

| From | Action | To | Driver started |
|---|---|---|---|
| event `i` | `play` | the next stop: an event, or the goal's file `loading`, or its `clip` | timer, or the load, or the drawing loop |
| event `i` | `timerDone` | as `play` | as `play` |
| `loading g` | `loaded(g, file)` | `clip g` from its first frame, held still for `TRACK_STILL_MS` | the drawing loop |
| `clip g` | `clipDone` | `goal g`, `until` = now + 20 s | its timer and the countdown |
| `loading g` | `loaded(g, null)` | `goal g`, `until` = now + 20 s | its timer and the countdown |
| `goal g` | `timerDone` | the next stop | as `play` |
| `goal g` | `pause` | `goal g`, no `until` (no limit, countdown gone) | none |
| `goal g`, paused | `play` | the next stop at once (as today) | as `play` |
| `clip g` | `pause` | `clip g`, `from` = the position | none |
| `clip g` | `next` / `prev` | the next/previous stop inside the clip, or the goal frame | none (paused) |
| any | `pause` | the same place | none |
| any | `speed(v)` | the same place, new rate | the same driver as before |
| any | `jump(i)` | event `i` | none, or a timer if playing |
| any | `scrub(i)` | event `i`, paused; a clip on screen ends | none |

The scrubber marks event frames. During a clip it stays on the frame before the
goal, as it does today; this design doesn't change that.

The table is the specification, and the tests in §7 walk it row by row.

## 5. The rules `pbGo` checks after every action

1. Playing means exactly one driver is live. Paused means none.
2. A clip on screen means `where.kind` is `'clip'`, and the reverse.
3. Only the current clip's frame booking can run.
4. What the rink shows is what the clock says, because drawing reads the clock and
   never writes state.

When a rule breaks, trace mode logs it. The tests fail on it everywhere.

## 6. What changes for the reader

**Kevin ruled all three yes, 2026-11-03.** Apart from no more freezes:

1. **A speed change mid-goal** carries on from the current moment, instead of
   restarting the goal from its first frame.
2. **A goal file that never arrives** gives up after 8 s and plays the goal frame
   with "No tracking for this goal." Today Play waits indefinitely.
3. **A hidden tab.** Today the browser stops the drawing but the step timer keeps
   running slowly, so a goal can end unseen. Two choices:
   Ruled: **pause when hidden**, so the reader returns where they left. That
   includes the 20-second goal pause.

## 7. Tests (written before the change, failing against today's code where they should)

- **Clock:** frames repeat, arrive 2 s late, stop for 10 s then resume. Each time,
  the picture matches the clock and the clip ends on the goal frame.
- **One clock:** frames arrive slowly (a phone). The replay does not leave the clip
  before the goal line. This fails today.
- **Every row of §4,** from a given state with a given action, checking the state
  after and the live driver.
- **Rules under random use:** a few hundred random sequences of
  play/pause/next/prev/jump/speed/frames/loads, checking the §5 rules after every
  step. This is the test that stands for "reliable and consistent".
- **The goal pause:** the countdown and the move-on agree to the frame; Pause
  holds the goal with no limit; Play then moves on at once.
- **The scrubber:** a drag pauses, ends a clip on screen, and leaves no driver live.
- **Every failure in §3.4,** including a drawing that throws once and three times,
  and a file that never arrives.
- **The hero loop and "See it tracked"** go round and rest through the same door.

**The test harness changes too.** Its fake `requestAnimationFrame` runs the callback
immediately with time 0 (`boot`, in the test helpers). That fake is why the loop has a
"time has not moved" stop at all: an always-on loop would never return. The fake
becomes a queue that the test advances, as the two new freeze tests already do.

## 8. Scope and order

1. Tests of §7, against today's code.
2. The clock and the door for Goals, the goal pause, the scrubber, "See it tracked" and the hero. Remove
   `TRK.hold` durations, `trkExtra`, `left()`, `TRK_SAME`, `TRK_STALL_MS` and the
   `trkKick` rebook.
3. Move the event walk's `play`/`step` behind the same door. Its single timer has
   never frozen, so this is for consistency, not repair.
4. Measure the cost of drawing a frame at phone size (each frame rebuilds the
   whole tracking picture). Make it faster only if the measurement says to.

The trace (`&trace=1`) stays as the diagnostic. It records and never repairs.

## 9. As built

- **The door** is `pbGo(act)` over the table `PB` in app.js: play, pause, next,
  clipDone, speed, step, hide and show. `play()`, `stop()` and `step()` are now
  one-line callers of it.
- **The clock** is `base + (now − from)` inside `trkStart`. The browser's frame
  time is never read, and both freeze guards (`TRK_SAME`, `TRK_STALL_MS`) are
  gone, along with `trkKick`, `TRK.hold`, `trkExtra` and `left()`.
- **The goal pause** arms its timer and its countdown from the same `ms`.
- **Drawing failures** count per goal, not "in a row". An unchanged frame isn't
  redrawn, so it can't throw, and it would have reset a run count.
- **Two defects found by the random-use test, both fixed:**
  - At the horn, the "What this game was" overlay stops the replay in the middle of
    the door's own redraw, and the door then armed a timer anyway: paused, with a
    driver. A driver now starts only while the replay still plays. The DOM golden
    had recorded that stray timer as a duplicate 271st frame of its play walk
    (identical to frame 270 in every element), and it was regenerated without it.
  - A scrubber `change` without an `input` ended the clip but left the replay
    playing with nothing driving it. `change` now pauses too, and any redraw that
    ends a playing clip carries the replay on from that frame.
- **The trace's STALL poller is removed.** It polled the state, so it was a
  watchdog. The trace now records actions, errors and broken rules (`RULE`)
  only.
- **The test harness:**
  - The page reads the harness clock (`performance` is injected).
  - Frames run immediately two levels deep and then wait in a queue the test
    delivers.
  - `advance` moves the clock by the wait it fires, or runs a clip's frames when
    no timer is pending.
  - `later(ms)` is a browser that stopped drawing; `hide()`/`show()` fire
    `visibilitychange`.
- **The tests** are `test/playback.test.js`, 18 of them. 14 fail against the code
  at `19524b2`, and the 4 that pass cover behaviour the old code already had
  right.

