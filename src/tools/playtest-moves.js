const { chromium } = require('playwright');
const ids = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push('PAGE '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  await p.goto('file://' + require('path').resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(()=>typeof SPR!=='undefined'&&SPR.ready&&APP.mode==='press',null,{timeout:60000});
  await p.evaluate(()=>{ window.__hold = true; });
  for (const id of ids) {
    const dirs = await p.evaluate((id)=>MOVES[id].specials.map(s=>s.dir),id);
    for (const dir of [...dirs,'ult']) {
      const info = await p.evaluate(([id,dir])=>{
        APP.gameMode='training'; APP.picks=[id, id==='phage'?'atp':(id==='mito'?'golgi':'mito')]; APP.tower=null; APP.startFight('training'); const g=APP.game; g.skipIntro=true;
        for(let i=0;i<30;i++){g.step();} g.phase='fight'; const [a,o]=g.f; a.x=-1.6; o.x=dir==='ult'?-0.4:1.4; a.set('idle'); o.set('idle'); a.face=1;o.face=-1;
        let n=0; const ctrl={read(){const c={},pr={}; if(n===0){ if(dir==='ult'){c.ult=pr.ult=true; a.meter=100;} else { c.special=pr.special=true; if(dir==='fwd')c.right=true; if(dir==='down')c.down=true; if(dir==='back')c.left=true; } } n++; this.cur=c;this.pressed=pr;return c;}};
        a.ctrl=ctrl; o.ctrl={read(){this.cur={};this.pressed={};return {};}};
        window.__g=g; return a.state;
      },[id,dir]);
      const times = dir==='ult' ? [30, 75, 140, 200, 240] : [8, 16, 24, 40];
      let done=0;
      for (const t of times) {
        await p.evaluate(([k])=>{const g=window.__g; for(let i=0;i<k;i++){ if(g.phase==='over')break; g.step(); } g.render(1/60); APP.drawFight(1/60); HUD.update(g);},[t-done]); done=t;
        await p.locator('#screen').screenshot({path:`sweep/${id}_${dir||'n'}_${t}.png`}); if(dir==='ult') console.log(t, await p.evaluate(()=>JSON.stringify({imp:VIEW.impact,fl:VIEW.flash,ct:window.__g.cine&&window.__g.cine.t})));
      }
      const st = await p.evaluate(()=>{const g=window.__g;return JSON.stringify({ph:g.phase,a:g.f[0].state,mv:g.f[0].move&&g.f[0].move.name,ohp:g.f[1].hp,obars:g.f[1].bars});});
      console.log(id, dir||'neutral', st);
    }
  }
  console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close();
})();
