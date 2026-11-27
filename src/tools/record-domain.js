// Records a Megaform / Domain Expansion super as video frames, for review.
// usage: node tools/record-domain.js ATTACKER OPPONENT OUTDIR [side]
//   side = "left" (default: attacker starts on the left) or "right"
// Writes OUTDIR/f0000.png ... at 30 fps (every second 60 Hz step); turn them into a video with ffmpeg.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [att, opp, out, side = 'left'] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGE ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 60000 });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__hold = true; });
  const ok = await p.evaluate(([att, opp, side]) => {
    APP.gameMode = 'training'; APP.picks = [att, opp]; APP.tower = null; APP.startFight('training'); const g = APP.game; g.skipIntro = true;
    for (let i = 0; i < 30; i++) g.step(); g.phase = 'fight'; const [a, o] = g.f;
    if (side === 'left') { a.x = -2.2; o.x = 0.6; a.face = 1; o.face = -1; } else { a.x = 2.2; o.x = -0.6; a.face = -1; o.face = 1; }
    a.set('idle'); o.set('idle');
    let n = 0; a.ctrl = { read() { const c = {}, pr = {}; if (n === 0) { c.ult = pr.ult = true; a.meter = 100; } n++; this.cur = c; this.pressed = pr; return c; } };
    o.ctrl = { read() { this.cur = {}; this.pressed = {}; return {}; } };
    document.getElementById('announce').innerHTML = ''; window.__g = g; return true;
  }, [att, opp, side]);
  let i = 0; const times = [];
  for (let f = 0; f < 60 * 9.4; f += 2) {
    const st = await p.evaluate(() => { const g = window.__g; for (let k = 0; k < 2; k++) { if (g.phase === 'over') break; g.step(); g.render(1 / 60); } APP.drawFight(2 / 60); HUD.update(g); return g.phase + ' ' + (g.cine ? g.cine.t.toFixed(2) : '-'); });
    await p.locator('#game').screenshot({ path: path.join(out, 'f' + String(i++).padStart(4, '0') + '.png') });
    times.push(st); if (i % 30 === 0) console.log(i, st);
  }
  fs.writeFileSync(path.join(out, 'times.json'), JSON.stringify(times));
  const res = await p.evaluate(() => { const g = window.__g; return JSON.stringify({ phase: g.phase, opp: g.f[1].state, hp: g.f[1].hp, bars: g.f[1].bars, hidden: [g.f[0].hidden, g.f[1].hidden] }); });
  console.log(ok, res); console.log(errs.slice(0, 10).join('\n') || 'no errors'); await b.close();
})();
