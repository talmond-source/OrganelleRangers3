const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push('PAGE '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  await p.goto('file://' + require('path').resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(()=>typeof SPR!=='undefined'&&SPR.ready&&APP.mode==='press',null,{timeout:60000});
  const res = await p.evaluate(()=>{ window.__hold=true; const ids=ROSTER.map(r=>r.id).concat(['phage']); const out=[]; let drawMs=0,draws=0;
    for(let k=0;k<ids.length;k++){ const a=ids[k], o=ids[(k+5)%ids.length]===a?'atp':ids[(k+5)%ids.length];
      APP.gameMode='tower'; APP.picks=[a,o]; APP.tower={list:[o],i:0}; APP.diff=2; APP.startFight(towerStage(k,o)); const g=APP.game; g.f[0].ctrl=new AICtrl(0.8); g.f[1].ctrl=new AICtrl(0.8);
      let steps=0; while(g.phase!=='over'&&steps<60*120){ g.step(); steps++; if(steps%4===0){ g.render(1/15); const t0=performance.now(); APP.drawFight(1/15); drawMs+=performance.now()-t0; draws++; } }
      out.push([a,o,g.phase,(steps/60).toFixed(0)+'s',g.result?g.f[g.result.winner].id:'-', g.f.map(f=>f.bars+':'+f.hp).join(' ')]); }
    return {out, avgDraw:(drawMs/draws).toFixed(2)}; });
  console.log(res.out.map(r=>r.join(' ')).join('\n')); console.log('avg draw ms', res.avgDraw);
  console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close();
})();
