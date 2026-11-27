/* ================= 8-bit power metal: the story intro score and the title loop =================
   NES-style voices (pulse leads, triangle bass, noise drums) plus a distorted pulse "guitar" for the riffs.
   Everything sits on a 180 BPM grid of 16th-note steps (1 bar = 4/3 s), the same grid the intro's shots are cut to.
   A score is a function (ctx, bus, base, t0, t1) that schedules every note whose time falls in [t0, t1). */
const BPM = 180, STEP = 60 / BPM / 4, BAR = STEP * 16;
const CHIP = {
  midi: (m) => 440 * Math.pow(2, (m - 69) / 12),
  waves: new WeakMap(),
  pulse(c, duty) { // band-limited pulse wave with the given duty cycle (0.125, 0.25, 0.5 like the NES)
    let m = this.waves.get(c); if (!m) this.waves.set(c, (m = {}));
    if (!m[duty]) { const n = 40, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); m[duty] = c.createPeriodicWave(re, im); }
    return m[duty];
  },
  bus(c, out) { // the shared mix: a distortion channel for the guitar, a plain channel for everything else
    const gin = c.createGain(), sh = c.createWaveShaper(), lp = c.createBiquadFilter(), gout = c.createGain(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 7) * 0.9; }
    sh.curve = curve; lp.type = "lowpass"; lp.frequency.value = 2600; gout.gain.value = 0.42; gin.connect(sh).connect(lp).connect(gout).connect(out);
    if (!c._noise) { const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); let s = 1; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; } c._noise = b; }
    return { out, gtr: gin, noise: c._noise };
  },
  env(c, t, v, a, d, dest) { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(dest); return g; },
  osc(c, t, type, f, dur, dest, slide) { const o = c.createOscillator(); if (typeof type === "number") o.setPeriodicWave(this.pulse(c, type)); else o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur); o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; },
  /* voices */
  lead(c, B, t, m, len, v = 0.09, duty = 0.25, vib = true) { const d = len * STEP, g = this.env(c, t, v, 0.008, d * 1.05, B.out), o = this.osc(c, t, duty, this.midi(m), d, g);
    if (vib && d > 0.3) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(this.midi(m) * 0.012, t + d * 0.6); l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + d); } },
  tri(c, B, t, m, len, v = 0.22) { const g = this.env(c, t, v, 0.004, len * STEP * 0.95, B.out); this.osc(c, t, "triangle", this.midi(m), len * STEP, g); },
  gtr(c, B, t, root, len, v = 0.5, mute = true) { // power chord: root, fifth, octave
    const d = mute ? Math.min(len * STEP, 0.07) : len * STEP, g = this.env(c, t, v, 0.003, d, B.gtr);
    for (const [k, dt] of [[0, 0], [7, 0], [12, 0], [0, 0.07]]) this.osc(c, t, k === 0 && dt ? "sawtooth" : 0.5, this.midi(root + k) * (1 + dt * 0.01), d + 0.05, g); },
  pad(c, B, t, ms, secs, v = 0.05) { const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + secs * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + secs); g.connect(B.out); lp.connect(g);
    for (const m of ms) for (const det of [-0.004, 0.004]) this.osc(c, t, "sawtooth", this.midi(m) * (1 + det), secs, lp); },
  nz(c, B, t, dur, v, f, type = "highpass", q = 0.7, rise = 0) { const s = c.createBufferSource(); s.buffer = B.noise; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); if (rise) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02); } else { g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    s.connect(fl).connect(g).connect(B.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); },
  kick(c, B, t, v = 0.55) { const g = this.env(c, t, v, 0.002, 0.16, B.out); this.osc(c, t, "sine", 150, 0.15, g, 42); },
  snare(c, B, t, v = 0.3) { this.nz(c, B, t, 0.14, v, 1800, "bandpass", 0.8); const g = this.env(c, t, v * 0.5, 0.002, 0.08, B.out); this.osc(c, t, 0.5, 190, 0.08, g, 120); },
  hat(c, B, t, v = 0.06) { this.nz(c, B, t, 0.035, v, 8000); },
  crash(c, B, t, v = 0.22, d = 1.4) { this.nz(c, B, t, d, v, 4500); },
  tom(c, B, t, f, v = 0.4) { const g = this.env(c, t, v, 0.002, 0.22, B.out); this.osc(c, t, "triangle", f, 0.22, g, f * 0.5); },
  boom(c, B, t, v = 0.9) { this.nz(c, B, t, 1.6, v * 0.6, 220, "lowpass"); const g = this.env(c, t, v, 0.003, 1.4, B.out); this.osc(c, t, "sine", 90, 1.4, g, 30); },
  zap(c, B, t, f, v = 0.07) { const g = this.env(c, t, v, 0.002, 0.07, B.out); this.osc(c, t, 0.125, f, 0.07, g, f * 0.4); },
};
/* E minor. Chords are named by their root; the lead's harmony is a diatonic third below (E harmonic minor over B) */
const ROOT = { Em: 40, C: 36, D: 38, B: 35, G: 43, A: 45 };
const SCALE = [4, 6, 7, 9, 11, 0, 2];
function third(m, ch) { const sc = ch === "B" ? [4, 6, 7, 9, 11, 0, 3] : SCALE; const pc = ((m % 12) + 12) % 12, i = sc.indexOf(pc); if (i < 0) return m - 4; let k = m, steps = 0; while (steps < 2) { k--; if (sc.includes(((k % 12) + 12) % 12)) steps++; } return k; }
const MEL = {
  verse: { Em: [[0, 76, 3], [3, 74, 1], [4, 76, 2], [6, 79, 2], [8, 83, 4], [12, 81, 2], [14, 79, 2]], C: [[0, 79, 4], [4, 76, 2], [6, 79, 2], [8, 84, 4], [12, 83, 2], [14, 81, 2]],
    D: [[0, 81, 4], [4, 78, 2], [6, 81, 2], [8, 86, 4], [12, 84, 2], [14, 83, 2]], B: [[0, 83, 6], [6, 81, 2], [8, 78, 4], [12, 75, 4]] },
  chorus: { Em: [[0, 83, 6], [6, 81, 2], [8, 79, 4], [12, 78, 4]], C: [[0, 79, 6], [6, 76, 2], [8, 79, 4], [12, 84, 4]], G: [[0, 83, 6], [6, 86, 2], [8, 83, 4], [12, 79, 4]], D: [[0, 81, 8], [8, 78, 4], [12, 74, 4]] },
};
const GALLOP = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15];
/* one bar of full-speed power metal: galloping guitar and bass, double kick, snare on 2 and 4, lead (+ harmony) */
function metalBar(c, B, t0, ch, mel, opts = {}) {
  const r = ROOT[ch], gr = r < 40 ? r + 12 : r, lead = MEL[mel] && MEL[mel][ch];
  for (const s of GALLOP) { const t = t0 + s * STEP; CHIP.gtr(c, B, t, gr, 1, opts.soft ? 0.35 : 0.5); CHIP.tri(c, B, t, r, 1, 0.2); }
  for (let s = 0; s < 16; s++) { const t = t0 + s * STEP; if (opts.dbl !== false || s % 4 === 0) CHIP.kick(c, B, t, s % 4 === 0 ? 0.55 : 0.3); if (s % 2 === 0) CHIP.hat(c, B, t); if (s === 4 || s === 12) CHIP.snare(c, B, t); }
  if (lead && opts.lead !== false) for (const [s, m, len] of lead) { const up = opts.oct ? 12 : 0; CHIP.lead(c, B, t0 + s * STEP, m + up, len, 0.085, 0.25); if (opts.harm) CHIP.lead(c, B, t0 + s * STEP, third(m, ch) + up, len, 0.05, 0.125, false); }
  if (opts.crash) CHIP.crash(c, B, t0);
}
/* scheduler helper: calls fn(bar, step, time) for every 16th whose time is in [t0, t1) */
function steps(base, t0, t1, fn) { for (let n = Math.ceil(t0 / STEP - 1e-6); n * STEP < t1; n++) fn(Math.floor(n / 16), n % 16, base + n * STEP, n); }

/* ---------- the title / menu loop: 8 bars of verse, 8 bars of chorus ---------- */
const TITLE_PROG = ["Em", "C", "D", "B", "Em", "C", "D", "B", "Em", "C", "G", "D", "Em", "C", "G", "D"];
function titleBar(c, B, t, bar) { const i = ((bar % 16) + 16) % 16, ch = TITLE_PROG[i], chorus = i >= 8;
  metalBar(c, B, t, ch, chorus ? "chorus" : "verse", { harm: i >= 4, crash: i % 4 === 0, dbl: chorus, soft: true }); }
function TITLE_SCORE(c, B, base, t0, t1) { steps(base, t0, t1, (bar, s, t) => { if (s === 0) titleBar(c, B, t, bar); }); }

/* ---------- the story intro ----------
   Section lengths in bars. Shots in intro2d.js start on these bars, and every shot is long enough for its captions to be
   typed out and then read (about 1.2 s + 0.3 s a word), since students learn from them. */
const SEC_LEN = [["open", 4], ["rise", 8], ["inject", 7], ["dna1", 4], ["dna2", 8], ["visor", 7], ["blind", 6], ["looms", 6], ["leap", 3],
  ["close", 2], ["wide", 3], ["reflect", 4], ["call", 7], ["rc", 26], ["group", 2], ["lyso", 3]];
const SEC = {}; { let b = 0; for (const [k, n] of SEC_LEN) { SEC[k] = b; b += n; } SEC.end = b; }
const RC_BARS = 2; // each Ranger's roll call: dive, land, hand sign, signature pose
const INTRO_END_BAR = SEC.end + 1; // the logo lands on beat 2 of the bar after the Lysosome; the title loop starts a bar later
function INTRO_SCORE(c, B, base, t0, t1) {
  steps(base, t0, t1, (bar, s, t) => {
    const at = (b, st) => bar === b && s === st, sec = (k) => bar - SEC[k], inS = (k, n) => bar >= SEC[k] && bar < SEC[k] + n;
    // ACT 1: infection. A low drone and a cold echoing arpeggio; a heartbeat from the injection on
    if (bar < SEC.blind && bar % 4 === 0 && s === 0) CHIP.pad(c, B, t, bar >= SEC.dna1 ? [28, 40, 46] : [28, 40, 47], BAR * 4.6, 0.11);
    if (bar >= 1 && bar < SEC.visor + 3 && s % 2 === 0) { const arp = [64, 67, 71, 78, 76, 71, 67, 71][(s / 2) % 8] + (bar % 4 === 3 ? -2 : 0) + (inS("dna2", 8) && bar % 2 ? -1 : 0);
      CHIP.lead(c, B, t, arp, 1.5, 0.05, 0.125, false); CHIP.lead(c, B, t + STEP * 3, arp, 1.5, 0.022, 0.125, false); }
    if (inS("rise", 8) && s === 0 && sec("rise") % 2 === 0) CHIP.lead(c, B, t, [40, 40, 43, 39][(sec("rise") / 2) % 4], 14, 0.07, 0.5, false); // the Phage's low pulse
    if (bar >= SEC.inject && bar < SEC.visor + 3 && (s === 0 || s === 3)) CHIP.kick(c, B, t, s === 0 ? 0.75 : 0.5);
    if (at(SEC.inject + 2, 0)) { CHIP.boom(c, B, t, 0.5); CHIP.nz(c, B, t, 0.35, 0.5, 900, "lowpass"); } // the tail tube punches through the membrane
    if (bar >= SEC.dna1 && bar < SEC.visor && s === 0) { const i = (bar - SEC.dna1) % 6, dread = [[71, 8, 72, 8], [71, 16], [67, 8, 66, 8], [71, 8, 72, 8], [74, 8, 72, 8], [75, 16]][i];
      for (let k = 0; k < dread.length; k += 2) CHIP.lead(c, B, t + (k ? dread[k - 1] : 0) * STEP, dread[k], dread[k + 1], 0.08, 0.5); }
    if (at(SEC.dna2, 0)) CHIP.zap(c, B, t, 1400, 0.06); // splice
    if (inS("visor", 3) && sec("visor") >= 1 && (s === 8 || s === 11)) CHIP.kick(c, B, t, 0.5); // the heartbeat quickens
    const G = SEC.visor + 3; // the sleeper wakes
    if (bar === G) { if ([0, 1, 3, 6, 7, 10].includes(s)) { CHIP.zap(c, B, t, 600 + s * 170, 0.09); CHIP.nz(c, B, t, 0.06, 0.25, 3000, "bandpass", 2); } if (s === 0) CHIP.pad(c, B, t, [28, 34, 40], BAR * 4.2, 0.1); }
    if (bar > G && bar < SEC.blind) { if (s % 4 === 2) CHIP.hat(c, B, t, 0.05); if (s === 0 || s === 8) CHIP.lead(c, B, t, s ? 75 : 76, 6, 0.05, 0.5); if (bar === SEC.blind - 1 && s === 8) CHIP.nz(c, B, t, BAR / 2, 0.3, 1200, "bandpass", 0.6, 1); }
    // ACT 2: turned. The punch lands on the downbeat, then a half-time chug
    if (at(SEC.blind, 0)) { CHIP.crash(c, B, t, 0.3, 2); CHIP.boom(c, B, t, 0.6); CHIP.gtr(c, B, t, 40, 16, 0.55, false); }
    if (bar >= SEC.blind && bar < SEC.leap) { const k = bar - SEC.blind, ch = k < 6 ? ["Em", "Em", "C", "Em", "C", "B"][k] : ["Em", "C", "Em", "C", "D", "B"][k - 6], r = ROOT[ch], gr = r < 40 ? r + 12 : r;
      if (k >= 1 && [0, 2, 3, 8, 10, 11].includes(s)) { CHIP.gtr(c, B, t, gr, 1, 0.42); CHIP.tri(c, B, t, r, 1); }
      if (k >= 1 && (s === 0 || s === 6)) CHIP.kick(c, B, t); if (k >= 1 && s === 8) CHIP.snare(c, B, t); if (k >= 1 && s % 4 === 2) CHIP.hat(c, B, t);
      if (k >= 6 && s === 0) CHIP.gtr(c, B, t, gr, 6, 0.4, false);
      const vil = { 6: [[0, 76, 6], [6, 75, 2], [8, 76, 4], [12, 79, 4]], 7: [[0, 78, 6], [6, 76, 2], [8, 75, 8]], 8: [[0, 76, 6], [6, 75, 2], [8, 76, 4], [12, 83, 4]], 9: [[0, 81, 6], [6, 79, 2], [8, 78, 8]], 10: [[0, 79, 8], [8, 78, 8]], 11: [[0, 71, 8]] }[k];
      if (vil && s === 0) for (const [st, m, len] of vil) CHIP.lead(c, B, t + st * STEP, m, len, 0.08, 0.5);
      if (k === 11 && s >= 8) CHIP.tom(c, B, t, [220, 220, 180, 180, 150, 150, 120, 100][s - 8]); }
    // ACT 3: CRISPR's leap, a snare roll that just... stops
    if (inS("leap", 3)) { const k = sec("leap"), n = k * 16 + s; CHIP.snare(c, B, t, 0.06 + n * 0.006); if (s % 2 === 0) CHIP.kick(c, B, t, 0.4); CHIP.lead(c, B, t, [64, 67, 71, 76][s % 4] + Math.min(k, 2) * 12 - (k === 0 ? 12 : 0), 1, 0.05, 0.25, false); if (s === 0) CHIP.gtr(c, B, t, [40, 43, 45][k], 16, 0.4, false); }
    if (at(SEC.close, 0)) { const g = CHIP.env(c, t, 0.05, 0.01, 2.6, B.out); CHIP.osc(c, t, "sine", 3150, 2.6, g); } // the blade stops: ringing silence
    if (at(SEC.close + 1, 0)) { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + BAR - 0.02); g.gain.linearRampToValueAtTime(0, t + BAR); g.connect(B.out); CHIP.osc(c, t, "sine", 34, BAR, g, 55); }
    if (at(SEC.wide, 0)) { CHIP.boom(c, B, t, 1); CHIP.crash(c, B, t, 0.4, 2.6); CHIP.gtr(c, B, t, 28, 24, 0.6, false); CHIP.nz(c, B, t, 2.4, 0.3, 400, "lowpass"); CHIP.pad(c, B, t, [28, 35, 40], BAR * 3.2, 0.09); }
    if (inS("wide", 3) && s % 3 === 1 && (bar * 16 + s) % 5 < 2) CHIP.nz(c, B, t, 0.05, 0.08, 2400, "bandpass", 3); // falling debris
    if (at(SEC.reflect, 0)) CHIP.pad(c, B, t, [52, 55, 59, 64], BAR * 4.2, 0.045);
    if (inS("reflect", 4) && s % 2 === 0) CHIP.lead(c, B, t, [76, 79, 83, 88, 83, 79, 76, 71][(s / 2) % 8], 1, 0.02, 0.125, false);
    // Nucleus' call: the build
    if (inS("call", 7)) { const k = sec("call"), ch = ["Em", "C", "D", "Em", "Em", "C", "D"][k]; if (s === 0) { CHIP.pad(c, B, t, [ROOT[ch] + 12, ROOT[ch] + 19, ROOT[ch] + 24], BAR * 1.1, 0.05); CHIP.gtr(c, B, t, ROOT[ch] < 40 ? ROOT[ch] + 12 : ROOT[ch], 16, 0.35, false); }
      if (k >= 4 && s % [4, 2, 1][k - 4] === 0) CHIP.kick(c, B, t, 0.4); if (k === 6) CHIP.snare(c, B, t, 0.06 + s * 0.016); if (k >= 5 && s % 2 === 0) CHIP.lead(c, B, t, [64, 67, 71, 76, 79, 83, 88, 91][(s / 2) % 8] - (k === 5 ? 12 : 0), 1, 0.035, 0.25, false); }
    // ROLL CALL: full power metal, two bars per Ranger. Landing on beat 2 (snare), hand sign on beat 3, signature pose on beat 2 of the next bar
    if (inS("rc", 26) && s === 0) { const i = sec("rc"), ch = ["Em", "C", "D", "B"][i % 4]; metalBar(c, B, t, ch, i % 8 < 4 ? "verse" : "chorus", { harm: i >= 4, crash: i % 4 === 0, oct: i >= 16 && i < 24 }); }
    if (inS("rc", 26)) { const odd = sec("rc") % RC_BARS;
      if (!odd && s === 4) { CHIP.crash(c, B, t, 0.12, 0.6); CHIP.nz(c, B, t, 0.3, 0.35, 260, "lowpass"); }
      if (!odd && s === 8) for (let k = 0; k < 4; k++) CHIP.lead(c, B, t + k * STEP * 0.5, [88, 91, 95, 100][k], 1, 0.035, 0.125, false); // the hand sign: a bright chime
      if (odd && s === 4) CHIP.crash(c, B, t, 0.2, 1); }
    if (inS("group", 2) && s === 0) metalBar(c, B, t, sec("group") ? "C" : "Em", "chorus", { harm: true, oct: true, crash: true });
    // the hacked Lysosome: everything drops out
    const L = SEC.lyso;
    if (bar === L && s < 4) CHIP.nz(c, B, t, STEP, 0.05 + s * 0.06, 900, "bandpass", 0.6, 1);
    if (at(L, 4)) { CHIP.boom(c, B, t, 0.9); CHIP.gtr(c, B, t, 40, 10, 0.6, false); CHIP.gtr(c, B, t, 46, 10, 0.45, false); CHIP.kick(c, B, t, 0.7); }
    if (at(L, 8)) for (let k = 0; k < 4; k++) CHIP.lead(c, B, t + k * STEP * 0.5, [88, 94, 89, 95][k], 1, 0.04, 0.125, false); // his hand sign: the chime, wrong
    if (at(L + 1, 4)) { CHIP.gtr(c, B, t, 40, 12, 0.55, false); CHIP.gtr(c, B, t, 46, 12, 0.4, false); CHIP.crash(c, B, t, 0.2, 1); }
    if ((bar === L + 1 && s >= 10) || (bar === L + 2 && s < 8)) { if ([10, 11, 14, 0, 1, 4].includes(s)) { CHIP.gtr(c, B, t, bar === L + 1 ? 40 : 41, 1, 0.45); CHIP.kick(c, B, t, 0.4); } }
    if (at(L + 2, 8) || at(L + 2, 9)) { CHIP.zap(c, B, t, 1800 - s * 80, 0.1); CHIP.nz(c, B, t, 0.08, 0.35, 2500, "bandpass", 1.5); }
    if (at(SEC.end, 4)) { CHIP.boom(c, B, t, 1); CHIP.crash(c, B, t, 0.35, 2.4); CHIP.gtr(c, B, t, 40, 16, 0.6, false); CHIP.pad(c, B, t, [52, 59, 64, 67, 71], BAR * 1.2, 0.06); CHIP.lead(c, B, t, 83, 10, 0.08, 0.25); CHIP.lead(c, B, t, 79, 10, 0.05, 0.125); }
    if (bar >= INTRO_END_BAR && s === 0) titleBar(c, B, t, bar - INTRO_END_BAR);
  });
}
