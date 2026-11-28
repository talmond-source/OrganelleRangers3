// Records one chapter of the story as a review movie: every cutscene, title card and question at a reading pace,
// with the fights skipped except for Battle 2's slowed, narrated megaform. usage: node tools/record-movie.js OUTDIR CHAPTER(0-14)
// Writes OUTDIR/chNN.webm and OUTDIR/chNN.json (when the chapter starts/ends and when the megaform runs, in seconds of video).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [out, chArg] = process.argv.slice(2); const CH = +chArg; const tag = 'ch' + String(CH + 1).padStart(2, '0');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage(); const T0 = Date.now(); const ev = {}; const mark = (k) => { ev[k] = (Date.now() - T0) / 1000; };
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie');
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 120000 });
  const W = (ms) => p.waitForTimeout(ms); const key = async (k, ms = 150) => { await p.keyboard.press(k); await W(ms); };
  const pane = () => p.evaluate(() => [...document.querySelectorAll('#story .sp')].filter((x) => !x.hidden).map((x) => x.id)[0] || null);
  await p.evaluate((c) => {
    localStorage.setItem('or3story', JSON.stringify({ name: 'Review', period: '', ch: c, stage: 'open', answers: [], losses: {}, done: false }));
    // skip the fights: no pre-fight screens, no Battle 1; Battle 2 goes straight to the megaform question
    SM.prefight = () => Promise.resolve(); const B = SM.battle; SM.battle = function (ch, n) { return n === 1 ? Promise.resolve() : B.call(this, ch, n); };
  }, CH);
  await key('Enter', 700); await p.evaluate(() => APP.mainGo('story')); await W(500);
  await p.evaluate(() => SM.el('smGo').click()); // begin (the map itself is not filmed)
  await p.waitForFunction(() => !SM.el('smTitle').hidden, null, { timeout: 10000 }); mark('start');
  const readOn = async () => { await p.waitForFunction(() => !SM.el('smMore').hidden, null, { timeout: 30000 }); const len = await p.evaluate(() => SM.el('smText').textContent.length); await W(1600 + len * 30); await key('Enter', 250); };
  const ask = async () => { await W(5500); const ix = await p.evaluate(() => { const F = APP.storyFight, ch = STORY[SM.S.ch], q = F ? ch.quiz[(F.asked - 1) % ch.quiz.length] : ch.check; return [...document.querySelectorAll('#smQAns .ans')].findIndex((b) => b.textContent.slice(1) === q.c[q.a]); });
    await key('Digit' + (ix + 1), 400); const len = await p.evaluate(() => SM.el('smQFb').textContent.length); await W(2000 + len * 32); await key('Enter', 300); };
  let fought = false;
  for (let i = 0; i < 200; i++) {
    const mode = await p.evaluate(() => APP.mode);
    if (mode === 'fight' && !fought) { // Battle 2: freeze both fighters and ask the megaform question at once
      fought = true; mark('megaOn');
      await p.evaluate(() => { APP.game.skipIntro = true; }); await p.waitForFunction(() => APP.game && APP.game.phase === 'fight', null, { timeout: 10000 });
      await p.evaluate(() => { const idle = { read() { this.cur = {}; this.pressed = {}; return {}; } }; APP.game.f.forEach((f) => (f.ctrl = idle)); APP.game.f[0].x = -2; APP.game.f[1].x = 2; SM.megaAsk(); });
      await p.waitForFunction(() => APP.mode === 'storyq', null, { timeout: 8000 }); await ask();
      for (let k = 0; k < 3; k++) { await p.waitForFunction(() => !SM.el('smNarr').hidden && !SM.el('smNarrMore').hidden, null, { timeout: 30000 }); const len = await p.evaluate(() => SM.el('smNarrT').textContent.length); await W(2200 + len * 32); await key('Enter', 300); }
      await p.waitForFunction(() => APP.mode === 'story', null, { timeout: 30000 }); mark('megaOff'); continue;
    }
    const s = await pane();
    if (s === 'smTitle') { await W(2600); await key('Enter', 300); }
    else if (s === 'smScene') await readOn();
    else if (s === 'smQ') await ask();
    else if (s === 'smPick') { await W(3500); await p.click('.pk[data-id="nucleus"]'); await W(300); }
    else if (s === 'smNext' || s === 'smEnd') { await W(s === 'smEnd' ? 4500 : 2500); mark('end'); break; }
    else await W(200);
  }
  const rect = await p.evaluate(() => { const r = document.getElementById('screen').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  const vid = await p.video().path(); await ctx.close(); await b.close();
  fs.renameSync(vid, path.join(out, tag + '.webm')); fs.writeFileSync(path.join(out, tag + '.json'), JSON.stringify({ ev, rect, errs }));
  console.log(tag, JSON.stringify(ev), errs);
})().catch((e) => { console.error('FAIL', tag, e.message); process.exit(1); });
