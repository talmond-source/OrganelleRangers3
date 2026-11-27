// Records the story intro + roll call + title screen as a review video (frames + music).
// usage: node tools/record-intro.js OUTDIR [from_s] [to_s]
// Writes OUTDIR/c0000.jpg ... (the cutscene, stepped exactly at 30 fps), OUTDIR/t0000.png ... with t-times.json
// (the live title screen after it), and OUTDIR/music.wav (the score rendered offline, same notes the game plays).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [out, from = '0', to = ''] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGE ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.goto('file://' + path.resolve(__dirname, '../../test.html'));
  await p.waitForFunction(() => typeof SPR !== 'undefined' && SPR.ready && APP.mode === 'gate', null, { timeout: 90000 });
  await p.evaluate(async () => { await document.fonts.ready; for (const f of ['25px BC', '30px Bangers', '11px P2']) await document.fonts.load(f); await Promise.all(Object.values(IIMG).map((i) => i.decode().catch(() => {}))); });
  if (from.includes(',')) { // stills mode: node tools/record-intro.js OUTDIR 1.5,9.2,40
    await p.evaluate(() => { window.__hold = true; $id('movie').hidden = true; CINE.music = null; });
    for (const s of from.split(',')) { const url = await p.evaluate((t) => { CINE.t = t; CINE.frame = Math.round(t * 30); CINE.draw(VIEW.x, t); return VIEW.c.toDataURL('image/png'); }, +s); fs.writeFileSync(path.join(out, 's' + (+s).toFixed(2).padStart(6, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64')); }
    console.log(errs.slice(0, 10).join('\n') || 'no errors'); await b.close(); return;
  }
  const end = await p.evaluate(() => CINE_END), t0 = +from, t1 = to ? +to : end;
  await p.evaluate(() => { window.__hold = true; $id('movie').hidden = true; APP.mode = 'intro'; INTRO.show(true); INTRO.phase = 'cine'; CINE.music = null; });
  console.log('cutscene', t0, '->', t1);
  for (let f = Math.round(t0 * 30), i = 0; f / 30 < t1; f++, i++) {
    const url = await p.evaluate((f) => { CINE.t = f / 30; CINE.frame = f; CINE.draw(VIEW.x, CINE.t); return VIEW.c.toDataURL('image/jpeg', 0.93); }, f);
    fs.writeFileSync(path.join(out, 'c' + String(i).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    if (i % 150 === 0) console.log('frame', i, (f / 30).toFixed(2));
  }
  if (!to) { // the title screen, live, as it appears when the intro ends on its own
    await p.evaluate(() => { INTRO.phase = 'logo'; INTRO.natural = true; APP.toPress(); window.__hold = false; });
    const times = [], s0 = Date.now();
    for (let i = 0; Date.now() - s0 < 6000; i++) { await p.locator('#screen').screenshot({ path: path.join(out, 't' + String(i).padStart(4, '0') + '.png') }); times.push((Date.now() - s0) / 1000); }
    fs.writeFileSync(path.join(out, 't-times.json'), JSON.stringify(times));
  }
  const wav = await p.evaluate(async ([a, z]) => AUDIO.renderScore((c, B, base, x, y) => INTRO_SCORE(c, B, base - a, x + a, y + a), z - a), [t0, (to ? +to : end) + 6]);
  fs.writeFileSync(path.join(out, 'music.wav'), Buffer.from(wav, 'base64'));
  console.log(errs.slice(0, 10).join('\n') || 'no errors'); await b.close();
})();
