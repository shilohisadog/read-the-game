import json
data = json.load(open('game_embed.json'))
TEMPLATE = r'''<div id="app">
  <header class="masthead">
    <p class="eyebrow">Learn to read hockey · shot attempts, live</p>
    <h1>Watch the number get made.</h1>
    <p class="lede">“Corsi” sounds like a scary stat. It’s just <strong>shot attempts</strong> — who’s shooting more. Scrub a real game and watch every attempt get counted in front of you. No black box: open <em>Show me the work</em> to see exactly what we counted — and what we didn’t.</p>
  </header>

  <section class="board" aria-label="scoreboard">
    <div class="team team--away">
      <span class="abbr" id="awayAbbr">MIN</span>
      <span class="score" id="awayScore">0</span>
    </div>
    <div class="mid">
      <div class="gamestate"><span id="perLabel">Pre-game</span><span class="dot">·</span><span id="clock" class="mono">00:00</span></div>
      <div class="control">
        <div class="control-bar"><span class="fill fill--away" id="fillAway"></span><span class="fill fill--home" id="fillHome"></span></div>
        <div class="control-legend"><span class="mono" id="ctrlAway">50%</span><span class="control-word">control</span><span class="mono" id="ctrlHome">50%</span></div>
      </div>
    </div>
    <div class="team team--home">
      <span class="abbr" id="homeAbbr">BUF</span>
      <span class="score" id="homeScore">0</span>
    </div>
  </section>

  <section class="rink-wrap" aria-label="rink replay">
    <svg id="rink" viewBox="0 0 200 85" preserveAspectRatio="xMidYMid meet" role="img" aria-label="hockey rink with shot attempts">
      <defs></defs>
      <g id="rinkLines"></g>
      <g id="events"></g>
    </svg>
    <div class="attempt-counter">
      <div class="ac ac--away"><span class="ac-team" id="acAwayName">MIN</span><span class="ac-num mono" id="acAway">0</span><span class="ac-lab">attempts</span></div>
      <div class="ac ac--home"><span class="ac-team" id="acHomeName">BUF</span><span class="ac-num mono" id="acHome">0</span><span class="ac-lab">attempts</span></div>
    </div>
  </section>

  <section class="transport">
    <button id="playBtn" class="btn btn--play" aria-label="Play from start">▶ Replay from start</button>
    <input id="scrub" class="scrub" type="range" min="0" max="1" value="0" step="1" aria-label="scrub through the game event by event" />
    <button id="workBtn" class="btn btn--ghost" aria-expanded="false" aria-controls="workPanel">Show me the work</button>
  </section>

  <div class="legend">
    <span class="key"><i class="swatch sw-att"></i>shot attempt (counts)</span>
    <span class="key"><i class="swatch sw-block"></i>blocked shot — counts for the <em>shooter</em></span>
    <span class="key"><i class="swatch sw-goal"></i>goal</span>
    <span class="key"><i class="swatch sw-excl"></i>hit / faceoff — not a shot attempt</span>
  </div>

  <section id="workPanel" class="work" hidden aria-live="polite"></section>

  <footer class="foot">
    <span id="gameLabel">—</span> · every number is computed in your browser from the raw NHL play-by-play — the count and the itemized list read the same data, so they can’t disagree.
  </footer>
</div>

<script>
const GAME = __DATA__;
const HOME = GAME.meta.home, AWAY = GAME.meta.away;
const EV = GAME.events;                       // loadGame() seam: v1 fills from bundle
function loadGame(){ return GAME; }            // v-later: swap for fetch/proxy, reducers untouched

const ATT = new Set(['goal','shot-on-goal','missed-shot','blocked-shot']);
// --- THE LENS: a deterministic reducer over events[0..i]. countedEvents split 3 ways. ---
function corsiTeam(e){
  if(!ATT.has(e.type)) return null;
  return e.type==='blocked-shot' ? (HOME.id + AWAY.id - e.owner) : e.owner;  // flip blocks to shooter
}
function lens(events){
  const tally={}; tally[HOME.id]=0; tally[AWAY.id]=0;
  const counted=[], surprising=[], excluded={};
  let hs=0, as=0;
  for(const e of events){
    if(e.type==='goal'){ (e.owner===HOME.id? hs++ : as++); }
    const ct=corsiTeam(e);
    if(ct==null){ excluded[e.type]=(excluded[e.type]||0)+1; continue; }
    tally[ct]++;
    (e.type==='blocked-shot'? surprising : counted).push(e);
  }
  return {tally, counted, surprising, excluded, hs, as};
}

// --- RINK MARKINGS (NHL coords x[-100,100] y[-42.5,42.5] -> svg x+100, 42.5 - y) ---
const SX = x => x+100, SY = y => 42.5 - y;
function drawRink(){
  const P=[];
  P.push(`<rect class="boards" x="1" y="1" width="198" height="83" rx="27" ry="27"/>`);
  // goal lines
  for(const gx of [-89,89]) P.push(`<line class="ln red" x1="${SX(gx)}" y1="3" x2="${SX(gx)}" y2="82"/>`);
  // blue lines
  for(const bx of [-25,25]) P.push(`<line class="ln blue" x1="${SX(bx)}" y1="1" x2="${SX(bx)}" y2="84"/>`);
  // center red line
  P.push(`<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/>`);
  // center circle + dot
  P.push(`<circle class="ln blue" cx="100" cy="42.5" r="15" fill="none"/>`);
  P.push(`<circle class="dot blue" cx="100" cy="42.5" r="1.1"/>`);
  // zone faceoff circles + dots
  for(const zx of [-69,69]) for(const zy of [-22,22]){
    P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15" fill="none"/>`);
    P.push(`<circle class="dot red" cx="${SX(zx)}" cy="${SY(zy)}" r="1"/>`);
  }
  // neutral-zone dots
  for(const nx of [-20,20]) for(const ny of [-22,22]) P.push(`<circle class="dot red" cx="${SX(nx)}" cy="${SY(ny)}" r="0.9"/>`);
  // nets
  for(const gx of [-89,89]){ const d = gx<0?1:-1; P.push(`<rect class="net" x="${SX(gx)+ (d<0?-0:-3.2)}" y="40.3" width="3.2" height="4.4"/>`);}
  document.getElementById('rinkLines').innerHTML = P.join('');
}

// --- RENDER ---
const $ = id => document.getElementById(id);
let prevTally = {};
function markClass(e){
  if(e.type==='goal') return 'ev goal';
  if(e.type==='blocked-shot') return 'ev block';
  if(ATT.has(e.type)) return 'ev att';
  return 'ev excl';
}
function teamKey(e){ const ct=corsiTeam(e); if(ct===AWAY.id) return 'away'; if(ct===HOME.id) return 'home'; return 'none'; }
function render(i){
  const slice = EV.slice(0, i+1);
  const L = lens(slice);
  const cur = EV[i] || null;
  // events layer
  const parts=[];
  for(let k=0;k<slice.length;k++){
    const e=slice[k];
    if(e.x==null||e.y==null) continue;
    const r = e.type==='goal'?2.6 : ATT.has(e.type)?1.8 : 1.0;
    const isNew = (k===i);
    parts.push(`<circle class="${markClass(e)} t-${teamKey(e)}${isNew?' now':''}" cx="${SX(e.x).toFixed(1)}" cy="${SY(e.y).toFixed(1)}" r="${r}"><title>${e.clock} ${e.type}</title></circle>`);
  }
  $('events').innerHTML = parts.join('');
  // scoreboard
  $('awayScore').textContent = L.as; $('homeScore').textContent = L.hs;
  const a=L.tally[AWAY.id], h=L.tally[HOME.id], tot=a+h||1;
  const pa=Math.round(100*a/tot), ph=100-pa;
  $('fillAway').style.width=pa+'%'; $('fillHome').style.width=ph+'%';
  $('ctrlAway').textContent=pa+'%'; $('ctrlHome').textContent=ph+'%';
  $('acAway').textContent=a; $('acHome').textContent=h;
  // tick flash
  if(prevTally[AWAY.id]!==undefined){
    if(a>prevTally[AWAY.id]) flash('acAway'); if(h>prevTally[HOME.id]) flash('acHome');
  }
  prevTally={[AWAY.id]:a,[HOME.id]:h};
  // clock/period
  if(cur){ $('perLabel').textContent = 'Period '+cur.per; $('clock').textContent = cur.clock; }
  else { $('perLabel').textContent='Pre-game'; $('clock').textContent='00:00'; }
  if(workOpen) renderWork(L, cur);
}
let flashTimers={};
function flash(id){ const el=$(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

// --- SHOW ME THE WORK (same reducer output, itemized) ---
let workOpen=false;
function renderWork(L, cur){
  const a=L.tally[AWAY.id], h=L.tally[HOME.id], tot=a+h||1;
  const pa=Math.round(100*a/tot), ph=100-pa;
  const upto = cur ? ('through Period '+cur.per+' '+cur.clock) : 'at puck drop';
  const exOrder=['hit','faceoff','giveaway','takeaway','penalty'];
  const exLabels={hit:'hits',faceoff:'faceoffs',giveaway:'giveaways',takeaway:'takeaways',penalty:'penalties'};
  const exWhy={hit:'a big hit feels like control, but it isn’t a shot attempt',faceoff:'winning a draw isn’t a shot',giveaway:'a turnover isn’t a shot attempt',takeaway:'a steal isn’t a shot attempt',penalty:'not a shot attempt'};
  let exRows = exOrder.filter(t=>L.excluded[t]).map(t=>`<tr><td class="mono">${L.excluded[t]}×</td><td>${exLabels[t]}</td><td class="muted">${exWhy[t]}</td></tr>`).join('');
  const surp = L.surprising.slice(-4).reverse().map(e=>{
    const tm = corsiTeam(e)===AWAY.id?AWAY.abbrev:HOME.abbrev;
    return `<li>P${e.per} ${e.clock} — blocked shot, credited to <strong>${tm}</strong> (the shooter)</li>`;
  }).join('');
  $('workPanel').innerHTML = `
    <h2>How “control” is computed <span class="muted">(${upto})</span></h2>
    <p class="work-head"><span class="mono big">${a}</span> ${AWAY.abbrev} attempts &nbsp;·&nbsp; <span class="mono big">${h}</span> ${HOME.abbrev} attempts &nbsp;→&nbsp; <strong>${pa}% / ${ph}%</strong></p>
    <div class="work-grid">
      <div class="wcard">
        <h3>Counted <span class="mono">${L.counted.length}</span></h3>
        <p>Goals, shots on goal, and missed shots — every attempt, credited to the shooting team.</p>
      </div>
      <div class="wcard wcard--flag">
        <h3>Counted, but counterintuitively <span class="mono">${L.surprising.length}</span></h3>
        <p>A <strong>blocked shot still counts</strong> as an attempt — credited to the <strong>shooter</strong>, not the blocker. The NHL feed credits the blocker; we flip it back. Naïvely trusting the feed gets this backwards.</p>
        ${surp?`<ul class="surp">${surp}</ul>`:''}
      </div>
      <div class="wcard">
        <h3>Not counted <span class="muted">(and why)</span></h3>
        <table class="extab">${exRows||'<tr><td class="muted">—</td></tr>'}</table>
      </div>
    </div>
    <p class="work-foot">Every figure above is computed live, in your browser, from the raw play-by-play — the count and this list come from the <em>same</em> pass over the events, so they cannot drift apart.</p>`;
}

// --- WIRING ---
let i=EV.length-1, playing=false, timer=null;
function setI(v){ i=Math.max(0,Math.min(EV.length-1, v)); $('scrub').value=i; render(i); }
function play(){
  if(i>=EV.length-1){ setI(0); }
  playing=true; $('playBtn').textContent='⏸ Pause';
  clearInterval(timer);
  timer=setInterval(()=>{ if(i>=EV.length-1){ stop(); return; } setI(i+1); }, 230);
}
function stop(){ playing=false; $('playBtn').textContent = i>=EV.length-1?'▶ Replay from start':'▶ Play'; clearInterval(timer); }
$('playBtn').addEventListener('click', ()=> playing?stop():play());
$('scrub').addEventListener('input', e=>{ stop(); setI(+e.target.value); });
$('workBtn').addEventListener('click', ()=>{
  workOpen=!workOpen; $('workPanel').hidden=!workOpen; $('workBtn').setAttribute('aria-expanded',workOpen);
  $('workBtn').textContent = workOpen?'Hide the work':'Show me the work';
  if(workOpen) render(i);
});

// init
$('awayAbbr').textContent=$('acAwayName').textContent=AWAY.abbrev;
$('homeAbbr').textContent=$('acHomeName').textContent=HOME.abbrev;
$('gameLabel').textContent = `${AWAY.abbrev} at ${HOME.abbrev} · ${GAME.meta.date}`;
$('scrub').max = EV.length-1;
drawRink();
setI(EV.length-1);   // open on the finished picture; one click replays the build
</script>
'''
html = TEMPLATE.replace('__DATA__', json.dumps(data, separators=(',',':')))
open('read-the-game.html','w').write(html)
print("wrote read-the-game.html", len(html), "bytes")
