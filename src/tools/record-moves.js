// Records one Ranger doing their basic moves with real button presses, for reviewing new pose sheets.
// usage: node tools/record-moves.js RANGER OUTDIR
// Plays the same inputs twice: with the Ranger's motion sheet (new*.jpg) and without it (old*.jpg, the game as it
// was). Each frame is cropped around the Ranger. Also writes labels.json (the move in each frame), at 30 fps.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [who, out] = process.argv.slice(2);
// [label, frames to hold (60 Hz), inputs held, inputs pressed on the first frame, pressed later {frame: input}]
const PLAN = [['IDLE (breathing)', 80, {}], ['WALK FORWARD', 70, { right: 1 }], ['WALK BACK', 50, { left: 1 }], ['JUMP', 64, { up: 1 }, {}, null, 1],
  ['JAB', 40, {}, { punch: 1 }], ['KICK', 54, {}, { kick: 1 }], ['UPPERCUT (down + punch)', 60, { down: 1 }, { punch: 1 }], ['SWEEP (down + kick)', 66, { down: 1 }, { kick: 1 }],
  ['JUMP KICK', 70, { up: 1 }, {}, { 12: 'kick' }, 1], ['JUMP PUNCH', 70, { up: 1 }, {}, { 12: 'punch' }, 1]];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 90000 });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__hold = true; });
  for (const pass of ['new', 'old']) {
    await p.evaluate(([who, pass]) => {
      if (pass === 'old' && SPR.motion[who]) { window.__m = SPR.motion[who]; delete SPR.motion[who]; }
      APP.gameMode = 'training'; APP.picks = [who, who === 'golgi' ? 'membrane' : 'golgi']; APP.tower = null; APP.startFight('training');
      const g = APP.game; g.skipIntro = true; for (let i = 0; i < 30; i++) g.step(); g.phase = 'fight'; g.timer = 99; const [a, o] = g.f;
      a.x = -2.4; o.x = 3.2; a.face = 1; o.face = -1; a.set('idle'); o.set('idle');
      window.__in = { c: {}, pr: {} }; a.ctrl = { read() { this.cur = window.__in.c; this.pressed = window.__in.pr; return this.cur; } };
      o.ctrl = { read() { this.cur = {}; this.pressed = {}; return {}; } }; document.getElementById('announce').innerHTML = ''; window.__g = g;
    }, [who, pass]);
    let i = 0; const labels = [];
    for (const [lab, n, hold, press = {}, later = null, jump = 0] of PLAN) {
      for (let f = 0; f < n; f += 2) {
        const r = await p.evaluate(([hold, press, later, f, lab, jump]) => {
          const g = window.__g, a = g.f[0];
          for (let k = 0; k < 2; k++) { const ff = f + k, pr = {}, c = Object.assign({}, hold);
            if (jump && ff > 1) delete c.up; // tap up, don't hold it
            if (ff === 0) Object.assign(pr, press, press.punch ? { punch: true } : {}); if (later && later[ff]) { pr[later[ff]] = true; c[later[ff]] = true; }
            for (const k2 in pr) c[k2] = true; window.__in = { c, pr }; g.step(); }
          g.render(1 / 60); APP.drawFight(2 / 60);
          if (a.x > 1.2) a.x = 1.2; if (a.x < -3.5) a.x = -3.5;
          return [VIEW.sx(a.drawX ?? a.x), VIEW.c.toDataURL('image/jpeg', 0.92)];
        }, [hold, press, later, f, lab, jump]);
        fs.writeFileSync(path.join(out, pass + String(i++).padStart(4, '0') + '.jpg'), Buffer.from(r[1].split(',')[1], 'base64')); labels.push([lab, r[0]]);
      }
      await p.evaluate(() => { const a = window.__g.f[0]; window.__in = { c: {}, pr: {} }; for (let k = 0; k < 40 && (a.state !== 'idle' || !a.grounded); k++) window.__g.step(); a.x = Math.max(-2.6, Math.min(a.x, -1.2)); });
    }
    fs.writeFileSync(path.join(out, pass + '-labels.json'), JSON.stringify(labels)); console.log(pass, i, 'frames');
  }
  console.log(errs.slice(0, 10).join('\n') || 'no errors'); await b.close();
})();
