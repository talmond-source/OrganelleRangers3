// Records a review video of one story chapter, played at a human pace with real key presses.
// The fights run for real (a simple button-mashing bot) for a few seconds, then are shortened.
// usage: node tools/record-story.js OUTDIR [chapterIndex]   -> OUTDIR/*.webm (no sound)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [out, chArg] = process.argv.slice(2); const CH = +(chArg || 0);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 120000 });
  const W = (ms) => p.waitForTimeout(ms); const key = async (k, ms = 150) => { await p.keyboard.press(k); await W(ms); };
  const pane = () => p.evaluate(() => [...document.querySelectorAll('#story .sp')].filter((x) => !x.hidden).map((x) => x.id)[0] || null);
  await p.evaluate((c) => { localStorage.setItem('or3story', JSON.stringify({ name: 'Demo Student', period: 'Period 3', ch: c, stage: 'open', answers: [], losses: {}, done: false })); }, CH);
  await key('Enter', 900); await p.evaluate(() => APP.mainGo('story')); await W(2200);
  await key('Enter', 600);
  // read at a classroom pace: wait for the typing to finish, then about 2 s more
  const readOn = async () => { await p.waitForFunction(() => !SM.el('smMore').hidden || SM.el('smScene').hidden, null, { timeout: 20000 }); const len = await p.evaluate(() => SM.el('smText').textContent.length); await W(1400 + len * 28); await key('Enter', 250); };
  const story = async (target) => { for (let i = 0; i < 40; i++) { const s = await pane(); if (s === target) return; if (s === 'smTitle') { await W(1800); await key('Enter', 300); } else if (s === 'smScene') await readOn(); else if (s === 'smPick') { await W(1500); await p.click('.pk[data-id="atp"]'); await W(400); } else await W(300); } };
  const answer = async (first, wrong) => { await W(2600); const ix = await p.evaluate(([w]) => { const F = APP.storyFight, ch = STORY[SM.S.ch], q = F ? ch.quiz[(F.asked - 1) % ch.quiz.length] : ch.check; return [...document.querySelectorAll('#smQAns .ans')].findIndex((b) => (b.textContent.slice(1) === q.c[q.a]) !== w); }, [wrong]); await key('Digit' + (ix + 1), 2600); };
  const bot = async (secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { const d = await p.evaluate(() => APP.game && APP.game.f[1].x - APP.game.f[0].x); const k = Math.abs(d) > 1.4 ? (d > 0 ? 'ArrowRight' : 'ArrowLeft') : ['KeyZ', 'KeyX', 'KeyZ', 'KeyZ'][(Math.random() * 4) | 0]; if (k.startsWith('Arrow')) { await p.keyboard.down(k); await W(220); await p.keyboard.up(k); } else await key(k, 170); } };
  await story('smQ'); await answer(true, true); await answer(true, false); await key('Enter', 600);
  await story('smPre'); await W(3500); await key('Enter', 400);
  await p.waitForFunction(() => APP.game && APP.game.phase === 'fight', null, { timeout: 15000 }); await bot(9);
  await p.evaluate(() => { const g = APP.game; g.damage(g.f[1], 999, g.f[0]); g.damage(g.f[1], 999, g.f[0]); });
  await p.waitForFunction(() => APP.mode === 'story', null, { timeout: 20000 });
  await story('smPre'); await W(3500); await key('Enter', 400);
  await p.waitForFunction(() => APP.game && APP.game.phase === 'fight', null, { timeout: 15000 }); await bot(5);
  await p.evaluate(() => { const g = APP.game; g.damage(g.f[1], g.f[1].hp + 1, g.f[0]); });
  await p.waitForFunction(() => APP.mode === 'storyq', null, { timeout: 8000 }); await answer(false, false); await key('Enter', 400);
  for (let k = 0; k < 3; k++) { await p.waitForFunction(() => !SM.el('smNarr').hidden && !SM.el('smNarrMore').hidden, null, { timeout: 25000 }); const len = await p.evaluate(() => SM.el('smNarrT').textContent.length); await W(1800 + len * 30); await key('Enter', 300); }
  await p.waitForFunction(() => APP.mode === 'story', null, { timeout: 30000 });
  await story(CH < 14 ? 'smNext' : 'smEnd'); await W(2500);
  if (CH < 14) { await key('ArrowDown', 500); await key('Enter', 2500); }
  const vid = await p.video().path(); await ctx.close(); await b.close();
  fs.renameSync(vid, `${out}/chapter${CH + 1}.webm`); console.log('saved', `${out}/chapter${CH + 1}.webm`, errs);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
