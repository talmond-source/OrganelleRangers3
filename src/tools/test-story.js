// Smoke test of story mode: plays chapter 1 end to end with real key presses (fights are shortened by
// knocking health down), screenshotting each screen. usage: node tools/test-story.js OUTDIR [chapterIndex]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [out, chArg] = process.argv.slice(2); const CH = +(chArg || 0);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGE ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 120000 });
  let n = 0; const shot = async (name) => { await p.waitForTimeout(250); await p.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` }); };
  const key = async (k, wait = 120) => { await p.keyboard.press(k); await p.waitForTimeout(wait); };
  const st = () => p.evaluate(() => ({ mode: APP.mode, pane: [...document.querySelectorAll('#story .sp')].filter((x) => !x.hidden).map((x) => x.id)[0] || null, S: SM.S && { ch: SM.S.ch, stage: SM.S.stage } }));
  await p.evaluate(() => localStorage.removeItem('or3story'));
  await key('Enter', 600); // press start -> title
  await p.evaluate(() => APP.mainGo('story')); await p.waitForTimeout(300); await shot('name');
  await p.fill('#smNameIn', 'Test Student'); await p.fill('#smPerIn', 'Period 3'); await key('Enter', 400);
  if (CH) await p.evaluate((c) => { SM.S.ch = c; SM.store(); SM.map(); }, CH);
  await shot('map');
  await key('Enter', 500); // begin
  // advance through title cards and panels until a question shows
  const until = async (pane, max = 60, label) => { for (let i = 0; i < max; i++) { const s = await st(); if (s.pane === pane) return s; if (s.pane === 'smPick') { await shot('pick'); await p.click('.pk[data-id="atp"]'); await p.waitForTimeout(300); continue; } if (s.pane === 'smScene' && label && !label.done) { label.done = 1; await shot(label.name); } await key('Enter', 350); } throw new Error('never reached ' + pane + ' ' + JSON.stringify(await st())); };
  let s = await st(); if (s.pane === 'smTitle') await shot('title-card');
  const L1 = { name: 'panel' }; await until('smQ', 80, L1); await shot('checkin');
  // wrong answer first, then the right one
  const wrong = await p.evaluate(() => { const q = STORY[SM.S.ch].check; const btns = [...document.querySelectorAll('#smQAns .ans')]; return btns.findIndex((b) => b.textContent.slice(1) !== q.c[q.a]); });
  await key('Digit' + (wrong + 1), 300); await shot('checkin-wrong');
  const right = await p.evaluate(() => { const q = STORY[SM.S.ch].check; return [...document.querySelectorAll('#smQAns .ans')].findIndex((b) => b.textContent.slice(1) === q.c[q.a]); });
  await key('Digit' + (right + 1), 300); await shot('checkin-right'); await key('Enter', 400);
  await until('smPre'); await shot('prefight1'); await key('Enter', 500);
  // battle 1
  await p.waitForFunction(() => APP.game && APP.game.phase === 'fight', null, { timeout: 15000 }); await p.waitForTimeout(1500); await shot('battle1');
  const ultBlocked = await p.evaluate(() => { const g = APP.game, a = g.f[0]; a.meter = 100; return g.noUlt === true; });
  await key('Space', 200); const ultFired = await p.evaluate(() => APP.game.phase === 'cine');
  await p.evaluate(() => { const g = APP.game; g.damage(g.f[1], 999, g.f[0]); g.damage(g.f[1], 999, g.f[0]); });
  console.log('after b1 hits', JSON.stringify(await p.evaluate(() => ({ mode: APP.mode, ph: APP.game && APP.game.phase, hp: APP.game && APP.game.f.map((f) => [f.hp, f.bars, f.state, f.x.toFixed(2)]), sf: !!APP.storyFight }))));
  await p.waitForFunction(() => APP.mode === 'story', null, { timeout: 15000 });
  await until('smScene'); await shot('mid-panel');
  await until('smPre'); await shot('prefight2'); await key('Enter', 500);
  await p.waitForFunction(() => APP.game && APP.game.phase === 'fight', null, { timeout: 15000 }); await p.waitForTimeout(1200); await shot('battle2');
  // break the first bar
  const b2hp = await p.evaluate(() => APP.game.f[1].hp);
  await p.evaluate(() => { const g = APP.game; g.damage(g.f[1], g.f[1].hp + 1, g.f[0]); });
  console.log('after b2 hits', JSON.stringify(await p.evaluate(() => ({ mode: APP.mode, ph: APP.game && APP.game.phase, hp: APP.game && APP.game.f.map((f) => [f.hp, f.bars, f.state, f.x.toFixed(2)]), F: APP.storyFight && { asked: APP.storyFight.asked, pending: APP.storyFight.pending }, ob: !!APP.game.onBarBreak }))));
  await p.waitForFunction(() => APP.mode === 'storyq', null, { timeout: 8000 }); await shot('mega-question');
  const q2 = await p.evaluate(() => { const ch = STORY[SM.S.ch], F = APP.storyFight, q = ch.quiz[(F.asked - 1) % ch.quiz.length]; const btns = [...document.querySelectorAll('#smQAns .ans')]; return { w: btns.findIndex((b) => b.textContent.slice(1) !== q.c[q.a]), r: btns.findIndex((b) => b.textContent.slice(1) === q.c[q.a]) }; });
  await key('Digit' + (q2.w + 1), 300); await shot('mega-wrong'); await key('Enter', 600);
  const afterWrong = await p.evaluate(() => ({ mode: APP.mode, hp: APP.game.f[1].hp, bars: APP.game.f[1].bars }));
  const noKO = await p.evaluate(() => { const g = APP.game; g.damage(g.f[1], 999, g.f[0]); return [g.f[1].hp, g.phase]; });
  await p.waitForFunction(() => APP.mode === 'storyq', null, { timeout: 8000 }); await shot('mega-question-2');
  const q3 = await p.evaluate(() => { const ch = STORY[SM.S.ch], F = APP.storyFight, q = ch.quiz[(F.asked - 1) % ch.quiz.length]; return [...document.querySelectorAll('#smQAns .ans')].findIndex((b) => b.textContent.slice(1) === q.c[q.a]); });
  await key('Digit' + (q3 + 1), 300); await shot('mega-right'); await key('Enter', 400);
  // narrated megaform
  for (let k = 0; k < 3; k++) { await p.waitForFunction(() => !document.getElementById('smNarr').hidden && !document.getElementById('smNarrMore').hidden, null, { timeout: 20000 }); await shot('narr' + (k + 1)); await key('Enter', 300); }
  await p.waitForFunction(() => APP.mode === 'story', null, { timeout: 30000 });
  await until('smScene'); await shot('end-panel');
  if (CH < 14) { await until('smNext'); await shot('chapter-complete'); } else { await until('smEnd'); await shot('the-end'); }
  const S = await p.evaluate(() => ({ S: SM.S, score: SM.score() }));
  if (CH < 14) { await key('ArrowDown', 200); await key('Enter', 600); await shot('map-after'); }
  // report card
  const pdf = await p.evaluate(async () => { let blob; const o = URL.createObjectURL; URL.createObjectURL = (b) => { blob = b; return o.call(URL, b); }; SM.reportCard(); URL.createObjectURL = o; const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const c of buf) s += String.fromCharCode(c); return btoa(s); });
  fs.writeFileSync(`${out}/report.pdf`, Buffer.from(pdf, 'base64'));
  fs.writeFileSync(`${out}/result.json`, JSON.stringify({ ultBlocked, afterWrong, S, errs }, null, 1));
  console.log(JSON.stringify({ ultFired, b2hp, noKO, ultBlocked, afterWrong, score: S.score, answers: S.S.answers.map((a) => [a.kind, a.right, a.tries, !!a.retry]), errs }, null, 1));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
