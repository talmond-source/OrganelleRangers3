/* ================= Audio: synthesized arcade SFX + driving music loop (no files needed) ================= */
const AUDIO = {
  ctx: null, on: true, music: null, vol: 0.55,
  init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination); this.noiseBuf = this.makeNoise(); } catch (e) { this.ctx = null; } },
  makeNoise() { const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.6, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  tone(f, d, type = "square", v = 0.2, when = 0, slide) { const c = this.ctx; if (!c || !this.on) return; const t = c.currentTime + when; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(this.master); o.start(t); o.stop(t + d + 0.02); },
  noise(d, v = 0.3, f = 1200, q = 1, when = 0, type = "bandpass") { const c = this.ctx; if (!c || !this.on) return; const t = c.currentTime + when; const s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl).connect(g).connect(this.master); s.start(t); s.stop(t + d + 0.02); },
  sfx(n) {
    if (!this.ctx || !this.on) return;
    switch (n) {
      case "jab": this.noise(0.08, 0.35, 1800, 1.2); this.tone(180, 0.08, "square", 0.12, 0, 90); break;
      case "kick": this.noise(0.12, 0.4, 900, 1); this.tone(120, 0.12, "square", 0.16, 0, 60); break;
      case "hit": this.noise(0.1, 0.4, 1400, 1); this.tone(150, 0.1, "sawtooth", 0.14, 0, 70); break;
      case "heavy": this.noise(0.22, 0.55, 600, 0.8); this.tone(90, 0.25, "square", 0.25, 0, 40); this.tone(60, 0.3, "sine", 0.3, 0, 35); break;
      case "block": this.noise(0.06, 0.25, 4000, 3); this.tone(900, 0.05, "square", 0.06); break;
      case "whoosh": this.noise(0.22, 0.25, 700, 0.7, 0, "lowpass"); break;
      case "whip": this.noise(0.12, 0.3, 3000, 2); this.tone(1400, 0.1, "sawtooth", 0.06, 0, 300); break;
      case "jump": this.tone(300, 0.12, "square", 0.06, 0, 520); break;
      case "land": this.noise(0.15, 0.3, 300, 0.7, 0, "lowpass"); break;
      case "shoot": this.tone(880, 0.14, "sawtooth", 0.1, 0, 220); this.noise(0.08, 0.2, 2500, 2); break;
      case "charge": this.tone(220, 0.3, "sawtooth", 0.08, 0, 880); break;
      case "zap": this.tone(1200 + Math.random() * 600, 0.06, "sawtooth", 0.07, 0, 300); this.noise(0.05, 0.15, 5000, 4); break;
      case "ding": this.tone(1320, 0.18, "triangle", 0.12); this.tone(1980, 0.22, "triangle", 0.08, 0.06); break;
      case "boom": this.noise(0.7, 0.5, 200, 0.6, 0, "lowpass"); this.tone(70, 0.6, "sine", 0.35, 0, 35); break;
      case "fight": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, "square", 0.1, i * 0.06)); break;
      case "break": this.noise(0.5, 0.5, 900, 0.5); this.tone(220, 0.5, "sawtooth", 0.15, 0, 55); break;
      case "ko": this.noise(1.0, 0.6, 250, 0.5, 0, "lowpass"); this.tone(110, 1.0, "sawtooth", 0.2, 0, 30); break;
      case "win": [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, "square", 0.08, i * 0.12)); break;
      case "ultStart": this.tone(110, 0.6, "sawtooth", 0.15, 0, 880); this.noise(0.5, 0.3, 1200, 0.6); break;
      case "impact": this.noise(0.4, 0.7, 400, 0.4); this.tone(55, 0.5, "square", 0.35, 0, 30); break;
      case "select": this.tone(660, 0.07, "square", 0.08); break;
      case "confirm": this.tone(523, 0.1, "square", 0.1); this.tone(784, 0.15, "square", 0.1, 0.07); break;
      case "move": this.tone(440, 0.04, "square", 0.05); break;
    }
  },
  /* 90s arcade loop: driving bass, square lead, noise drums */
  startMusic(kind = "fight") {
    if (!this.ctx || this.music) return; const c = this.ctx; const bpm = kind === "menu" ? 112 : 148, beat = 60 / bpm; let next = c.currentTime + 0.1, step = 0;
    const bassA = [45, 45, 57, 45, 48, 48, 60, 48, 43, 43, 55, 43, 50, 50, 52, 55], lead = [69, 0, 72, 74, 0, 72, 69, 67, 69, 0, 64, 67, 0, 69, 72, 76];
    const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const g = c.createGain(); g.gain.value = 0.32; g.connect(this.master);
    const tick = () => {
      while (next < c.currentTime + 0.2) {
        const s = step % 16, bar = Math.floor(step / 16) % 4;
        if (this.on) {
          const b = bassA[s] + (bar === 2 ? 5 : bar === 3 ? -2 : 0); const o = c.createOscillator(), og = c.createGain(); o.type = "sawtooth"; o.frequency.value = midi(b - 12); og.gain.setValueAtTime(0.16, next); og.gain.exponentialRampToValueAtTime(0.001, next + beat * 0.45); const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700; o.connect(lp).connect(og).connect(g); o.start(next); o.stop(next + beat * 0.5);
          if (kind === "fight" && lead[s] && bar % 2 === 1) { const l = c.createOscillator(), lg = c.createGain(); l.type = "square"; l.frequency.value = midi(lead[s] + (bar === 3 ? 3 : 0)); lg.gain.setValueAtTime(0.05, next); lg.gain.exponentialRampToValueAtTime(0.001, next + beat * 0.4); l.connect(lg).connect(g); l.start(next); l.stop(next + beat * 0.45); }
          if (s % 4 === 0) { const k = c.createOscillator(), kg = c.createGain(); k.frequency.setValueAtTime(140, next); k.frequency.exponentialRampToValueAtTime(40, next + 0.12); kg.gain.setValueAtTime(0.5, next); kg.gain.exponentialRampToValueAtTime(0.001, next + 0.15); k.connect(kg).connect(g); k.start(next); k.stop(next + 0.16); }
          if (s % 8 === 4) { const n = c.createBufferSource(); n.buffer = this.noiseBuf; const ng = c.createGain(), f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1500; ng.gain.setValueAtTime(0.25, next); ng.gain.exponentialRampToValueAtTime(0.001, next + 0.12); n.connect(f).connect(ng).connect(g); n.start(next); n.stop(next + 0.13); }
          if (s % 2 === 1) { const n = c.createBufferSource(); n.buffer = this.noiseBuf; const ng = c.createGain(), f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000; ng.gain.setValueAtTime(0.06, next); ng.gain.exponentialRampToValueAtTime(0.001, next + 0.04); n.connect(f).connect(ng).connect(g); n.start(next); n.stop(next + 0.05); }
        }
        next += beat / 2; step++;
      }
    };
    this.music = { id: setInterval(tick, 50), g }; tick();
  },
  stopMusic() { if (this.music) { clearInterval(this.music.id); this.music.g.disconnect(); this.music = null; } },
};
