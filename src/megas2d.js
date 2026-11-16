/* ================= Megaform ultimates: the Ranger summons its giant organelle (pixel art drawn from the real structure) ================= */
const MEGA_RES = 128; // the Megaform is drawn at this size, then scaled up with hard pixels for the arcade look
const MEGA_ART = {
  atp: (g) => { g.save(); g.translate(64, 64); g.scale(3.4, 3.4); g.lineJoin = "round"; g.lineCap = "round"; MOLECULE_ART.atp(g); g.restore(); },
  ribosome: (g) => { // large and small subunit with the mRNA threaded between and the new chain leaving the top
    dgEll(g, 64, 50, 46, 30, 0, "#d84a5c", "#ffb0bc", 2.5); dgEll(g, 64, 88, 36, 17, 0, "#ff7a8c", "#ffd0d8", 2.5);
    g.beginPath(); for (let x = 6; x <= 122; x += 2) g.lineTo(x, 72 + Math.sin(x / 7) * 3); g.strokeStyle = "#c9b0ff"; g.lineWidth = 3; g.stroke();
    ["A", "U", "G", "G", "C", "U", "U", "U", "C"].forEach((b, i) => { g.fillStyle = BASE_COL[b]; g.fillRect(10 + i * 12, 75, 7, 6); });
    for (let i = 0; i < 6; i++) dgCirc(g, 64 + Math.sin(i * 1.3) * 8, 20 - i * 3.2, 4.4, AA_COLORS[i % AA_COLORS.length], "#1a1206", 1); },
  rougher: (g) => { dgRoughER(g, 18, 64, 34, -1.2, 1.2, 4); },
  golgi: (g) => { dgGolgi(g, 14, 30, 100, 76); for (const [x, y] of [[8, 104], [116, 22], [120, 96]]) dgVesicle(g, x, y, 6); },
  cytoplasm: (g) => { dgEll(g, 64, 64, 58, 50, 0, "#1d5f8a", "#ff89bd", 3); dgMito(g, 40, 82, 34, 14, -0.3); dgMito(g, 92, 46, 28, 12, 0.5); dgLyso(g, 86, 90, 8); dgVesicle(g, 34, 40, 6); dgGolgi(g, 56, 30, 30, 22);
    const r = dgSeeded(3); for (let i = 0; i < 26; i++) dgCirc(g, 18 + r() * 92, 22 + r() * 84, 1.2, "#9fe8ff"); },
  membrane: (g) => { for (let x = 6; x <= 122; x += 10) { dgPhospholipid(g, x, 34, true, 1.4); dgPhospholipid(g, x, 94, false, 1.4); } dgEll(g, 64, 64, 12, 34, 0, "#4f8fe0", "#bcd8ff", 2); dgEll(g, 26, 64, 7, 26, 0, "#9b6cff", "#e0cfff", 2); },
  mito: (g) => { dgMito(g, 64, 64, 120, 60, -0.2); },
  nucleus: (g) => { dgNucleus(g, 64, 64, 54, 50); },
  smoother: (g) => { dgSmoothER(g, 6, 22, 116, 84); },
  lysosome: (g) => { dgLyso(g, 64, 64, 56); dgText(g, "pH 5", 64, 66, 18, "#ffe1ea", "center", 900); },
  dna: (g) => { // a short stretch of the double helix, bases colored by letter
    const seq = "ATGCGTACGCTA"; for (let i = 0; i < 12; i++) { const y = 8 + i * 10, ph = i * 0.62, x1 = 64 + Math.sin(ph) * 34, x2 = 64 - Math.sin(ph) * 34; dgLine(g, [[x1, y], [64, y]], BASE_COL[seq[i]], 4); dgLine(g, [[64, y], [x2, y]], BASE_COL[{ A: "T", T: "A", G: "C", C: "G" }[seq[i]]], 4); }
    for (const s of [1, -1]) { g.beginPath(); for (let y = 4; y <= 124; y += 2) g.lineTo(64 + s * Math.sin((y - 8) / 10 * 0.62) * 34, y); g.strokeStyle = s > 0 ? "#3d7bf0" : "#ff9f43"; g.lineWidth = 5; g.stroke(); } },
  rna: (g) => { dgTRNA(g, 64, 116, "UAC", "Met", 1.15); },
  mitosis: (g) => { dgMitosisCell(g, 64, 64, "anaphase", 58); },
  crispr: (g) => { g.save(); g.translate(64, 60); g.scale(3.4, 3.4); g.lineJoin = "round"; g.lineCap = "round"; MOLECULE_ART.cas9(g); g.restore(); },
  phage: (g) => { dgPhage(g, 64, 78, 2.1, 0); },
};
const _megaCache = {};
function megaArt(id) {
  if (_megaCache[id]) return _megaCache[id];
  const c = document.createElement("canvas"); c.width = c.height = MEGA_RES; const g = c.getContext("2d"); (MEGA_ART[id] || MEGA_ART.nucleus)(g);
  // hard dark outline so the shape reads against any background
  const o = document.createElement("canvas"); o.width = o.height = MEGA_RES + 8; const q = o.getContext("2d");
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [-2, 2], [2, -2]]) q.drawImage(c, 4 + dx, 4 + dy);
  q.globalCompositeOperation = "source-in"; q.fillStyle = "#07060c"; q.fillRect(0, 0, o.width, o.height); q.globalCompositeOperation = "source-over"; q.drawImage(c, 4, 4);
  return (_megaCache[id] = o);
}
// how each Megaform attacks: beam, barrage of molecules, a whip/chain, swallowing the opponent, a slam or a drill
const MEGA_STYLE = {
  atp: { kind: "beam", col: "#ffd36b" }, ribosome: { kind: "chain", col: "#ff8fa0" }, rougher: { kind: "barrage", icon: "vesicleOrange", col: "#ffb071" },
  golgi: { kind: "barrage", icon: "vesicleGold", col: "#fff0b0" }, cytoplasm: { kind: "engulf", col: "#2f7fe0" }, membrane: { kind: "engulf", col: "#ff89bd" },
  mito: { kind: "beam", col: "#7fe8ff" }, nucleus: { kind: "slam", col: "#b48cff" }, smoother: { kind: "barrage", icon: "calcium", col: "#7ff1e2" },
  lysosome: { kind: "engulf", col: "#9bd13a" }, dna: { kind: "drill", col: "#ffd23f" }, rna: { kind: "chain", col: "#c9b0ff" },
  mitosis: { kind: "slam", col: "#ff5fd0" }, crispr: { kind: "beam", col: "#13c9c6" }, phage: { kind: "slam", col: "#b5d737" },
};
function megaCine(game, att, def) {
  const st = MEGA_STYLE[att.id] || MEGA_STYLE.nucleus, F = () => att.face;
  att.set("cine"); def.set("cine"); att.vx = def.vx = 0; att.y = def.y = 0;
  att.face = def.x >= att.x ? 1 : -1; def.face = -att.face;
  const want = att.x + att.face * 4.2; def.x = clamp(want, -HALF + 0.5, HALF - 0.5); if (Math.abs(def.x - att.x) < 3) att.x = clamp(def.x - att.face * 4.2, -HALF + 0.5, HALF - 0.5);
  const ultName = (MOVES[att.id] && MOVES[att.id].ult && MOVES[att.id].ult.name) || "Megaform";
  FX2D.banner(ultName.toUpperCase() + "!", att.info.hex, "MEGAFORM · " + att.info.name, att.face); HUD.science(att, ultName);
  const P = game.parts, art = megaArt(att.id), HIT = 3.0, DUR = 4.6;
  const c = { att, def, dmg: 35, t: 0, camX: (att.x + def.x) / 2, camS: 98, fired: {},
    once(k, t) { if (this.t >= t && !this.fired[k]) { this.fired[k] = 1; return true; } return false; },
    megaPos() { const t = this.t, rise = ss(t, 0.45, 1.35); let x = att.x - att.face * 0.9, y = lerp(-2.5, 1.9, rise), s = lerp(0.2, 1, rise);
      if (st.kind === "slam") { const k = ss(t, 1.6, HIT); x = lerp(x, def.x, k); y = lerp(1.9, k < 1 ? 3.2 - k * 2.0 : 1.0, ss(t, 1.4, 1.8)) - (k > 0.85 ? (k - 0.85) * 4 : 0); }
      if (st.kind === "drill") { const k = ss(t, 1.7, HIT); x = lerp(x, def.x - att.face * 0.6, k); y = lerp(1.9, 1.1, k); }
      if (st.kind === "engulf") { const k = ss(t, 1.6, 2.6); x = lerp(x, def.x, k); y = lerp(1.9, 1.0, k); s = lerp(s, 1.25, k); }
      const out = ss(t, HIT + 0.6, DUR); return { x, y, s: s * (1 - out * 0.4), a: 1 - out }; },
    step(dt) {
      this.t += dt; const t = this.t, m = this.megaPos();
      att.cineAnim = AN("charge", t * 30); def.cineAnim = t > 1.6 ? AN("hitHigh", (t * 30) % 12) : AN("idle", t * 30);
      if (t < 0.5 && Math.random() < 0.8) P.gather(V3(att.x, 1.1, 0), att.info.hex, 1.4);
      if (this.once("rise", 0.45)) { game.sfx("boom"); P.boom(V3(att.x - att.face * 0.9, 0, 0), att.info.hex, 1.2); VIEW.shake = 0.3; }
      if (t > 1.5 && t < HIT) {
        if (st.kind === "beam" && Math.random() < 0.9) P.spark(V3(def.x + (Math.random() - 0.5) * 0.4, 1.0 + Math.random() * 0.8, 0), st.col, 0.25, V3(att.face * 4, (Math.random() - 0.5) * 3, 0), 0.25);
        if (st.kind === "barrage" && this.once("b" + Math.floor(t * 8), 0)) { (this.shots = this.shots || []).push({ t: 0, y0: m.y + (Math.random() - 0.5) * 0.8, dy: (Math.random() - 0.5) * 0.6 }); game.sfx("shoot"); }
        if (Math.random() < 0.15) { def.flash = 0.06; game.sfx("hit"); P.hit(V3(def.x, 0.9 + Math.random() * 0.9, 0), st.col, 0.7); }
      }
      for (const s of this.shots || []) s.t += dt;
      if (this.once("impact", HIT)) { FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(1.1) / VIEW_H; VIEW.impact = 0.34; VIEW.shake = 0.6; game.sfx("impact"); P.boom(V3(def.x, 0.6, 0), st.col, 2.2); P.hit(V3(def.x, 1.1, 0), "#ffffff", 2.2); def.flash = 0.2; }
      return t >= DUR;
    },
    draw(g) {
      const t = this.t, m = this.megaPos(), S = VIEW.S, dark = ss(t, 0, 0.4) * (1 - ss(t, HIT + 0.5, DUR));
      // darken the arena, then redraw both fighters on top so they stay readable
      g.save(); g.fillStyle = `rgba(4,3,12,${0.62 * dark})`; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80);
      const cx = VIEW.sx(m.x), cy = VIEW.sy(m.y), size = 2.9 * S * m.s;
      // speed lines radiating from the Megaform
      g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.35 * dark; g.strokeStyle = st.col; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + t * 0.6, r0 = size * 0.62, r1 = size * (1.4 + (i % 3) * 0.3); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, size * 0.85); gr.addColorStop(0, rgba(st.col, 0.55 * m.a)); gr.addColorStop(1, rgba(st.col, 0)); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, size * 0.85, 0, TAU); g.fill();
      g.globalCompositeOperation = "source-over"; g.restore();
      drawFighter(g, att); drawFighter(g, def);
      // attack effects between the Megaform and the target
      const tx = VIEW.sx(def.x), ty = VIEW.sy(1.15);
      if (st.kind === "beam" && t > 1.5 && t < HIT + 0.15) { const w = (18 + Math.sin(t * 60) * 4) * (t > HIT ? 1.8 : 1); g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.strokeStyle = rgba(st.col, 0.75); g.lineWidth = w; g.beginPath(); g.moveTo(cx, cy); g.lineTo(tx, ty); g.stroke(); g.strokeStyle = "#ffffff"; g.lineWidth = w * 0.35; g.stroke(); g.restore(); }
      if (st.kind === "chain" && t > 1.5) { const k = ss(t, 1.5, 2.3), n = 18; for (let i = 0; i < n; i++) { const u = i / (n - 1) * k, wrap = ss(t, 2.2, 2.9) * (i > n * 0.55 ? 1 : 0), a = i * 0.9 + t * 6; const x = lerp(cx, tx, u) + Math.cos(a) * 0.5 * S * wrap, y = lerp(cy, ty, u) + Math.sin(a) * 0.35 * S * wrap + Math.sin(u * 12 + t * 10) * 6 * (1 - wrap);
          g.fillStyle = AA_COLORS[i % AA_COLORS.length]; g.strokeStyle = "#1a1206"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 0.1 * S, 0, TAU); g.fill(); g.stroke(); } }
      if (st.kind === "barrage") for (const s of this.shots || []) { const u = clamp(s.t / 0.35); if (u >= 1) continue; const x = lerp(cx, tx, u), y = lerp(VIEW.sy(s.y0), ty + s.dy * S, u); g.save(); g.imageSmoothingEnabled = false; g.drawImage(moleculeIcon(st.icon), x - 0.32 * S, y - 0.32 * S, 0.64 * S, 0.64 * S); g.restore(); }
      if (st.kind === "engulf" && t > 2.1 && t < HIT + 0.3) { g.save(); g.globalAlpha = 0.45; g.fillStyle = st.col; g.beginPath(); g.arc(tx, ty, 1.1 * S, 0, TAU); g.fill(); g.restore(); }
      if (st.kind === "drill" && t > 1.6 && t < HIT + 0.1) { g.save(); g.translate(cx, cy); g.rotate(t * 30); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(0, 0, size * 0.55, 0, 0.8); g.stroke(); } g.restore(); }
      // the Megaform itself, in hard pixels
      if (m.a > 0.01) { g.save(); g.globalAlpha = m.a; g.imageSmoothingEnabled = false; g.translate(cx, cy); if (st.kind === "drill") g.rotate(Math.sin(t * 40) * 0.06 + att.face * 0.5); if (st.kind === "slam" && t > 1.6 && t < HIT) g.rotate(att.face * 0.15);
        const bob = Math.sin(t * 3) * 0.05 * S; g.drawImage(art, -size / 2, -size / 2 + bob, size, size); g.restore(); }
      // title card while it rises
      if (t > 0.6 && t < 2.4) { const a = ss(t, 0.6, 0.9) * (1 - ss(t, 2.1, 2.4)); g.save(); g.globalAlpha = a; g.font = "22px P2, monospace"; g.textAlign = "center"; g.lineWidth = 6; g.strokeStyle = "#07060c"; const label = ultName.toUpperCase(); g.strokeText(label, VIEW_W / 2, 150); g.fillStyle = st.col; g.fillText(label, VIEW_W / 2, 150); g.restore(); }
    },
    dispose() {} };
  return c;
}
