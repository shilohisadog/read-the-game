STYLE = r'''<style>
:root{
  --sans: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono: ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;
  --bg:#EFF4F8; --ice:#E4EDF3; --panel:#FBFDFE; --ink:#0F1A23; --muted:#596B78;
  --edge:#C7D5DF; --min:#1C6B4A; --buf:#9C6E15; --rink-red:#C8102E; --rink-blue:#37538F;
  --flag:#CF5A22; --shadow:0 1px 2px rgba(16,32,45,.06),0 6px 20px rgba(16,32,45,.07);
}
@media (prefers-color-scheme:dark){
  :root{ --bg:#08111A; --ice:#0F1E29; --panel:#101E29; --ink:#E9EFF4; --muted:#8CA0AE;
    --edge:#22364799; --min:#3BB981; --buf:#E7C05A; --rink-red:#E24A63; --rink-blue:#5E82C8;
    --flag:#F0894A; --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 28px rgba(0,0,0,.35);}
}
:root[data-theme="light"]{ --bg:#EFF4F8; --ice:#E4EDF3; --panel:#FBFDFE; --ink:#0F1A23; --muted:#596B78; --edge:#C7D5DF; --min:#1C6B4A; --buf:#9C6E15; --rink-red:#C8102E; --rink-blue:#37538F; --flag:#CF5A22; --shadow:0 1px 2px rgba(16,32,45,.06),0 6px 20px rgba(16,32,45,.07);}
:root[data-theme="dark"]{ --bg:#08111A; --ice:#0F1E29; --panel:#101E29; --ink:#E9EFF4; --muted:#8CA0AE; --edge:#22364799; --min:#3BB981; --buf:#E7C05A; --rink-red:#E24A63; --rink-blue:#5E82C8; --flag:#F0894A; --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 28px rgba(0,0,0,.35);}

*{box-sizing:border-box}
body{margin:0}
#app{ font-family:var(--sans); color:var(--ink); background:
   radial-gradient(120% 80% at 50% -10%, color-mix(in srgb,var(--rink-blue) 8%,var(--bg)) 0%, var(--bg) 60%);
   min-height:100vh; padding:clamp(18px,4vw,44px) clamp(14px,4vw,24px);
   line-height:1.5; -webkit-font-smoothing:antialiased;}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.01em}

.masthead{max-width:64ch;margin:0 auto 26px}
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;font-weight:600}
h1{font-size:clamp(1.9rem,4.4vw,2.75rem);line-height:1.04;letter-spacing:-.028em;font-weight:800;margin:0 0 14px;text-wrap:balance}
.lede{font-size:1.045rem;color:var(--muted);margin:0;max-width:60ch}
.lede strong{color:var(--ink);font-weight:650}
.lede em{font-style:normal;color:var(--ink);border-bottom:1.5px solid var(--flag);padding-bottom:1px}

.board,.rink-wrap,.transport,.work{max-width:900px;margin-left:auto;margin-right:auto}

.board{display:grid;grid-template-columns:1fr minmax(0,2.1fr) 1fr;align-items:center;gap:clamp(10px,3vw,26px);
  background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:16px clamp(14px,3vw,26px);box-shadow:var(--shadow);margin-bottom:14px}
.team{display:flex;flex-direction:column;align-items:center;gap:2px}
.abbr{font-weight:800;letter-spacing:.06em;font-size:.95rem}
.team--away .abbr{color:var(--min)} .team--home .abbr{color:var(--buf)}
.score{font-family:var(--mono);font-size:clamp(2rem,6vw,2.9rem);font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.mid{display:flex;flex-direction:column;gap:10px}
.gamestate{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--muted);font-size:.82rem;letter-spacing:.04em;text-transform:uppercase}
.gamestate .dot{opacity:.5}
.gamestate .mono{font-size:.92rem;letter-spacing:0;color:var(--ink)}
.control-bar{display:flex;height:9px;border-radius:99px;overflow:hidden;background:var(--edge)}
.fill{display:block;height:100%;transition:width .18s ease}
.fill--away{background:var(--min)} .fill--home{background:var(--buf)}
.control-legend{display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:.8rem}
.control-legend .mono{font-weight:600}
.control-word{font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}

.rink-wrap{position:relative;background:var(--ice);border:1px solid var(--edge);border-radius:16px;padding:10px;box-shadow:var(--shadow)}
#rink{display:block;width:100%;height:auto;border-radius:9px}
.boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
.ln{stroke-linecap:round;fill:none}
.ln.red{stroke:var(--rink-red);stroke-width:.7;opacity:.5}
.ln.blue{stroke:var(--rink-blue);stroke-width:.9;opacity:.5}
.ln.thick{stroke-width:1.1;opacity:.6}
.dot.red{fill:var(--rink-red);opacity:.55} .dot.blue{fill:var(--rink-blue);opacity:.55}
.net{fill:none;stroke:var(--muted);stroke-width:.5;opacity:.6}
.ev{transform-box:fill-box;transform-origin:center}
.ev.att{opacity:.85} .ev.att.t-away{fill:var(--min)} .ev.att.t-home{fill:var(--buf)}
.ev.block.t-away{fill:var(--min)} .ev.block.t-home{fill:var(--buf)}
.ev.block{stroke:var(--flag);stroke-width:.8;opacity:.95}
.ev.goal.t-away{fill:var(--min)} .ev.goal.t-home{fill:var(--buf)}
.ev.goal{stroke:var(--panel);stroke-width:.7}
.ev.excl{fill:var(--muted);opacity:.32}
.ev.now{animation:pop .34s ease-out}
@keyframes pop{0%{transform:scale(2.6)}100%{transform:scale(1)}}

.attempt-counter{position:absolute;top:16px;left:0;right:0;display:flex;justify-content:space-between;padding:0 clamp(14px,4vw,34px);pointer-events:none}
.ac{display:flex;flex-direction:column;align-items:center;line-height:1;gap:3px;background:color-mix(in srgb,var(--panel) 78%,transparent);border:1px solid var(--edge);border-radius:10px;padding:7px 12px;backdrop-filter:blur(3px)}
.ac-team{font-size:.68rem;font-weight:700;letter-spacing:.08em}
.ac--away .ac-team{color:var(--min)} .ac--home .ac-team{color:var(--buf)}
.ac-num{font-size:1.5rem;font-weight:700}
.ac-lab{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.bump{animation:bump .3s ease}
@keyframes bump{0%{transform:scale(1)}40%{transform:scale(1.32);color:var(--flag)}100%{transform:scale(1)}}

.transport{display:flex;align-items:center;gap:12px;margin:16px auto 6px}
.btn{font-family:var(--sans);font-size:.86rem;font-weight:600;border-radius:9px;border:1px solid var(--edge);
  background:var(--panel);color:var(--ink);padding:9px 15px;cursor:pointer;white-space:nowrap;transition:border-color .15s,background .15s}
.btn:hover{border-color:var(--muted)}
.btn--play{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.btn--play:hover{opacity:.9}
.btn--ghost{color:var(--muted)}
.scrub{flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;background:var(--edge);cursor:pointer;min-width:80px}
.scrub::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--panel);border:2px solid var(--ink);box-shadow:var(--shadow);cursor:pointer}
.scrub::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--panel);border:2px solid var(--ink);cursor:pointer}
:focus-visible{outline:2.5px solid var(--flag);outline-offset:2px}

.legend{max-width:900px;margin:2px auto 0;display:flex;flex-wrap:wrap;gap:8px 20px;font-size:.8rem;color:var(--muted);padding:6px 2px}
.key{display:inline-flex;align-items:center;gap:7px}
.key em{font-style:normal;color:var(--ink)}
.swatch{width:11px;height:11px;border-radius:50%;flex:none}
.sw-att{background:var(--min)} .sw-block{background:var(--buf);box-shadow:0 0 0 1.6px var(--flag)}
.sw-goal{background:var(--buf);box-shadow:0 0 0 1.4px var(--panel),0 0 0 2.4px var(--ink)}
.sw-excl{background:var(--muted);opacity:.4}

.work{background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:clamp(16px,3vw,26px);margin-top:16px;box-shadow:var(--shadow)}
.work h2{font-size:1.15rem;margin:0 0 4px;letter-spacing:-.01em}
.work h2 .muted,.muted{color:var(--muted)}
.work-head{font-size:1rem;margin:2px 0 18px;color:var(--muted)}
.work-head .big{font-size:1.5rem;color:var(--ink);font-weight:700}
.work-head strong{color:var(--ink)}
.work-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.wcard{background:color-mix(in srgb,var(--ice) 55%,var(--panel));border:1px solid var(--edge);border-radius:11px;padding:14px 16px}
.wcard h3{margin:0 0 7px;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.wcard h3 .mono{font-size:1.3rem;color:var(--ink);font-weight:700}
.wcard p{margin:0;font-size:.9rem;line-height:1.5}
.wcard--flag{border-color:color-mix(in srgb,var(--flag) 45%,var(--edge))}
.wcard--flag h3 .mono{color:var(--flag)}
.surp{margin:10px 0 0;padding-left:18px;font-size:.82rem;color:var(--muted);display:flex;flex-direction:column;gap:4px}
.surp strong{color:var(--ink)}
.extab{width:100%;border-collapse:collapse;font-size:.85rem}
.extab td{padding:3px 8px 3px 0;vertical-align:top}
.extab td.mono{font-weight:700;white-space:nowrap}
.work-foot{margin:16px 0 0;font-size:.82rem;color:var(--muted);border-top:1px solid var(--edge);padding-top:12px}
.work-foot em{font-style:normal;color:var(--ink)}

.foot{max-width:900px;margin:20px auto 0;font-size:.78rem;color:var(--muted);text-align:center;line-height:1.5}
.foot #gameLabel,.foot span{color:var(--ink)}

@media (max-width:560px){
  .board{grid-template-columns:1fr 1fr;gap:14px}
  .mid{grid-column:1/-1;order:3}
  .attempt-counter{top:10px;padding:0 8px}
  .ac{padding:5px 9px}.ac-num{font-size:1.2rem}
}
@media (prefers-reduced-motion:reduce){
  .ev.now{animation:none} .bump{animation:none} .fill{transition:none}
}
</style>
'''
p='read-the-game.html'
html=open(p).read()
if not html.lstrip().startswith('<style'):
    open(p,'w').write(STYLE+html)
    print("prepended style; total", len(STYLE+html), "bytes")
else:
    print("style already present")
