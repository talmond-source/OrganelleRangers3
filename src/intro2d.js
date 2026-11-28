/* ================= Story intro: "Sleeper" =================
   Act 1 Infection, Act 2 Turned, Act 3 Stand, then the roll call (the hacked Lysosome lands last) and the logo.
   Every shot is cut to the music's bar grid (music.js: 180 BPM, BAR = 4/3 s), and the cutscene reads its clock off
   the audio when sound is on, so picture and music can't drift apart. Everything is drawn from the clock alone
   (no particle state), so the recorder can step it frame by frame and skipping can't leave anything half-done.
   Art: intro/*.webp from tools/prep_intro.py (story shots, roll-call strips, stage, logo). */
const T = (bars) => bars * BAR;
const CINE_END = T(SEC.end + 0.25); // the logo slam, on beat 2 of the bar after the Lysosome (music.js)
const S0 = (k) => T(SEC[k]); // a section's start, in seconds
const RC_ORDER = ["nucleus", "mito", "atp", "ribosome", "rougher", "smoother", "golgi", "cytoplasm", "membrane", "dna", "rna", "mitosis", "crispr"];
const RC_INFO = {
  nucleus: ["NUCLEUS", "HOLDS THE GENOME"], mito: ["MITOCHONDRIA", "MAKES THE CELL'S ATP"], atp: ["ATP", "CARRIES THE ENERGY"],
  ribosome: ["RIBOSOME", "BUILDS PROTEINS"], rougher: ["ROUGH ER", "FOLDS NEW PROTEINS"], smoother: ["SMOOTH ER", "MAKES LIPIDS · STORES CALCIUM"],
  golgi: ["GOLGI", "SORTS AND SHIPS"], cytoplasm: ["CYTOPLASM", "MOVES THE CARGO"], membrane: ["MEMBRANE", "GUARDS THE BORDER"],
  dna: ["DNA", "THE BLUEPRINT"], rna: ["RNA", "CARRIES THE MESSAGE"], mitosis: ["MITOSIS", "DIVIDES THE CELL"], crispr: ["CRISPR", "CUTS VIRUS DNA"],
  lysosome: ["LYSOSOME", "DIGESTS AND RECYCLES"],
};
const IIMG = {};
function introArt() { for (const [k, src] of Object.entries(typeof INTRO_DATA === "undefined" ? {} : INTRO_DATA)) { const im = new Image(); im.src = src; IIMG[k] = im; } }
const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const eOut = (u) => 1 - Math.pow(1 - clamp(u), 3), eIn = (u) => Math.pow(clamp(u), 2.2), eIO = (u) => ease(clamp(u));
const lerpK = (t, a, b, from, to, f = eIO) => lerp(from, to, f((t - a) / (b - a)));

const CINE = {
  t: 0, music: null, frame: 0,
  start() {
    this.t = 0; this.frame = 0; this.music = null;
    if (AUDIO.ctx && SET.sound) this.music = AUDIO.playScore(INTRO_SCORE, 0, "intro");
  },
  /* the clock: the audio's when it's playing, otherwise frame time */
  update(dt) {
    // Phones can keep audio paused after the tap (or start it late). Follow the audio clock only while it is actually
    // running; otherwise run on frame time, and if the music starts behind the picture, restart it where the picture is.
    const m = this.music, c = AUDIO.ctx;
    if (m && AUDIO.music === m && c && c.state === "running") {
      const at = c.currentTime - m.base;
      if (at < this.t - 0.25) { this.t += dt; this.music = AUDIO.playScore(INTRO_SCORE, this.t, "intro"); }
      else this.t = Math.max(this.t, at);
    } else this.t += dt;
    this.frame++; this.draw(VIEW.x, this.t);
    return this.t >= CINE_END;
  },
  /* ---------------- drawing helpers ---------------- */
  // draw a full-screen shot: (cx, cy) is the point of the picture (0..1) at the centre of the screen, z the zoom
  // (1 = just covers the screen), rot a Dutch tilt. The centre is clamped so the picture always covers the screen.
  shot(g, key, cx, cy, z = 1, rot = 0, o = {}) {
    const im = IIMG[key]; if (!im || !im.naturalWidth) return; const w = im.naturalWidth, h = im.naturalHeight;
    const s = Math.max(VIEW_W / w, VIEW_H / h) * z * (1 + Math.abs(rot) * 1.4), r = Math.abs(Math.sin(rot)), hw = (VIEW_W / 2 + r * VIEW_H / 2) / s, hh = (VIEW_H / 2 - (this.lb || 0) + r * VIEW_W / 2) / s; // the letterbox may hide the picture's edge; a tilt needs a margin
    const px = clamp(cx * w, hw, w - hw), py = clamp(cy * h, hh, h - hh);
    g.save(); g.globalAlpha = o.alpha ?? 1; g.translate(VIEW_W / 2 + (o.ox || 0), VIEW_H / 2 + (o.oy || 0)); g.rotate(rot); g.scale(s, s);
    if (o.smear) { const [dx, dy, n] = o.smear; for (let i = n; i >= 1; i--) { g.globalAlpha = (o.alpha ?? 1) * 0.22; g.drawImage(im, -px - dx * i / s, -py - dy * i / s); } g.globalAlpha = o.alpha ?? 1; }
    g.drawImage(im, -px, -py); g.restore();
    this.cam = { key, s, px, py, rot, ox: o.ox || 0, oy: o.oy || 0, w, h };
  },
  // where a point of the current shot's picture (0..1) lands on screen
  pt(u, v) { const c = this.cam; if (!c) return [0, 0]; const x = (u * c.w - c.px) * c.s, y = (v * c.h - c.py) * c.s, cs = Math.cos(c.rot), sn = Math.sin(c.rot); return [VIEW_W / 2 + c.ox + x * cs - y * sn, VIEW_H / 2 + c.oy + x * sn + y * cs]; },
  flash(g, a, col = "#fff") { if (a <= 0.003) return; g.save(); g.globalAlpha = clamp(a); g.fillStyle = col; g.fillRect(-50, -50, VIEW_W + 100, VIEW_H + 100); g.restore(); },
  glow(g, x, y, r, col, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); },
  speedLines(g, cx, cy, k, seed, col = "#fff") { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineCap = "round"; const R = 700;
    for (let i = 0; i < 46; i++) { const a = hsh(seed + i) * TAU, r0 = 170 + hsh(seed * 3 + i) * 180, len = 140 + hsh(i + seed * 7) * 260; g.globalAlpha = k * (0.25 + hsh(i * 9 + seed) * 0.5); g.lineWidth = 1.5 + hsh(i * 5) * 4;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * Math.min(R, r0 + len), cy + Math.sin(a) * Math.min(R, r0 + len)); g.stroke(); } g.restore(); },
  // sparks thrown from (x, y) at time `age` seconds after they were made; slow < 1 for slow motion
  sparks(g, x, y, age, n, seed, o = {}) { if (age < 0) return; const sp = o.speed || 420, life = o.life || 0.7, col = o.col || "#ffd58a", grav = o.grav ?? 500; g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = col; g.lineCap = "round";
    for (let i = 0; i < n; i++) { const born = hsh(seed + i * 1.7) * (o.spread || 0), a0 = age - born; if (a0 < 0) continue; const L = life * (0.5 + hsh(i + seed) * 0.8), u = a0 / L; if (u >= 1 && !o.loop) continue; const uu = o.loop ? u % 1 : u, aa = uu * L;
      const ang = (o.dir ?? 0) + (hsh(i * 3.1 + seed) - 0.5) * (o.arc ?? TAU), v = sp * (0.4 + hsh(i * 7.3 + seed) * 0.9), px = x + Math.cos(ang) * v * aa, py = y + Math.sin(ang) * v * aa + grav * aa * aa * 0.5;
      const tx = Math.cos(ang) * v * 0.03, ty = (Math.sin(ang) * v + grav * aa) * 0.03; g.globalAlpha = (1 - uu) * (o.alpha ?? 1); g.lineWidth = o.w || 2.4; g.beginPath(); g.moveTo(px, py); g.lineTo(px - tx, py - ty); g.stroke(); } g.restore(); },
  // rocks and chips flying out (dark, tumbling)
  debris(g, x, y, age, n, seed, col = "#3a2b2b", sp = 520) { if (age < 0) return; g.save();
    for (let i = 0; i < n; i++) { const ang = -Math.PI / 2 + (hsh(i + seed) - 0.5) * Math.PI * 1.6, v = sp * (0.35 + hsh(i * 2.3 + seed)), aa = age, px = x + Math.cos(ang) * v * aa, py = y + Math.sin(ang) * v * aa + 700 * aa * aa * 0.5, s = 3 + hsh(i * 5 + seed) * 9;
      if (py > VIEW_H + 40) continue; g.globalAlpha = clamp(1.4 - age * 0.7); g.fillStyle = col; g.save(); g.translate(px, py); g.rotate(aa * (hsh(i) * 12 - 6)); g.fillRect(-s / 2, -s / 2, s, s * 0.7); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(-s / 2, -s / 2, s, 1.5); g.restore(); } g.restore(); },
  ring(g, x, y, u, R, col, w = 8, squash = 0.35) { if (u <= 0 || u >= 1) return; g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = (1 - u) * 0.9; g.strokeStyle = col; g.lineWidth = w * (1 - u) + 1; g.beginPath(); g.ellipse(x, y, R * eOut(u), R * eOut(u) * squash, 0, 0, TAU); g.stroke(); g.restore(); },
  // horizontal slice glitch with colour fringes
  glitch(g, k, seed) { if (k <= 0) return; const c = g.canvas; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 9; i++) { if (hsh(seed + i) > k + 0.15) continue; const y = hsh(seed * 2 + i) * VIEW_H, h = 6 + hsh(seed + i * 3) * 46, dx = (hsh(seed * 5 + i) - 0.5) * 120 * k; g.drawImage(c, 0, y, VIEW_W, h, dx, y, VIEW_W, h);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.35 * k; g.fillStyle = i % 2 ? "#ff0040" : "#00ff9c"; g.fillRect(0, y, VIEW_W, 2); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
    g.restore(); },
  vignette(g, k = 0.6) { if (!this._vig) { const c = document.createElement("canvas"); c.width = VIEW_W; c.height = VIEW_H; const x = c.getContext("2d"), gr = x.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); x.fillStyle = gr; x.fillRect(0, 0, VIEW_W, VIEW_H); this._vig = c; }
    g.save(); g.globalAlpha = k; g.drawImage(this._vig, 0, 0); g.restore(); },
  grain(g, k = 0.05) { if (!this._gr) { this._gr = []; for (let n = 0; n < 4; n++) { const c = document.createElement("canvas"); c.width = c.height = 192; const x = c.getContext("2d"), d = x.createImageData(192, 192); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); this._gr.push(c); } }
    const c = this._gr[this.frame % 4]; g.save(); g.globalAlpha = k; g.globalCompositeOperation = "overlay"; for (let y = 0; y < VIEW_H; y += 192) for (let x = 0; x < VIEW_W; x += 192) g.drawImage(c, x, y); g.restore(); },
  // caption in the lower letterbox, typed out
  caption(g, t, a, b, text, col = "#f4f1ff") { if (t < a || t > b) return; const n = Math.floor((t - a) * 40), s = text.slice(0, n), fade = clamp((b - t) / 0.3);
    g.save(); g.globalAlpha = fade; g.font = "700 25px BC, 'Arial Narrow', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#000"; g.fillText(s, VIEW_W / 2 + 2, VIEW_H - this.lb / 2 + 2); g.fillStyle = col; g.fillText(s, VIEW_W / 2, VIEW_H - this.lb / 2); g.restore(); },
  // a small "science check" tag in the top letterbox
  tag(g, t, a, b, text) { if (t < a || t > b) return; const k = clamp((t - a) / 0.2) * clamp((b - t) / 0.3), y = this.lb / 2; g.save(); g.globalAlpha = k; g.font = "10px P2, monospace"; g.textBaseline = "middle";
    const w0 = g.measureText("SCIENCE CHECK").width + 16; g.fillStyle = "#ffd21f"; g.fillRect(24, y - 12, w0, 24); g.fillStyle = "#1a0b2e"; g.fillText("SCIENCE CHECK", 32, y + 1); g.fillStyle = "#ffe98a"; g.fillText(text, 24 + w0 + 12, y + 1); g.restore(); },
  // comic speech bubble, typed out, with a tail pointing at (tx, ty)
  bubble(g, t, a, b, lines, x, y, tx, ty, o = {}) { if (t < a || t > b) return; const pop = eOut((t - a) / 0.14), fade = clamp((b - t) / 0.2), size = o.size || 30;
    g.save(); g.globalAlpha = fade; g.font = `${size}px Bangers, Impact, sans-serif`; const n = Math.floor((t - a) * 34), W = Math.max(...lines.map((l) => g.measureText(l).width)) + 44, H = lines.length * size * 1.05 + 26;
    g.translate(x, y); g.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop); const fill = o.fill || "#fff", ink = o.ink || "#120a1c";
    g.lineJoin = "round"; g.lineWidth = 5; g.strokeStyle = ink; g.fillStyle = fill;
    g.beginPath(); g.moveTo(-W * 0.12, H / 2 - 4); g.lineTo(tx - x, ty - y); g.lineTo(W * 0.08, H / 2 - 4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-W / 2, -H / 2, W, H, 18); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-W * 0.12 + 3, H / 2 - 4); g.lineTo(W * 0.08 - 3, H / 2 - 4); g.lineWidth = 7; g.strokeStyle = fill; g.stroke();
    g.fillStyle = o.text || ink; g.textAlign = "center"; g.textBaseline = "middle"; let left = n;
    lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; g.fillText(s, 0, -H / 2 + 13 + size * 0.55 + i * size * 1.05); });
    g.restore(); },
  shakeOff(t, hits) { let k = 0; for (const [at, amp, dec] of hits) if (t >= at) k += amp * Math.exp(-(t - at) * (dec || 6)); const f = Math.floor(t * 60); return [(hsh(f) - 0.5) * k * 36, (hsh(f + 99) - 0.5) * k * 28]; },
  motes(g, t, col, n, seed, speed = 18) { g.save(); g.globalCompositeOperation = "lighter"; for (let i = 0; i < n; i++) { const x = ((hsh(i + seed) * VIEW_W + t * speed * (0.4 + hsh(i * 3))) % (VIEW_W + 40)) - 20, y = hsh(i * 7 + seed) * VIEW_H + Math.sin(t * 0.7 + i) * 8, r = 1 + hsh(i * 11) * 2.5; g.globalAlpha = 0.25 + 0.35 * Math.sin(t * 2 + i) ** 2; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.restore(); },

  /* ---------------- roll call ---------------- */
  rcTint: {},
  // a Ranger roll-call frame (0 dive, 1 landing, 2 signature): centred on x, feet on footY
  rc(g, id, fi, x, footY, sc, o = {}) {
    const im = IIMG["rc-" + id], M = INTRO_META.rollcall[id]; if (!im || !im.naturalWidth || !M) return null; const [cw, ch] = M.cell, [ox, oy, w, h] = M.frames[fi];
    let src = im, sx = fi * cw + ox, sy = oy;
    if (o.tint) { const key = id + fi + o.tint; if (!this.rcTint[key]) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(im, sx, sy, w, h, 0, 0, w, h); x.globalCompositeOperation = "source-atop"; x.fillStyle = o.tint; x.fillRect(0, 0, w, h); this.rcTint[key] = c; } src = this.rcTint[key]; sx = 0; sy = 0; }
    const kx = o.kx || 1, ky = o.ky || 1, dw = w * sc * kx, dh = h * sc * ky, cx = x + (ox + w / 2 - cw / 2) * sc * kx, top = footY - (M.base - oy) * sc * ky;
    g.save(); g.globalAlpha = o.alpha ?? 1; if (o.flip) { g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); } g.drawImage(src, sx, sy, w, h, cx - dw / 2, top, dw, dh); g.restore();
    return { x: cx, top, w: dw, h: dh };
  },
  stage(g, t, z, ox, tint) {
    this.shot(g, "stage", 0.5, 0.55, z, 0, { ox: ox * 24 }); // centred: z > 1 leaves a margin for the offset and the shake
    // sweeping spotlights in the Ranger's colour
    g.save(); g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) { const bx = VIEW_W * (0.12 + i * 0.25), ang = Math.sin(t * 1.3 + i * 1.7) * 0.35 + (i < 2 ? 0.25 : -0.25), gr = g.createLinearGradient(bx, 0, bx + Math.sin(ang) * 500, 520);
      gr.addColorStop(0, rgba(tint, 0.32)); gr.addColorStop(1, rgba(tint, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - 8, -10); g.lineTo(bx + 8, -10); g.lineTo(bx + Math.sin(ang) * 560 + 90, 560); g.lineTo(bx + Math.sin(ang) * 560 - 90, 560); g.closePath(); g.fill(); }
    g.restore();
  },
  // jagged floor cracks out from an impact
  cracks(g, x, y, k, seed, col = "#fff") { if (k <= 0) return; g.save(); g.lineCap = "round"; g.lineJoin = "round";
    const paths = []; for (let i = 0; i < 9; i++) { const side = i % 2 ? 1 : -1, ang = (hsh(seed + i) * 0.5 + 0.05) * Math.PI, len = (90 + hsh(seed * 2 + i) * 200) * k, p = [[x, y]];
      for (let j = 1; j <= 6; j++) { const d = len * j / 6; p.push([x + Math.cos(ang) * d * side + (hsh(i * 9 + j) - 0.5) * 18, y + Math.abs(Math.sin(ang)) * d * 0.2 + (hsh(i * 13 + j) - 0.5) * 7]); } paths.push(p); }
    for (const [w, c, op] of [[9, col, "lighter"], [3.2, "rgba(8,4,18,.95)", "source-over"], [1.2, lighten(col, 0.6), "lighter"]]) { g.globalCompositeOperation = op; g.strokeStyle = op === "source-over" ? c : w > 5 ? rgba(col, 0.35) : c; g.lineWidth = w;
      for (const p of paths) { g.beginPath(); p.forEach(([px, py], j) => (j ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); } }
    g.restore(); },
  dust(g, x, y, u, col = "#b9a8e8") { if (u <= 0 || u >= 1) return; g.save();
    for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1, d = (50 + hsh(i) * 190) * eOut(u), r = (22 + hsh(i * 3) * 34) * (0.6 + u), px = x + s * d, py = y - 6 - hsh(i * 5) * 30 * u, gr = g.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, rgba(col, 0.32 * (1 - u))); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); } g.restore(); },
  nameCard(g, u, side, name, sub, col, seed) { // the sentai name slam: a colour band, the name, the job
    if (u <= 0) return; const k = eOut(u / 0.18), x = VIEW_W / 2 + side * 210, y = 190, slide = (1 - k) * 260 * side;
    g.save(); g.translate(x + slide, y); g.rotate(-0.06);
    g.globalAlpha = clamp(u / 0.08); g.fillStyle = rgba(col, 0.85); g.beginPath(); g.moveTo(-250, -46); g.lineTo(270, -58); g.lineTo(250, 56); g.lineTo(-270, 46); g.closePath(); g.fill();
    g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(-270, 30, 540, 26);
    const big = 1 + (1 - k) * 0.6; g.scale(big, big); comic(g, name, 0, -6, name.length > 9 ? 70 : 84, "#fff", 1, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.restore();
    g.save(); g.globalAlpha = clamp((u - 0.12) / 0.12); g.font = "13px P2, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.translate(x + slide, y + 44); g.rotate(-0.06); g.fillText(sub, 0, 0); g.restore();
    void seed;
  },
  // one Ranger's bar: dive in as a colour streak, slam down on beat 2, rise into the signature pose, name slams in
  /* one Ranger's two bars: dive in as a colour streak, slam down on beat 2, rise into the domain hand sign on beat 3
     (the name slams in with it and stays up about two seconds), then the signature pose on beat 2 of the second bar */
  landing(g, t, id, i, o = {}) {
    const info = BYID[id] || { hex: "#fff" }, col = o.col || info.hex, side = i % 2 ? 1 : -1, LAND = 4 * STEP, SIGN = 8 * STEP, POSE = BAR + 4 * STEP;
    const hitT = t - LAND, signT = t - SIGN, poseT = t - POSE;
    const punch = hitT > 0 ? eOut(hitT / 0.25) * 0.1 - Math.min(0.06, Math.max(0, hitT - 0.4) * 0.05) + (signT > 0 ? Math.min(0.05, signT * 0.03) : 0) : 0;
    const [sx, sy] = this.shakeOff(t, [[LAND, 0.9, 9], [POSE, 0.45, 9]]);
    g.save(); g.translate(sx, sy); g.translate(VIEW_W / 2, VIEW_H * 0.8); g.scale(1 + punch, 1 + punch); g.translate(-VIEW_W / 2, -VIEW_H * 0.8);
    this.stage(g, t + i * 3, 1.14, -side, col); if (o.red) this.flash(g, 0.38 + 0.12 * Math.sin(t * 9), "#5a0014");
    const x = VIEW_W / 2 - side * 120, foot = 470, sc = 0.78;
    this.glow(g, x, foot - 190, 300, col, hitT > 0 ? 0.35 : 0.15);
    if (t < LAND) { // falling: a streak of colour, afterimages above
      const k = eIn(t / LAND), fy = lerp(150, foot, k);
      g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createLinearGradient(0, fy - 420, 0, fy - 120); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, 0.8)); g.fillStyle = gr; g.fillRect(x - 60, -20, 120, Math.max(0, fy - 100)); g.restore();
      for (let a = 3; a >= 1; a--) this.rc(g, id, 0, x, fy - a * 60, sc, { alpha: 0.18, tint: col });
      this.rc(g, id, 0, x, fy, sc, { ky: 1.12, kx: 0.94 });
    } else {
      this.cracks(g, x, foot + 4, eOut(hitT / 0.12) * clamp(2.2 - hitT), i * 17 + 3, col);
      this.ring(g, x, foot + 2, hitT / 0.5, 320, col, 10, 0.18); this.dust(g, x, foot, hitT / 0.9);
      if (signT > 0 && poseT < 0.3) { // the hand sign charges: two rotating rings and motes drawn in to the hands
        const k = clamp(signT / 0.25) * (poseT > 0 ? 1 - poseT / 0.3 : 1), cy = foot - 250;
        g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = rgba(lighten(col, 0.4), 0.7 * k); g.lineWidth = 3;
        for (const [r, dir] of [[150, 1], [190, -1]]) { g.setLineDash([18, 12]); g.lineDashOffset = signT * 120 * dir; g.beginPath(); g.ellipse(x, cy, r * (0.9 + 0.1 * k), r * 0.42 * (0.9 + 0.1 * k), 0, 0, TAU); g.stroke(); }
        g.setLineDash([]); g.restore();
        this.glow(g, x, cy, 220 + 40 * Math.sin(signT * 12), col, 0.4 * k);
        g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = lighten(col, 0.6);
        for (let m = 0; m < 22; m++) { const u = ((signT * 0.9 + hsh(m + i)) % 1), ang = hsh(m * 3 + i) * TAU, r = 260 * (1 - u); g.globalAlpha = k * u; g.beginPath(); g.arc(x + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.6, 2.5, 0, TAU); g.fill(); }
        g.restore();
      }
      const sq = hitT < 0.12 ? 1 - 0.1 * (1 - hitT / 0.12) : 1;
      if (t < SIGN) this.rc(g, id, 1, x, foot, sc, { ky: sq, kx: 2 - sq });
      else if (t < POSE) { const pop = 1 + 0.06 * Math.exp(-signT * 14); this.rc(g, id, 3, x, foot, sc, { kx: pop, ky: pop }); if (signT < 0.09) this.rc(g, id, 3, x, foot, sc, { tint: "#fff", alpha: 0.6 * (1 - signT / 0.09), kx: pop, ky: pop }); }
      else { const pop = 1 + 0.08 * Math.exp(-poseT * 14); this.rc(g, id, 2, x, foot, sc, { kx: pop, ky: pop }); if (poseT < 0.1) this.rc(g, id, 2, x, foot, sc, { tint: "#fff", alpha: 0.6 * (1 - poseT / 0.1), kx: pop, ky: pop });
        this.ring(g, x, foot - 220, poseT / 0.45, 380, lighten(col, 0.3), 12, 0.6); this.sparks(g, x, foot - 220, poseT, 40, i * 13 + 5, { col: lighten(col, 0.6), speed: 700, life: 0.7, grav: 400 }); }
      this.sparks(g, x, foot, hitT, 26, i * 31, { col: lighten(col, 0.5), speed: 520, dir: -Math.PI / 2, arc: 2.6, grav: 900, life: 0.6 });
    }
    g.restore();
    if (hitT >= 0 && hitT < 0.08) this.flash(g, 0.3 * (1 - hitT / 0.08));
    if (poseT >= 0 && poseT < 0.07) this.flash(g, 0.2 * (1 - poseT / 0.07), lighten(col, 0.5));
    const [nm, sub] = RC_INFO[id]; this.nameCard(g, signT, side, nm, o.sub ? o.sub(t) : sub, col, i);
    if (t < 0.07) this.flash(g, 0.4 * (1 - t / 0.07), col); // the cut in, on the downbeat
  },
  group(g, t) {
    const z = lerpK(t, 0, BAR * 1.6, 1.14, 1.0, eOut); g.save(); g.translate(VIEW_W / 2, VIEW_H * 0.75); g.scale(z, z); g.translate(-VIEW_W / 2, -VIEW_H * 0.75);
    this.stage(g, t * 1.6, 1.1, 0, "#b48cff");
    const back = ["atp", "rougher", "smoother", "cytoplasm", "rna", "mitosis"], front = ["mito", "ribosome", "golgi", "nucleus", "membrane", "dna", "crispr"];
    back.forEach((id, i) => this.rc(g, id, 2, VIEW_W * (0.15 + i * 0.14), 400, 0.43));
    g.save(); g.fillStyle = "rgba(6,4,16,.28)"; g.fillRect(0, 0, VIEW_W, 404); g.restore();
    front.forEach((id, i) => { const x = VIEW_W * (0.08 + i * 0.14); this.glow(g, x, 400, 140, BYID[id].hex, 0.18); this.rc(g, id, 2, x, 500, id === "nucleus" ? 0.56 : 0.5); });
    for (const s of [-1, 1]) this.sparks(g, VIEW_W / 2 + s * 430, 500, t, 40, s * 7 + 50, { col: "#ffe38a", speed: 640, dir: -Math.PI / 2, arc: 0.5, grav: 700, life: 1.1, spread: 1.6, loop: true });
    g.restore();
    if (t < 0.1) this.flash(g, 0.8 * (1 - t / 0.1));
  },

  /* ---------------- the film ---------------- */
  draw(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#000"; g.fillRect(0, 0, VIEW_W, VIEW_H);
    const RC = S0("rc"); this.lb = t < RC ? 58 : Math.max(0, 58 * (1 - (t - RC) / 0.25)); const L = this.lb;
    const sh = SEC_LEN.map(([k]) => k).filter((k) => t >= S0(k)).pop(), l = t - S0(sh), d = T(SEC_LEN.find(([k]) => k === sh)[1]);
    // ---- ACT 1: INFECTION ----
    if (sh === "open") { // the stage the Rangers guard, barely lit
      this.shot(g, "stage", 0.5, 0.5, lerpK(l, 0, d, 1.0, 1.1, (u) => u), 0, { alpha: 0.22 * clamp(l / 1.5) }); this.motes(g, t, "#7cf7df", 40, 3, 10);
    } else if (sh === "rise") {
      const cy = l < d * 0.55 ? lerpK(l, 0, d * 0.55, 0.78, 0.3) : lerpK(l, d * 0.55, d, 0.3, 0.2), z = l < d * 0.55 ? lerpK(l, 0, d * 0.55, 1.55, 1.15) : lerpK(l, d * 0.55, d, 1.15, 1.6, eIn);
      this.shot(g, "phage-rise", 0.55, cy, z, lerpK(l, 0, d, -0.04, 0.02)); this.motes(g, t, "#9dff6a", 26, 9, 30);
      const [vx, vy] = this.pt(0.556, 0.135); this.glow(g, vx, vy, 120, "#9dff6a", 0.2 + 0.15 * Math.sin(t * 6) ** 2);
    } else if (sh === "inject") { const hit = T(2), trk = 5.0, [sx, sy] = this.shakeOff(l, [[hit, 1.1, 5]]);
      const cx = l < hit ? lerpK(l, 0, hit, 0.24, 0.36) : lerpK(l, trk, trk + 1.5, 0.36, 0.8), z = l < hit ? lerpK(l, 0, hit, 1.45, 1.65) : l < trk ? lerpK(l, hit, trk, 1.65, 1.5) : lerpK(l, trk, d, 1.5, 1.3);
      this.shot(g, "phage-inject", cx, 0.5, z, -0.02, { ox: sx, oy: sy, smear: l > trk && l < trk + 1.2 ? [-26, 0, 3] : null });
      const [mx, my] = this.pt(0.53, 0.5); this.sparks(g, mx, my, l - hit, 34, 11, { col: "#ff8fc8", speed: 460, life: 0.8, grav: 300, w: 3.4 });
      const [dx, dy] = this.pt(0.82, 0.48); this.glow(g, dx, dy, 220, "#7dff4a", l > hit ? 0.25 + 0.2 * Math.sin(t * 8) ** 2 : 0);
      if (l >= hit && l < hit + 0.09) this.flash(g, 0.7 * (1 - (l - hit) / 0.09));
    } else if (sh === "dna1") {
      this.shot(g, "dna1", 0.5, lerpK(l, 0, d, 0.3, 0.46), lerpK(l, 0, d, 1.0, 1.12)); const [gx, gy] = this.pt(0.45, 0.3); this.glow(g, gx, gy, 200, "#7dff4a", 0.18 + 0.12 * Math.sin(t * 5) ** 2);
    } else if (sh === "dna2") {
      this.shot(g, "dna2", 0.5, 0.52, lerpK(l, 0, d, 1.05, 1.42)); const [gx, gy] = this.pt(0.5, 0.52); this.glow(g, gx, gy, 260, "#7dff4a", 0.3 * Math.exp(-l * 1.5) + 0.12);
      if (l < 0.15) this.flash(g, 0.8 * (1 - l / 0.15), "#c6ff9a");
    } else if (sh === "visor") { const gl = T(3);
      let key = "visor1", gk = 0; if (l >= gl) { const f = Math.floor((l - gl) * 30); key = l - gl > 0.6 || hsh(f * 3.3) > 0.45 ? "visor2" : "visor1"; gk = l - gl < 0.6 ? 0.9 : Math.max(0, 0.25 - (l - gl - 0.6) * 0.3); }
      const z = lerpK(l, 0, d, 1.0, 1.4), [sx, sy] = this.shakeOff(l, [[gl, 0.5, 4]]); this.shot(g, key, 0.5, 0.36, z, 0, { ox: sx, oy: sy });
      if (key === "visor2") { const [ex, ey] = this.pt(0.5, 0.36); this.glow(g, ex, ey, 260, "#59ff3a", 0.25 + 0.15 * Math.sin(t * 11) ** 2); }
      this.glitch(g, gk, Math.floor(l * 30));
    // ---- ACT 2: TURNED ----
    } else if (sh === "blind") { const [sx, sy] = this.shakeOff(l, [[0, 1.4, 4.5]]);
      const z = lerpK(l, 0, 1.6, 1.55, 1.12, eOut) - lerpK(l, 1.6, d, 0, 0.06), cx = lerpK(l, 0, 1.6, 0.53, 0.5, eOut);
      this.shot(g, "lyso-blindside", cx, lerpK(l, 0, 1.6, 0.5, 0.46, eOut), z, lerpK(l, 0, 1.6, 0.05, 0.015, eOut), { ox: sx, oy: sy });
      const [px, py] = this.pt(0.555, 0.5); this.speedLines(g, px, py, clamp(1 - l / 0.5), 3); this.sparks(g, px, py, l, 30, 5, { col: "#a6ff4a", speed: 600, life: 0.6, grav: 200 });
      if (l < 0.1) this.flash(g, 0.9 * (1 - l / 0.1));
      const [hx, hy] = this.pt(0.8, 0.2); this.bubble(g, l, 0.7, 4.6, ["LYSO?! I MADE YOU!"], Math.min(hx, VIEW_W - 190), Math.max(L + 50, hy - 40), hx - 30, hy + 10);
    } else if (sh === "looms") { const up = 3.3;
      const cy = l < up ? lerpK(l, 0, up, 0.85, 0.32) : lerpK(l, up, d, 0.32, 0.24), z = l < up ? lerpK(l, 0, up, 1.4, 1.12) : lerpK(l, up, d, 1.12, 1.3), rot = lerpK(l, 0, d, -0.09, -0.035);
      this.shot(g, "phage-looms", 0.52, cy, z, rot); this.motes(g, t, "#9dff6a", 30, 21, -14);
      const [hx, hy] = this.pt(0.53, 0.15); this.glow(g, hx, hy, 160, "#9dff6a", 0.18 + 0.1 * Math.sin(t * 7) ** 2);
      this.bubble(g, l, 2.6, d - 0.05, ["ONE RANGER AT A TIME...", "THIS CELL IS MINE."], Math.min(VIEW_W - 220, hx + 230), Math.max(L + 70, hy - 10), hx + 40, hy + 10, { fill: "#16240f", ink: "#9dff6a", text: "#c6ff9a", size: 26 });
    // ---- ACT 3: STAND ----
    } else if (sh === "leap") { const whip = clamp(1 - l / 0.22);
      this.shot(g, "crispr-leap", 0.58 + whip * 0.3, lerpK(l, 0, d, 0.62, 0.34), lerpK(l, 0, d, 1.32, 1.14), 0.03, { smear: whip > 0 ? [80 * whip, 0, 4] : null });
      const [cx, cy] = this.pt(0.62, 0.4); this.speedLines(g, cx, cy, 0.55, 7 + Math.floor(l * 12), "#c7fff9");
      this.bubble(g, l, 0.4, d - 0.05, ["THEN I'LL CUT YOU OUT!"], 250, L + 70, cx - 80, cy - 90, { size: 32 });
    } else if (sh === "close") { const tr = Math.max(0, l - d + 0.5) * 2;
      const [sx, sy] = [(hsh(this.frame) - 0.5) * tr * 6, (hsh(this.frame + 5) - 0.5) * tr * 5];
      this.shot(g, "blade-stop-closeup", 0.45, 0.42, lerpK(l, 0, d, 1.12, 1.42, (u) => u), 0, { ox: sx, oy: sy });
      const [fx, fy] = this.pt(0.455, 0.36); this.sparks(g, fx, fy, l * 0.12 + 0.3, 60, 77, { col: "#ffd58a", speed: 900, life: 0.5, grav: 0, spread: 0.3, loop: true, w: 3 });
      this.glow(g, fx, fy, 160, "#fff4c8", 0.35); this.flash(g, 0.12, "#0a1430");
    } else if (sh === "wide") { const [sx, sy] = this.shakeOff(l, [[0, 1.6, 3.2]]), shud = Math.exp(-l * 2.5) * Math.sin(l * 70) * 0.012;
      this.shot(g, "blade-stop-wide", 0.55, 0.48, lerpK(l, 0, 0.9, 1.3, 1.06, eOut), shud, { ox: sx, oy: sy });
      const [cx, cy] = this.pt(0.6, 0.44); for (let k = 0; k < 3; k++) this.ring(g, cx, cy, (l - k * 0.12) / 0.9, 900, k ? "#7cf7df" : "#fff", 14, 0.42);
      const [gx, gy] = this.pt(0.6, 0.8); this.debris(g, gx, gy, l, 40, 3, "#5a4338", 600); this.debris(g, cx, cy + 60, l - 0.05, 18, 9, "#2e2430", 420);
      this.sparks(g, cx, cy, l, 70, 41, { col: "#ffd58a", speed: 900, life: 0.9, grav: 300 }); this.glow(g, cx, cy, 300, "#fff4c8", 0.6 * Math.exp(-l * 2));
      if (l < 0.16) this.flash(g, 1 - l / 0.16);
      const [px, py] = this.pt(0.72, 0.52); this.bubble(g, l, 1.4, d - 0.05, ["...CUTE."], Math.min(VIEW_W - 120, px + 120), py - 70, px + 20, py - 20, { fill: "#16240f", ink: "#9dff6a", text: "#c6ff9a", size: 34 });
    } else if (sh === "reflect") {
      this.shot(g, "visor-reflection", 0.56, 0.55, lerpK(l, 0, d, 1.08, 1.4), 0.0);
      const [rx, ry] = this.pt(0.52, 0.6); this.glow(g, rx, ry, 220, "#7dff4a", 0.12 + 0.1 * Math.sin(t * 5) ** 2);
    } else if (sh === "call") {
      const cx = lerpK(l, 0.2, 1.7, 0.74, 0.4), z = lerpK(l, 0.2, 1.7, 1.32, 1.16) + lerpK(l, 1.7, d, 0, 0.14), cy = lerpK(l, 0.2, 1.7, 0.5, 0.4);
      this.shot(g, "nucleus-call", cx, cy, z, 0);
      const [hx, hy] = this.pt(0.36, 0.22), bx = Math.min(VIEW_W - 200, hx + 270), by = Math.max(L + 70, hy + 10);
      this.bubble(g, l, 1.1, 4.6, ["ALL RANGERS.", "CELL PROTOCOL."], bx, by, hx + 60, hy + 30);
      this.bubble(g, l, 4.7, d - 0.02, ["FIND IT...", "OR FIGHT IT."], bx, by, hx + 60, hy + 30, { size: 36 });
      if (l > d - 0.25) this.flash(g, (l - d + 0.25) / 0.25);
    // ---- ROLL CALL ----
    } else if (sh === "rc") { const k = Math.floor(l / T(RC_BARS)); this.landing(g, l - k * T(RC_BARS), RC_ORDER[k], k);
    } else if (sh === "group") { this.group(g, l);
    } else if (sh === "lyso") { const two = T(2) - 0.01, fl = T(2) + 8 * STEP, lysoSub = (u) => (u > T(1.5) ? (u > T(1.75) || Math.floor(u * 14) % 3 ? "INFECTED" : "DIGESTS AND RECYCLES") : "DIGESTS AND RECYCLES");
      if (l >= fl && l < fl + 0.1) { this.shot(g, "visor2", 0.5, 0.36, 1.25); const [ex, ey] = this.pt(0.5, 0.36); this.glow(g, ex, ey, 300, "#59ff3a", 0.45); this.glitch(g, 0.8, this.frame); }
      else if (l >= fl + 0.1 && l < fl + 0.3) { this.landing(g, two, "lysosome", 1, { col: "#a0122e", red: true, sub: () => "INFECTED" }); this.glitch(g, 0.7, this.frame + 3); }
      else if (l < fl) { const z = l > T(2) ? lerpK(l, T(2), fl, 1, 1.14) : 1; g.save(); g.translate(VIEW_W / 2 + 120, VIEW_H * 0.35); g.scale(z, z); g.translate(-(VIEW_W / 2 + 120), -VIEW_H * 0.35);
        this.landing(g, Math.min(l, two), "lysosome", 1, { col: "#a0122e", red: true, sub: lysoSub }); g.restore();
        if (l > T(1.6)) this.glitch(g, 0.16, this.frame); }
      // after the flicker: black, then the logo
    }
    this.vignette(g, t < RC + 0.3 ? 0.55 : 0.35);
    this.grain(g, 0.045);
    if (L > 0) { g.fillStyle = "#000"; g.fillRect(0, 0, VIEW_W, L); g.fillRect(0, VIEW_H - L, VIEW_W, L); }
    this.post(g, t);
    if (t < 0.6) this.flash(g, 1 - t / 0.6, "#000");
  },
  /* captions (bottom letterbox) and science tags (top): [section, from, to, text, colour]. Times are within the section;
     a negative "to" counts back from the section's end. Each stays up long enough to be read: see readTimes() */
  TEXT: [["open", 0.3, -0.05, "Inside every living cell, an army stands guard."],
    ["rise", 0.3, 5.0, "A BACTERIOPHAGE: a virus that hunts cells.", "#c6ff9a"], ["rise", 5.1, -0.1, "It can't copy itself. It needs a cell."],
    ["inject", 0.25, 5.3, "It grips the cell membrane and punches through..."], ["inject", 5.35, -0.1, "...then injects its own DNA.", "#c6ff9a"],
    ["dna1", 0.3, -0.1, "But this virus doesn't attack. Not yet."],
    ["dna2", 0.3, 5.3, "It splices itself into the cell's own DNA."], ["dna2", 5.4, -0.1, "Now it's a PROPHAGE: a sleeper, waiting.", "#c6ff9a"],
    ["dna2", 5.6, -0.1, "THIS IS THE LYSOGENIC CYCLE", null, "tag"],
    ["visor", 0.3, 3.9, "Until the signal comes."], ["visor", 4.4, -0.1, "And the sleeper wakes up inside a Ranger.", "#c6ff9a"],
    ["blind", 3.0, -0.1, "LYSOSOMES BUD OFF THE GOLGI APPARATUS", null, "tag"],
    ["reflect", 0.4, -0.1, "BACTERIA REALLY USE CRISPR TO CUT UP VIRUS DNA", null, "tag"]],
  post(g, t) {
    if (this.lb <= 0) return;
    for (const [k, a, b, s, c, kind] of this.TEXT) { const s0 = S0(k), e = b < 0 ? S0(k) + T(SEC_LEN.find(([n]) => n === k)[1]) + b : s0 + b; this[kind || "caption"](g, t, s0 + a, e, s, c || undefined); }
  },
};
