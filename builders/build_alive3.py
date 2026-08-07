import json
G=json.load(open('rich.json'))
WHY_CSS=r'''
#rg .ev.clickable{cursor:pointer}
#rg .hint{font-size:.76rem;color:var(--hd);margin:2px 2px 0;font-weight:600}
#rg .whybk{position:fixed;inset:0;background:rgba(10,18,26,.55);display:none;align-items:center;justify-content:center;z-index:60;padding:16px}
#rg .whybk.on{display:flex}
#rg .why{background:#fff;border-radius:15px;max-width:430px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden;max-height:92vh;overflow-y:auto}
#rg .whyhd{padding:15px 18px;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px}
#rg .whyhd .t{font-weight:800;font-size:1.08rem}#rg .whyhd .s{font-size:.75rem;opacity:.9;font-family:ui-monospace,Menlo,monospace}
#rg .whyclose{background:rgba(255,255,255,.22);border:0;color:#fff;border-radius:7px;padding:6px 10px;cursor:pointer;font-weight:700;line-height:1}
#rg .whybody{padding:16px 18px}
#rg .whydiag{background:var(--ice);border:1px solid var(--edge);border-radius:10px;padding:8px;margin-bottom:14px}
#rg .whydiag svg{width:100%;height:auto;display:block}
#rg .factor{display:flex;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid var(--edge)}
#rg .factor .fv{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:1.1rem;min-width:52px}
#rg .factor .fl{font-size:.86rem;color:var(--muted)}#rg .factor .fl b{color:var(--ink)}
#rg .chk{color:var(--min);font-weight:800}
#rg .whyrule{background:#f2f7fa;border:1px solid var(--edge);border-radius:9px;padding:12px 13px;font-size:.83rem;margin-top:13px;line-height:1.5}
#rg .whyrule b{color:var(--ink)}
'''
WHY_JS=r'''
const HX=x=>11+Math.abs(x), HY=y=>42.5-y;
let lastHD=null;
function showWhy(idx){const e=EV[idx];if(e.x==null)return;
 const dLine=89-Math.abs(e.x), dist=Math.hypot(dLine,e.y), angle=Math.atan2(Math.abs(e.y),dLine)*180/Math.PI;
 const inSlot=Math.abs(e.y)<=22, tid=e.own, ab=tid===AID?AAB:HAB, col=tid===AID?'var(--min)':'var(--buf)', p=R[e.actor];
 const isGoal=e.type==='goal';
 const diag=`<svg viewBox="0 0 100 85">
   <rect x="1" y="1" width="98" height="83" rx="14" fill="#fff" stroke="var(--edge)"/>
   <polygon points="63,20.5 96,38 96,47 63,64.5" fill="var(--hd)" opacity=".3"/>
   <text x="70" y="43" font-size="3.4" fill="#b07d17" text-anchor="middle">slot</text>
   <rect x="90" y="37" width="6" height="11" rx="1.5" fill="${col}" opacity=".55"/>
   <line x1="96" y1="29" x2="96" y2="56" stroke="var(--red)" stroke-width="1" opacity=".7"/>
   <line x1="36" y1="1" x2="36" y2="84" stroke="var(--blue)" stroke-width=".8" opacity=".35"/>
   <line x1="${HX(e.x).toFixed(1)}" y1="${HY(e.y).toFixed(1)}" x2="95" y2="42.5" stroke="var(--ink)" stroke-dasharray="2 1.5" stroke-width=".7"/>
   <circle cx="${HX(e.x).toFixed(1)}" cy="${HY(e.y).toFixed(1)}" r="2.8" fill="${col}" stroke="#fff" stroke-width=".7"/>
   <text x="${Math.min(HX(e.x)+4,80).toFixed(1)}" y="${(HY(e.y)-2.5).toFixed(1)}" font-size="4.2" fill="var(--ink)" font-weight="700">${Math.round(dist)} ft</text></svg>`;
 $('whyContent').innerHTML=`
   <div class="whyhd" style="background:${col}"><div><div class="t">${isGoal?'🚨 A high-danger GOAL':'⚡ Why this was high-danger'}</div>
     <div class="s">${p?'#'+p.n+' '+p.nm:ab} · ${ab} · P${e.per} ${e.clock} · ${e.type.replace(/-/g,' ')}</div></div>
     <button class="whyclose" onclick="hideWhy()">✕</button></div>
   <div class="whybody">
     <div class="whydiag">${diag}</div>
     <div class="factor"><span class="fv">${Math.round(dist)} ft</span><span class="fl">Distance to the net — <b>close</b>. Our rule: ≤ 33 ft. <span class="chk">✓</span></span></div>
     <div class="factor"><span class="fv">${Math.round(angle)}°</span><span class="fl">Shooting angle off straight-on — ${angle<22?'<b>a clean look</b> at the net':'a slot-area angle'}. Lower = more net to shoot at.</span></div>
     <div class="factor" style="border-bottom:0"><span class="fv">${inSlot?'Slot':'Wide'}</span><span class="fl">Lateral position — ${inSlot?'<b>in the slot</b> (within the faceoff dots) <span class="chk">✓</span>':'outside the slot'}</span></div>
     <div class="whyrule"><b>The rule, and you can check it:</b> a shot is flagged <b>high-danger</b> when it's <b>≤ 33 ft from the net</b> AND <b>central</b> (within ±22 ft of the middle — the slot). Both are true here. This is a <b>transparent geometric rule</b> — a teaching stand-in for "dangerous," not a trained expected-goals model. Measure it yourself on the diagram above.</div>
   </div>`;
 $('whyBk').classList.add('on');
}
function hideWhy(){$('whyBk').classList.remove('on');}
'''
# base = alive2 template, patched
base=open('_alive2_template.txt').read() if False else None
