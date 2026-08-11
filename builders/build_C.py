import json
import pathlib as _pl
import sys, pathlib as _pl
sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import page as _page
_ROOT = _pl.Path(__file__).resolve().parent.parent
_D = lambda n: str(_ROOT / 'data' / n)
_S = lambda n: str(_ROOT / 'src' / n)

G=json.load(open(_D('rich.json')))
sub={'roster':G['roster'],'teams':G['teams'],'gshots':G['gshots'],'goalies':G['goalies']}
T=r'''<style>
#pc{--ink:#0f1a23;--muted:#5d6f7c;--edge:#cdd9e1;--ice:#eef4f8;--min:#12885a;--buf:#c79212;--save:#4a6b86;--goal:#d92b3f;--hd:#f4d06a;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#f4f7fa;min-height:100vh;padding:clamp(16px,3.5vw,34px) clamp(12px,4vw,22px);line-height:1.5}
#pc .wrap{max-width:940px;margin:0 auto}
#pc .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#pc h1{font-size:clamp(1.5rem,3.4vw,2rem);letter-spacing:-.02em;font-weight:800;margin:0 0 8px}
#pc .cap{font-size:.92rem;color:var(--muted);margin:0 0 16px;max-width:66ch}#pc .cap b{color:var(--ink);font-weight:600}
#pc .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){#pc .grid{grid-template-columns:1fr}}
#pc .card{background:#fff;border:1px solid var(--edge);border-radius:14px;overflow:hidden;box-shadow:0 6px 22px rgba(16,32,45,.07)}
#pc .ghead{padding:12px 16px;color:#fff;display:flex;align-items:baseline;justify-content:space-between}
#pc .ghead.min{background:var(--min)}#pc .ghead.buf{background:var(--buf)}
#pc .ghead .nm{font-size:1.15rem;font-weight:800}#pc .ghead .tm{font-size:.72rem;letter-spacing:.1em;opacity:.85;text-transform:uppercase}
#pc .ghead .svp{font-family:ui-monospace,Menlo,monospace;font-size:1.6rem;font-weight:700}
#pc .netbox{background:var(--ice);padding:8px}#pc svg{display:block;width:100%;height:auto}
#pc .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#pc .gl{stroke:var(--goal);stroke-width:1;opacity:.6}#pc .bl{stroke:#3a5a9c;stroke-width:.9;opacity:.4}
#pc .hd{fill:var(--hd);opacity:.32}#pc .crease{fill:#9fc2e6;opacity:.5}
#pc .save{fill:var(--save);opacity:.72}#pc .goal{fill:var(--goal)}
#pc .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--edge)}
#pc .stat{background:#fff;padding:10px 8px;text-align:center}
#pc .stat .v{font-family:ui-monospace,Menlo,monospace;font-size:1.3rem;font-weight:700}
#pc .stat .l{font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:2px}
#pc .legend{display:flex;gap:16px;flex-wrap:wrap;font-size:.8rem;color:var(--muted);margin:14px 2px 0}
#pc .legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
#pc .legend .hdsw{width:14px;height:10px;border-radius:2px;background:var(--hd)}
#pc .foot{font-size:.78rem;color:var(--muted);margin-top:14px;max-width:66ch}#pc .foot em{font-style:normal;color:var(--ink)}
#pc .lede{background:#fff;border:1px solid var(--edge);border-left:3px solid var(--buf);border-radius:8px;padding:12px 15px;margin:0 0 16px;font-size:.95rem}
#pc .lede b{color:var(--ink)}
</style>
<div id="pc"><div class="wrap">
<p class="eyebrow">Prototype C · goalies — real shots, real outcomes</p>
<h1>The goalie view: who actually stole the game</h1>
<p class="cap">Every dot is a <b>real shot on goal</b> at its <b>real coordinate</b> — <b class="k">saved</b> or a <b>goal</b>. No model, no estimate: just where each shot came from and what happened. The shaded slot is a <b>high-danger</b> zone we define geometrically (shown below), so you can see it, not trust it.</p>
<p class="lede">Minnesota outshot Buffalo <b>35–25</b> and lost <b>2–3</b>. This is why: <b>Ukko-Pekka Levi stopped 33 of 35 (.943)</b> — he stole a game his team was outplayed in. The scoreboard says Buffalo was better; the goalie view says Buffalo's <em>goalie</em> was.</p>
<div class="grid" id="grid"></div>
<div class="legend"><span><i class="save"></i>save</span><span><i class="goal"></i>goal</span><span><i class="hdsw"></i>high-danger slot (dist ≤ 33 ft &amp; within the faceoff dots)</span></div>
<p class="foot"><em>What it teaches:</em> shots aren't equal, and a hot goalie can flip a game the run-of-play "should" have decided — the single most important thing a novice can learn about why the score and the play often disagree. <em>Every number is real counts;</em> "high-danger" is a transparent geometric rule, not a black box.</p>
</div></div>
<script>
const G=__DATA__,R=G.roster;
const SXn=x=>11+Math.abs(x), SY=y=>42.5-y;  // canonical: net at right (~x100)
function dist(x,y){return Math.sqrt((89-Math.abs(x))**2+y*y);}
function isHD(x,y){return dist(x,y)<=33 && Math.abs(y)<=22;}
function halfRink(){const P=[];
 P.push('<rect class="boards" x="1" y="1" width="98" height="83" rx="16"/>');
 // high-danger home plate (net at right ~x96)
 P.push('<polygon class="hd" points="63,20.5 96,38 96,47 63,64.5"/>');
 P.push('<rect class="crease" x="90" y="37" width="6" height="11" rx="1.5"/>');
 P.push('<line class="gl" x1="96" y1="30" x2="96" y2="55"/>');
 P.push('<line class="bl" x1="36" y1="1" x2="36" y2="84"/>');
 return P.join('');}
function panel(gid){
 const g=R[gid], team=g.tid, ab=G.teams.home.id===team?'BUF':'MIN', cls=ab.toLowerCase();
 const shots=G.gshots.filter(s=>s.g===gid);
 let saves=0,goals=0,hdF=0,hdS=0;
 let dots=[];
 for(const s of shots){const hd=isHD(s.x,s.y);const cx=SXn(s.x),cy=SY(s.y);
   if(s.out==='goal'){goals++;if(hd)hdF++;dots.push(`<circle class="goal" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.4"/>`);}
   else{saves++;if(hd){hdF++;hdS++;}dots.push(`<circle class="save" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.7"/>`);}
 }
 const sog=saves+goals, svp=(saves/sog).toFixed(3).replace(/^0/,'');
 const hdsv=hdF?((hdF-(hdF-hdS))/hdF):0; // hdS/hdF
 const hdpct=hdF?(hdS/hdF).toFixed(3).replace(/^0/,''):'—';
 return `<div class="card">
   <div class="ghead ${cls}"><div><div class="nm">${g.nm}</div><div class="tm">${ab} · #${g.n}</div></div><div class="svp">${svp}</div></div>
   <div class="netbox"><svg viewBox="0 0 100 85">${halfRink()}${dots.join('')}</svg></div>
   <div class="stats">
     <div class="stat"><div class="v">${sog}</div><div class="l">shots faced</div></div>
     <div class="stat"><div class="v">${saves}</div><div class="l">saves</div></div>
     <div class="stat"><div class="v" style="color:var(--goal)">${goals}</div><div class="l">goals</div></div>
     <div class="stat"><div class="v">${hdF}</div><div class="l">high-danger</div></div>
     <div class="stat"><div class="v">${hdS}</div><div class="l">HD saves</div></div>
     <div class="stat"><div class="v">${hdpct}</div><div class="l">HD save%</div></div>
   </div></div>`;
}
document.getElementById('grid').innerHTML=G.goalies.map(panel).join('');
</script>'''
open(_S('goalie-view.html'),'w').write(_page.document(T.replace('__DATA__',json.dumps(sub,separators=(',',':'))), title='The goalie view — Read the Game', description='Minnesota outshot Buffalo and lost. The save-by-save reason why.'))
print("wrote goalie-view.html",len(open(_S('goalie-view.html')).read().encode()),"bytes")
