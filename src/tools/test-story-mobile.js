// Phone-sized look at the story screens (landscape and portrait). usage: node tools/test-story-mobile.js OUTDIR
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'); const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [nm, vp] of [['land', { width: 844, height: 390 }], ['port', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../../test.html') + '?nomovie&touch');
    await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'press', null, { timeout: 120000 });
    await p.evaluate(() => { localStorage.setItem('or3story', JSON.stringify({ name: 'Ava R.', period: '3', ch: 1, stage: 'open', answers: [{ ch: 0, kind: 'check', right: true, tries: 0, solved: true, q: 'x' }], losses: {}, done: false })); APP.toTitle(); SM.enter(); });
    await p.waitForTimeout(400); await p.screenshot({ path: `${out}/${nm}-map.png` });
    await p.tap('#smGo'); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${nm}-title.png` });
    for (let i = 0; i < 4; i++) { await p.tap('#story'); await p.waitForTimeout(500); }
    await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${nm}-panel.png` });
    for (let i = 0; i < 30 && !(await p.evaluate(() => !document.getElementById('smQ').hidden)); i++) { await p.tap('#story'); await p.waitForTimeout(300); }
    await p.screenshot({ path: `${out}/${nm}-question.png` });
    console.log(nm, errs);
    await ctx.close();
  }
  await b.close();
})();
