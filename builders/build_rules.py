#!/usr/bin/env python3
"""Why the whistle — every stoppage in the game, and the rule behind it.

The play-by-play feed records WHY play stopped: icing, offside, hand-pass,
high-stick, puck out of play, and the full penalty list with who committed it
and who drew it. That is exactly the material a new fan is missing, because
the broadcast assumes you already know these rules.

The honest limit, stated on screen: a stoppage play carries a `reason` and
NOTHING else -- no coordinates, no players, no zone. So we can say what was
called and when, never who did it or where it happened. What we CAN show is
the consequence: the next faceoff is a real event with real coordinates, and
for icing that faceoff location is the whole punishment.

Anything we work out from a rule rather than read from the feed is marked
"derived" on screen, with the derivation shown.

  python3 builders/build_rules.py   ->  src/why-the-whistle.html
"""
import json, pathlib, re, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
pbp = json.loads((ROOT / "data" / "pbp_2023020204.json").read_text())
rich = json.loads((ROOT / "data" / "rich.json").read_text())

ROSTER = {int(k): v for k, v in rich["roster"].items()}
HOME, AWAY = rich["teams"]["home"], rich["teams"]["away"]          # BUF, MIN
AB = {HOME["id"]: HOME["ab"], AWAY["id"]: AWAY["ab"]}

def secs(period, clock):
    mm, ss = clock.split(":")
    return (period - 1) * 1200 + int(mm) * 60 + int(ss)

def norm(x, y, side):
    """Teams switch ends each period. Normalize so HOME (BUF) always defends -x."""
    return (-x, -y) if side == "right" else (x, y)

def name(pid):
    p = ROSTER.get(pid)
    return p["nm"] if p else None

plays = pbp["plays"]

# ---- pair each whistle with the faceoff that restarted play -----------------
whistles = []
for i, p in enumerate(plays):
    kind = p["typeDescKey"]
    if kind not in ("stoppage", "penalty", "delayed-penalty"):
        continue
    d = p.get("details", {}) or {}
    per = p["periodDescriptor"]["number"]
    side = p.get("homeTeamDefendingSide")

    nxt = next((q for q in plays[i + 1:] if q["typeDescKey"] == "faceoff"), None)
    fo = None
    if nxt:
        fd = nxt["details"]
        fx, fy = norm(fd["xCoord"], fd["yCoord"], nxt.get("homeTeamDefendingSide"))
        w = fd.get("winningPlayerId")
        fo = {
            "x": fx, "y": fy,
            "end": ("home" if fx < -25 else "away" if fx > 25 else "neutral"),
            "win": name(w),
            "winTeam": AB.get(fd.get("eventOwnerTeamId")),
            "clock": nxt["timeInPeriod"], "per": nxt["periodDescriptor"]["number"],
        }

    rec = {
        "per": per, "clock": p["timeInPeriod"], "s": secs(per, p["timeInPeriod"]),
        "kind": "penalty" if kind != "stoppage" else "stoppage",
        "delayed": kind == "delayed-penalty",
        "key": d.get("reason") or d.get("descKey"),
        "second": d.get("secondaryReason"),
        "fo": fo,
    }
    if kind != "stoppage":
        px, py = (norm(d["xCoord"], d["yCoord"], side)
                  if d.get("xCoord") is not None else (None, None))
        rec.update({
            "team": AB.get(d.get("eventOwnerTeamId")),
            "dur": d.get("duration"),
            "by": name(d.get("committedByPlayerId")),
            "drew": name(d.get("drawnByPlayerId")),
            "x": px, "y": py,
        })
    whistles.append(rec)

whistles.sort(key=lambda w: w["s"])

# ---- the teaching copy ------------------------------------------------------
# Every entry: what the call means, in the words you'd use to a friend who has
# never watched a game. `why` is the part a novice actually can't infer.
RULES = {
 "icing": {
   "t": "Icing",
   "what": "A team shot the puck from behind the centre line all the way past the "
           "far goal line, and nobody touched it on the way.",
   "why": "Play stops and the faceoff comes <b>all the way back to the offending team's own end</b> "
          "— and they're not allowed to change their tired players first. That's the entire point of "
          "the rule: it takes away the cheap escape of flinging the puck down the ice to relieve pressure. "
          "Watch where the next faceoff dot lands below — that's the punishment, made visible."},
 "offside": {
   "t": "Offside",
   "what": "An attacking player crossed the blue line into the attacking zone before the puck did.",
   "why": "The puck has to enter the zone first — you can't station a player in front of the net "
          "waiting for a long pass. Play stops and the faceoff goes back <b>outside</b> the zone, "
          "so the attack has to be built again from scratch."},
 "hand-pass": {
   "t": "Hand pass",
   "what": "A player batted the puck to a teammate with their hand.",
   "why": "You're allowed to knock a puck out of the air with your hand — you're not allowed to "
          "<b>pass</b> with it. The one exception is inside your own defensive zone, where a hand pass "
          "is legal. Anywhere else, the whistle goes."},
 "high-stick": {
   "t": "High stick (puck)",
   "what": "The puck was played with a stick carried above shoulder height.",
   "why": "This is a <b>stoppage, not a penalty</b> — nobody got hurt, the stick just came up too high "
          "on the puck. Don't confuse it with <em>high-sticking</em>, which is when the stick hits an "
          "opponent and does earn a trip to the box. This game has both, which makes it a good place "
          "to learn the difference."},
 "goalie-stopped-after-sog": {
   "t": "Goalie froze the puck",
   "what": "The goalie caught or covered the puck after a shot.",
   "why": "The most common whistle in hockey, and usually deliberate: a goalie who covers up gets their "
          "team a breather and a fresh faceoff. It's also the reason the shot count and the stoppage "
          "count move together — this game's 13 of these all followed a shot on goal."},
 "puck-frozen": {
   "t": "Puck frozen",
   "what": "Players tied the puck up against the boards or in a pile, and nobody could dig it out.",
   "why": "When the puck genuinely can't be played, the officials blow it dead rather than let bodies "
          "keep piling in. Common along the wall in the corners."},
 "puck-in-netting": {
   "t": "Puck in the netting",
   "what": "The puck was shot or cleared over the glass and landed in the protective netting above it.",
   "why": "Play stops so the puck can be replaced. Usually harmless — but if a <b>defending</b> player "
          "shoots it straight out of play from their own zone, that's a delay-of-game penalty instead."},
 "puck-in-benches": {
   "t": "Puck in the benches",
   "what": "The puck went into a team's bench.",
   "why": "Out of play, so the whistle goes. No penalty — this one's just physics."},
 "puck-in-crowd": {
   "t": "Puck in the crowd",
   "what": "The puck left the rink entirely and went into the stands.",
   "why": "Someone in section 118 got a souvenir. Play stops and restarts with a faceoff."},
 "referee-or-linesman": {
   "t": "Officials stopped play",
   "what": "An official stopped play, or the puck struck an official.",
   "why": "Officials are part of the rink — the puck stays live if it hits one, unless play is affected. "
          "When it is, the whistle goes and nobody is charged with anything."},
}

PENALTIES = {
 "tripping": ("Tripping", "Using a stick, knee, foot, arm or hand to make an opponent fall."),
 "holding": ("Holding", "Grabbing an opponent — or their stick — to slow them down."),
 "cross-checking": ("Cross-checking", "Hitting an opponent with the shaft of the stick, both hands on "
                    "it and no part of it on the ice."),
 "kneeing": ("Kneeing", "Sticking a knee out into an opponent."),
 "interference": ("Interference", "Hitting or blocking an opponent who <b>doesn't have the puck</b>. "
                  "A hard one for new fans: the same hit is perfectly legal a second earlier."),
 "high-sticking-double-minor": ("High-sticking (double minor)",
                  "The stick came up and hit an opponent in the face. It's normally two minutes — "
                  "it doubles to <b>four</b> when there's an injury, which is what the 4:00 here means."),
}

PENALTY_NOTE = (
 "A penalty means the offending player sits in the box and their team plays a player short — "
 "a <b>power play</b> for the other side. Two minutes for a minor, and it ends early if the "
 "team on the power play scores.")

DELAYED_NOTE = (
 "<b>Delayed penalty.</b> The referee has seen an infraction but won't blow the whistle while the "
 "<em>other</em> team has the puck — stopping play would hand the offenders a rest. So the arm goes up "
 "and play continues until the offending team touches the puck. The team about to get the power play "
 "almost always pulls their goalie for a sixth attacker: free offence with no risk at all, because the "
 "instant the other team touches it, the whistle goes. If you've ever wondered why a goalie sprints to "
 "the bench mid-play with nothing obviously wrong — this is why.")

SECOND = {
 "tv-timeout": "Also a TV timeout — the league takes commercial breaks at the first stoppage after "
               "the 14, 10 and 6 minute marks of each period.",
 "video-review": "Also a video review — the play was checked upstairs before the restart.",
 "visitor-timeout": "The visiting coach also used their one 30-second timeout here.",
}

# Kevin asked about too-many-men specifically. It has a descKey in the feed, it
# just didn't happen in this game. Say so rather than quietly omitting it.
NOT_HERE = [
 ("Too many men on the ice",
  "A bench minor: for a moment there were seven skaters out instead of six, usually a botched line "
  "change where the new player touched the puck before the old one reached the bench. Any player may "
  "serve the two minutes. <b>The feed does record this</b> (as a penalty like any other) — it simply "
  "didn't happen in this game."),
 ("Delay of game",
  "Most often a defending player shooting the puck directly over the glass from their own zone. "
  "Also recorded by the feed; not called here."),
 ("Fighting",
  "Five minutes each, and both players go. Recorded by the feed; no fights in this game."),
]

# ---- assemble the payload ---------------------------------------------------
items = []
for w in whistles:
    if w["kind"] == "penalty":
        t, what = PENALTIES.get(w["key"], (w["key"] or "Penalty", ""))
        item = {**w, "title": t, "what": what, "why": PENALTY_NOTE,
                "cat": "penalty", "delayedNote": DELAYED_NOTE if w["delayed"] else None}
        if w["delayed"]:
            item["title"] = "Delayed penalty"
            item["what"] = "The referee signalled a penalty, but play carried on."
            item["why"] = DELAYED_NOTE
    else:
        r = RULES.get(w["key"])
        if not r:
            continue
        cat = ("icing" if w["key"] == "icing" else
               "offside" if w["key"] in ("offside", "hand-pass", "high-stick") else "puck")
        item = {**w, "title": r["t"], "what": r["what"], "why": r["why"], "cat": cat}
    item["secondNote"] = SECOND.get(w["second"]) if w["second"] else None
    items.append(item)

payload = {"items": items, "notHere": NOT_HERE,
           "home": HOME["ab"], "away": AWAY["ab"],
           "counts": {"stoppages": sum(1 for w in whistles if w["kind"] == "stoppage"),
                      "penalties": sum(1 for w in whistles if w["kind"] == "penalty" and not w["delayed"]),
                      "plays": len(plays)}}

TEMPLATE = r"""<title>Read the Game — why the whistle</title>
<style>
body{background:#05090e;margin:0}
#wh{--ink:#e9f0f6;--muted:#8ba0ae;--line:#1c2c3a;--panel:#0a1520;--accent:#4aa3e0;
 --ice:#f3c249;--pen:#ff4d5e;--derived:#b98cf0;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 background:radial-gradient(120% 90% at 50% 0%,#0d1a26,#05090e 65%);color:var(--ink);
 min-height:100vh;padding:clamp(16px,3.5vw,32px) clamp(12px,4vw,20px)}
#wh .wrap{max-width:860px;margin:0 auto}
#wh .eyebrow{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#wh h1{font-size:clamp(1.5rem,3.4vw,2.1rem);letter-spacing:-.02em;font-weight:800;margin:0 0 10px}
#wh .cap{font-size:.92rem;color:var(--muted);margin:0 0 6px;max-width:68ch;line-height:1.6}
#wh .cap b{color:var(--ink);font-weight:600}
#wh .limit{font-size:.83rem;color:var(--muted);line-height:1.6;max-width:68ch;
 border-left:2px solid var(--accent);padding:9px 0 9px 13px;margin:16px 0 18px;background:rgba(74,163,224,.05)}
#wh .limit b{color:var(--ink)}
#wh .tally{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px}
#wh .t{border:1px solid var(--line);border-radius:11px;padding:11px 15px;background:var(--panel);flex:1 1 130px}
#wh .t .n{font-family:ui-monospace,Menlo,monospace;font-size:1.5rem;font-weight:700;
 font-variant-numeric:tabular-nums;line-height:1.1}
#wh .t .l{font-size:.73rem;color:var(--muted);margin-top:3px}
#wh .chips{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px;align-items:center}
#wh .chips .cl{font-size:.78rem;color:var(--muted);font-weight:700;margin-right:2px}
#wh .chip{font:inherit;font-size:.8rem;font-weight:600;border-radius:20px;border:1px solid #24384a;
 background:#0e1b27;color:var(--muted);padding:7px 14px;cursor:pointer}
#wh .chip[aria-pressed="true"]{border-color:var(--accent);color:#fff;background:#12283a}
#wh .card{border:1px solid var(--line);border-radius:14px;background:var(--panel);
 padding:15px 17px;margin-bottom:11px;display:grid;grid-template-columns:1fr auto;gap:4px 16px}
#wh .card.pen{border-left:3px solid var(--pen)}
#wh .card.icing{border-left:3px solid var(--ice)}
#wh .hd{grid-column:1;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
#wh .clock{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;color:var(--muted);
 font-variant-numeric:tabular-nums;white-space:nowrap}
#wh .ttl{font-weight:800;font-size:1.04rem;letter-spacing:-.01em}
#wh .dur{font-family:ui-monospace,Menlo,monospace;font-size:.76rem;color:var(--pen);font-weight:700}
#wh .what{grid-column:1;font-size:.88rem;color:var(--ink);margin:5px 0 0;line-height:1.55}
#wh .why{grid-column:1;font-size:.84rem;color:var(--muted);margin:8px 0 0;line-height:1.6;max-width:64ch}
#wh .why b{color:var(--ink);font-weight:600}#wh .why em{font-style:italic}
#wh .who{grid-column:1;font-size:.82rem;color:var(--muted);margin:8px 0 0}
#wh .who b{color:var(--ink);font-weight:600}
#wh .note{grid-column:1;font-size:.79rem;color:var(--muted);margin:8px 0 0;padding-left:11px;
 border-left:2px solid #24384a;line-height:1.55}
#wh .rink{grid-column:2;grid-row:1/span 5;align-self:start;width:172px}
@media (max-width:640px){#wh .card{grid-template-columns:1fr}#wh .rink{grid-column:1;grid-row:auto;margin-top:10px}}
#wh .rink svg{display:block;width:100%;border:1px solid var(--line);border-radius:7px;background:#0b1a26}
#wh .rcap{font-size:.68rem;color:var(--muted);margin-top:5px;line-height:1.4;text-align:center}
#wh .derived{display:inline-block;font-size:.64rem;letter-spacing:.09em;text-transform:uppercase;
 font-weight:700;color:var(--derived);border:1px solid rgba(185,140,240,.4);border-radius:4px;
 padding:2px 6px;background:rgba(185,140,240,.09);vertical-align:1px}
#wh .drv{grid-column:1;font-size:.8rem;color:var(--muted);margin:9px 0 0;line-height:1.6;
 border:1px dashed rgba(185,140,240,.32);border-radius:9px;padding:9px 12px;background:rgba(185,140,240,.05)}
#wh .drv b{color:var(--ink);font-weight:600}
#wh .drv code{font-family:ui-monospace,Menlo,monospace;font-size:.94em;color:#cbb5ee}
#wh .sect{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);
 margin:32px 0 12px;padding-top:20px;border-top:1px solid var(--line)}
#wh .nh{border:1px solid var(--line);border-radius:12px;background:rgba(10,21,32,.55);
 padding:13px 16px;margin-bottom:9px}
#wh .nh h3{margin:0 0 5px;font-size:.94rem;font-weight:700}
#wh .nh p{margin:0;font-size:.83rem;color:var(--muted);line-height:1.6}
#wh .nh p b{color:var(--ink);font-weight:600}
#wh .foot{font-size:.79rem;color:var(--muted);margin-top:24px;max-width:68ch;line-height:1.65}
#wh .foot em{font-style:normal;color:var(--ink)}
#wh .empty{color:var(--muted);font-size:.87rem;padding:22px 2px}
</style>
<div id="wh"><div class="wrap">
<p class="eyebrow">Read the Game &middot; MIN @ BUF &middot; 2023-11-10</p>
<h1>Why the whistle</h1>
<p class="cap">Hockey stops constantly, and the broadcast almost never tells you why &mdash; it assumes
you already know. The feed <b>does</b> record the reason for every single stoppage. So here is every
whistle in this game, in order, with the rule behind it written out for someone who has never
had it explained.</p>

<div class="limit"><b>What we can and can't tell you.</b> A stoppage in this feed carries a
<b>reason and nothing else</b> &mdash; no coordinates, no players, no zone. So we can tell you
<b>what was called and when</b>, and never <b>who did it</b> or <b>where on the ice it happened</b>.
What we can show is the <b>consequence</b>: the faceoff that restarted play is a real event with real
coordinates, and for icing that location <em>is</em> the punishment. Anything worked out from a rule
rather than read from the feed is tagged <span class="derived">derived</span>, with the reasoning shown.</p></div>

<div class="tally" id="tally"></div>
<div class="chips" id="chips"><span class="cl">Show:</span></div>
<div id="list"></div>

<p class="sect">Rules this game didn't happen to show you</p>
<div id="nothere"></div>

<p class="foot"><em>Why it's honest:</em> every time, reason, penalty, player and faceoff coordinate on
this page is read straight from the NHL's public play-by-play feed &mdash; nothing is estimated and
nothing is filled in. Faceoff coordinates are normalised so Buffalo always defends the left end, because
teams switch ends each period. The rule explanations are ours, written for a newcomer; the calls are
the league's.</p>
</div></div>
<script>
const P=__PAYLOAD__;
const CATS=[['all','Everything'],['icing','Icing'],['offside','Offside &amp; puck rules'],
            ['puck','Puck out of play'],['penalty','Penalties']];
let cat='all';

const tally=document.getElementById('tally');
tally.innerHTML=[[P.counts.plays,'recorded plays'],[P.counts.stoppages,'stoppages'],
                 [P.counts.penalties,'penalties'],[P.items.filter(i=>i.key==='icing').length,'icings']]
 .map(([n,l])=>`<div class="t"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');

const chips=document.getElementById('chips');
CATS.forEach(([k,l])=>{const b=document.createElement('button');
 b.className='chip';b.textContent='';b.innerHTML=l;b.dataset.k=k;
 b.setAttribute('aria-pressed',k===cat);
 b.addEventListener('click',()=>{cat=k;
  chips.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c.dataset.k===cat));
  render();});
 chips.appendChild(b);});

const ORD=['1st','2nd','3rd','OT'];
function per(n){return ORD[n-1]||('P'+n);}

/* A faceoff dot on a normalised rink. BUF always defends the left end, so the
   side of the picture the dot lands on is which team's end play restarted in. */
function rink(fo){
 if(!fo)return '';
 const X=x=>x+100, Y=y=>42.5-y;
 const dots=[[-69,22],[-69,-22],[69,22],[69,-22],[-20,22],[-20,-22],[20,22],[20,-22]];
 return `<div class="rink"><svg viewBox="0 0 200 85" aria-label="where the faceoff was">
  <rect x="0" y="0" width="200" height="85" rx="14" fill="#0b1a26" stroke="#24455f" stroke-width="1"/>
  <line x1="100" y1="0" x2="100" y2="85" stroke="#c8102e" stroke-width="1.4" opacity=".55"/>
  <line x1="36" y1="0" x2="36" y2="85" stroke="#3f6bd6" stroke-width="1.4" opacity=".6"/>
  <line x1="164" y1="0" x2="164" y2="85" stroke="#3f6bd6" stroke-width="1.4" opacity=".6"/>
  <line x1="11" y1="0" x2="11" y2="85" stroke="#c8102e" stroke-width="1" opacity=".4"/>
  <line x1="189" y1="0" x2="189" y2="85" stroke="#c8102e" stroke-width="1" opacity=".4"/>
  <circle cx="100" cy="42.5" r="13" fill="none" stroke="#3f6bd6" stroke-width=".8" opacity=".45"/>
  ${dots.map(d=>`<circle cx="${X(d[0])}" cy="${Y(d[1])}" r="2.4" fill="#c8102e" opacity=".33"/>`).join('')}
  <circle cx="${X(fo.x)}" cy="${Y(fo.y)}" r="6.5" fill="none" stroke="#4aa3e0" stroke-width="1.6"/>
  <circle cx="${X(fo.x)}" cy="${Y(fo.y)}" r="3.1" fill="#4aa3e0"/>
  <text x="14" y="79" font-size="8" fill="#8ba0ae" font-family="system-ui">${P.home}</text>
  <text x="171" y="79" font-size="8" fill="#8ba0ae" font-family="system-ui">${P.away}</text>
 </svg><div class="rcap">restarted at <b style="color:#e9f0f6">(${fo.x}, ${fo.y})</b>${
  fo.win?` &middot; won by ${fo.win}`:''}</div></div>`;
}

/* Icing is the one call whose consequence the data shows outright: the draw
   comes back to the offending team's end. We don't get told who iced it, so we
   state the rule, show the real dot, and label the conclusion as derived. */
function derivedIcing(it){
 if(it.key!=='icing'||!it.fo)return '';
 const end=it.fo.end==='home'?P.home:it.fo.end==='away'?P.away:null;
 if(!end)return '';
 return `<div class="drv"><span class="derived">derived</span>
  The rule sends the faceoff back to the team that iced it, and this draw came back to the
  <b>${end}</b> end &mdash; normalised x of <code>${it.fo.x}</code>, which is an end-zone dot.
  So <b>${end} iced it</b>. That conclusion is the rule applied to a real coordinate; the feed
  itself never names the offending team.</div>`;
}

function card(it){
 const cls='card'+(it.cat==='penalty'?' pen':it.key==='icing'?' icing':'');
 const who=it.cat==='penalty'&&it.by
   ? `<p class="who"><b>${it.by}</b> (${it.team})${it.drew?` &mdash; drawn by <b>${it.drew}</b>`:''}</p>`
   : '';
 return `<div class="${cls}">
  <div class="hd"><span class="clock">${per(it.per)} &middot; ${it.clock}</span>
   <span class="ttl">${it.title}</span>
   ${it.dur?`<span class="dur">${it.dur}:00</span>`:''}</div>
  <p class="what">${it.what}</p>
  ${who}
  <p class="why">${it.why}</p>
  ${derivedIcing(it)}
  ${it.secondNote?`<p class="note">${it.secondNote}</p>`:''}
  ${rink(it.fo)}
 </div>`;
}

function render(){
 const rows=P.items.filter(i=>cat==='all'||i.cat===cat);
 document.getElementById('list').innerHTML=rows.length
   ? rows.map(card).join('')
   : '<p class="empty">Nothing in this game matched that filter.</p>';
}
render();

document.getElementById('nothere').innerHTML=P.notHere
 .map(([t,b])=>`<div class="nh"><h3>${t}</h3><p>${b}</p></div>`).join('');
</script>
"""

html = TEMPLATE.replace("__PAYLOAD__", json.dumps(payload, separators=(",", ":")))
out = ROOT / "src" / "why-the-whistle.html"
out.write_text(html)

script = re.search(r"<script>(.*)</script>", html, re.S).group(1)
chk = pathlib.Path(tempfile.gettempdir()) / "rtg.rules.check.js"
chk.write_text(script)
print(f"wrote {out} {len(html)} bytes; {len(items)} explained whistles "
      f"({payload['counts']['stoppages']} stoppages, {payload['counts']['penalties']} penalties)")
