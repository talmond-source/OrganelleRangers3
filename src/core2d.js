/* ================= Organelle Rangers 3 · 2D core: helpers, canvas view, sprites, particles, drawables ================= */
const $ = (s) => document.querySelector(s);
const $id = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const ss = (t, a, b) => smooth(seg(t, a, b));
const TAU = Math.PI * 2;
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
class Vec { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z = 0) { this.x = x; this.y = y; this.z = z; return this; } clone() { return new Vec(this.x, this.y, this.z); } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); } setScalar(s) { this.x = this.y = this.z = s; return this; } }
const V3 = (x = 0, y = 0, z = 0) => new Vec(x, y, z);
const hexRGB = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
const lighten = (h, k) => { const [r, g, b] = hexRGB(h); const f = (c) => Math.round(c + (255 - c) * k); return `rgb(${f(r)},${f(g)},${f(b)})`; };

/* ---------------- the canvas view: world is in metres, x = 0 at the arena centre, y = 0 on the floor ---------------- */
const VIEW_W = 960, VIEW_H = 540, FLOOR_Y = 474;
const VIEW = {
  init(host) {
    this.c = document.createElement("canvas"); this.c.id = "game"; this.c.width = VIEW_W; this.c.height = VIEW_H; host.prepend(this.c);
    this.x = this.c.getContext("2d", { alpha: false }); this.camX = 0; this.S = 112; this.shake = 0; this.impact = 0; this.flash = 0; this.bg = null; this.tint = null; this.t = 0;
  },
  sx(x) { return VIEW_W / 2 + (x - this.camX) * this.S; },
  sy(y) { return FLOOR_Y - y * this.S; },
  begin(dt) {
    const g = this.x; this.t += dt; g.setTransform(1, 0, 0, 1, 0, 0);
    this.ox = this.shake > 0.01 ? (Math.random() - 0.5) * this.shake * 40 : 0; this.oy = this.shake > 0.01 ? (Math.random() - 0.5) * this.shake * 30 : 0;
    this.shake = Math.max(0, this.shake - dt * 1.6);
    g.translate(this.ox, this.oy);
    this.drawBackground();
  },
  setStage(id) { this.bg = STAGE_ART[id] || STAGE_ART.environment; this.stageId = id; },
  drawBackground() {
    const g = this.x, img = this.bg; g.fillStyle = "#07060c"; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80);
    if (img && img.complete && img.naturalWidth) {
      // parallax: the painted city scrolls slower than the floor
      const h = FLOOR_Y + 40, w = h * img.naturalWidth / img.naturalHeight, off = ((this.camX * this.S * 0.35) % w + w) % w;
      for (let x = -off - w; x < VIEW_W + w; x += w) g.drawImage(img, x, -20, w, h);
      const sh = g.createLinearGradient(0, 0, 0, FLOOR_Y); sh.addColorStop(0, "rgba(5,8,20,.55)"); sh.addColorStop(0.65, "rgba(5,8,20,.18)"); sh.addColorStop(1, "rgba(5,8,20,.45)"); g.fillStyle = sh; g.fillRect(-40, -40, VIEW_W + 80, FLOOR_Y + 40);
    }
    // arena floor: lab plating that matches the Cell Rescue platforms
    const fy = FLOOR_Y; g.fillStyle = "#0a182b"; g.fillRect(-40, fy, VIEW_W + 80, VIEW_H - fy + 40); g.fillStyle = "#6ecbbf"; g.fillRect(-40, fy, VIEW_W + 80, 3); g.fillStyle = "#a8fbe1"; g.fillRect(-40, fy, VIEW_W + 80, 1);
    const tile = 1.0 * this.S, start = Math.floor((this.camX - 6) / 1.0);
    for (let i = start; i < start + 14; i++) { const x = this.sx(i * 1.0); g.fillStyle = "#1c3550"; g.fillRect(x + 4, fy + 9, tile - 8, 4); g.fillStyle = "#0f1f34"; g.fillRect(x - 1, fy + 5, 2, VIEW_H - fy); g.fillStyle = "#243c56"; g.fillRect(x + 6, fy + 22, tile - 12, 30); g.fillStyle = "#3f617a"; g.fillRect(x + 8, fy + 24, tile - 16, 1); }
    // arena walls at ±HALF
    for (const s of [-1, 1]) { const x = this.sx(s * (HALF + 0.35)); if (x > -60 && x < VIEW_W + 60) { g.fillStyle = "rgba(124,247,223,.12)"; g.fillRect(x - 6, 0, 12, fy); g.fillStyle = "rgba(124,247,223,.5)"; for (let y = 10; y < fy; y += 18) g.fillRect(x - 1, y, 2, 9); } }
  },
  end(dt) {
    const g = this.x;
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(0.85, this.flash * 6)})`; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80); this.flash -= dt; }
    if (this.impact > 0) { this.impact -= dt; FX2D.impactDraw(g, Math.floor(this.impact * 30) % 2 === 1); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  },
};

/* ---------------- sprites: Cell Rescue art, rebuilt at fighting-game scale ---------------- */
const SPR = { img: {}, port: {}, ready: false, extra: {} };
const FIGHTER_H = 1.85; // metres, idle height
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function loadSprites(progress) {
  const ids = [...ROSTER.map((r) => r.id), "phage"]; let n = 0;
  for (const id of ids) {
    SPR.img[id] = await loadImage(SPRITE_DATA[id]);
    if (SPRITE_DATA[id + "-portrait"]) SPR.port[id] = await loadImage(SPRITE_DATA[id + "-portrait"]);
    if (SPRITE_DATA[id + "-extra"]) SPR.extra[id] = await loadImage(SPRITE_DATA[id + "-extra"]);
    progress && progress(++n, ids.length);
  }
  SPR.ready = true;
}
/* draw one atlas frame with its feet at world (x, y). opts: rot (radians, + = lean forward), pivot height (m), alpha, scale, flip, tint */
function drawFrame(g, id, frame, x, y, face, o = {}) {
  const boss = id === "phage", sheet = o.extra ? SPR.extra[id] : SPR.img[id]; if (!sheet) return;
  const cw = boss ? SPRITE_META.phageCell[0] : SPRITE_META.cell[0], ch = boss ? SPRITE_META.phageCell[1] : SPRITE_META.cell[1], base = boss ? SPRITE_META.phageBase : SPRITE_META.base;
  const cols = 4, sx = (frame % cols) * cw, sy = Math.floor(frame / cols) * ch;
  const px = VIEW.S * FIGHTER_H / SPRITE_META.target * (o.scale || 1);
  const dir = boss ? -face : face; // the Phage sheet faces left
  g.save(); g.globalAlpha = o.alpha ?? 1; g.translate(VIEW.sx(x), VIEW.sy(y) + (o.drop || 0) * VIEW.S);
  if (o.rot) { const pv = (o.pivot ?? 0.95) * VIEW.S; g.translate(0, -pv); g.rotate(o.rot * face); g.translate(0, pv); }
  g.scale(dir * px, px);
  if (o.squash) g.scale(1, o.squash);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  if (o.silhouette) { const c = silhouette(id, frame, o.silhouette, boss); g.drawImage(c, -cw / 2, -base); }
  else g.drawImage(sheet, sx, sy, cw, ch, -cw / 2, -base, cw, ch);
  if (o.flash > 0) { g.globalAlpha = Math.min(1, o.flash * 8); g.drawImage(silhouette(id, frame, "#ffffff", boss), -cw / 2, -base); }
  g.restore();
}
const _sil = {};
function silhouette(id, frame, color, boss) {
  const k = id + ":" + frame + ":" + color; if (_sil[k]) return _sil[k];
  const cw = boss ? SPRITE_META.phageCell[0] : SPRITE_META.cell[0], ch = boss ? SPRITE_META.phageCell[1] : SPRITE_META.cell[1];
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d");
  g.drawImage(SPR.img[id], (frame % 4) * cw, Math.floor(frame / 4) * ch, cw, ch, 0, 0, cw, ch); g.globalCompositeOperation = "source-atop"; g.fillStyle = color; g.fillRect(0, 0, cw, ch);
  return (_sil[k] = c);
}

/* ---------------- particles (same calls the move code uses) ---------------- */
class Particles2D {
  constructor() { this.list = []; }
  add(p) { p.t = 0; this.list.push(p); return p; }
  clear() { this.list = []; }
  spark(pos, color, size = 0.2, vel, life = 0.4) { return this.add({ k: "spark", x: pos.x, y: pos.y, vx: vel ? vel.x : 0, vy: vel ? vel.y : 0, size, color, life, drag: 2 }); }
  gather(pos, color, r = 1.1) { const a = Math.random() * TAU; return this.add({ k: "dot", x: pos.x + Math.cos(a) * r, y: pos.y + Math.sin(a) * r, vx: -Math.cos(a) * r / 0.22, vy: -Math.sin(a) * r / 0.22, size: 0.07, color, life: 0.22 }); }
  ring(pos, color, size = 0.3, grow = 10, life = 0.25) { return this.add({ k: "ring", x: pos.x, y: pos.y, size, grow, color, life }); }
  streak(pos, color, len, width, vel, life) { return this.add({ k: "streak", x: pos.x, y: pos.y, vx: vel.x, vy: vel.y, len, width, color, life, drag: 3 }); }
  fan(pos, color, dir, n = 7, speed = 9, spread = 0.9) { for (let i = 0; i < n; i++) { const a = (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * spread, v = speed * (0.6 + Math.random() * 0.7); this.streak(pos, i % 3 ? color : "#ffffff", 0.3 + Math.random() * 0.3, 0.05, V3(Math.cos(a) * v, Math.sin(a) * v), 0.14 + Math.random() * 0.1); } }
  hit(pos, color = "#ffffff", big = 1) {
    this.add({ k: "flash", x: pos.x, y: pos.y, size: 0.55 * big, color: "#ffffff", life: 0.09 });
    this.add({ k: "ring", x: pos.x, y: pos.y, size: 0.25 * big, grow: 9 * big, color, life: 0.22 });
    for (let i = 0; i < 10 * big; i++) { const a = Math.random() * TAU, v = 6 + Math.random() * 9 * big; this.streak(pos, i % 2 ? color : "#ffffff", 0.25 + Math.random() * 0.35 * big, 0.06, V3(Math.cos(a) * v, Math.sin(a) * v), 0.12 + Math.random() * 0.12); }
    this.add({ k: "star", x: pos.x, y: pos.y, size: 0.42 * big, color, life: 0.14, rot: Math.random() });
  }
  block(pos) { this.add({ k: "hex", x: pos.x, y: pos.y, size: 0.42, color: "#8ad8ff", life: 0.18, grow: 1.5 }); this.add({ k: "flash", x: pos.x, y: pos.y, size: 0.3, color: "#bfefff", life: 0.07 }); }
  dust(pos, n = 8) { for (let i = 0; i < n; i++) this.add({ k: "puff", x: pos.x + (Math.random() - 0.5) * 0.6, y: 0.08, vx: (Math.random() - 0.5) * 3, vy: 0.4 + Math.random() * 0.8, size: 0.2 + Math.random() * 0.15, grow: 1.8, color: "#9b8fc0", life: 0.55, drag: 3 }); }
  boom(pos, color, scale = 1) {
    this.add({ k: "flash", x: pos.x, y: pos.y + 0.4 * scale, size: 1.2 * scale, color, life: 0.18 });
    this.add({ k: "ring", x: pos.x, y: pos.y + 0.3 * scale, size: 0.4 * scale, grow: 7 * scale, color, life: 0.35 });
    for (let i = 0; i < 18 * scale; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 6 * scale; this.add({ k: "spark", x: pos.x, y: pos.y + 0.3 * scale, vx: Math.cos(a) * v, vy: Math.abs(Math.sin(a)) * v, size: 0.12 + Math.random() * 0.14, color: i % 3 ? color : "#ffffff", life: 0.35 + Math.random() * 0.3, drag: 2, grav: 6 }); }
    for (let i = 0; i < 6 * scale; i++) this.add({ k: "puff", x: pos.x + (Math.random() - 0.5) * scale, y: pos.y + Math.random() * scale, vx: (Math.random() - 0.5) * 2, vy: 0.5 + Math.random(), size: 0.3 * scale, grow: 2, color: rgba(color, 0.5), life: 0.6, drag: 2 });
  }
  bolt(a, b, color = "#9fe8ff", life = 0.12) { const pts = []; const n = 7; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a.x, b.x, t) + (i && i < n ? (Math.random() - 0.5) * 0.3 : 0), lerp(a.y, b.y, t) + (i && i < n ? (Math.random() - 0.5) * 0.3 : 0)]); } return this.add({ k: "bolt", pts, color, life }); }
  update(dt) {
    for (const p of this.list) { p.t += dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += (p.vy || 0) * dt; if (p.drag) { p.vx *= Math.max(0, 1 - p.drag * dt); p.vy *= Math.max(0, 1 - p.drag * dt); } if (p.grav) p.vy -= p.grav * dt; } }
    this.list = this.list.filter((p) => p.t < p.life);
  }
  draw(g) {
    const S = VIEW.S;
    g.save(); g.globalCompositeOperation = "lighter";
    for (const p of this.list) {
      const k = 1 - p.t / p.life, x = VIEW.sx(p.x), y = VIEW.sy(p.y);
      if (p.k === "spark" || p.k === "dot") { const r = Math.max(1, p.size * S * (p.k === "dot" ? 1 : 0.5 + k * 0.5)); g.fillStyle = p.color; g.globalAlpha = k; g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.fill(); g.globalAlpha = k * 0.35; g.beginPath(); g.arc(x, y, r * 1.3, 0, TAU); g.fill(); }
      else if (p.k === "streak") { const ang = Math.atan2(-p.vy, p.vx), L = p.len * S * k; g.globalAlpha = k; g.strokeStyle = p.color; g.lineWidth = Math.max(1, p.width * S * k); g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L); g.stroke(); }
      else if (p.k === "ring") { const r = (p.size + (1 - k) * p.grow * 0.1) * S; g.globalAlpha = k; g.strokeStyle = p.color; g.lineWidth = Math.max(1.5, 6 * k); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
      else if (p.k === "flash") { const r = p.size * S * (1.2 - k * 0.2); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba("#ffffff", k)); gr.addColorStop(0.35, p.color.startsWith("#") ? rgba(p.color, k * 0.8) : p.color); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      else if (p.k === "star") { const r = p.size * S * (0.6 + (1 - k) * 0.8); g.globalAlpha = k; g.fillStyle = "#ffffff"; g.beginPath(); for (let i = 0; i < 16; i++) { const a = p.rot + i * TAU / 16, rr = i % 2 ? r * 0.22 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
      else if (p.k === "hex") { const r = p.size * S * (1 + (1 - k) * (p.grow - 1)); g.globalAlpha = k; g.strokeStyle = p.color; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); }
      else if (p.k === "puff") { const r = p.size * S * (1 + (1 - k) * (p.grow - 1)); g.globalCompositeOperation = "source-over"; g.globalAlpha = k * 0.5; g.fillStyle = p.color; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalCompositeOperation = "lighter"; }
      else if (p.k === "bolt") { g.globalAlpha = k; g.strokeStyle = p.color; g.lineWidth = 3; g.beginPath(); p.pts.forEach(([px, py], i) => (i ? g.lineTo(VIEW.sx(px), VIEW.sy(py)) : g.moveTo(VIEW.sx(px), VIEW.sy(py)))); g.stroke(); g.strokeStyle = "#ffffff"; g.lineWidth = 1.2; g.stroke(); }
    }
    g.restore();
  }
}

/* ---------------- drawables: projectiles and props, drawn in world metres ---------------- */
class Drawable {
  constructor(draw) { this.drawFn = draw; this.visible = true; this.rotation = { x: 0, y: 0, z: 0 }; this.scale = V3(1, 1, 1); this.position = V3(); this.children = []; }
  add(...c) { this.children.push(...c); return this; }
  draw(g, x, y) { if (!this.visible) return; g.save(); g.translate(VIEW.sx(x + this.position.x), VIEW.sy(y + this.position.y)); g.rotate(-this.rotation.z); g.scale(this.scale.x * VIEW.S, this.scale.y * VIEW.S); this.drawFn && this.drawFn(g); for (const c of this.children) { g.save(); g.translate(c.position.x, -c.position.y); g.rotate(-c.rotation.z); g.scale(c.scale.x, c.scale.y); c.drawFn && c.drawFn(g); g.restore(); } g.restore(); }
}
const glowDot = (g, r, color, a = 0.8) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, rgba("#ffffff", a)); gr.addColorStop(0.3, rgba(color, a * 0.7)); gr.addColorStop(1, rgba(color, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); };
const ball = (g, x, y, r, fill, edge) => { g.beginPath(); g.arc(x, -y, r, 0, TAU); g.fillStyle = fill; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = r * 0.18; g.stroke(); } };
function orb(col, r = 0.16, glow = 0.6) { return new Drawable((g) => { glowDot(g, r * 3.2, col, glow); const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, lighten(col, 0.7)); gr.addColorStop(1, col); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = r * 0.12; g.stroke(); }); }
function vesicle(col, r = 0.2) { return new Drawable((g) => { glowDot(g, r * 2.4, col, 0.4); g.fillStyle = rgba(col, 0.45); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = lighten(col, 0.5); g.lineWidth = r * 0.16; g.stroke(); g.strokeStyle = rgba(col, 0.9); g.lineWidth = r * 0.08; g.beginPath(); g.arc(0, 0, r * 0.82, 0, TAU); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(r * 0.15, r * 0.1, r * 0.32, 0, TAU); g.fill(); }); }
function glowSprite(col, size = 1) { return new Drawable((g) => glowDot(g, size / 2, col, 0.7)); }
function phosphateModel(scale = 1) { return new Drawable((g) => { const s = scale; glowDot(g, 0.42 * s, "#ffd36b", 0.6); for (const [dx, dy] of [[0, -1], [0.94, 0.33], [-0.94, 0.33], [0, 0.6]]) { g.strokeStyle = "#ffe0b0"; g.lineWidth = 0.025 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(dx * 0.17 * s, dy * 0.17 * s); g.stroke(); ball(g, dx * 0.18 * s, -dy * 0.18 * s, 0.07 * s, "#ff4f5e", "#5a0c0c"); } ball(g, 0, 0, 0.12 * s, "#f2a23a", "#6b3a05"); g.fillStyle = "#3a1d00"; g.font = `900 ${0.15 * s}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("P", 0, 0.01 * s); }); }
const AA_COLORS = ["#f1c746", "#22b8b1", "#d74780", "#7b6cf0", "#3fae7a", "#f08a3c", "#e8505b", "#a9c3ff"];
function trnaModel(aaColor = "#f1c746") { return new Drawable((g) => { glowDot(g, 0.55, "#ff8090", 0.4); g.lineCap = "round"; g.strokeStyle = "#e8505b"; g.lineWidth = 0.12; g.beginPath(); g.moveTo(-0.12, -0.3); g.lineTo(-0.12, 0.3); g.moveTo(-0.12, -0.3); g.lineTo(0.48, -0.3); g.stroke(); g.strokeStyle = "#f4efe6"; g.lineWidth = 0.05; g.beginPath(); g.arc(-0.12, 0.38, 0.09, 0, TAU); g.stroke(); ["#3fae7a", "#3460e0", "#f2b631"].forEach((c, i) => { g.fillStyle = c; g.fillRect(-0.24 + i * 0.08, 0.47, 0.06, 0.1); }); ball(g, 0.55, 0.3, 0.12, aaColor, "#2b1d04"); }); }
function aminoBead(i, r = 0.08) { const c = AA_COLORS[i % AA_COLORS.length]; return new Drawable((g) => { glowDot(g, r * 2.2, c, 0.4); ball(g, 0, 0, r, c, "#1a1206"); }); }
/* a molecule icon from the Cell Rescue art, drawn at world size */
function iconModel(key, size = 0.5, variant = 0) { return new Drawable((g) => { const ic = moleculeIcon(key, variant); g.save(); g.scale(size / 34, size / 34); g.imageSmoothingEnabled = true; g.drawImage(ic, -17, -17); g.restore(); }); }

/* ---------------- stage art ---------------- */
const STAGE_ART = {};
function loadStages() { for (const [k, src] of Object.entries(STAGE_DATA)) { const i = new Image(); i.src = src; STAGE_ART[k] = i; } }
