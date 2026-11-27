/* ================= Domain Expansions: each Megaform super is a short scripted scene =================
   Every domain follows the same five beats:
     1. hand sign and chant        (the Ranger's own domain poses)
     2. "DOMAIN EXPANSION: ___"    (a dome in the Ranger's colour closes over the arena, revealing the domain)
     3. the sure-hit rule          (the organelle's real biology, scripted per domain)
     4. the finisher               (the Megaform / prop lands the blow)
     5. the domain shatters        (shards fly off, the normal arena comes back, the hit lands)
   Beats 1, 2 and 5, the camera hand-offs, the hit-stop and the Ranger's poses are shared (domainCine).
   Each domain adds only its middle (DOMAINS[id].setup): its own events, camera, props and opponent poses.
   Art lives in src/domain/<id>/ (made by tools/prep_domain.py from the ChatGPT originals in src/art/domain/).
   A Ranger without domain art keeps the old Megaform scene (megas2d.js). */
const DOMAIN_IMG = {};
for (const id in (typeof DOMAIN_DATA !== "undefined" ? DOMAIN_DATA : {})) { DOMAIN_IMG[id] = {}; for (const k in DOMAIN_DATA[id]) { const im = new Image(); im.src = DOMAIN_DATA[id][k]; DOMAIN_IMG[id][k] = im; } }
const domImgReady = (id) => !!DOMAIN_IMG[id] && Object.values(DOMAIN_IMG[id]).every((im) => im.complete && im.naturalWidth > 0);
const easeIn = (u) => u * u, easeOut = (u) => 1 - (1 - u) * (1 - u);
const backOut = (u) => { const s = 1.9; u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const spring = (u, k = 9, w = 26) => (u < 0 ? 0 : Math.exp(-u * k) * Math.cos(u * w)); // 1 at u = 0, settles to 0

/* one frame of a domain strip (frames side by side, feet on a shared base line) with its feet at screen (sx, sy) */
function domStrip(g, img, M, frame, sx, sy, px, o = {}) {
  const [cw, ch] = M.cell; g.save(); g.globalAlpha = o.alpha ?? 1; g.translate(sx, sy); if (o.rot) g.rotate(o.rot);
  g.scale((o.flip || 1) * px * (o.kx || 1), px * (o.ky || 1)); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(img, frame * cw, 0, cw, ch, -cw / 2 + (o.dx || 0), -M.base, cw, ch); g.restore();
}
/* the same, centred on the frame's own picture (for props that spin and squash about their middle) */
function domCentered(g, img, M, frame, cx, cy, px, o = {}) {
  const [cw] = M.cell, [ox, oy, w, h] = M.frames[frame]; g.save(); g.globalAlpha = o.alpha ?? 1; g.translate(cx, cy); if (o.rot) g.rotate(o.rot);
  g.scale(px * (o.kx || 1), px * (o.ky || 1)); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(img, frame * cw + ox, oy, w, h, -w / 2, -h / 2, w, h); g.restore();
}

/* the domain interior, painted behind everything; the floor row lines up with the arena floor */
function domBackground(g, id, t) {
  const im = DOMAIN_IMG[id].bg, B = DOMAIN_META[id].bg, D = DOMAINS[id];
  const s = Math.max(0.6 * Math.pow(VIEW.S / 98, 0.3), (FLOOR_Y + 4) / B.floor, (VIEW_W + 40) / B.size[0]), w = B.size[0] * s, h = B.size[1] * s;
  const x = clamp(VIEW_W / 2 - w / 2 - VIEW.camX * VIEW.S * 0.12, VIEW_W - w + 20, -20), y = FLOOR_Y - B.floor * s;
  g.drawImage(im, x, y, w, h);
  if (D.dim) { g.fillStyle = `rgba(20,10,30,${D.dim})`; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80); } // keeps a same-coloured Ranger readable
  if (D.glow) { // a slow pulse on the domain's light source, and motes drifting through the air, so the room breathes
    const [gx, gy, gr, gc] = D.glow, cx = x + gx * s, cy = y + gy * s, r = gr * s * (1 + 0.06 * Math.sin(t * 4));
    g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6); gl.addColorStop(0, rgba(gc, 0.22 + 0.08 * Math.sin(t * 4))); gl.addColorStop(1, rgba(gc, 0)); g.fillStyle = gl; g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    for (let i = 0; i < 26; i++) { const k = (t * (0.05 + (i % 5) * 0.012) + i * 0.137) % 1, mx = ((i * 97.3) % VIEW_W + Math.sin(t * 0.7 + i) * 18), my = FLOOR_Y - k * FLOOR_Y; g.globalAlpha = Math.sin(k * Math.PI) * 0.7; g.fillStyle = i % 3 ? D.mote || "#c9a2ff" : D.gold; g.fillRect(mx, my, 2 + (i % 2), 2 + (i % 2)); }
    g.restore();
  }
}

/* where a point of the domain's background image (image pixels) lands on screen, matching domBackground */
function domBgPt(id, ix, iy) {
  const B = DOMAIN_META[id].bg, s = Math.max(0.6 * Math.pow(VIEW.S / 98, 0.3), (FLOOR_Y + 4) / B.floor, (VIEW_W + 40) / B.size[0]), w = B.size[0] * s;
  const x = clamp(VIEW_W / 2 - w / 2 - VIEW.camX * VIEW.S * 0.12, VIEW_W - w + 20, -20), y = FLOOR_Y - B.floor * s; return [x + ix * s, y + iy * s];
}
/* the opponent in one of its fight poses (the extra sheet: hitHigh, hitBody, block, down, dizzy...), with a fallback for the Phage */
const K1 = () => FIGHTER_H / SPRITE_META.target;
function defPose(g, def, key, x, y, o = {}) {
  if (SPR.extra[def.id]) drawFrame(g, def.id, XE[key], x, y, def.face, Object.assign({ extra: true }, o));
  else drawFrame(g, def.id, 0, x, y, def.face, o);
}
/* the box (world metres, relative to the fighter's feet) of one of the opponent's poses: [centre x, top y, width] */
function defBox(def, key) {
  const f = SPR.extra[def.id] && SPRITE_META.frames[def.id + "-extra"] ? SPRITE_META.frames[def.id + "-extra"][XE[key]] : null, k = K1();
  if (!f) return [0, 2.3, 1.6];
  return [def.face * (f[0] + f[2] / 2 - SPRITE_META.cell[0] / 2) * k, (SPRITE_META.base - f[1]) * k, f[2] * k];
}
/* the opponent's pose, stretched (kx, ky), skewed and spun about the middle of the body (cy metres up), for folding them like a protein */
function defMorph(g, def, key, x, y, o = {}) {
  const cx = VIEW.sx(x), cy = VIEW.sy(y + (o.cy ?? 0.9)); g.save(); g.translate(cx, cy); if (o.rot) g.rotate(o.rot);
  if (o.skew) g.transform(1, 0, o.skew, 1, 0, 0); g.scale(o.kx ?? 1, o.ky ?? 1); g.translate(-cx, -cy);
  defPose(g, def, key, x, y, { flash: o.flash, alpha: o.alpha, silhouette: o.silhouette }); g.restore();
}
/* A horizontal stretch of DNA drawn in code, so the base pairs and the twist are always right:
   a RIGHT-handed double helix (the strand in front always slopes down to the right), about 10.5 base pairs per turn,
   red always paired with yellow (A-T) and green with orange (G-C). Positions are in world metres.
   o.cut: x of a double-strand break; o.gap: how far the two pieces have pulled apart there; o.tilt: their droop;
   o.hi: [x0, x1, colour] a highlighted window (the guide RNA); o.pam: x where the PAM's 3 rungs start (drawn gold-ringed) */
const DNA_PAIR = { 0: ["#e23430", "#face28"], 1: ["#face28", "#e23430"], 2: ["#60c438", "#f6841c"], 3: ["#f6841c", "#60c438"] };
function drawDNA(g, x0, x1, cy, o = {}) {
  const S = VIEW.S, turn = o.turn || 1.6, step = turn / 10.5, R = o.R || 0.3, w = Math.max(3, 0.09 * S), seq = o.seq || ((i) => (i * 7 + (i >> 2) * 3) % 4);
  const piece = (x) => (o.cut == null ? 0 : x < o.cut ? -1 : 1);
  const pos = (x, strand) => { // screen point of a strand at x, after the cut pieces have moved
    const th = (x - x0) / turn * TAU + (strand ? Math.PI : 0) + (o.phase || 0), side = piece(x), off = side * (o.gap || 0), d = side ? (x - o.cut) * side : 0;
    return [VIEW.sx(x + off), VIEW.sy(cy - Math.sin(th) * R - side * d * (o.tilt || 0)), Math.cos(th)];
  };
  const seg = [], n = Math.ceil((x1 - x0) / 0.02);
  for (let i = 0; i < n; i++) for (const st of [0, 1]) { const xa = x0 + i * 0.02, xb = Math.min(x1, xa + 0.022); if (o.cut != null && xa < o.cut && xb > o.cut) continue; const p = pos(xa, st), q = pos(xb, st); seg.push({ z: (p[2] + q[2]) / 2, p, q, st }); }
  const draw = (list) => { for (const sgm of list) { g.strokeStyle = "#140a24"; g.lineWidth = w + 4; g.beginPath(); g.moveTo(sgm.p[0], sgm.p[1]); g.lineTo(sgm.q[0], sgm.q[1]); g.stroke(); }
    for (const sgm of list) { const lit = 0.75 + 0.25 * sgm.z; g.strokeStyle = sgm.st ? `rgb(${168 * lit | 0},${60 * lit | 0},${230 * lit | 0})` : `rgb(${30 * lit | 0},${200 * lit | 0},${200 * lit | 0})`; g.lineWidth = w; g.beginPath(); g.moveTo(sgm.p[0], sgm.p[1]); g.lineTo(sgm.q[0], sgm.q[1]); g.stroke(); } };
  g.save(); g.globalAlpha = o.alpha ?? 1; g.lineCap = "round";
  draw(seg.filter((q) => q.z < 0));
  if (o.hi) { // the guide RNA's window: a tinted band with corner brackets
    const [ha, hb, hc] = o.hi, a0 = VIEW.sx(Math.min(ha, hb)), b0 = VIEW.sx(Math.max(ha, hb)), t0 = VIEW.sy(cy + R * 1.7), h0 = R * 3.4 * S;
    g.save(); g.fillStyle = rgba(hc, 0.22); g.fillRect(a0, t0, b0 - a0, h0); g.strokeStyle = hc; g.lineWidth = 3; const L = Math.min(18, (b0 - a0) / 4);
    for (const [x, d] of [[a0, 1], [b0, -1]]) { g.beginPath(); g.moveTo(x + d * L, t0); g.lineTo(x, t0); g.lineTo(x, t0 + h0); g.lineTo(x + d * L, t0 + h0); g.stroke(); } g.restore(); }
  const nr = Math.floor((x1 - x0) / step);
  for (let i = 0; i <= nr; i++) { // the rungs: each base pair is two halves meeting in the middle
    const x = x0 + i * step + step * 0.5; if (x > x1 || (o.cut != null && Math.abs(x - o.cut) < step * 0.4)) continue;
    const a = pos(x, 0), b = pos(x, 1), [c1, c2] = DNA_PAIR[seq(i)], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, rw = Math.max(2, w * 0.55);
    g.strokeStyle = "#140a24"; g.lineWidth = rw + 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.lineWidth = rw; g.strokeStyle = c1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(mx, my); g.stroke(); g.strokeStyle = c2; g.beginPath(); g.moveTo(mx, my); g.lineTo(b[0], b[1]); g.stroke();
    if (o.pam != null && x >= o.pam && x < o.pam + step * 3) { g.strokeStyle = "#ffe14d"; g.lineWidth = 2; g.beginPath(); g.arc(mx, my, Math.abs(a[1] - b[1]) / 2 + 5, 0, TAU); g.stroke(); }
    if (o.bad && Math.abs(x - o.bad) < step * 1.1) { g.strokeStyle = "#ff3355"; g.lineWidth = 3; g.beginPath(); g.moveTo(mx - 7, my - 7); g.lineTo(mx + 7, my + 7); g.moveTo(mx + 7, my - 7); g.lineTo(mx - 7, my + 7); g.stroke(); }
  }
  draw(seg.filter((q) => q.z >= 0)); g.restore();
  return step;
}
/* a domain strip frame as a flat silhouette (cached), e.g. for shadow clones */
const _domSil = {};
function domSil(img, M, frame, col) {
  const k = img.src.length + ":" + frame + ":" + col; if (_domSil[k]) return _domSil[k];
  const [cw, ch] = M.cell, cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; const x = cv.getContext("2d");
  x.drawImage(img, frame * cw, 0, cw, ch, 0, 0, cw, ch); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, cw, ch); return (_domSil[k] = cv);
}
/* a single RNA strand along a path: backbone plus one coloured base per letter (A red, U yellow, G green, C orange,
   the same colours the DNA pairs use, so a guide lying against its target shows proper A-U / G-C pairs).
   path(u) gives world [x, y] for u in 0..1; dir = +1 bases hang down, -1 they stand up */
const RNA_COL = { A: "#e23430", U: "#face28", G: "#60c438", C: "#f6841c" }, RNA_COMP = { A: "U", U: "A", G: "C", C: "G" };
function drawStrand(g, path, seq, o = {}) {
  const S = VIEW.S, n = seq.length, L = (o.base ?? 0.16) * S, dir = o.dir || 1, w = Math.max(2, (o.w ?? 0.06) * S);
  g.save(); g.globalAlpha = o.alpha ?? 1; g.lineCap = "round";
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, [x, y] = path(u), sx = VIEW.sx(x), sy = VIEW.sy(y); g.strokeStyle = "#140a24"; g.lineWidth = w * 0.7 + 3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy + dir * L); g.stroke(); g.strokeStyle = RNA_COL[seq[i]]; g.lineWidth = w * 0.7; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy + dir * L); g.stroke(); }
  const pts = []; for (let i = 0; i <= 40; i++) { const [x, y] = path(i / 40); pts.push([VIEW.sx(x), VIEW.sy(y)]); }
  for (const [lw, col] of [[w + 4, "#140a24"], [w, o.col || "#c98bff"]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  if (o.glow) { g.globalCompositeOperation = "lighter"; g.strokeStyle = rgba(o.glow, 0.5); g.lineWidth = w * 2.4; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  g.restore();
}
/* a circular double-stranded DNA ring (mtDNA), drawn in code: two strands twisting around each other all the way round,
   joined by base pairs (red-yellow, green-orange), with a neon glow. cx, cy, r in screen pixels; o.ky tilts it like a frisbee */
function drawRing(g, cx, cy, r, phase, o = {}) {
  const N = 36, k = 8, a = r * 0.2, pts = (sgn) => { const p = []; for (let i = 0; i <= 96; i++) { const th = i / 96 * TAU; const rr = r + sgn * a * Math.sin(k * th + phase); p.push([Math.cos(th) * rr, Math.sin(th) * rr]); } return p; };
  g.save(); g.translate(cx, cy); if (o.rot) g.rotate(o.rot); g.scale(1, o.ky ?? 1); g.globalAlpha = o.alpha ?? 1; g.lineCap = "round";
  g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.5); gl.addColorStop(0, "rgba(255,140,40,0)"); gl.addColorStop(0.45, rgba(o.glow || "#ff8a2a", 0.45)); gl.addColorStop(1, "rgba(255,140,40,0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, r * 1.5, 0, TAU); g.fill(); g.restore();
  const lw = Math.max(1.5, r * 0.05);
  for (let j = 0; j < N; j++) { const th = (j + 0.5) / N * TAU, s1 = Math.sin(k * th + phase), r1 = r + a * s1, r2 = r - a * s1; if (Math.abs(s1) < 0.3) continue; const [c1, c2] = DNA_PAIR[(j * 7 + (j >> 2)) % 4], rm = (r1 + r2) / 2;
    g.lineWidth = lw * 1.7; g.strokeStyle = c1; g.beginPath(); g.moveTo(Math.cos(th) * r1, Math.sin(th) * r1); g.lineTo(Math.cos(th) * rm, Math.sin(th) * rm); g.stroke(); g.strokeStyle = c2; g.beginPath(); g.moveTo(Math.cos(th) * rm, Math.sin(th) * rm); g.lineTo(Math.cos(th) * r2, Math.sin(th) * r2); g.stroke(); }
  for (const [sgn, col] of [[1, "#ffb347"], [-1, "#fff1d6"]]) { const p = pts(sgn); g.strokeStyle = "#2a0a06"; g.lineWidth = lw * 1.6 + 2; g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = col; g.lineWidth = lw * 1.6; g.stroke(); }
  if (o.label) { g.font = `${Math.max(9, r * 0.12) | 0}px P2, monospace`; g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; const txt = o.label, R2 = r * 1.24, step = 0.13 * 110 / r;
    for (let i = 0; i < txt.length; i++) { const th = -Math.PI / 2 + (i - txt.length / 2) * step + (o.labelSpin || 0); g.save(); g.rotate(th + Math.PI / 2); g.translate(0, -R2); g.lineWidth = 3; g.strokeStyle = "#2a0a06"; g.strokeText(txt[i], 0, 0); g.fillText(txt[i], 0, 0); g.restore(); } }
  g.restore();
}
/* a double helix that follows any curve P(u) (world metres, u 0..1): the same right-handed twist, 10.5 base pairs
   per turn and red-yellow / green-orange pairs as drawDNA. Each strand can be shown or hidden, and coloured, along u,
   so a helix can be unzipped and rebuilt. Where only one strand is present, its bases stick out on their own.
   Returns the end of the curve (screen x, y) and its direction, for a head. */
function drawHelixPath(g, P, o = {}) {
  const S = VIEW.S, n = 120, R = o.R ?? 0.28, turn = o.turn ?? 1.5, step = turn / 10.5, pts = [];
  let len = 0, prev = P(0);
  for (let i = 0; i <= n; i++) { const u = i / n, p = P(u), q = P(Math.min(1, u + 0.005)), r = P(Math.max(0, u - 0.005)); if (i) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
    let tx = q[0] - r[0], ty = q[1] - r[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const th = len / turn * TAU + (o.phase || 0), off = Math.sin(th) * R;
    pts.push({ u, len, x: p[0], y: p[1], tx, ty, s0: [p[0] + ty * off, p[1] - tx * off], s1: [p[0] - ty * off, p[1] + tx * off], z: Math.cos(th) }); }
  const vis = [o.show0 || (() => true), o.show1 || (() => true)], col = [o.col0 || (() => "#1ec8c8"), o.col1 || (() => "#a83ce6")], w = Math.max(3, 0.09 * S);
  g.save(); g.globalAlpha = o.alpha ?? 1; g.lineCap = "round";
  const strand = (k, front) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], z = (k ? -1 : 1) * (a.z + b.z) / 2; if ((z >= 0) !== front || !vis[k](a.u) || !vis[k](b.u)) continue;
      const A = k ? a.s1 : a.s0, B = k ? b.s1 : b.s0, lit = 0.72 + 0.28 * z; g.strokeStyle = "#140a24"; g.lineWidth = w + 4; g.beginPath(); g.moveTo(VIEW.sx(A[0]), VIEW.sy(A[1])); g.lineTo(VIEW.sx(B[0]), VIEW.sy(B[1])); g.stroke();
      g.strokeStyle = col[k](a.u); g.globalAlpha = (o.alpha ?? 1) * (0.55 + 0.45 * lit); g.lineWidth = w; g.stroke(); g.globalAlpha = o.alpha ?? 1; } };
  strand(0, false); strand(1, false);
  const nr = Math.floor(len / step);
  for (let r = 0; r < nr; r++) {
    const L = (r + 0.5) * step; let i = 1; while (i < pts.length - 1 && pts[i].len < L) i++; const a = pts[i]; const v0 = vis[0](a.u), v1 = vis[1](a.u); if (!v0 && !v1) continue;
    const [c1, c2] = DNA_PAIR[(r * 7 + (r >> 2) * 3 + (o.seed || 0)) % 4], A = [VIEW.sx(a.s0[0]), VIEW.sy(a.s0[1])], B = [VIEW.sx(a.s1[0]), VIEW.sy(a.s1[1])], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], rw = Math.max(2, w * 0.55);
    const half = (F, T, c) => { g.strokeStyle = "#140a24"; g.lineWidth = rw + 3; g.beginPath(); g.moveTo(F[0], F[1]); g.lineTo(T[0], T[1]); g.stroke(); g.strokeStyle = c; g.lineWidth = rw; g.stroke(); };
    if (Math.hypot(A[0] - B[0], A[1] - B[1]) < rw * 1.5) continue;
    if (v0) half(A, M, c1); if (v1) half(B, M, c2);
  }
  strand(0, true); strand(1, true);
  g.restore();
  const e = pts[pts.length - 1]; return [VIEW.sx(e.x), VIEW.sy(e.y), Math.atan2(-e.ty, e.tx)];
}
const bez = (P0, P1, P2, P3) => (u) => { const v = 1 - u; return [v * v * v * P0[0] + 3 * v * v * u * P1[0] + 3 * v * u * u * P2[0] + u * u * u * P3[0], v * v * v * P0[1] + 3 * v * v * u * P1[1] + 3 * v * u * u * P2[1] + u * u * u * P3[1]]; };
function comic(g, text, x, y, size, fill, k = 1, rot = -0.08) { // a pop-art sound effect word
  if (k <= 0.01) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); g.font = `${size}px Bangers, Impact, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.lineWidth = size * 0.22; g.strokeStyle = "#1a0b2e"; g.strokeText(text, 0, 0); g.fillStyle = fill; g.fillText(text, 0, 0); g.restore();
}

const DOMAINS = {
  /* ---------- Nucleus: Genome Vault. A vault marked NUCLEUS falls on the opponent; inside, the DNA is perfectly safe ---------- */
  nucleus: {
    name: "GENOME VAULT", col: "#b48cff", gold: "#ffd36b", dur: 7.4, shatter: 6.6, pull: 6.35,
    glow: [835, 150, 190, "#ffb347"], // the nucleolus in the background image (x, y, radius in image pixels)
    mv: { knock: [3, 7] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D } = X;
      const T = { point: 1.95, warn: 2.05, fall: 2.55, hit: 2.95, smug: 3.3, push: 3.75, door: 4.3, peek: 4.6, wink: 5.1, tada: 5.95 };
      // where the vault lands: over the opponent's head and chest, with their boots sticking out toward the attacker
      const lie = defBox(def, "down"), lieW = lie[2], lieC = def.x + lie[0];
      const VW = 2.0, legEnd = lieC - s * lieW / 2, vaultX = legEnd + s * (0.78 + VW / 2), hasLie = !!SPR.extra[def.id];
      const holeX = vaultX + (M.vault.hole[0] - M.vault.body[0] - M.vault.body[2] / 2) * VW / M.vault.body[2];
      const vaultY = (t) => (t < T.fall ? null : t < T.hit ? lerp(7.5, 0, easeIn(seg(t, T.fall, T.hit))) : t < D.shatter ? 0 : lerp(0, 9, easeIn(seg(t, D.shatter, D.shatter + 0.45))));
      let bubble = null;
      return {
        poses: [[0, 0], [D.expand, 1], [T.point, 2], [T.smug, 3]],
        camera(t) {
          if (t < T.push) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, (att.x + vaultX) / 2, k), S: lerp(150, 92, k) + (t > T.hit ? 10 * spring(t - T.hit, 7, 20) : 0) }; }
          const k = ss(t, T.push, T.push + 0.6); return { x: lerp((att.x + vaultX) / 2, holeX, k), S: lerp(92, 150, k) + 10 * ss(t, T.wink, T.wink + 0.3) };
        },
        step(t) {
          if (c.once("warn", T.warn)) game.sfx("whistle");
          if (c.once("hit", T.hit)) { c.freeze = 0.11; VIEW.impact = 0.16; VIEW.shake = 0.85; FX2D.cx = VIEW.sx(vaultX) / VIEW_W; FX2D.cy = VIEW.sy(0.6) / VIEW_H; game.sfx("impact"); game.sfx("boom"); P.boom(V3(vaultX, 0, 0), D.gold, 0.9); P.dust(V3(vaultX - VW / 2, 0, 0), 4); P.dust(V3(vaultX + VW / 2, 0, 0), 4); for (let i = 0; i < 14; i++) { const d = i % 2 ? 1 : -1; P.spark(V3(vaultX + d * VW / 2, 0.05, 0), i % 3 ? "#e8d9ff" : D.gold, 0.12, V3(d * (4 + Math.random() * 6), 1 + Math.random() * 3, 0), 0.4); } def.flash = 0.15; }
          if (c.once("creak", T.door - 0.28)) game.sfx("creak");
          if (c.once("door", T.door)) { VIEW.shake = 0.15; game.sfx("whoosh"); for (let i = 0; i < 8; i++) { const a = Math.random() * TAU; P.spark(V3(vaultX + Math.cos(a) * 0.45, 0.95 + Math.sin(a) * 0.45, 0), D.gold, 0.12, V3(Math.cos(a) * 7, Math.sin(a) * 7, 0), 0.35); } }
          if (c.once("wink", T.wink + 0.12)) game.sfx("ding");
        },
        drawBack(g, t) {
          if (t >= T.warn && t < T.hit) { // the vault's shadow grows on the floor
            const k = seg(t, T.warn, T.hit); g.save(); g.globalAlpha = 0.25 + 0.4 * k; g.fillStyle = "#000"; g.beginPath(); g.ellipse(VIEW.sx(vaultX), FLOOR_Y + 4, VW * VIEW.S * (0.15 + 0.4 * easeIn(k)), 0.12 * VIEW.S * (0.4 + k), 0, 0, TAU); g.fill(); g.restore();
          }
        },
        drawDef(g, t) {
          if (t < T.hit) { if (t >= T.fall) defPose(g, def, "block", def.x, 0); else X.drawDefIdle(g, t); return; }
          // flattened under the vault; the boots twitch now and then; when the vault lifts they spring back from flat
          const u = t - T.hit, tw = (u % 0.55) < 0.1 && u > 0.5 ? Math.sin(u * 90) * 0.025 : 0, lifted = vaultY(t) > 0.01;
          const u2 = t - D.shatter - 0.15, flat = !lifted ? 1 : u2 < 0 ? 0.45 : 1 - 0.55 * spring(u2, 6, 22);
          if (hasLie) defPose(g, def, "down", def.x + tw, 0, { squash: clamp(flat, 0.45, 1.1), flash: def.flash });
          else drawFrame(g, def.id, 0, def.x, 0, def.face, { squash: 0.3 });
        },
        drawProps(g, t) {
          const vy = vaultY(t); if (vy === null) return;
          const V = M.vault, body = V.body, px = VIEW.S * VW / body[2], bcx = body[0] + body[2] / 2;
          const u = t - T.hit, squ = t < T.hit ? 1.1 : 1 - 0.16 * spring(u, 8, 24); // stretched in the fall, squashed on landing, then wobbles back
          const open = t >= T.door, jig = t > T.door - 0.28 && t < T.door ? (Math.random() - 0.5) * 3 : 0;
          const sx = VIEW.sx(vaultX) + jig, sy = VIEW.sy(vy);
          if (t < T.hit) { g.save(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const lx = sx + (i - 3) * VW * VIEW.S / 7, ly = sy - body[3] * px * 1.1; g.beginPath(); g.moveTo(lx, ly - 30 - (i % 3) * 25); g.lineTo(lx, ly - 140 - (i % 2) * 60); g.stroke(); } g.restore(); }
          domStrip(g, IM.vault, V, open ? 1 : 0, sx, sy, px, { ky: squ, kx: 1 + (1 - squ) * 0.7, dx: V.cell[0] / 2 - bcx });
          if (!open) return;
          const [hx, hy, hr] = V.hole, ox = sx + (hx - bcx) * px * (1 + (1 - squ) * 0.7), oy = sy + (hy - V.base) * px * squ, r = hr * px;
          const glow = 1 - seg(t, T.door, T.door + 0.6) * 0.65; // gold light pours out as the door opens
          g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(ox, oy, r * 0.2, ox, oy, r * 2.2); gl.addColorStop(0, rgba(D.gold, 0.4 * glow)); gl.addColorStop(1, rgba(D.gold, 0)); g.fillStyle = gl; g.fillRect(ox - r * 2.2, oy - r * 2.2, r * 4.4, r * 4.4); g.restore();
          // the DNA mascot: peeks over the bottom of the doorway, then pops up for the wink
          const MM = M.mascot, mpx = VIEW.S * 0.86 / MM.frames[1][3];
          if (t >= T.peek && t < T.wink) {
            const k = easeOut(seg(t, T.peek, T.peek + 0.35)), ph = MM.frames[0][3] * mpx;
            g.save(); g.beginPath(); g.rect(ox - r * 1.6, oy - r * 1.6, r * 3.2, r * 2.45); g.clip();
            domStrip(g, IM.mascot, MM, 0, ox, oy + r * 0.85 + ph * (1 - k), mpx); g.restore();
          } else if (t >= T.wink) {
            const k = seg(t, T.wink, T.wink + 0.45), ky = 0.6 + 0.4 * backOut(k), fr = t < T.tada ? 1 : 3, pop = t >= T.tada ? 1 + 0.08 * spring(t - T.tada, 9, 26) : 1;
            domStrip(g, IM.mascot, MM, fr, ox, oy + r * 0.95, mpx, { ky: ky * pop, kx: (2 - ky) * (2 - pop) });
            if (t > T.wink + 0.12 && t < T.wink + 0.6) { // the wink's sparkle
              const f = MM.frames[1], ex = ox + (f[0] + f[2] * 0.66 - MM.cell[0] / 2) * mpx, ey = oy + r * 0.95 - (MM.base - f[1] - f[3] * 0.2) * mpx, a = 1 - seg(t, T.wink + 0.12, T.wink + 0.6), R = 16 * (0.6 + a);
              g.save(); g.globalAlpha = a; g.fillStyle = "#ffffff"; g.translate(ex + 14, ey - 10); g.rotate(t * 3); g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? R * 0.25 : R; g.lineTo(Math.cos(i * TAU / 8) * rr, Math.sin(i * TAU / 8) * rr); } g.closePath(); g.fill(); g.restore();
            }
            bubble = [ox, oy + r * 0.95 - MM.frames[1][3] * mpx, sy - body[3] * px * squ];
          }
        },
        text(g, t) {
          if (t > T.warn && t < T.hit) X.exclaim(g, t - T.warn);
          if (t > T.wink + 0.1 && t < D.shatter && bubble) X.speech(g, bubble, ["...and I'm", "perfectly safe!"], t - T.wink - 0.1);
        },
      };
    },
  },

  /* ---------- Golgi: Packing Punt. The opponent is cargo: wrapped in a vesicle, sugar-tagged, addressed and punted ---------- */
  golgi: {
    name: "PACKING PUNT", col: "#ffd23f", gold: "#ff8fb1", mote: "#fff2b0", dur: 7.3, shatter: 6.55, pull: 6.3, dim: 0.28,
    glow: [836, 380, 300, "#fff0a0"],
    mv: { knock: [2, 5] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D } = X;
      const T = { wrap: 1.9, tie: 2.55, tag: 2.85, tagOut: 3.6, run: 3.6, kick: 4.05, bonk: 4.6, fall: 4.78, land: 5.35, bump: 5.5 };
      const boss = def.id === "phage" ? 1.3 : 1, R = 1.02 * boss; // the vesicle's radius (m)
      const gx = def.x, startX = att.x, kickX = gx - s * (R + 0.55);
      const G = M.gift, gpx = () => VIEW.S * 2 * R * 1.08 / G.frames[0][2]; // the wrapped gift fits the bubble
      const ceilY = () => (FLOOR_Y - 92) / VIEW.S; // just under the health bars, in metres: the domain's ceiling
      const run = (t) => (t < T.run ? startX : t < T.kick ? lerp(startX, kickX, easeIn(seg(t, T.run, T.kick))) : kickX - s * 0.25 * easeOut(seg(t, T.kick, T.kick + 0.35)));
      // the gift's path: sitting on the floor, punted up to the ceiling, squashed there, falling back down
      const giftPos = (t) => {
        const rest = R * 1.05;
        if (t < T.kick) return { x: gx, y: rest + 0.25 * (1 - ss(t, T.tie, T.tie + 0.4)), rot: 0 };
        const top = ceilY() - R * 0.5;
        if (t < T.bonk) { const u = seg(t, T.kick, T.bonk); return { x: lerp(gx, gx + s * 0.5, u), y: lerp(rest, top - R * 0.55, easeOut(u)), rot: s * u * 5 }; }
        if (t < T.fall) return { x: gx + s * 0.5, y: top, rot: 0, squashed: true };
        const u = seg(t, T.fall, T.land); return { x: lerp(gx + s * 0.5, gx, u), y: lerp(top - R * 0.4, rest, easeIn(u)), rot: -s * u * 4 };
      };
      return {
        poses: [[0, 0], [D.expand, 1], [T.run, 2], [T.kick, 3], [T.land + 0.35, 1]], // ...and arms up for the touchdown
        attX: run, // the run-up and the plant for the punt
        ghosts: (t) => t > T.run && t < T.kick + 0.05,
        camera(t) {
          if (t < T.run) { const k = ss(t, D.expand, T.wrap + 0.3); return { x: lerp(att.x + s * 0.25, lerp(startX, gx, 0.62), k), S: lerp(150, 112, k) + 8 * ss(t, T.tie, T.tie + 0.25) * (1 - ss(t, T.tagOut, T.run + 0.2)) }; }
          if (t < T.kick) { const k = ss(t, T.run, T.kick); return { x: lerp(lerp(startX, gx, 0.62), (kickX + gx) / 2, k), S: lerp(120, 104, k) }; }
          if (t < T.land - 0.15) { const k = ss(t, T.kick, T.kick + 0.4); return { x: lerp((kickX + gx) / 2, gx + s * 0.25, k), S: lerp(104, 66, k) }; }
          const k = ss(t, T.land - 0.15, T.land + 0.25); return { x: lerp(gx + s * 0.25, (kickX + gx) / 2 + s * 0.4, k), S: lerp(66, 118, k) };
        },
        step(t) {
          if (c.once("wrap", T.wrap)) game.sfx("whoosh");
          if (c.once("tie", T.tie)) { game.sfx("ding"); VIEW.flash = 0.05; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; P.spark(V3(gx + Math.cos(a) * R, R * 1.3 + Math.sin(a) * R, 0), i % 2 ? D.gold : "#7ff1e2", 0.13, V3(Math.cos(a) * 5, Math.sin(a) * 5, 0), 0.4); } }
          if (c.once("tagIn", T.tag)) game.sfx("select");
          if (c.once("run", T.run)) game.sfx("jump");
          if (t > T.run && t < T.kick && Math.random() < 0.6) X.grit(run(t) - s * 0.3, 2);
          if (c.once("kick", T.kick)) { c.freeze = 0.1; VIEW.impact = 0.12; VIEW.shake = 0.7; FX2D.cx = VIEW.sx(gx) / VIEW_W; FX2D.cy = VIEW.sy(R) / VIEW_H; game.sfx("impact"); P.hit(V3(gx - s * R * 0.7, R * 0.7, 0), D.col, 1.8); }
          if (c.once("bonk", T.bonk)) { const p = giftPos(t); c.freeze = 0.08; VIEW.shake = 0.6; game.sfx("bonk"); P.hit(V3(p.x, p.y + R * 0.3, 0), "#ffffff", 1.4); }
          if (c.once("land", T.land)) { VIEW.shake = 0.45; game.sfx("pop"); game.sfx("land"); X.grit(gx, 12); for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI, v = 4 + Math.random() * 6; P.spark(V3(gx, R, 0), i % 3 ? "#ffd84a" : D.gold, 0.14, V3(Math.cos(a) * v, Math.sin(a) * v, 0), 0.5); } }
          if (c.once("bump", T.bump)) game.sfx("boing");
        },
        drawDef(g, t) {
          if (t < T.wrap) return X.drawDefIdle(g, t);
          if (t < T.tie) { // caught in the vesicle: lifted off the floor, curled up
            const k = ss(t, T.wrap, T.wrap + 0.4); defPose(g, def, "hitBody", def.x, 0.25 * k, { flash: def.flash }); return;
          }
          if (t < T.land) return; // inside the gift
          // out of the burst vesicle, dizzy, wobbling, with an egg-sized bump rising on the head and stars circling it
          const u = t - T.land, wob = Math.sin(u * 7) * 0.06 * (1 - seg(u, 1.2, 1.6) * 0.5), x = def.x;
          defPose(g, def, "dizzy", x, 0, { rot: wob, pivot: 0.2, squash: 1 - 0.12 * spring(u, 8, 22) });
          const [bx, top] = defBox(def, "dizzy"), hx = VIEW.sx(x + bx - def.face * 0.08 + wob * 1.6), hy = VIEW.sy(top - 0.06), S = VIEW.S;
          const k = t < T.bump ? 0 : backOut(seg(t, T.bump, T.bump + 0.35)); // the bump swells up
          if (k > 0) { g.save(); g.translate(hx, hy); g.scale(k, k); g.fillStyle = "#ff8fa0"; g.strokeStyle = "#1a0b2e"; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -0.11 * S, 0.14 * S, 0.18 * S, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.ellipse(-0.045 * S, -0.19 * S, 0.035 * S, 0.055 * S, -0.4, 0, TAU); g.fill(); g.restore(); }
          for (let i = 0; i < 4; i++) { // the stars
            const a = u * 5 + i * TAU / 4, sx = hx + Math.cos(a) * 0.36 * S, sy = hy - 0.3 * S + Math.sin(a) * 0.08 * S, r = 0.09 * S * (Math.sin(a) > 0 ? 1 : 0.75);
            g.save(); g.translate(sx, sy); g.rotate(u * 6); g.fillStyle = "#ffe14d"; g.strokeStyle = "#1a0b2e"; g.lineWidth = 2; g.beginPath(); for (let j = 0; j < 10; j++) { const rr = j % 2 ? r * 0.45 : r, b = j * TAU / 10 - Math.PI / 2; g.lineTo(Math.cos(b) * rr, Math.sin(b) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore();
          }
        },
        drawProps(g, t) {
          if (t >= T.wrap && t < T.tie + 0.12) { // the vesicle: a membrane bubble (a phospholipid bilayer, so two lines) closing around the opponent
            const k = backOut(seg(t, T.wrap, T.wrap + 0.45)), cx = VIEW.sx(gx), cy = VIEW.sy(R * 1.05 + 0.25 * ss(t, T.wrap, T.wrap + 0.4)), r = R * VIEW.S * k, a = 1 - seg(t, T.tie, T.tie + 0.12);
            g.save(); g.globalAlpha = a; g.fillStyle = "rgba(255,214,90,.28)"; g.beginPath(); g.arc(cx, cy, Math.max(1, r), 0, TAU); g.fill();
            g.strokeStyle = "#ff8fb1"; g.lineWidth = 5; g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, Math.max(1, r - 9), 0, TAU); g.stroke();
            g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, Math.max(1, r * 0.8), -2.5, -1.7); g.stroke(); g.restore();
          }
          if (t >= T.tie && t < T.land + 0.45) {
            const p = giftPos(t), px = gpx(), cx = VIEW.sx(p.x), cy = VIEW.sy(p.y);
            if (t < T.land) {
              const pop = t < T.kick ? 1 + 0.12 * spring(t - T.tie, 8, 24) : 1, stretch = t > T.kick && t < T.bonk ? 1 + 0.18 * (1 - seg(t, T.kick, T.bonk)) : t > T.fall ? 1.1 : 1;
              if (p.squashed) domCentered(g, IM.gift, G, 1, cx, VIEW.sy(p.y + R * 0.2), px, { kx: 1 + 0.1 * spring(t - T.bonk, 10, 30) });
              else {
                if (t > T.kick) { g.save(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const lx = cx + (i - 2) * R * VIEW.S * 0.35, dir = t < T.bonk ? 1 : -1; g.beginPath(); g.moveTo(lx, cy + dir * R * VIEW.S * 1.1); g.lineTo(lx, cy + dir * R * VIEW.S * (1.6 + (i % 2) * 0.4)); g.stroke(); } g.restore(); }
                domCentered(g, IM.gift, G, 0, cx, cy, px, { rot: p.rot, kx: pop / Math.sqrt(stretch), ky: pop * stretch });
              }
            } else { // burst: the torn vesicle and snapped ribbon fly apart and fade
              const u = seg(t, T.land, T.land + 0.45); domCentered(g, IM.gift, G, 2, cx, cy - u * 0.4 * VIEW.S, px * (1 + u * 0.35), { alpha: 1 - u });
            }
          }
        },
        text(g, t) {
          if (t > T.kick && t < T.kick + 0.6) { const u = t - T.kick; comic(g, "PUNT!", VIEW.sx(gx - s * 0.4), VIEW.sy(2.3), 64, "#ffe14d", backOut(seg(u, 0, 0.18)) * (1 - seg(u, 0.45, 0.6))); }
          if (t > T.bonk && t < T.bonk + 0.7) { const u = t - T.bonk, p = giftPos(T.bonk); comic(g, "BONK!", clamp(VIEW.sx(p.x) + s * 170, 120, VIEW_W - 120), 150, 70, "#ffffff", backOut(seg(u, 0, 0.15)) * (1 - seg(u, 0.55, 0.7)), 0.12); }
          if (t > T.land && t < T.land + 0.55) { const u = t - T.land; comic(g, "POP!", VIEW.sx(gx), VIEW.sy(2.7), 54, "#ff8fb1", backOut(seg(u, 0, 0.15)) * (1 - seg(u, 0.4, 0.55))); }
        },
        drawTop(g, t) { // the shipping label, close up: the Golgi addresses every protein it ships
          if (t < T.tag || t > T.tagOut + 0.2) return;
          const k = backOut(seg(t, T.tag, T.tag + 0.3)), out = seg(t, T.tagOut - 0.05, T.tagOut + 0.2), f = G.frames[3], W = 440, px = W / f[2];
          g.save(); g.fillStyle = `rgba(10,6,20,${0.45 * (1 - out)})`; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80); g.restore();
          domCentered(g, IM.gift, G, 3, VIEW_W / 2 + out * 700 * s, VIEW_H * 0.52 + (1 - k) * 320, px * (0.9 + 0.1 * k), { rot: Math.sin((t - T.tag) * 7) * 0.06 * (1 - seg(t, T.tag, T.tagOut)) });
        },
      };
    },
  },

  /* ---------- Rough ER: Factory Finesse. The opponent is the new protein: docked, folded, packed in a coated vesicle, crushed ---------- */
  rougher: {
    name: "FACTORY FINESSE", col: "#ff7a2e", gold: "#ffd0a0", mote: "#ffb37a", dur: 7.3, shatter: 6.55, pull: 6.3, dim: 0.12,
    glow: [836, 60, 260, "#ffb070"],
    mv: { knock: [2, 5] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { hook: 1.95, lift: 2.05, helix: 2.5, sheet: 3.05, fold: 3.55, cage: 3.95, close: 4.2, burst: 5.72, drop: 5.98 };
      const CR = [4.6, 4.95, 5.3]; // the three crunches
      const V = M.vesicle, ballY = 1.25, cageW = 1.75 * (def.id === "phage" ? 1.25 : 1), vpx = () => VIEW.S * cageW / V.frames[1][2];
      const ribY = () => (FLOOR_Y - 118) / VIEW.S; // the ribosome that makes (and docks) the opponent hangs above them, just under the health bars
      const crush = (t) => { let p = 0; CR.forEach((c0, i) => { if (t >= c0) p = Math.max(p, (1 + 0.25 * i) * Math.exp(-(t - c0) * 7)); }); return p; };
      const lifted = (t) => (t < T.lift ? 0 : t < T.fold ? ss(t, T.lift, T.lift + 0.4) * 0.6 : lerp(0.6, ballY - 0.9, ss(t, T.fold, T.fold + 0.3))); // folded, the ball's middle sits in the cage's middle
      return {
        poses: [[0, 0], [D.expand, 1], [T.hook, 2], [CR[0] - 0.06, 3], [CR[0] + 0.15, 2], [CR[1] - 0.06, 3], [CR[1] + 0.15, 2], [CR[2] - 0.06, 3], [T.burst + 0.05, 1]],
        camera(t) {
          if (t < T.hook) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid, k), S: lerp(150, 105, k) }; }
          if (t < 4.35) { const k = ss(t, T.hook + 0.05, T.helix); return { x: lerp(mid, def.x - s * 0.35, k), S: lerp(105, 132, k) }; }
          const k = ss(t, 4.35, 4.65); return { x: lerp(def.x - s * 0.35, mid + s * 0.3, k), S: lerp(132, 112, k) + 7 * crush(t) };
        },
        step(t) {
          if (c.once("rib", T.hook - 0.1)) game.sfx("charge");
          if (c.once("hook", T.hook)) { game.sfx("zap"); def.flash = 0.12; }
          if (c.once("helix", T.helix)) game.sfx("whoosh");
          if (c.once("sheet", T.sheet)) { game.sfx("land"); VIEW.shake = 0.2; }
          if (c.once("fold", T.fold)) game.sfx("heavy");
          if (c.once("cage", T.cage)) game.sfx("select");
          if (c.once("close", T.close)) { game.sfx("block"); VIEW.flash = 0.04; }
          CR.forEach((c0, i) => { if (c.once("cr" + i, c0)) { c.freeze = 0.07; VIEW.shake = 0.5 + 0.15 * i; VIEW.impact = i === 2 ? 0.12 : 0; game.sfx("crunch"); def.flash = 0.12; for (let j = 0; j < 10; j++) { const d = j % 2 ? 1 : -1; P.spark(V3(def.x + d * cageW * 0.45, ballY + (Math.random() - 0.5) * 0.8, 0), j % 3 ? D.col : "#ffffff", 0.12, V3(d * (3 + Math.random() * 5), (Math.random() - 0.3) * 4, 0), 0.35); } } });
          if (c.once("burst", T.burst)) { VIEW.shake = 0.5; game.sfx("pop"); game.sfx("shatter"); }
          if (c.once("drop", T.drop)) { game.sfx("land"); X.grit(def.x, 10); VIEW.shake = 0.3; }
        },
        drawBack(g, t) { // the ribosome above the opponent, and the signal line that docks them
          if (t < T.hook - 0.1 || t > T.fold + 0.4) return;
          const a = 1 - seg(t, T.fold, T.fold + 0.4), k = backOut(seg(t, T.hook - 0.1, T.hook + 0.2)), rx = VIEW.sx(def.x), ry = VIEW.sy(ribY()), f = V.frames[3], px = VIEW.S * 0.9 / f[2];
          if (t > T.hook) { // the signal sequence: a glowing line from the ribosome down to the opponent, pulsing as it reels them in
            const ty = VIEW.sy(lifted(t) + 1.75), w = 6 + 3 * Math.sin(t * 30); g.save(); g.globalAlpha = a; g.globalCompositeOperation = "lighter"; g.strokeStyle = rgba(D.col, 0.9); g.lineWidth = w; g.beginPath(); g.moveTo(rx, ry + f[3] * px * 0.3); g.lineTo(rx, ty); g.stroke();
            g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2; g.stroke(); for (let i = 0; i < 5; i++) { const yy = lerp(ry, ty, ((t * 3 + i / 5) % 1)); g.fillStyle = "#fff"; g.beginPath(); g.arc(rx, yy, 4, 0, TAU); g.fill(); } g.restore();
          }
          domCentered(g, IM.vesicle, V, 3, rx, ry, px * k, { alpha: a });
        },
        drawDef(g, t) {
          if (t < T.hook) return X.drawDefIdle(g, t);
          const y = lifted(t), fl = def.flash;
          if (t < T.helix) return defPose(g, def, "hitHigh", def.x, y, { flash: fl });
          if (t < T.sheet) { // alpha helix: stretched tall and twisted like a corkscrew
            const u = t - T.helix, tw = Math.cos(u * 26); return defMorph(g, def, "hitBody", def.x, y, { kx: (0.35 + 0.65 * Math.abs(tw)) * Math.sign(tw || 1), ky: 1 + 0.45 * ss(u, 0, 0.15), rot: Math.sin(u * 13) * 0.08, flash: fl });
          }
          if (t < T.fold) { // beta sheet: squashed flat and pleated back and forth
            const u = t - T.sheet; return defMorph(g, def, "hitBody", def.x, y, { kx: 1 + 0.5 * ss(u, 0, 0.12), ky: 1 - 0.62 * ss(u, 0, 0.12), skew: Math.sin(u * 22) * 0.35, flash: fl });
          }
          if (t < T.burst) { // folded: crumpled into a ball that tumbles inside the cage and gets crushed with it
            const k = ss(t, T.fold, T.fold + 0.3), p = crush(t), sc = lerp(1, 0.6, k);
            return defMorph(g, def, "hitBody", def.x, y, { kx: sc * (1 - 0.3 * p), ky: sc * (1 + 0.12 * p), rot: (t - T.fold) * 5 * s, cy: 0.9, flash: fl });
          }
          if (t < T.drop) { const u = seg(t, T.burst, T.drop); return defMorph(g, def, "hitBody", def.x, lerp(y, 0, easeIn(u)), { kx: 0.6, ky: 0.6, rot: (t - T.fold) * 5 * s, cy: 0.9 }); }
          // dropped out on the floor, slowly unfolding
          const u = t - T.drop, un = ss(u, 0.1, 0.6); defMorph(g, def, "down", def.x, 0, { kx: lerp(0.55, 1, un) * (1 + 0.06 * spring(u, 7, 20)), ky: lerp(0.7, 1, un), cy: 0.15 });
        },
        drawProps(g, t) {
          if (t < T.cage || t > T.burst + 0.45) return;
          const cx = VIEW.sx(def.x), cy = VIEW.sy(ballY), px = vpx();
          if (t < T.close) { // the coat proteins assemble: a bowl rises up around the ball
            const u = easeOut(seg(t, T.cage, T.close)), f = V.frames[0]; domCentered(g, IM.vesicle, V, 0, cx, cy + (V.frames[1][3] - f[3]) * px * 0.5 + (1 - u) * 1.2 * VIEW.S, px, { alpha: u });
          } else if (t < T.burst) { // the closed cage, squeezed by each crunch; a glow behind keeps the protein inside readable
            g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(cx, cy, 0, cx, cy, cageW * 0.5 * VIEW.S); gl.addColorStop(0, rgba("#ffd0a0", 0.35)); gl.addColorStop(1, rgba("#ffd0a0", 0)); g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, cageW * 0.5 * VIEW.S, 0, TAU); g.fill(); g.restore();
            const p = crush(t), pop = 1 + 0.1 * spring(t - T.close, 9, 26); domCentered(g, IM.vesicle, V, 1, cx, cy, px, { kx: pop * (1 - 0.3 * p), ky: pop * (1 + 0.14 * p) });
          } else { const u = seg(t, T.burst, T.burst + 0.45); domCentered(g, IM.vesicle, V, 2, cx, cy, px * (1.05 + u * 0.5), { alpha: 1 - u }); }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot) => { if (t > at && t < at + 0.55) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, 0.42, 0.55)), rot); } };
          const tx = VIEW.sx(def.x), side = VIEW.sx(def.x + s * 1.4);
          pop("DOCKED!", T.hook + 0.05, tx, VIEW.sy(2.9), 46, "#ffffff");
          pop("\u03b1-HELIX!", T.helix + 0.05, side, VIEW.sy(2.4), 52, "#ffd0a0", 0.08);
          pop("\u03b2-SHEET!", T.sheet + 0.05, side, VIEW.sy(1.9), 52, "#ffd0a0", -0.1);
          pop("FOLDED!", T.fold + 0.08, side, VIEW.sy(2.2), 56, "#ff7a2e");
          CR.forEach((c0, i) => pop("CRUNCH!", c0, VIEW.sx(def.x) + (i % 2 ? -1 : 1) * 120, VIEW.sy(2.5 + 0.25 * i), 52 + 8 * i, i === 2 ? "#ff7a2e" : "#ffffff", i % 2 ? 0.12 : -0.12));
        },
      };
    },
  },

  /* ---------- CRISPR: Precision Cut Theater. A guide RNA finds the opponent's matching DNA, a PAM unlocks it, Cas9 cuts both strands ---------- */
  crispr: {
    name: "PRECISION CUT THEATER", col: "#2fe0c8", gold: "#c98bff", mote: "#7ff1e2", dur: 7.4, shatter: 6.6, pull: 6.35, dim: 0.1,
    glow: [836, 110, 200, "#9ff5ff"],
    mv: { knock: [3, 6] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { bind: 1.95, scan: 2.35, match: 3.15, cmd: 3.55, fly: 3.6, snip: 4.3, slide: 4.32, repair: 4.95, stamp: 5.25, drop: 5.9 };
      const dnaY = 1.2, half = 3.0, x0 = def.x - half, x1 = def.x + half, step = 1.6 / 10.5;
      // the PAM sits on the far side of the cut; Cas9 cuts 3 letters before it, and the 20-letter target runs back toward the attacker
      const cutX = def.x, pamX = s > 0 ? cutX + step * 3 : cutX - step * 6, tA = s > 0 ? cutX - step * 17 : cutX + step * 3, tB = tA + step * 20;
      const scanX = (t) => lerp(s > 0 ? x0 : x1 - step * 20, tA, easeOut(seg(t, T.scan, T.match))); // the guide RNA's window slides along until it matches
      const C = M.cas9, cpx = () => VIEW.S * 1.9 / C.frames[0][2];
      const gap = (t) => (t < T.snip ? 0 : t < T.repair ? 0.42 * easeOut(seg(t, T.snip, T.snip + 0.25)) : 0.42 * (1 - backOut(seg(t, T.repair, T.repair + 0.25))));
      return {
        poses: [[0, 0], [D.expand, 1], [T.cmd, 2], [T.snip, 3]],
        camera(t) {
          if (t < T.bind) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid, k), S: lerp(150, 100, k) }; }
          if (t < T.drop) { const k = ss(t, T.bind, T.scan + 0.3); return { x: lerp(mid, cutX - s * 1.25, k), S: lerp(100, 112, k) + 10 * spring(t - T.snip, 6, 18) * (t > T.snip ? 1 : 0) + 8 * ss(t, T.repair, T.stamp) }; }
          const k = ss(t, T.drop, T.drop + 0.3); return { x: lerp(cutX - s * 1.25, mid, k), S: lerp(120, 108, k) };
        },
        step(t) {
          if (c.once("bind", T.bind)) { game.sfx("charge"); def.flash = 0.1; }
          if (c.once("scan", T.scan)) game.sfx("zap");
          if (t > T.scan && t < T.match && Math.random() < 0.25) game.sfx("zap");
          if (c.once("match", T.match)) { game.sfx("ding"); VIEW.flash = 0.04; }
          if (c.once("pam", T.match + 0.2)) game.sfx("select");
          if (c.once("fly", T.fly)) game.sfx("whoosh");
          if (c.once("snip", T.snip)) { c.freeze = 0.13; VIEW.impact = 0.16; VIEW.shake = 0.8; FX2D.cx = VIEW.sx(cutX) / VIEW_W; FX2D.cy = VIEW.sy(dnaY) / VIEW_H; game.sfx("impact"); game.sfx("cut"); def.flash = 0.2;
            for (let i = 0; i < 18; i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 7; P.spark(V3(cutX, dnaY, 0), i % 2 ? D.col : "#ffffff", 0.13, V3(Math.cos(a) * v, Math.sin(a) * v, 0), 0.4); } }
          if (c.once("repair", T.repair)) { game.sfx("block"); def.flash = 0.12; }
          if (c.once("stamp", T.stamp)) { game.sfx("heavy"); VIEW.shake = 0.5; }
          if (c.once("drop", T.drop)) { game.sfx("land"); X.grit(def.x, 8); }
        },
        drawDef(g, t) {
          if (t < T.bind) return X.drawDefIdle(g, t);
          const key = t < T.drop ? "hitHigh" : "down", fl = def.flash;
          if (t < T.slide || t >= T.drop) { // bound in place, then (after the knockout) collapsed
            if (t >= T.drop) { const u = t - T.drop, flat = SPR.extra[def.id] ? 1 : 0.5; return defPose(g, def, "down", def.x, 0, { squash: flat * (1 - 0.15 * spring(u, 8, 20)) }); }
            return defPose(g, def, key, def.x, 0, { flash: fl });
          }
          // cut: the two halves slide apart along the slash, then snap back crooked and glitching (sloppy repair = knockout)
          const cy = VIEW.sy(dnaY), cx = VIEW.sx(cutX), sl = -0.35 * s, glitch = t > T.repair;
          const off = t < T.repair ? 0.36 * VIEW.S * easeOut(seg(t, T.slide, T.slide + 0.2)) : 0.05 * VIEW.S * (1 - seg(t, T.repair, T.drop) * 0.5);
          const halfDraw = (top, dx, dy) => { g.save(); g.beginPath(); const W = VIEW_W * 2; if (top) { g.moveTo(cx - W, cy - W * sl); g.lineTo(cx + W, cy + W * sl); g.lineTo(cx + W, -W); g.lineTo(cx - W, -W); } else { g.moveTo(cx - W, cy - W * sl); g.lineTo(cx + W, cy + W * sl); g.lineTo(cx + W, W); g.lineTo(cx - W, W); } g.closePath(); g.clip(); g.translate(dx, dy);
            if (glitch) { g.globalAlpha = 0.55; drawFrame(g, def.id, SPR.extra[def.id] ? XE[key] : 0, def.x - 0.04, 0, def.face, { extra: !!SPR.extra[def.id], silhouette: "#ff2bd6" }); drawFrame(g, def.id, SPR.extra[def.id] ? XE[key] : 0, def.x + 0.04, 0, def.face, { extra: !!SPR.extra[def.id], silhouette: "#2bf3ff" }); g.globalAlpha = 1; }
            defPose(g, def, key, def.x, 0, { flash: fl }); g.restore(); };
          halfDraw(false, 0, 0); halfDraw(true, s * off, -off * 0.25);
          if (glitch && Math.random() < 0.5) { const yy = cy + (Math.random() - 0.5) * 1.4 * VIEW.S; g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = Math.random() < 0.5 ? "rgba(255,43,214,.35)" : "rgba(43,243,255,.35)"; g.fillRect(cx - 0.6 * VIEW.S, yy, 1.2 * VIEW.S, 3 + Math.random() * 5); g.restore(); }
        },
        drawProps(g, t) {
          if (t >= T.bind && t < T.drop + 0.3) { // the opponent's DNA, locked across their chest
            const grow = easeOut(seg(t, T.bind, T.bind + 0.4)), a = 1 - seg(t, T.drop, T.drop + 0.3), xa = s > 0 ? x0 : lerp(x1, x0, grow), xb = s > 0 ? lerp(x0, x1, grow) : x1;
            let hi = null;
            if (t >= T.scan && t < T.match) hi = [scanX(t), scanX(t) + step * 20, "#ff9a3c"];
            else if (t >= T.match && t < T.snip) hi = [tA, tB, (t - T.match) % 0.2 < 0.1 ? "#7dff8a" : "#3ad15a"];
            drawDNA(g, xa, xb, dnaY, { alpha: a, hi, pam: t >= T.match + 0.15 && t < T.snip ? pamX : null, cut: t >= T.snip ? cutX : null, gap: gap(t), tilt: t >= T.snip && t < T.repair ? 0.12 * seg(t, T.snip, T.snip + 0.25) : 0, bad: t >= T.repair ? cutX : null, phase: t * 0.6 });
            if (t >= T.match + 0.15 && t < T.snip) { // the PAM reticle snaps on: NGG
              const k = backOut(seg(t, T.match + 0.15, T.match + 0.4)), px = VIEW.sx(pamX + step * 1.5), py = VIEW.sy(dnaY), r = (0.38 + 0.5 * (1 - k)) * VIEW.S;
              g.save(); g.translate(px, py); g.rotate((1 - k) * 1.5); g.strokeStyle = "#ffe14d"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(r, r * 0.45); g.lineTo(r, r); g.lineTo(r * 0.45, r); g.stroke(); } g.restore();
              g.save(); g.font = "14px P2, monospace"; g.textAlign = "center"; g.lineWidth = 5; g.strokeStyle = "#140a24"; g.strokeText("PAM: NGG", px, py + r + 22); g.fillStyle = "#ffe14d"; g.fillText("PAM: NGG", px, py + r + 22); g.restore();
            }
            if (t >= T.scan && t < T.snip) { // the guide RNA readout
              const ok = t >= T.match, txt = ok ? "GUIDE RNA: MATCH" : "GUIDE RNA: SCANNING" + ".".repeat(1 + Math.floor(t * 6) % 3), tx = VIEW.sx((ok ? tA + tB : scanX(t) * 2 + step * 20) / 2), ty = VIEW.sy(dnaY + 0.62);
              g.save(); g.font = "13px P2, monospace"; g.textAlign = "center"; g.lineWidth = 5; g.strokeStyle = "#140a24"; g.strokeText(txt, tx, ty); g.fillStyle = ok ? "#7dff8a" : "#ffb070"; g.fillText(txt, tx, ty); g.restore();
            }
          }
          if (t >= T.fly && t < T.repair) { // Cas9 swoops in from above, blades pointing down across the DNA, and snaps shut
            const u = easeOut(seg(t, T.fly, T.fly + 0.45)), leave = seg(t, T.snip + 0.35, T.repair), px = cpx(), f = t < T.snip ? 0 : 1;
            const tipY = dnaY - 0.35, cyW = tipY + C.frames[0][2] * px / VIEW.S * 0.5, x = lerp(cutX - s * 3, cutX, u), y = lerp(cyW + 3.5, cyW, u) + leave * 4;
            const pre = t > T.fly + 0.45 && t < T.snip ? Math.sin(t * 50) * 0.03 : 0; // trembling before the cut
            domCentered(g, IM.cas9, C, f, VIEW.sx(x + pre), VIEW.sy(y), px, { rot: Math.PI / 2 + (1 - u) * -s * 1.2, alpha: 1 - leave, ky: s });
          }
          if (t >= T.snip && t < T.snip + 0.3) { // the cut line through both strands
            const u = seg(t, T.snip, T.snip + 0.3), x = VIEW.sx(cutX); g.save(); g.globalAlpha = 1 - u; g.globalCompositeOperation = "lighter"; g.strokeStyle = "#ffffff"; g.lineWidth = 10 * (1 - u) + 2; g.beginPath(); g.moveTo(x - s * 240, VIEW.sy(dnaY) - 240 * 0.35); g.lineTo(x + s * 240, VIEW.sy(dnaY) + 240 * 0.35); g.stroke(); g.restore();
          }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.55) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.13, life)), rot); } };
          pop("MATCH FOUND!", T.match, VIEW.sx((tA + tB) / 2), VIEW.sy(2.55), 48, "#7dff8a", -0.06, 0.6);
          pop("SNIP!", T.snip, VIEW.sx(cutX + s * 1.1), VIEW.sy(2.3), 76, "#ffffff", 0.1, 0.6);
          pop("SLOPPY REPAIR...", T.repair, VIEW.sx(cutX), VIEW.sy(2.65), 34, "#ffb070", -0.04, 0.5);
          if (t > T.stamp && t < D.shatter) { // the stamp: GENE KNOCKOUT
            const u = t - T.stamp, k = u < 0.12 ? lerp(2.2, 1, easeIn(u / 0.12)) : 1 + 0.05 * spring(u - 0.12, 10, 30), x = VIEW.sx(def.x), y = VIEW.sy(1.35);
            g.save(); g.translate(x, y); g.rotate(-0.16); g.scale(k, k); g.globalAlpha = Math.min(1, u / 0.08);
            g.strokeStyle = "#e8233c"; g.lineWidth = 7; g.strokeRect(-190, -42, 380, 84); g.lineWidth = 2; g.strokeRect(-180, -33, 360, 66);
            g.font = "48px Bangers, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#e8233c"; g.fillText("GENE KNOCKOUT!", 0, 3); g.restore();
          }
        },
      };
    },
  },

  /* ---------- RNA: Silent Shadow Interference. Dicer chops double-stranded RNA into guides; shadow ninjas (RISC) slice the matching mRNA ---------- */
  rna: {
    name: "SILENT SHADOW INTERFERENCE", col: "#b86bff", gold: "#ffd36b", mote: "#d9a8ff", dur: 7.8, shatter: 7.0, pull: 6.75, dim: 0.08,
    glow: [850, 125, 110, "#f0c8ff"],
    mv: { knock: [3, 6] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { throw: 1.8, dicer: 2.15, chop: [2.45, 2.8, 3.15], seal: 3.35, mrna: 3.55, slice: [4.15, 4.55, 4.95], palm: 5.3, silent: 5.5, flurry: 5.95, vanish: 6.45, down: 6.5, pose: 6.55 };
      const lim = (x) => clamp(x, -HALF + 0.6, HALF - 0.6), startX = att.x;
      const ribY = 2.7, bp = 0.6 / 10.5, piece = 21 * bp, rib0 = mid - s * piece * 1.5; // the dsRNA: three 21-letter pieces long
      const spots = [lim(def.x - s * 1.75), lim(def.x + s * 1.75), lim(def.x - s * 3.0)];
      const land = T.chop.map((t) => t + 0.35);
      const SEQS = ["AUGGCUAGCUUCGAGGAUCCA", "AUGCCGUUAGCAUGGCUACGU", "AUGUUCGGACAUAGCGCUAAG"], NAMES = ["mRNA: PUNCH", "mRNA: KICK", "mRNA: SPECIAL"];
      const comp = (q) => q.split("").map((b) => RNA_COMP[b]).join("");
      // the opponent's three mRNAs, streaming out of their chest toward the attacker like scrolls
      const ribH = [0.75, 1.4, 2.05], ribLen = 2.3;
      const mrnaPath = (i, t, k = 1) => (u) => { const xx = def.x - s * (0.15 + u * ribLen * k); return [xx, ribH[i] + Math.sin(u * 9 + t * 4 + i) * 0.05]; };
      const unfurl = (t) => easeOut(seg(t, T.mrna, T.mrna + 0.4));
      const sliceX = (i) => def.x - s * (0.15 + ribLen * 0.55);
      const SIL = (f) => domSil(IM.poses, M.poses, f, "#1c0a30"), RIM = (f) => domSil(IM.poses, M.poses, f, "#d79bff");
      const ppx = () => VIEW.S * FIGHTER_H / SPRITE_META.target;
      const ninja = (g, x, f, a, face = s) => { // a shadow clone: a dark silhouette with a glowing rim and glowing eyes
        const sx = VIEW.sx(x), sy = VIEW.sy(0), px = ppx(), PS = M.poses, [cw, ch] = PS.cell;
        g.save(); g.globalAlpha = a; g.translate(sx, sy); g.scale(face * px, px);
        for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, 4], [-4, 4], [4, -4]]) g.drawImage(RIM(f), -cw / 2 + dx, -PS.base + dy);
        g.drawImage(SIL(f), -cw / 2, -PS.base);
        const fr = PS.frames[f], ex = f === 3 ? fr[0] + fr[2] * 0.86 : fr[0] + fr[2] * 0.62, ey = f === 3 ? fr[1] + fr[3] * 0.2 : fr[1] + fr[3] * 0.075;
        g.globalCompositeOperation = "lighter"; g.fillStyle = "#ff9cf0"; g.fillRect(ex - cw / 2 - 14, ey - PS.base - 3, 28, 7); g.fillStyle = "#ffffff"; g.fillRect(ex - cw / 2 - 9, ey - PS.base - 1, 18, 3); g.restore();
      };
      const guideAt = (i, t) => { // the ninja's guide strand, floating beside it
        const x = spots[i], u = t * 3 + i; return (v) => [x - s * 0.15 + s * (v - 0.5) * 0.9, 1.75 + Math.sin(v * 8 + u) * 0.05]; };
      return {
        poses: [[0, 0], [D.expand, 1], [T.throw, 2], [T.seal, 0], [T.flurry, 3], [T.pose, 0]],
        attX: (t) => (t < T.flurry ? startX : lerp(startX, lim(startX + s * 1.2), easeOut(seg(t, T.flurry, T.flurry + 0.15)))),
        ghosts: (t) => t > T.flurry && t < T.flurry + 0.2,
        camera(t) {
          if (t < T.mrna) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid, k), S: lerp(150, 92, k) }; }
          if (t < T.flurry) { const k = ss(t, T.mrna, T.mrna + 0.5); return { x: lerp(mid, def.x - s * 1.3, k), S: lerp(92, 108, k) }; }
          const k = ss(t, T.flurry, T.flurry + 0.2); return { x: lerp(def.x - s * 1.3, def.x - s * 0.6, k), S: lerp(108, 126, k) + 6 * spring(t - T.flurry, 5, 30) };
        },
        step(t) {
          if (c.once("throw", T.throw)) game.sfx("whoosh");
          if (c.once("dicer", T.dicer)) game.sfx("charge");
          T.chop.forEach((tc, i) => {
            if (c.once("chop" + i, tc)) { game.sfx("cut"); VIEW.shake = 0.25; c.freeze = 0.05; const x = rib0 + s * piece * (i + 1); for (let j = 0; j < 8; j++) P.spark(V3(x, ribY, 0), j % 2 ? "#7ff1e2" : "#ffffff", 0.1, V3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0), 0.3); }
            if (c.once("land" + i, land[i])) { game.sfx("poof"); X.grit(spots[i], 4); }
          });
          if (c.once("mrna", T.mrna)) { game.sfx("select"); def.flash = 0.1; }
          T.slice.forEach((ts, i) => { if (c.once("pair" + i, ts - 0.3)) game.sfx("ding"); if (c.once("slice" + i, ts)) { game.sfx("cut"); c.freeze = 0.06; VIEW.shake = 0.35; for (let j = 0; j < 10; j++) P.spark(V3(sliceX(i), ribH[i], 0), j % 2 ? D.col : "#ffffff", 0.1, V3((Math.random() - 0.5) * 7, Math.random() * 4, 0), 0.35); } });
          if (c.once("palm", T.palm)) game.sfx("fizzle");
          for (let j = 0; j < 6; j++) if (c.once("fl" + j, T.flurry + j * 0.075)) { game.sfx(j === 5 ? "impact" : "zap"); def.flash = 0.1; VIEW.shake = 0.3 + 0.08 * j; if (j === 5) { c.freeze = 0.1; VIEW.impact = 0.14; FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(1.1) / VIEW_H; } P.hit(V3(def.x + (Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.9, 0), j % 2 ? D.col : "#ffffff", 1); }
          if (c.once("vanish", T.vanish)) game.sfx("poof");
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x, 8); }
        },
        drawDef(g, t) {
          if (t < T.palm) return X.drawDefIdle(g, t);
          if (t < T.flurry) return defPose(g, def, t < T.silent + 0.25 ? "palm" : "dizzy", def.x, 0, { flash: def.flash });
          if (t < T.down) return defPose(g, def, Math.floor((t - T.flurry) / 0.075) % 2 ? "hitBody" : "hitHigh", def.x, 0, { flash: def.flash });
          const u = t - T.down; defPose(g, def, "down", def.x, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawBack(g, t) { // the shadow ninjas stand behind the opponent's mRNAs
          for (let i = 0; i < 3; i++) {
            if (t < land[i]) continue;
            const a = Math.min(1, (t - land[i]) / 0.12) * (1 - seg(t, T.vanish, T.vanish + 0.15)); if (a <= 0) continue;
            const ts = T.slice[i];
            if (t > ts - 0.08 && t < ts + 0.14) { // the dash through its mRNA, with afterimages
              const u = seg(t, ts - 0.08, ts + 0.14), x0 = spots[i], x1 = lim(spots[i] === spots[1] ? def.x - s * 3.4 : def.x + s * 0.9), dx = lerp(x0, x1, u);
              for (let k = 1; k < 4; k++) ninja(g, lerp(x0, x1, Math.max(0, u - k * 0.12)), 3, a * 0.25 / k, Math.sign(x1 - x0) || s);
              ninja(g, dx, 3, a, Math.sign(x1 - x0) || s); continue;
            }
            const sx = t >= ts + 0.14 ? lim(spots[i] === spots[1] ? def.x - s * 3.4 : def.x + s * 0.9) : spots[i];
            if (t > T.flurry && t < T.vanish) { // the flurry: every ninja blinks from side to side through the opponent
              const j = Math.floor((t - T.flurry) / 0.075 + i), side = j % 2 ? 1 : -1; ninja(g, def.x + side * (0.9 + 0.25 * i), 3, a, -side); continue;
            }
            ninja(g, sx, 0, a, Math.sign(def.x - sx) || s);
            if (t < ts - 0.3) drawStrand(g, guideAt(i, t), comp(SEQS[i]), { dir: -1, base: 0.1, w: 0.04, col: "#ffd36b", glow: "#ffd36b", alpha: a });
          }
          for (let i = 0; i < 3; i++) { // smoke: a puff where each ninja lands, a burst when they vanish
            if (t > land[i] - 0.05 && t < land[i] + 0.45) { const u = seg(t, land[i] - 0.05, land[i] + 0.45); domStrip(g, IM.smoke, M.smoke, 0, VIEW.sx(spots[i]), VIEW.sy(-0.1), VIEW.S * 1.6 / M.smoke.frames[0][2] * (0.7 + 0.5 * u), { alpha: 1 - u * u }); }
          }
        },
        drawProps(g, t) {
          // the double-stranded RNA, thrown up and chopped from one end, piece by piece
          if (t >= T.throw && t < land[2]) {
            const fly = easeOut(seg(t, T.throw, T.throw + 0.35)), done = T.chop.filter((tc) => t >= tc).length;
            if (done < 3) { const a = rib0 + s * piece * done, b = rib0 + s * piece * 3, xa = Math.min(a, b), xb = Math.max(a, b), y = lerp(1.6, ribY, fly), ox = lerp(startX, 0, fly) * (1 - fly);
              drawDNA(g, xa + ox, xb + ox, y, { turn: 0.6, R: 0.14, phase: t * 3, alpha: Math.min(1, fly * 2) }); }
            for (let i = 0; i < done; i++) { // each chopped piece falls to its ninja's spot, losing its passenger strand on the way
              const u = seg(t, T.chop[i], land[i]); if (u >= 1) continue; const x0 = rib0 + s * piece * (i + 0.5), x = lerp(x0, spots[i], u), y = lerp(ribY, 0.6, easeIn(u));
              drawDNA(g, x - piece / 2, x + piece / 2, y, { turn: 0.6, R: 0.14, phase: t * 8, alpha: 1 - u * 0.3 });
            }
          }
          if (t >= T.dicer && t < T.chop[2] + 0.35) { // Dicer works along the RNA: blades up, chop, move on
            const i = Math.min(2, T.chop.filter((tc) => t >= tc - 0.12).length), tc = T.chop[Math.min(2, i)], k = t - tc;
            const cutAt = rib0 + s * piece * (Math.min(i, 2) + 1), x = cutAt, f = k > -0.04 && k < 0.18 ? 1 : 0, a = Math.min(1, (t - T.dicer) / 0.15) * (1 - seg(t, T.chop[2] + 0.15, T.chop[2] + 0.35));
            const Dm = M.dicer, px = VIEW.S * 2.0 / Dm.frames[0][2]; domStrip(g, IM.dicer, Dm, f, VIEW.sx(x - s * 0.55), VIEW.sy(ribY - 0.25), px, { flip: s, alpha: a });
          }
          // the opponent's mRNAs
          if (t >= T.mrna && t < T.vanish) for (let i = 0; i < 3; i++) {
            const ts = T.slice[i], seq = SEQS[i];
            if (t < ts) {
              drawStrand(g, mrnaPath(i, t, unfurl(t)), seq.slice(0, Math.max(1, Math.round(seq.length * unfurl(t)))), { base: 0.15, w: 0.055, col: "#c98bff" });
              const [lx, ly] = mrnaPath(i, t, unfurl(t))(1); g.save(); g.font = "11px P2, monospace"; g.textAlign = s > 0 ? "right" : "left"; g.lineWidth = 4; g.strokeStyle = "#140a24"; g.globalAlpha = unfurl(t); g.strokeText(NAMES[i], VIEW.sx(lx) - s * 8, VIEW.sy(ly) + 4); g.fillStyle = "#ffffff"; g.fillText(NAMES[i], VIEW.sx(lx) - s * 8, VIEW.sy(ly) + 4); g.restore();
              if (t > ts - 0.3) { // the guide strand lines up under its match: A-U and G-C pairs
                const k = easeOut(seg(t, ts - 0.3, ts - 0.12)), base = mrnaPath(i, t); drawStrand(g, (u) => { const [x, y] = base(u); return [x, y - 0.3 + 0.0 * k - (1 - k) * 0.6]; }, comp(seq), { dir: -1, base: 0.15, w: 0.05, col: "#ffd36b", glow: "#ffd36b", alpha: k });
              }
            } else { // sliced: the two halves fall away and break down
              const u = seg(t, ts, ts + 0.6); if (u >= 1) continue; const half = Math.floor(seq.length * 0.55), base = mrnaPath(i, ts);
              drawStrand(g, (v) => { const [x, y] = base(v * 0.55); return [x - s * 0.1 * u, y - 1.2 * u * u + Math.sin(v * 5) * 0.1 * u]; }, seq.slice(0, half), { base: 0.15, w: 0.055, col: "#c98bff", alpha: 1 - u });
              drawStrand(g, (v) => { const [x, y] = base(0.55 + v * 0.45); return [x + s * 0.1 * u, y - 1.4 * u * u - Math.sin(v * 5) * 0.1 * u]; }, seq.slice(half), { base: 0.15, w: 0.055, col: "#c98bff", alpha: 1 - u });
            }
          }
          if (t > T.palm && t < T.palm + 0.5) { // the attack fizzles: no mRNA, no protein, no move
            const u = seg(t, T.palm, T.palm + 0.5), b = defBox(def, "palm"), hx = def.x + b[0] + def.face * b[2] * 0.45; domStrip(g, IM.smoke, M.smoke, 0, VIEW.sx(hx), VIEW.sy(1.05), VIEW.S * 0.5 / M.smoke.frames[0][2] * (1 + u), { alpha: 0.6 * (1 - u) });
          }
          if (t > T.flurry && t < T.vanish) for (let j = 0; j < 6; j++) { // the slashes of the flurry
            const t0 = T.flurry + j * 0.075, u = seg(t, t0, t0 + 0.14); if (t < t0 || u >= 1) continue; const cx = VIEW.sx(def.x), cy = VIEW.sy(1.1), a = (j * 1.1) % Math.PI, L = 1.3 * VIEW.S;
            g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - u; g.strokeStyle = j % 2 ? "#ff9cf0" : "#ffffff"; g.lineWidth = 7 * (1 - u) + 1; g.beginPath(); g.moveTo(cx - Math.cos(a) * L, cy - Math.sin(a) * L); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke(); g.restore();
          }
          if (t > T.vanish - 0.05 && t < T.vanish + 0.6) for (let i = 0; i < 3; i++) { // the ninjas vanish in smoke
            const u = seg(t, T.vanish - 0.05, T.vanish + 0.6), j = Math.floor((T.vanish - T.flurry) / 0.075 + i), side = j % 2 ? 1 : -1, x = def.x + side * (0.9 + 0.25 * i);
            domStrip(g, IM.smoke, M.smoke, 1, VIEW.sx(x), VIEW.sy(-0.2), VIEW.S * 2.2 / M.smoke.frames[1][2] * (0.8 + 0.4 * u), { alpha: 1 - u * u });
          }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.5) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          T.chop.forEach((tc, i) => pop("CHOP!", tc, VIEW.sx(rib0 + s * piece * (i + 1)), VIEW.sy(ribY + 0.75), 40 + i * 6, "#7ff1e2", i % 2 ? 0.1 : -0.1, 0.4));
          T.slice.forEach((ts, i) => pop("SLICE!", ts, VIEW.sx(sliceX(i) - s * 0.8), VIEW.sy(ribH[i] + 0.55), 46, "#ff9cf0", i % 2 ? 0.1 : -0.1, 0.45));
          if (t > T.palm + 0.08 && t < T.silent + 0.05) { const [bx, top] = defBox(def, "palm"); X.speech(g, [VIEW.sx(def.x + bx), VIEW.sy(top - 0.1), VIEW.sy(top + 0.1)], ["...?"], 1); }
          pop("SILENCED!", T.silent, VIEW.sx(def.x), VIEW.sy(2.75), 62, "#ffffff", -0.06, 0.5);
        },
      };
    },
  },

  /* ---------- Mitochondria: mtDNA Disk Barrage. Its own circular DNA, copied eight times and thrown like light disks ---------- */
  mito: {
    name: "mtDNA DISK BARRAGE", col: "#ff8a2a", gold: "#ffd36b", mote: "#ffb070", dur: 7.5, shatter: 6.7, pull: 6.45, dim: 0.12,
    glow: [836, 80, 260, "#ff7a30"],
    mv: { knock: [4, 7] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { copy: 1.75, double: [1.95, 2.2, 2.45], throw0: 2.85, gap: 0.22, fly: 0.42, gather: 5.0, merge: 5.3, giant: 5.65, through: 5.9, down: 6.15 };
      const lim = (x) => clamp(x, -HALF + 0.3, HALF - 0.3), ceil = (FLOOR_Y - 100) / 95, startX = att.x, hand = () => [att.x + s * 0.55, 1.3];
      const wallX = lim(def.x + s * 2.4), L = (k) => lerp(att.x, def.x, k);
      const paths = [ // each disk's ricochets: walls, ceiling and floor of the domain
        [[L(0.5), ceil], [def.x, 1.35]],
        [[L(0.42), 0.05], [def.x, 1.6]],
        [[wallX, 2.5], [def.x, 1.15]],
        [[L(0.3), ceil], [L(0.68), 0.05], [def.x, 1.45]],
        [[L(0.3), 0.05], [L(0.7), ceil], [def.x, 1.25]],
        [[wallX, 0.6], [def.x, 1.5]],
        [[L(0.55), ceil], [wallX, 1.9], [def.x, 1.1]],
        [[L(0.45), 0.05], [wallX, 2.8], [def.x, 1.4]],
      ];
      const t0 = (i) => T.throw0 + i * T.gap, hitT = (i) => t0(i) + T.fly;
      const route = (i) => [hand(), ...paths[i]];
      const at = (pts, u) => { const d = []; let tot = 0; for (let j = 1; j < pts.length; j++) { const l = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); d.push(l); tot += l; }
        let want = u * tot; for (let j = 0; j < d.length; j++) { if (want <= d[j] || j === d.length - 1) { const k = clamp(want / d[j]); return [lerp(pts[j][0], pts[j + 1][0], k), lerp(pts[j][1], pts[j + 1][1], k), j]; } want -= d[j]; } };
      const routes = [];
      const count = (t) => (t < T.copy ? 0 : t < T.double[0] ? 1 : t < T.double[1] ? 2 : t < T.double[2] ? 4 : 8);
      const orbit = (i, n, t) => { const a = i / n * TAU + t * 2.2, [hx] = hand(); return [att.x + s * 0.2 + Math.cos(a) * 0.95, 2.05 + Math.sin(a) * 0.45]; };
      const thrown = (t) => [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => t >= t0(i)).length;
      const giantR = 1.05, giantPos = (t) => { const a = [att.x + s * 1.25, 2.3]; if (t < T.giant) return a; const u = easeIn(seg(t, T.giant, T.through + 0.25)); return [lerp(a[0], def.x + s * 3.2, u), lerp(a[1], 1.15, Math.min(1, u * 1.6))]; };
      const poses = [[0, 0], [D.expand, 1], [T.copy, 0]];
      for (let i = 0; i < 8; i++) poses.push([t0(i) - 0.11, 2], [t0(i), 3]);
      poses.push([T.gather, 1], [T.giant - 0.14, 2], [T.giant, 3], [T.down + 0.2, 0]);
      return {
        poses,
        camera(t) {
          if (t < T.giant) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid, k), S: lerp(150, 92, k) + (t > T.throw0 ? 3 * Math.sin(t * 40) * Math.exp(-((t - T.throw0) % T.gap) * 20) : 0) }; }
          const k = ss(t, T.giant, T.through); return { x: lerp(mid, def.x - s * 0.5, k), S: lerp(92, 116, k) + 10 * spring(t - T.through, 6, 18) * (t > T.through ? 1 : 0) };
        },
        step(t) {
          if (c.once("copy", T.copy)) game.sfx("disc");
          T.double.forEach((td, i) => { if (c.once("dbl" + i, td)) { game.sfx("select"); VIEW.flash = 0.03; } });
          for (let i = 0; i < 8; i++) {
            if (c.once("th" + i, t0(i))) { game.sfx("disc"); routes[i] = route(i); }
            if (routes[i]) for (let j = 1; j < routes[i].length - 1; j++) { const pts = routes[i], ub = (() => { let tot = 0, upto = 0; for (let q = 1; q < pts.length; q++) { const l = Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]); tot += l; if (q <= j) upto += l; } return upto / tot; })();
              if (c.once("b" + i + "_" + j, t0(i) + ub * T.fly)) { game.sfx("zap"); const [bx, by] = pts[j]; for (let q = 0; q < 8; q++) P.spark(V3(bx, by, 0), q % 2 ? "#ff8a2a" : "#ffffff", 0.1, V3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0), 0.3); } }
            if (c.once("hit" + i, hitT(i))) { c.freeze = i === 7 ? 0.09 : 0.045; VIEW.shake = 0.25 + i * 0.04; game.sfx(i === 7 ? "heavy" : "impact"); def.flash = 0.12; const [, hy] = paths[i][paths[i].length - 1]; P.hit(V3(def.x, hy, 0), "#ff8a2a", 1.1); }
          }
          if (c.once("gather", T.gather)) game.sfx("charge");
          if (c.once("merge", T.merge)) { game.sfx("domain"); VIEW.flash = 0.08; VIEW.shake = 0.3; }
          if (c.once("giant", T.giant)) game.sfx("disc");
          if (c.once("through", T.through)) { c.freeze = 0.13; VIEW.impact = 0.16; VIEW.shake = 0.9; FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(1.15) / VIEW_H; game.sfx("impact"); game.sfx("boom"); def.flash = 0.2; for (let q = 0; q < 20; q++) { const a = Math.random() * TAU, v = 4 + Math.random() * 7; P.spark(V3(def.x, 1.15, 0), q % 2 ? "#ff8a2a" : "#ffe0b0", 0.13, V3(Math.cos(a) * v, Math.sin(a) * v, 0), 0.45); } }
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x + s * 0.6, 8); }
        },
        drawDef(g, t) {
          if (t < hitT(0)) return X.drawDefIdle(g, t);
          const fl = def.flash;
          if (t < T.through) { const n = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => t >= hitT(i)).length, key = t > hitT(7) + 0.3 ? "dizzy" : n % 2 ? "hitHigh" : "hitBody"; return defPose(g, def, key, def.x, 0, { flash: fl }); }
          if (t < T.down) { const u = seg(t, T.through, T.down); return defPose(g, def, "launch", def.x + s * 0.6 * u, Math.sin(u * Math.PI) * 0.5, { flash: fl, rot: s * u * 0.4 }); }
          const u = t - T.down; defPose(g, def, "down", def.x + s * 0.6, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawProps(g, t) {
          const S = VIEW.S, rr = 0.3 * S;
          // copying: one ring becomes 2, 4, 8, orbiting above the Ranger, until each is thrown
          const n = count(t), gone = thrown(t);
          if (n > 0 && t < T.throw0 + 8 * T.gap) for (let i = gone; i < n; i++) {
            const [x, y] = orbit(i, n, t), born = n === 1 ? T.copy : T.double[Math.log2(n) - 1], k = backOut(seg(t, born, born + 0.25));
            drawRing(g, VIEW.sx(x), VIEW.sy(y), rr * (n === 1 ? 1.4 : 1) * Math.max(0.2, k), t * 6 + i, { ky: 0.85 });
          }
          for (let i = 0; i < 8; i++) { // thrown disks: light trails behind, ricochets, and the hit
            if (!routes[i] || t < t0(i)) continue; const u = seg(t, t0(i), hitT(i)), fade = 1 - seg(t, hitT(i), hitT(i) + 0.35);
            if (fade <= 0) continue;
            const pts = routes[i], trail = []; for (let q = 0; q <= 24; q++) { const uu = q / 24 * u; if (uu < u - 0.5) continue; trail.push(at(pts, uu)); }
            g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round";
            for (const [w, col, al] of [[14, "#ff6a10", 0.35], [6, "#ffb060", 0.8], [2, "#ffffff", 1]]) { g.globalAlpha = al * fade; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); trail.forEach(([x, y], q) => (q ? g.lineTo(VIEW.sx(x), VIEW.sy(y)) : g.moveTo(VIEW.sx(x), VIEW.sy(y)))); g.stroke(); }
            g.restore();
            if (u < 1) { const [x, y] = at(pts, u); drawRing(g, VIEW.sx(x), VIEW.sy(y), rr, t * 30, { ky: 0.45, rot: Math.sin(t * 10 + i) * 0.3 }); }
          }
          if (t >= T.gather && t < T.merge + 0.1) { // the disks come back and merge into one giant ring
            const u = easeIn(seg(t, T.gather, T.merge)), [gx, gy] = giantPos(t);
            for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 3, sx = lerp(def.x + Math.cos(a) * 0.6, gx + Math.cos(a) * giantR * (1 - u), u), sy = lerp(1.3 + Math.sin(a) * 0.5, gy + Math.sin(a) * giantR * (1 - u), u); drawRing(g, VIEW.sx(sx), VIEW.sy(sy), rr * 0.8, t * 20 + i, { ky: 0.8 }); }
          }
          if (t >= T.merge && t < T.through + 0.5) {
            const k = backOut(seg(t, T.merge, T.merge + 0.3)), [gx, gy] = giantPos(t), a = 1 - seg(t, T.through + 0.15, T.through + 0.5), R = giantR * S * k;
            if (t > T.giant) { g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(255,140,40,.5)"; g.lineWidth = R * 0.5; g.lineCap = "round"; const [ax, ay] = giantPos(T.giant); g.beginPath(); g.moveTo(VIEW.sx(lerp(ax, gx, 0.5)), VIEW.sy(lerp(ay, gy, 0.5))); g.lineTo(VIEW.sx(gx), VIEW.sy(gy)); g.stroke(); g.restore(); }
            drawRing(g, VIEW.sx(gx), VIEW.sy(gy), R, t * 12, { alpha: a, label: "16,569 BASE PAIRS · 37 GENES", labelSpin: t * 0.8 });
          }
        },
        text(g, t) {
          const pop = (word, at0, x, y, size, col, rot, life = 0.5) => { if (t > at0 && t < at0 + life) { const u = t - at0; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          if (t > T.copy && t < T.throw0 + 0.3) { const n = count(t), txt = "mtDNA ×" + n; g.save(); g.font = "18px P2, monospace"; g.textAlign = "center"; g.lineWidth = 6; g.strokeStyle = "#2a0a06"; const x = VIEW.sx(att.x + s * 0.2), y = VIEW.sy(3.0); g.strokeText(txt, x, y); g.fillStyle = "#ffd36b"; g.fillText(txt, x, y); g.restore(); }
          T.double.forEach((td) => pop("COPY!", td, VIEW.sx(att.x + s * 1.4), VIEW.sy(2.7), 34, "#ffd36b", 0.08, 0.3));
          for (let i = 0; i < 8; i++) pop((i + 1) + " HIT" + (i ? "S" : "") + "!", hitT(i), VIEW.sx(def.x + s * 1.1), VIEW.sy(2.4 + (i % 2) * 0.2), 34 + i * 3, i === 7 ? "#ff8a2a" : "#ffffff", i % 2 ? 0.08 : -0.08, 0.3);
          pop("INHERITED FROM MOM!", T.through, VIEW.sx(def.x), VIEW.sy(2.65), 56, "#ffd36b", -0.06, 0.75);
        },
      };
    },
  },

  /* ---------- DNA: Twin Serpent Fork. Replication: helicase unzips the serpent, polymerase builds two copies, each half old and half new ---------- */
  dna: {
    name: "TWIN SERPENT FORK", col: "#3c8cff", gold: "#ffd36b", mote: "#9cc4ff", dur: 7.5, shatter: 6.7, pull: 6.45, dim: 0.12,
    glow: [836, 40, 300, "#8a7dff"],
    mv: { knock: [4, 7] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { rise: 1.55, unzip: 2.45, unzipEnd: 3.35, ligase: 3.6, copies: 3.8, strike: 4.15, bites: [4.3, 4.65, 5.0], fin: 5.45, down: 5.85 };
      const lim = (x) => clamp(x, -HALF + 0.3, HALF - 0.3), V = (x, y) => [x, y];
      const B0 = V(lim(att.x - s * 1.1), -0.3);
      const single = [B0, V(att.x - s * 1.6, 2.9), V(mid - s * 0.6, 3.7), V(mid + s * 0.35, 2.75)];
      const restA = [B0, V(att.x - s * 1.8, 3.2), V(mid - s * 0.5, 3.9), V(mid + s * 0.55, 3.3)];
      const restB = [B0, V(att.x - s * 0.4, 1.2), V(mid - s * 0.8, 0.3), V(mid + s * 0.2, 0.95)];
      const tgt = V(def.x - s * 0.35, 1.3);
      const fork = (t) => 1 - ss(t, T.unzip, T.unzipEnd); // the replication fork runs from the head down to the root
      const wsplit = (u, t) => ss(u, fork(t), fork(t) + 0.15);
      const bite = (t, at, dur = 0.4) => { const u = (t - at) / dur; return u < 0 || u > 1 ? 0 : u < 0.3 ? easeOut(u / 0.3) : u < 0.5 ? 1 : 1 - easeIn((u - 0.5) / 0.5); };
      const ctrl = (k, t) => { // serpent k's curve right now: its rest pose, pushed toward the opponent while it bites
        const rest = k ? restB : restA, bt = k ? bite(t, T.bites[1]) : Math.max(bite(t, T.bites[0]), bite(t, T.bites[2])), fin = t < T.fin ? 0 : t < T.fin + 0.2 ? easeOut(seg(t, T.fin, T.fin + 0.14)) : 1 - easeIn(seg(t, T.fin + 0.3, T.fin + 0.7));
        const hit = k ? V(def.x - s * 0.1, 0.85) : V(def.x - s * 0.1, 1.75), b = Math.max(bt, fin), aim = fin > bt ? hit : tgt;
        const coil = t > T.strike ? 0.12 * Math.sin(t * 5 + k * 2) : 0;
        return [rest[0], rest[1], V(lerp(rest[2][0], (rest[2][0] + aim[0]) / 2, b), lerp(rest[2][1], aim[1] + (k ? -0.6 : 0.8), b) + coil), V(lerp(rest[3][0], aim[0], b), lerp(rest[3][1], aim[1], b) + coil * 0.6)];
      };
      const curve = (k, t) => { const sp = bez(...single), sk = bez(...ctrl(k, t)); return (u) => { const w = wsplit(u, t), a = sp(u), b = sk(u); return [lerp(a[0], b[0], w), lerp(a[1], b[1], w)]; }; };
      const grow = (t) => easeOut(seg(t, T.rise, T.rise + 0.6));
      const LB = [0, 0.2, 0.4, 0.6, 0.8, 1]; // the lagging strand's Okazaki fragments, each made away from the fork
      const lagFill = (u, t) => { const f = fork(t); if (u < f) return false; for (let j = 0; j < 5; j++) { const a = LB[j], b = LB[j + 1]; if (u < a || u > b) continue; const st = T.unzip + (1 - b) * (T.unzipEnd - T.unzip) + 0.05, p = seg(t, st, st + 0.2), gap = t < T.ligase ? 0.018 : 0; return u >= a + gap && u <= lerp(a + gap, b - gap, p); } return false; };
      const lead = (u, t) => u >= fork(t) + 0.05;
      const OLD0 = () => "#1ec8c8", OLD1 = () => "#a83ce6", NEW = () => "#ffd36b";
      const heads = [];
      const head = (g, x, y, ang, open, sc) => { // a serpent head on the end of its body, upright whichever way it faces
        const Hm = M.heads, f = open ? 1 : 0, [ox, oy, w, h] = Hm.frames[f], cw = Hm.cell[0], nk = [[12, 185], [14, 180]][f], px = 0.78 * VIEW.S * sc / 170;
        g.save(); g.translate(x, y); g.rotate(ang); if (Math.cos(ang) < 0) g.scale(1, -1); g.scale(px, px); g.imageSmoothingEnabled = true;
        g.drawImage(IM.heads, f * cw, 0, cw, Hm.cell[1], -nk[0] + 4, -nk[1], cw, Hm.cell[1]); g.restore();
      };
      const enz = (g, f, x, y, size, ang = 0) => domCentered(g, IM.enzymes, M.enzymes, f, VIEW.sx(x), VIEW.sy(y), VIEW.S * size / M.enzymes.frames[f][2], { rot: ang });
      return {
        poses: [[0, 0], [D.expand, 1], [T.unzip - 0.12, 2], [T.strike - 0.1, 3], [T.down + 0.3, 0]],
        camera(t) {
          if (t < T.strike) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid - s * 0.6, k), S: lerp(150, 86, k) }; }
          const k = ss(t, T.strike, T.strike + 0.4); return { x: lerp(mid - s * 0.6, mid + s * 0.2, k), S: lerp(86, 94, k) + 9 * spring(t - T.fin - 0.14, 6, 18) * (t > T.fin + 0.14 ? 1 : 0) };
        },
        step(t) {
          if (c.once("rise", T.rise)) { game.sfx("roar"); VIEW.shake = 0.4; }
          if (c.once("unzip", T.unzip)) { game.sfx("cut"); VIEW.shake = 0.3; }
          if (t > T.unzip && t < T.unzipEnd && Math.random() < 0.3) game.sfx("zap");
          [0, 1, 2, 3, 4].forEach((j) => { const st = T.unzip + (1 - LB[j + 1]) * (T.unzipEnd - T.unzip) + 0.05; if (c.once("ok" + j, st)) game.sfx("select"); });
          if (c.once("ligase", T.ligase)) { game.sfx("ding"); VIEW.flash = 0.04; }
          if (c.once("copies", T.copies)) { game.sfx("domain"); }
          T.bites.forEach((tb, i) => { if (c.once("bite" + i, tb + 0.12)) { c.freeze = 0.06; VIEW.shake = 0.45; game.sfx("impact"); game.sfx("roar"); def.flash = 0.12; P.hit(V3(def.x, i === 1 ? 0.9 : 1.5, 0), i === 1 ? "#a83ce6" : "#1ec8c8", 1.3); } });
          if (c.once("fin", T.fin + 0.14)) { c.freeze = 0.13; VIEW.impact = 0.16; VIEW.shake = 0.9; FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(1.3) / VIEW_H; game.sfx("boom"); game.sfx("roar"); def.flash = 0.2; for (let q = 0; q < 22; q++) { const a = Math.random() * TAU, v = 4 + Math.random() * 7; P.spark(V3(def.x, 1.3, 0), q % 2 ? "#ffd36b" : "#3c8cff", 0.13, V3(Math.cos(a) * v, Math.sin(a) * v, 0), 0.45); } }
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x + s * 0.6, 8); }
        },
        drawDef(g, t) {
          if (t < T.bites[0] + 0.12) return X.drawDefIdle(g, t);
          const fl = def.flash;
          if (t < T.fin + 0.14) { const n = T.bites.filter((b) => t >= b + 0.12).length; return defPose(g, def, n === 2 ? "hitBody" : t > T.bites[2] + 0.3 ? "dizzy" : "hitHigh", def.x, 0, { flash: fl }); }
          if (t < T.down) { const u = seg(t, T.fin + 0.14, T.down); return defPose(g, def, "launch", def.x + s * 0.6 * u, Math.sin(u * Math.PI) * 0.6, { flash: fl, rot: s * u * 0.4 }); }
          const u = t - T.down; defPose(g, def, "down", def.x + s * 0.6, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawBack(g, t) {
          if (t < T.rise) return;
          // the root: a glowing pool on the floor the serpents rise from
          const a = Math.min(1, (t - T.rise) / 0.2) * (1 - seg(t, D.shatter - 0.3, D.shatter)), rx = VIEW.sx(B0[0]);
          g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = a; const gl = g.createRadialGradient(rx, FLOOR_Y, 0, rx, FLOOR_Y, VIEW.S); gl.addColorStop(0, "rgba(120,160,255,.7)"); gl.addColorStop(1, "rgba(120,160,255,0)"); g.fillStyle = gl; g.beginPath(); g.ellipse(rx, FLOOR_Y, VIEW.S, VIEW.S * 0.2, 0, 0, TAU); g.fill(); g.restore();
          const out = 1 - seg(t, D.shatter - 0.25, D.shatter), gr = grow(t), f = fork(t), split = t >= T.unzip;
          const al = out; if (al <= 0) return;
          // serpent B (the copy that keeps the purple strand) and serpent A (keeps the teal strand)
          const cA = curve(0, t), cB = curve(1, t), part = (cv) => (u) => cv(u * gr);
          if (split) drawHelixPath(g, part(cB), { alpha: al, show0: (u) => u >= f && lagFill(u, t), show1: (u) => u >= f, col0: NEW, col1: OLD1 });
          const eA = drawHelixPath(g, part(cA), { alpha: al, show0: () => true, show1: (u) => u < f || lead(u, t), col0: OLD0, col1: (u) => (u < f ? "#a83ce6" : "#ffd36b") });
          heads.length = 0; heads.push(eA);
          if (split && f < 0.985) { const pB = cB(1), dB = cB(0.99); heads.push([VIEW.sx(pB[0]), VIEW.sy(pB[1]), Math.atan2(-(pB[1] - dB[1]), pB[0] - dB[0])]); }
          const open = (k) => (k ? bite(t, T.bites[1]) : Math.max(bite(t, T.bites[0]), bite(t, T.bites[2]))) > 0.2 || (t > T.fin - 0.05 && t < T.fin + 0.6) || (t > T.rise && t < T.rise + 0.5);
          heads.forEach(([x, y, ang], k) => head(g, x, y, ang, open(k), 1));
          // the enzymes: helicase opens the fork, a polymerase on each strand builds the new partner
          if (t > T.unzip - 0.15 && t < T.unzipEnd + 0.25) {
            const ea = Math.min(1, (t - T.unzip + 0.15) / 0.15) * (1 - seg(t, T.unzipEnd, T.unzipEnd + 0.25)), sp = bez(...single), p = sp(Math.max(0.02, f)), q = sp(Math.max(0, f - 0.01));
            g.save(); g.globalAlpha = ea; enz(g, 0, p[0], p[1], 0.75, Math.atan2(-(p[1] - q[1]), p[0] - q[0])); g.restore();
            const pa = cA(Math.min(1, f + 0.05)); g.save(); g.globalAlpha = ea; enz(g, 1, pa[0], pa[1] + 0.05, 0.6); g.restore();
            let lj = 0; for (let j = 0; j < 5; j++) if (f <= LB[j + 1]) lj = j; const st = T.unzip + (1 - LB[lj + 1]) * (T.unzipEnd - T.unzip) + 0.05, pr = seg(t, st, st + 0.2), pb = cB(Math.min(1, lerp(LB[lj] + 0.02, LB[lj + 1] - 0.02, pr)));
            g.save(); g.globalAlpha = ea; enz(g, 1, pb[0], pb[1] - 0.05, 0.6, Math.PI); g.restore();
          }
          if (t > T.ligase - 0.05 && t < T.ligase + 0.4) for (let j = 1; j < 5; j++) { // ligase seals the gaps between fragments
            const p = cB(LB[j]), u = seg(t, T.ligase - 0.05, T.ligase + 0.4); g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - u; g.fillStyle = "#ffffff"; g.beginPath(); g.arc(VIEW.sx(p[0]), VIEW.sy(p[1]), 10 + 20 * u, 0, TAU); g.fill(); g.restore();
          }
        },
        drawDef2: null,
        drawProps(g, t) {},
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.5) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          pop("UNZIP!", T.unzip, VIEW.sx(mid), VIEW.sy(3.4), 58, "#ffd36b", -0.08, 0.55);
          pop("LIGASE!", T.ligase, VIEW.sx(mid - s * 0.6), VIEW.sy(0.5), 40, "#ffffff", 0.08, 0.45);
          pop("2 IDENTICAL COPIES!", T.copies, VIEW.sx(mid), VIEW.sy(3.55), 44, "#ffd36b", -0.05, 0.6);
          pop("TWIN STRIKE!", T.fin + 0.14, VIEW.sx(def.x), VIEW.sy(2.6), 60, "#3c8cff", -0.06, 0.7);
          const lab = (txt, x, y, col, a) => { g.save(); g.globalAlpha = a; g.font = "12px P2, monospace"; g.textAlign = "center"; g.lineWidth = 5; g.strokeStyle = "#140a24"; g.strokeText(txt, VIEW.sx(x), VIEW.sy(y)); g.fillStyle = col; g.fillText(txt, VIEW.sx(x), VIEW.sy(y)); g.restore(); };
          if (t > T.unzip + 0.25 && t < T.copies) { const a = Math.min(1, (t - T.unzip - 0.25) / 0.2) * (1 - seg(t, T.copies - 0.2, T.copies)), pa = curve(0, t)(0.55), pb = curve(1, t)(0.55);
            lab("LEADING STRAND", pa[0], pa[1] + 0.55, "#ffd36b", a); lab("LAGGING: OKAZAKI FRAGMENTS", pb[0], pb[1] - 0.55, "#ffd36b", a); }
          if (t > T.copies && t < T.strike + 0.3) { const a = Math.min(1, (t - T.copies) / 0.2) * (1 - seg(t, T.strike, T.strike + 0.3)), pa = curve(0, t)(0.45), pb = curve(1, t)(0.45);
            lab("1 OLD + 1 NEW", pa[0], pa[1] + 0.55, "#ffffff", a); lab("1 OLD + 1 NEW", pb[0], pb[1] - 0.5, "#ffffff", a); }
        },
      };
    },
  },

  /* ---------- Mitosis: Cellular Craze. The opponent goes through the phases of mitosis, then divides out of control into chibi copies ---------- */
  mitosis: {
    name: "CELLULAR CRAZE", col: "#ff3fa4", gold: "#5dff7a", mote: "#ffb3dc", dur: 7.6, shatter: 6.8, pull: 6.55, dim: 0.06,
    glow: null,
    mv: { knock: [3, 6] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { pro: 1.55, meta: 2.15, ana: 2.8, cyto: 3.35, pop: 3.7, dbl: [4.0, 4.25, 4.5], pile: 4.75, dash: 5.25, chop: 5.45, merge: 5.75, down: 6.05 };
      const lim = (x) => clamp(x, -HALF + 0.35, HALF - 0.35), startX = att.x, chopX = def.x - s * 1.25;
      const PR = M.props, xpx = () => VIEW.S * 0.62 / PR.frames[0][3];
      // four chromosomes: two from each parent (pink and green), each an X of two identical sister chromatids
      const chrom = [0, 1, 0, 1], spot = [[-0.75, 2.05], [0.8, 1.75], [-0.55, 0.95], [0.7, 0.55]], plate = [2.15, 1.6, 1.05, 0.5];
      const chromPos = (i, t) => { const k = ss(t, T.meta, T.meta + 0.4); return [def.x + lerp(spot[i][0], 0, k), lerp(spot[i][1], plate[i], k)]; };
      const sep = (t) => 0.95 * easeIn(seg(t, T.ana, T.ana + 0.45)); // anaphase: sisters pulled to opposite poles
      const poles = () => DOMAIN_META.mitosis.bg.poles.map(([ix, iy]) => domBgPt("mitosis", ix, iy));
      // the copies: each round doubles the count and halves the size
      const count = (t) => (t < T.pop ? 1 : t < T.dbl[0] ? 2 : t < T.dbl[1] ? 4 : t < T.dbl[2] ? 8 : 16);
      const scale = (n) => ({ 1: 1, 2: 0.76, 4: 0.6, 8: 0.47, 16: 0.38 })[n];
      const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      const homeX = (i, n) => def.x + (n === 1 ? 0 : (((i + 0.5) / n) - 0.5) * Math.min(4.4, 1.1 * Math.sqrt(n) * 1.3));
      const pileSpot = (i) => { const row = i < 6 ? 0 : i < 10 ? 1 : i < 13 ? 2 : i < 15 ? 3 : 4, idx = [0, 6, 10, 13, 15][row], nIn = [6, 4, 3, 2, 1][row]; return [def.x + (i - idx - (nIn - 1) / 2) * 0.48 + s * 0.15, row * 0.34]; };
      const copyAt = (i, t) => { // where copy i is and how it's tumbling
        const n = count(t); if (i >= n) return null;
        const born = n === 2 ? T.pop : T.dbl[Math.log2(n) - 2], from = homeX(i >> 1, n / 2), to = homeX(i, n), k = easeOut(seg(t, born, born + 0.18));
        let x = lerp(from, to, k), y = Math.abs(Math.sin((t - born) * (7 + rnd(i, 1) * 5) + rnd(i, 2) * 6)) * (0.25 + 0.35 * rnd(i, 3)), rot = Math.sin(t * 6 + i) * 0.25;
        if (t >= T.pile) { const u = easeOut(seg(t, T.pile, T.pile + 0.35)), [px, py] = pileSpot(i); x = lerp(x, px, u); y = lerp(y, py, u) + (t < T.chop ? Math.abs(Math.sin(t * 9 + i)) * 0.04 : 0); rot = lerp(rot, (rnd(i, 4) - 0.5) * 2.2, u); }
        if (t >= T.chop) { const u = easeIn(seg(t, T.chop + 0.05, T.merge)); x = lerp(x, def.x, u); y = lerp(y, 0.4, u); rot *= 1 - u; }
        return [x, y, rot, scale(n)];
      };
      const drawX = (g, kind, x, y, half, dx = 0, a = 1) => { // one chromosome, or one of its sister chromatids (half = -1 / +1)
        const fr = PR.frames[kind], px = xpx(), cx = VIEW.sx(x), cy = VIEW.sy(y);
        g.save(); g.globalAlpha = a; if (half) { g.beginPath(); const W = fr[2] * px; g.rect(cx + (half < 0 ? -W : 0) + dx * VIEW.S, cy - 400, W, 800); g.clip(); g.translate(dx * VIEW.S, 0); }
        domCentered(g, IM.props, PR, kind, cx, cy, px); g.restore();
      };
      return {
        poses: [[0, 0], [D.expand, 1], [T.ana - 0.08, 2], [T.pop + 0.2, 1], [T.dash, 3]],
        attX: (t) => (t < T.dash ? startX : lerp(startX, lim(chopX), easeOut(seg(t, T.dash, T.chop)))),
        ghosts: (t) => t > T.dash && t < T.chop + 0.05,
        camera(t) {
          if (t < T.pop) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, def.x - s * 1.3, k), S: lerp(150, 112, k) }; }
          if (t < T.chop) { const k = ss(t, T.pop, T.dbl[2] + 0.2); return { x: lerp(def.x - s * 1.3, def.x - s * 0.9, k), S: lerp(112, 84, k) }; }
          const k = ss(t, T.chop, T.chop + 0.3); return { x: lerp(def.x - s * 0.9, def.x - s * 0.6, k), S: lerp(84, 112, k) + 9 * spring(t - T.chop, 6, 18) };
        },
        step(t) {
          if (c.once("pro", T.pro)) game.sfx("charge");
          if (c.once("meta", T.meta)) game.sfx("zap");
          if (c.once("ana", T.ana)) { game.sfx("whoosh"); VIEW.shake = 0.25; }
          if (c.once("cyto", T.cyto)) game.sfx("creak");
          if (c.once("pop", T.pop)) { game.sfx("pop"); VIEW.shake = 0.35; VIEW.flash = 0.05; X.grit(def.x, 6); }
          T.dbl.forEach((td, i) => { if (c.once("d" + i, td)) { game.sfx("pop"); VIEW.shake = 0.2 + i * 0.1; } });
          if (t > T.dbl[2] && t < T.pile && Math.random() < 0.18) game.sfx("boing");
          if (c.once("pile", T.pile)) game.sfx("land");
          for (let j = 0; j < 4; j++) if (c.once("bk" + j, T.pile + 0.1 + j * 0.1)) game.sfx("bonk");
          if (c.once("dash", T.dash)) game.sfx("jump");
          if (c.once("chop", T.chop)) { c.freeze = 0.12; VIEW.impact = 0.16; VIEW.shake = 0.9; FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(0.8) / VIEW_H; game.sfx("impact"); game.sfx("boom"); for (let q = 0; q < 22; q++) { const a = Math.random() * TAU, v = 4 + Math.random() * 7; P.spark(V3(def.x, 0.8, 0), q % 2 ? "#ff3fa4" : "#5dff7a", 0.13, V3(Math.cos(a) * v, Math.sin(a) * v, 0), 0.45); } }
          if (c.once("merge", T.merge)) { game.sfx("poof"); def.flash = 0.2; }
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x, 8); }
        },
        drawDef(g, t) {
          if (t < T.ana) return X.drawDefIdle(g, t);
          if (t < T.pop) { // the cell stretches as the poles move apart, then pinches in the middle
            const st = ss(t, T.ana, T.ana + 0.45), pinch = ss(t, T.cyto, T.pop);
            defMorph(g, def, "hitBody", def.x, 0, { kx: 1 + 0.35 * st + 0.2 * pinch, ky: 1 - 0.08 * st - 0.1 * pinch, cy: 0.9, flash: def.flash }); return;
          }
          if (t < T.merge) { // the copies
            for (let i = 0; i < 16; i++) { const p = copyAt(i, t); if (!p) continue; const [x, y, rot, sc] = p, key = t >= T.pile ? (i % 3 ? "dizzy" : "hitBody") : i % 2 ? "idle" : "hitHigh";
              const pop = 1 + 0.2 * spring(t - (count(t) === 2 ? T.pop : T.dbl[Math.max(0, Math.log2(count(t)) - 2)]), 10, 30);
              defPose(g, def, key, x, y, { scale: sc * pop, rot, pivot: 0.5 * sc, flash: t > T.chop && t < T.chop + 0.1 ? 0.15 : 0 }); }
            return;
          }
          if (t < T.down) { const u = seg(t, T.merge, T.down); return defPose(g, def, "dizzy", def.x, 0, { squash: 1 + 0.1 * spring(u, 8, 26), flash: def.flash }); }
          const u = t - T.down; defPose(g, def, "down", def.x, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawProps(g, t) {
          if (t >= T.pro && t < T.cyto + 0.2) {
            const a = Math.min(1, (t - T.pro) / 0.3) * (1 - seg(t, T.cyto, T.cyto + 0.2));
            if (t >= T.meta - 0.05 && t < T.cyto) { // spindle fibres from both poles to every centromere (or to each chromatid once they separate)
              const [L, R] = poles(), k = seg(t, T.meta - 0.05, T.meta + 0.25);
              g.save(); g.globalAlpha = a; g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(120,255,160,.8)"; g.lineWidth = 2;
              for (let i = 0; i < 4; i++) { const [x, y] = chromPos(i, t), d = sep(t); for (const [pt, sd] of [[L, -1], [R, 1]]) { const ex = VIEW.sx(x + sd * s * d * 0 + sd * d), ey = VIEW.sy(y), tx = lerp(pt[0], ex, k), ty = lerp(pt[1], ey, k); g.beginPath(); g.moveTo(pt[0], pt[1]); g.lineTo(tx, ty); g.stroke(); } }
              g.restore();
            }
            for (let i = 0; i < 4; i++) {
              const [x, y] = chromPos(i, t), born = T.pro + i * 0.08, k = backOut(seg(t, born, born + 0.3));
              if (t < T.ana) { if (k <= 0) continue; g.save(); g.globalAlpha = a; const cx = VIEW.sx(x), cy = VIEW.sy(y); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); drawX(g, chrom[i], x, y, 0); g.restore(); }
              else { const d = sep(t); drawX(g, chrom[i], x, y, -1, -d, a); drawX(g, chrom[i], x, y, 1, d, a); }
            }
          }
          if (t >= T.cyto && t < T.pop + 0.1) { // the contractile ring tightens round the middle
            const k = seg(t, T.cyto, T.pop), cx = VIEW.sx(def.x), cy = VIEW.sy(1.0), rx = (0.75 - 0.6 * easeIn(k)) * VIEW.S;
            g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = "#ff7ac4"; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, Math.max(2, rx), rx * 0.22 + 3, 0, 0, TAU); g.stroke(); g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.stroke(); g.restore();
          }
          if (t >= T.pop && t < T.dbl[2] + 0.3) for (const td of [T.pop, ...T.dbl]) { if (t < td || t > td + 0.3) continue; const u = seg(t, td, td + 0.3); g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - u; g.strokeStyle = "#ffb3dc"; g.lineWidth = 5; g.beginPath(); g.arc(VIEW.sx(def.x), VIEW.sy(0.9), (0.4 + 2.2 * u) * VIEW.S, 0, TAU); g.stroke(); g.restore(); }
          if (t > T.pile + 0.1 && t < T.chop) for (let j = 0; j < 4; j++) { const t0 = T.pile + 0.1 + j * 0.1; if (t < t0) continue; const p = pileSpot((j * 5 + 3) % 16), u = (t - t0) * 6; // bonked-head stars over the pile
            for (let q = 0; q < 3; q++) { const a = u + q * TAU / 3, x = VIEW.sx(p[0]) + Math.cos(a) * 18, y = VIEW.sy(p[1] + 0.75) + Math.sin(a) * 5; g.save(); g.fillStyle = "#ffe14d"; g.strokeStyle = "#1a0b2e"; g.lineWidth = 1.5; g.translate(x, y); g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 3 : 7, b = k * TAU / 10 - Math.PI / 2; g.lineTo(Math.cos(b) * rr, Math.sin(b) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore(); } }
          if (t >= T.chop && t < T.chop + 0.3) { const u = seg(t, T.chop, T.chop + 0.3), x = VIEW.sx(def.x); g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - u; g.strokeStyle = "#ffffff"; g.lineWidth = 12 * (1 - u) + 2; g.beginPath(); g.moveTo(x - s * 30, VIEW.sy(3.2)); g.lineTo(x + s * 30, FLOOR_Y); g.stroke(); g.restore(); }
          if (t >= T.merge - 0.05 && t < T.merge + 0.5) { const u = seg(t, T.merge - 0.05, T.merge + 0.5); domStrip(g, DOMAIN_IMG.rna ? DOMAIN_IMG.rna.smoke : IM.props, DOMAIN_IMG.rna ? DOMAIN_META.rna.smoke : PR, DOMAIN_IMG.rna ? 1 : 3, VIEW.sx(def.x), VIEW.sy(-0.2), VIEW.S * 2.6 / (DOMAIN_IMG.rna ? DOMAIN_META.rna.smoke.frames[1][2] : 200) * (0.8 + 0.4 * u), { alpha: 0.8 * (1 - u * u) }); }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.5) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          const lx = VIEW.sx(def.x + s * 1.9);
          pop("PROPHASE", T.pro + 0.05, lx, VIEW.sy(2.6), 40, "#ffb3dc", -0.06, 0.55);
          pop("METAPHASE", T.meta + 0.1, lx, VIEW.sy(2.6), 40, "#5dff7a", 0.06, 0.55);
          pop("ANAPHASE", T.ana + 0.05, lx, VIEW.sy(2.6), 40, "#ffb3dc", -0.06, 0.5);
          pop("CYTOKINESIS!", T.pop, VIEW.sx(def.x), VIEW.sy(2.6), 48, "#ffffff", 0.05, 0.4);
          [T.pop, ...T.dbl].forEach((td, i) => pop("×" + (2 << i), td + 0.02, VIEW.sx(def.x) + (i % 2 ? 1 : -1) * 120, VIEW.sy(2.1 + i * 0.25), 44 + i * 8, i === 3 ? "#ff3fa4" : "#5dff7a", i % 2 ? 0.1 : -0.1, 0.3));
          pop("CELLULAR CRAZE!", T.pile + 0.05, VIEW.sx(def.x), VIEW.sy(2.9), 58, "#ff3fa4", -0.05, 0.6);
          pop("CHOP!", T.chop, VIEW.sx(def.x + s * 1.1), VIEW.sy(2.3), 64, "#ffffff", 0.1, 0.5);
        },
      };
    },
  },

  /* ---------- Phage (boss): Lytic Hive. Phages land, inject their DNA, hijack the opponent into a phage factory, and burst out (lysis) ---------- */
  phage: {
    name: "LYTIC HIVE", col: "#9dff5a", gold: "#d8ff6a", mote: "#c8ff8a", dur: 7.1, shatter: 6.3, pull: 6.05, dim: 0.06,
    glow: [836, 300, 380, "#7dff5a"],
    mv: { knock: [4, 7] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { cmd: 1.45, rain: 1.55, land: 2.0, inject: 2.4, hijack: 2.8, build: 2.95, lysis: 4.75, down: 5.25, boss: 4.85 };
      const PR = M.props, rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      const [bx, top, bw] = defBox(def, "idle"), cx = def.x + bx, cy = top * 0.55;
      const N = 8, spots = Array.from({ length: N }, (_, i) => [cx + (rnd(i, 1) - 0.5) * bw * 0.7, 0.45 + rnd(i, 2) * (top - 0.85), (rnd(i, 3) - 0.5) * 0.9]);
      const phpx = (h) => VIEW.S * h / PR.frames[0][3];
      const lander = (g, f, x, y, h, rot, a = 1) => domCentered(g, IM.props, PR, f, VIEW.sx(x), VIEW.sy(y), phpx(h) * (f === 2 ? 0.62 : 1), { rot, alpha: a });
      // the assembly line inside the host: heads and tails made separately, then joined
      const SL = 14, slots = Array.from({ length: SL }, (_, i) => ({ x: cx + (((i % 4) + 0.5) / 4 - 0.5) * bw * 0.62 + (rnd(i, 5) - 0.5) * 0.1, y: 0.45 + (Math.floor(i / 4) + 0.5) / 4 * (top - 0.75), t: T.build + i * ((T.lysis - 0.35 - T.build) / SL) }));
      const built = (t) => slots.filter((q) => t >= q.t + 0.3).length;
      const BURST = 40, burst = Array.from({ length: BURST }, (_, i) => { const a = (i / BURST) * TAU + rnd(i, 7) * 0.3, v = 3 + rnd(i, 8) * 5; return { a, v, spin: (rnd(i, 9) - 0.5) * 10, h: 0.42 + rnd(i, 10) * 0.2 }; });
      return {
        poses: [[0, 0], [D.expand, 1], [T.cmd, 2], [T.boss, 3]],
        camera(t) {
          if (t < T.hijack) { const k = ss(t, D.expand, D.expand + 0.7); return { x: lerp(att.x + s * 0.25, mid + s * 0.4, k), S: lerp(150, 100, k) }; }
          if (t < T.lysis) { const k = ss(t, T.hijack, T.hijack + 0.4); return { x: lerp(mid + s * 0.4, cx - s * 0.4, k), S: lerp(100, 128, k) + 4 * ss(t, T.lysis - 0.6, T.lysis) }; }
          const k = ss(t, T.lysis, T.lysis + 0.25); return { x: lerp(cx - s * 0.4, mid, k), S: lerp(132, 86, k) + 10 * spring(t - T.lysis, 6, 18) };
        },
        step(t) {
          if (c.once("rain", T.rain)) game.sfx("whoosh");
          for (let i = 0; i < N; i++) if (c.once("l" + i, T.land + i * 0.03)) { game.sfx("land"); def.flash = 0.06; }
          if (c.once("inject", T.inject)) { game.sfx("zap"); game.sfx("charge"); VIEW.shake = 0.3; def.flash = 0.12; }
          if (c.once("hijack", T.hijack)) { game.sfx("domain"); VIEW.flash = 0.04; }
          slots.forEach((q, i) => { if (c.once("b" + i, q.t + 0.3)) game.sfx(i % 3 ? "select" : "ding"); });
          if (t > T.lysis - 0.6 && t < T.lysis && Math.random() < 0.3) { VIEW.shake = 0.15; game.sfx("zap"); }
          if (c.once("lysis", T.lysis)) { c.freeze = 0.13; VIEW.impact = 0.18; VIEW.shake = 1.0; VIEW.flash = 0.08; FX2D.cx = VIEW.sx(cx) / VIEW_W; FX2D.cy = VIEW.sy(cy) / VIEW_H; game.sfx("boom"); game.sfx("pop"); game.sfx("shatter"); def.flash = 0.25; }
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x + s * 0.8, 8); }
        },
        drawDef(g, t) {
          if (t < T.land) return X.drawDefIdle(g, t);
          if (t < T.hijack) return defPose(g, def, t < T.inject ? "block" : "hitBody", def.x, 0, { flash: def.flash });
          if (t < T.lysis) { // the host as an x-ray: a dark silhouette with a toxic glow, swelling and trembling as it fills with phages
            const k = seg(t, T.hijack, T.lysis), sw = 1 + 0.12 * easeIn(k), tr = (Math.random() - 0.5) * 0.04 * k, mk = (o) => defMorph(g, def, "hitBody", def.x + tr, 0, Object.assign({ kx: sw, ky: sw, cy: cy }, o));
            const a = ss(t, T.hijack, T.hijack + 0.25); mk({ flash: def.flash, alpha: 1 - a });
            g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = a * (0.75 + 0.25 * Math.sin(t * 20)); mk({ silhouette: "#b8ff6a", kx: sw * 1.08, ky: sw * 1.05 }); mk({ silhouette: "#7dff5a", kx: sw * 1.14, ky: sw * 1.08 }); g.restore();
            g.save(); g.globalAlpha = a * 0.9; mk({ silhouette: "#1d4a2c" }); g.restore();
            return;
          }
          if (t < T.down) { const u = seg(t, T.lysis, T.down); return defPose(g, def, "launch", def.x + s * 0.8 * u, Math.sin(u * Math.PI) * 0.7, { flash: def.flash, rot: s * u * 0.4 }); }
          const u = t - T.down; defPose(g, def, "down", def.x + s * 0.8, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawProps(g, t) {
          // the swarm rains down, grips with its tail fibres and injects
          if (t >= T.rain && t < T.hijack + 0.3) for (let i = 0; i < N; i++) {
            const [x, y, r] = spots[i], land = T.land + i * 0.03, u = easeIn(seg(t, T.rain + i * 0.03, land)), a = 1 - seg(t, T.hijack, T.hijack + 0.3);
            const px = lerp(x - s * 1.5, x, u), py = lerp(y + 4.5, y, u), f = t >= T.inject ? 1 : 0, squ = t >= T.inject && t < T.inject + 0.12 ? 0.85 : 1;
            lander(g, f, px, py + 0.28, 0.62 * squ, r + (1 - u) * -s * 0.6, a);
          }
          if (t >= T.inject && t < T.hijack + 0.2) for (let i = 0; i < N; i++) { // the injected DNA snakes into the host
            const [x, y] = spots[i], u = seg(t, T.inject, T.inject + 0.35), a = 1 - seg(t, T.hijack, T.hijack + 0.2);
            g.save(); g.globalAlpha = a; g.globalCompositeOperation = "lighter"; g.strokeStyle = "#c8ff5a"; g.lineWidth = 3; g.beginPath();
            for (let q = 0; q <= 12; q++) { const v = q / 12 * u, xx = lerp(x, cx, v) + Math.sin(v * 18 + i) * 0.06, yy = lerp(y, cy, v); q ? g.lineTo(VIEW.sx(xx), VIEW.sy(yy)) : g.moveTo(VIEW.sx(xx), VIEW.sy(yy)); } g.stroke(); g.restore();
          }
          if (t >= T.build && t < T.lysis) for (const q of slots) { // heads and tails built separately, then snapped together
            if (t < q.t) continue; const u = seg(t, q.t, q.t + 0.3), a = Math.min(1, (t - q.t) / 0.1), h = 0.42;
            g.save(); g.globalAlpha = a;
            if (u < 1) { lander(g, 2, q.x - 0.18 * (1 - u), q.y + h * 0.28, h); lander(g, 3, q.x + 0.18 * (1 - u), q.y - h * 0.18, h * 0.78); }
            else { const pop = 1 + 0.25 * spring(t - q.t - 0.3, 10, 30); lander(g, 0, q.x, q.y, h * pop); }
            g.restore();
          }
          if (t >= T.lysis && t < T.lysis + 1.2) { // lysis: the new phages burst out in every direction
            const u = t - T.lysis; g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 1 - seg(u, 0, 0.35); g.fillStyle = "#d8ff9a"; g.beginPath(); g.arc(VIEW.sx(cx), VIEW.sy(cy), (0.5 + 4 * u) * VIEW.S, 0, TAU); g.fill(); g.restore();
            for (const b of burst) { const d = b.v * u * (1 - 0.25 * u), a = 1 - seg(u, 0.7, 1.2); lander(g, 0, cx + Math.cos(b.a) * d, cy + Math.sin(b.a) * d * 0.8 - 0.6 * u * u, b.h, b.spin * u, a); }
          }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.5) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          pop("ATTACH!", T.land, VIEW.sx(cx + s * 1.5), VIEW.sy(2.6), 46, "#d8ff6a", -0.06, 0.4);
          pop("INJECT!", T.inject, VIEW.sx(cx + s * 1.5), VIEW.sy(2.4), 50, "#ffffff", 0.08, 0.4);
          pop("HIJACKED!", T.hijack, VIEW.sx(cx), Math.max(110, VIEW.sy(top + 0.55)), 54, "#9dff5a", -0.05, 0.55);
          if (t > T.hijack + 0.55 && t < T.lysis) { const n = Math.min(150, Math.round(built(t) / SL * 150 + seg(t, T.build, T.lysis) * 8)), txt = "PHAGES BUILT: " + n; g.save(); g.font = "16px P2, monospace"; g.textAlign = "center"; g.lineWidth = 6; g.strokeStyle = "#0c2416"; const x = VIEW.sx(cx), y = Math.max(96, VIEW.sy(top + 0.45)); g.strokeText(txt, x, y); g.fillStyle = "#d8ff6a"; g.fillText(txt, x, y); g.restore(); }
          pop("LYSIS!", T.lysis, VIEW.sx(cx), Math.max(130, VIEW.sy(2.9)), 80, "#d8ff6a", -0.06, 0.7);
        },
      };
    },
  },

  /* ---------- Cytoplasm: Motor Protein Puller. The arena floods with cytosol; kinesin and dynein walk opposite ways on a microtubule ---------- */
  cytoplasm: {
    name: "MOTOR PROTEIN PULLER", col: "#3f7bff", gold: "#7fe8ff", mote: "#a8d8ff", dur: 7.1, shatter: 6.3, pull: 6.05, dim: 0.06,
    glow: [195, 120, 160, "#9ff5ff"],
    mv: { knock: [3, 6] },
    setup(c, X) {
      const { game, att, def, s, P, M, IM, D, mid } = X;
      const T = { tide: 1.45, flood: 1.55, float: 1.75, mt: 2.2, bind: 2.55, walk: 2.9, step: 0.2, nsteps: 7, snap: 4.6, drain: 4.75, down: 5.3 };
      const MO = M.motors, rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      const [bx, top, bw] = defBox(def, "hitHigh"), floatY = 1.05, handY = () => floatY + top * 0.62, baseW = bw * 0.82, cx = def.x + bx;
      const mH = 1.5, mtY = () => handY() - mH; // the microtubule runs below the opponent's hands; the motors stand on it and reach up
      const surf = (t) => (t < T.drain ? lerp(-0.2, 5.5, easeOut(seg(t, T.flood, T.flood + 0.6))) : lerp(5.5, -0.3, easeIn(seg(t, T.drain, T.drain + 0.55))));
      const steps = (t) => Math.max(0, Math.min(T.nsteps, Math.floor((t - T.walk) / T.step) + 1));
      const stepU = (t) => { if (t < T.walk) return 0; const n = steps(t); if (n >= T.nsteps) return T.nsteps; return n - 1 + easeOut(seg(t - T.walk - (n - 1) * T.step, 0, T.step * 0.7)); };
      const sep = (t) => baseW + 0.36 * stepU(t); // distance between the two hands
      const oy = (t) => (t < T.float ? 0 : t < T.snap ? lerp(0, floatY, easeOut(seg(t, T.float, T.float + 0.5))) + Math.sin(t * 2.6) * 0.05 * (t < T.bind ? 1 : 0.3) : floatY * (1 - easeIn(seg(t, T.snap + 0.1, T.down))));
      const kx = (t) => (t < T.snap ? sep(t) / baseW : 1 + (sep(T.snap) / baseW - 1) * Math.max(-0.12, spring(t - T.snap, 7, 26)));
      const motor = (g, kind, x, t, frame, a) => { // kind 0 = kinesin, walks toward (+); 1 = dynein, toward (-)
        const fr = MO.frames[kind * 2 + 1], px = VIEW.S * mH / fr[3], dir = kind ? -s : s; domStrip(g, IM.motors, MO, kind * 2 + frame, VIEW.sx(x), VIEW.sy(mtY()), px, { flip: dir, alpha: a });
      };
      const hands = (t) => { const w = sep(Math.min(t, T.snap)) / 2; return [cx + s * w, cx - s * w]; }; // [+ side (kinesin), - side (dynein)]
      return {
        poses: [[0, 0], [D.expand, 1], [T.tide, 2], [T.walk - 0.1, 3], [T.down, 1]],
        camera(t) {
          if (t < T.flood) return { x: att.x + s * 0.25 + (mid - att.x) * ss(t, D.expand, D.expand + 0.7) * 0.5, S: lerp(150, 110, ss(t, D.expand, D.expand + 0.7)) };
          if (t < T.snap) { const k = ss(t, T.flood, T.mt + 0.3); return { x: lerp((att.x + mid) / 2, cx, k), S: lerp(110, 96, k) - 10 * ss(t, T.walk, T.snap) }; }
          const k = ss(t, T.snap, T.snap + 0.4); return { x: lerp(cx, mid, k), S: lerp(86, 100, k) + 8 * spring(t - T.snap, 6, 18) };
        },
        step(t) {
          if (c.once("flood", T.flood)) { game.sfx("whoosh"); game.sfx("splash"); VIEW.shake = 0.3; }
          if (c.once("mt", T.mt)) game.sfx("charge");
          if (c.once("bind", T.bind)) { game.sfx("block"); def.flash = 0.1; }
          for (let i = 0; i < T.nsteps; i++) if (c.once("st" + i, T.walk + i * T.step)) { game.sfx(i % 2 ? "land" : "block"); VIEW.shake = 0.12 + i * 0.03; def.flash = 0.06; if (i === T.nsteps - 1) game.sfx("creak"); }
          if (t > T.walk + T.nsteps * T.step && t < T.snap && Math.random() < 0.3) VIEW.shake = 0.15;
          if (c.once("snap", T.snap)) { c.freeze = 0.12; VIEW.impact = 0.15; VIEW.shake = 0.8; FX2D.cx = VIEW.sx(cx) / VIEW_W; FX2D.cy = VIEW.sy(handY()) / VIEW_H; game.sfx("boing"); game.sfx("impact"); def.flash = 0.2; }
          if (c.once("drain", T.drain)) game.sfx("splash");
          if (c.once("down", T.down)) { game.sfx("land"); X.grit(def.x, 8); }
        },
        drawDef(g, t) {
          if (t < T.float) return X.drawDefIdle(g, t);
          const y = oy(t), key = t < T.bind ? "hitHigh" : t < T.down ? "hitHigh" : "down";
          if (t < T.down) return defMorph(g, def, key, def.x, y, { kx: kx(t), ky: 1 - 0.18 * (kx(t) - 1) / 1.2, cy: top * 0.6, rot: t < T.bind ? Math.sin(t * 1.7) * 0.06 : 0, flash: def.flash });
          const u = t - T.down; defPose(g, def, "down", def.x, 0, { squash: (SPR.extra[def.id] ? 1 : 0.5) * (1 - 0.15 * spring(u, 8, 20)) });
        },
        drawProps(g, t) {
          // the microtubule: a hollow tube of alternating alpha/beta tubulin, (-) end and (+) end
          if (t >= T.mt && t < T.snap + 0.4) {
            const a = 1 - seg(t, T.snap + 0.1, T.snap + 0.4), slide = easeOut(seg(t, T.mt, T.mt + 0.35)), L = 4.6, x0 = cx - L + s * (1 - slide) * -6, x1 = cx + L + s * (1 - slide) * -6;
            const ya = VIEW.sy(mtY()), r = 0.1 * VIEW.S, sa = VIEW.sx(Math.min(x0, x1)), sb = VIEW.sx(Math.max(x0, x1));
            g.save(); g.globalAlpha = a; g.fillStyle = "#140a24"; g.fillRect(sa, ya - r - 3, sb - sa, 2 * r + 6);
            const seg8 = 0.085 * VIEW.S; for (let x = sa, i = 0; x < sb; x += seg8, i++) { g.fillStyle = i % 2 ? "#9fe8ff" : "#5cc4f0"; g.fillRect(x, ya - r, Math.min(seg8, sb - x) - 1, 2 * r); }
            g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(sa, ya - r * 0.7, sb - sa, r * 0.3);
            const lab = (txt, x, col) => { g.font = "22px P2, monospace"; g.textAlign = "center"; g.lineWidth = 6; g.strokeStyle = "#140a24"; g.strokeText(txt, x, ya + 7); g.fillStyle = col; g.fillText(txt, x, ya + 7); };
            const plusX = VIEW.sx(cx + s * (L - 0.35) + s * (1 - slide) * -6), minusX = VIEW.sx(cx - s * (L - 0.35) + s * (1 - slide) * -6);
            lab("+", clamp(plusX, 20, VIEW_W - 20), "#ffd36b"); lab("–", clamp(minusX, 20, VIEW_W - 20), "#c98bff"); g.restore();
          }
          // the motors: they bind to the track beside each hand, then walk apart in opposite directions
          if (t >= T.bind - 0.25 && t < T.snap + 0.5) {
            const [hp, hm] = hands(t), a = Math.min(1, (t - T.bind + 0.25) / 0.15), drop = (1 - easeIn(seg(t, T.bind - 0.25, T.bind))) * 1.5;
            const f = t < T.walk || t > T.walk + T.nsteps * T.step ? 1 : Math.floor((t - T.walk) / (T.step / 2)) % 2 ? 1 : 0;
            if (t < T.snap) { g.save(); g.translate(0, -drop * VIEW.S); motor(g, 1, hm - s * 0.25, t, f, a); motor(g, 0, hp - s * 0.1, t, f, a); g.restore(); }
            else { const u = seg(t, T.snap, T.snap + 0.5); g.save(); g.globalAlpha = 1 - u; motor(g, 1, hm - s * (0.25 + 2.5 * u), t, 0, 1); motor(g, 0, hp + s * (2.5 * u - 0.1), t, 0, 1); g.restore(); }
          }
          // the cytosol: a gel that floods the arena
          if (t >= T.flood) {
            const sy = VIEW.sy(surf(t)); if (sy < FLOOR_Y + 20) {
              g.save(); g.fillStyle = "rgba(60,140,255,.2)"; g.fillRect(-40, sy, VIEW_W + 80, VIEW_H - sy + 40);
              g.strokeStyle = "rgba(220,245,255,.85)"; g.lineWidth = 4; g.beginPath(); for (let x = -20; x <= VIEW_W + 20; x += 12) { const y = sy + Math.sin(x * 0.02 + t * 5) * 6 + Math.sin(x * 0.05 - t * 3) * 3; x === -20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
              for (let i = 0; i < 30; i++) { const k = (t * (0.25 + rnd(i, 1) * 0.3) + rnd(i, 2)) % 1, bx2 = rnd(i, 3) * VIEW_W + Math.sin(t * 2 + i) * 10, by = lerp(FLOOR_Y, sy, k); if (by < sy) continue; const r2 = 3 + rnd(i, 4) * 6; g.strokeStyle = "rgba(220,245,255,.7)"; g.lineWidth = 2; g.beginPath(); g.arc(bx2, by, r2, 0, TAU); g.stroke(); }
              g.restore(); }
          }
        },
        text(g, t) {
          const pop = (word, at, x, y, size, col, rot, life = 0.5) => { if (t > at && t < at + life) { const u = t - at; comic(g, word, x, y, size, col, backOut(seg(u, 0, 0.15)) * (1 - seg(u, life - 0.12, life)), rot); } };
          pop("SUBMERGE!", T.flood + 0.1, VIEW.sx(mid), Math.max(120, VIEW.sy(3.0)), 56, "#bfe9ff", -0.05, 0.6);
          pop("BIND!", T.bind, VIEW.sx(cx), Math.max(110, VIEW.sy(handY() + 1.0)), 44, "#ffffff", 0.06, 0.35);
          for (let i = 0; i < T.nsteps; i++) pop("STEP!", T.walk + i * T.step, VIEW.sx(cx) + (i % 2 ? 1 : -1) * 130, Math.max(110, VIEW.sy(handY() + 0.9 + (i % 3) * 0.15)), 34 + i * 3, i % 2 ? "#ffd36b" : "#c98bff", i % 2 ? 0.1 : -0.1, 0.22);
          pop("SNAP!", T.snap, VIEW.sx(cx), Math.max(120, VIEW.sy(handY() + 0.9)), 72, "#ffffff", -0.06, 0.6);
          if (t > T.bind + 0.1 && t < T.snap) { // the motor labels and the distance they've walked
            const [hp, hm] = hands(t), n = steps(t), lab = (txt, x, col) => { g.save(); g.font = "12px P2, monospace"; g.textAlign = "center"; g.lineWidth = 5; g.strokeStyle = "#140a24"; const y = VIEW.sy(mtY()) + 34; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); g.restore(); };
            lab((s > 0 ? "" : "+ ← ") + "KINESIN" + (s > 0 ? " → +" : ""), VIEW.sx(hp), "#ffd36b"); lab((s > 0 ? "– ← " : "") + "DYNEIN" + (s > 0 ? "" : " → –"), VIEW.sx(hm - s * 0.25), "#c98bff");
            if (n > 0) { const txt = "EACH WALKED " + n * 8 + " nm"; g.save(); g.font = "14px P2, monospace"; g.textAlign = "center"; g.lineWidth = 5; g.strokeStyle = "#140a24"; const y = VIEW.sy(mtY()) + 60; g.strokeText(txt, VIEW.sx(cx), y); g.fillStyle = "#ffffff"; g.fillText(txt, VIEW.sx(cx), y); g.restore(); }
          }
        },
      };
    },
  },
};

function domainCine(game, att, def) {
  const id = att.id, D = DOMAINS[id];
  if (!D || !domImgReady(id) || typeof DOMAIN_META === "undefined" || !DOMAIN_META[id]) return null;
  const M = DOMAIN_META[id], IM = DOMAIN_IMG[id], P = game.parts; D.expand = 1.0;
  att.set("cine"); def.set("cine"); att.vx = def.vx = 0; att.y = def.y = 0;
  att.face = def.x >= att.x ? 1 : -1; def.face = -att.face;
  const want = att.x + att.face * 4.2; def.x = clamp(want, -HALF + 0.5, HALF - 0.5); if (Math.abs(def.x - att.x) < 3) att.x = clamp(def.x - att.face * 4.2, -HALF + 0.5, HALF - 0.5);
  att.cineAnim = AN("idle", 0); def.cineAnim = AN("idle", 0); att.hidden = def.hidden = true; // this scene draws both fighters itself
  HUD.science(att, (MOVES[id] && MOVES[id].ult && MOVES[id].ult.name) || D.name);
  const s = att.face, mid = (att.x + def.x) / 2;
  const c = { att, def, dmg: 35, mv: D.mv, t: 0, camX: att.x, camS: 98, fired: {}, freeze: 0, shards: null, trail: [],
    once(k, at) { if (this.t >= at && !this.fired[k]) { this.fired[k] = 1; return true; } return false; },
  };
  // shared helpers the domains draw with
  const X = { game, att, def, s, P, M, IM, D, mid,
    grit(x, n) { for (let i = 0; i < n; i++) { const d = Math.random() < 0.5 ? -1 : 1; P.spark(V3(x + (Math.random() - 0.5) * 0.4, 0.04, 0), i % 2 ? D.col : "#ffffff", 0.08, V3(d * (1 + Math.random() * 3), 0.5 + Math.random() * 2, 0), 0.3); } },
    drawDefIdle(g, t) { def.hidden = false; def.cineAnim = AN("idle", t * 30); drawFighter(g, def); def.hidden = true; },
    exclaim(g, u) { const b = Math.abs(Math.sin(u * 14)) * 6; g.save(); g.font = "34px P2, monospace"; g.textAlign = "center"; g.lineWidth = 7; g.strokeStyle = "#1a0b2e"; const tx = VIEW.sx(def.x), ty = VIEW.sy(2.25) - b; g.strokeText("!", tx, ty); g.fillStyle = "#ffe14d"; g.fillText("!", tx, ty); g.restore(); },
    speech(g, [bx, by, top], lines, u) { // a comic speech bubble above a prop, typed out letter by letter
      const n = Math.floor(u / 0.03), W = Math.max(64, Math.max(...lines.map((l) => l.length)) * 13 + 28), H = 18 + lines.length * 22, x0 = clamp(bx + 40, 8, VIEW_W - W - 8), y0 = Math.max(70, top - H - 14);
      g.save(); g.fillStyle = "#ffffff"; g.strokeStyle = "#1a0b2e"; g.lineWidth = 4; g.beginPath(); g.roundRect(x0, y0, W, H, 12); g.fill(); g.stroke();
      g.beginPath(); const tx = clamp(bx + 30, x0 + 20, x0 + W - 20), ang = Math.atan2(by - y0 - H, bx - tx), L = 34; g.moveTo(tx - 10, y0 + H - 2); g.lineTo(tx + Math.cos(ang) * L, y0 + H + Math.sin(ang) * L); g.lineTo(tx + 10, y0 + H - 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#ffffff"; g.fillRect(tx - 8, y0 + H - 5, 16, 5);
      g.fillStyle = "#1a0b2e"; g.font = "13px P2, monospace"; g.textAlign = "left"; let k = n;
      lines.forEach((ln, i) => { g.fillText(ln.slice(0, Math.max(0, k)), x0 + 14, y0 + 26 + i * 22); k -= ln.length + 1; }); g.restore();
    },
  };
  const H = D.setup(c, X), poses = H.poses;
  const attX = (t) => (H.attX ? H.attX(t) : att.x);
  Object.assign(c, {
    camera() {
      const t = this.t; let v;
      if (t < D.expand) v = { x: att.x + s * 0.25, S: lerp(98, 150, ss(t, 0, 0.45)) };
      else if (t < D.pull) v = H.camera(t);
      else { const a = H.camera(D.pull), k = ss(t, D.pull, D.pull + 0.45); v = { x: lerp(a.x, (attX(t) + def.x) / 2, k), S: lerp(a.S, 98, k) }; }
      this.camX = v.x; this.camS = v.S;
    },
    step(dt) {
      if (this.freeze > 0) { this.freeze -= dt; return false; } // hit-stop: the whole scene holds for a beat on impact
      this.t += dt; const t = this.t; att.x = attX(t); this.camera();
      if (t < D.expand && Math.random() < 0.7) P.gather(V3(att.x + s * 0.12, 1.35, 0), D.gold, 1.2);
      if (this.once("sign", 0.05)) game.sfx("charge");
      if (this.once("expand", D.expand)) { game.sfx("domain"); VIEW.flash = 0.06; FX2D.banner(D.name, att.info.hex, "DOMAIN EXPANSION · " + att.info.name, s); }
      H.step(t);
      if (this.once("crack", D.shatter - 0.22)) game.sfx("block");
      if (this.once("shatter", D.shatter)) { game.sfx("shatter"); this.makeShards(); VIEW.shake = 0.3; }
      return t >= D.dur;
    },
    makeShards() { // break the domain image into jagged triangles that fly off the screen
      const cols = 7, rows = 4, pts = [];
      for (let r = 0; r <= rows; r++) for (let q = 0; q <= cols; q++) { const edge = r === 0 || r === rows || q === 0 || q === cols; pts.push([q / cols * VIEW_W + (edge ? 0 : (Math.random() - 0.5) * 90), r / rows * VIEW_H + (edge ? 0 : (Math.random() - 0.5) * 70)]); }
      const P_ = (q, r) => pts[r * (cols + 1) + q], cx0 = VIEW_W / 2, cy0 = VIEW_H * 0.45; this.shards = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) for (const tri of (q + r) % 2 ? [[P_(q, r), P_(q + 1, r), P_(q + 1, r + 1)], [P_(q, r), P_(q + 1, r + 1), P_(q, r + 1)]] : [[P_(q, r), P_(q + 1, r), P_(q, r + 1)], [P_(q + 1, r), P_(q + 1, r + 1), P_(q, r + 1)]]) {
        const mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, a = Math.atan2(my - cy0, mx - cx0), v = 500 + Math.random() * 700;
        this.shards.push({ tri, mx, my, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, spin: (Math.random() - 0.5) * 8, delay: Math.hypot(mx - cx0, my - cy0) / 3000 });
      }
    },
    drawDomain(g, t) {
      if (t < D.expand || t >= D.shatter + 0.9) return;
      if (t < D.shatter) {
        const u = seg(t, D.expand, D.expand + 0.85), R = easeOut(u) * 1150, hx = VIEW.sx(att.x + s * 0.12), hy = VIEW.sy(1.35);
        g.save(); if (u < 1) { g.beginPath(); g.arc(hx, hy, Math.max(1, R), 0, TAU); g.clip(); } domBackground(g, id, t); g.restore();
        if (u < 1) { // the dome's edge: a double membrane in the Ranger's colour, studded with dots, sweeping out over the arena
          g.save(); g.globalCompositeOperation = "lighter"; g.lineWidth = 5; g.strokeStyle = rgba(D.col, 0.9); g.beginPath(); g.arc(hx, hy, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(hx, hy, Math.max(1, R - 12), 0, TAU); g.stroke();
          g.fillStyle = D.gold; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * 0.8; g.beginPath(); g.arc(hx + Math.cos(a) * (R - 6), hy + Math.sin(a) * (R - 6), 4, 0, TAU); g.fill(); } g.restore();
        }
        if (t > D.shatter - 0.22) { // cracks race across the dome just before it breaks
          const k = seg(t, D.shatter - 0.22, D.shatter); g.save(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2; const r0 = this._cr || (this._cr = Array.from({ length: 9 }, (_, i) => { const a = i / 9 * TAU + Math.random() * 0.4; let x = VIEW_W / 2, y = VIEW_H * 0.45; const pts = [[x, y]]; for (let j = 0; j < 8; j++) { x += Math.cos(a + (Math.random() - 0.5)) * 90; y += Math.sin(a + (Math.random() - 0.5)) * 90; pts.push([x, y]); } return pts; }));
          for (const pts of r0) { g.beginPath(); const n = Math.max(2, Math.ceil(pts.length * k)); for (let j = 0; j < n; j++) j ? g.lineTo(pts[j][0], pts[j][1]) : g.moveTo(pts[j][0], pts[j][1]); g.stroke(); } g.restore();
        }
        return;
      }
      const u = t - D.shatter; // shards: each piece carries its bit of the domain as it flies off
      for (const sh of this.shards || []) {
        const v = Math.max(0, u - sh.delay), a = 1 - seg(v, 0.35, 0.8); if (a <= 0) continue;
        g.save(); g.globalAlpha = a; g.translate(sh.mx + sh.vx * v, sh.my + sh.vy * v + 900 * v * v); g.rotate(sh.spin * v); g.translate(-sh.mx, -sh.my);
        g.beginPath(); g.moveTo(sh.tri[0][0], sh.tri[0][1]); g.lineTo(sh.tri[1][0], sh.tri[1][1]); g.lineTo(sh.tri[2][0], sh.tri[2][1]); g.closePath(); g.save(); g.clip(); domBackground(g, id, D.shatter); g.restore();
        g.strokeStyle = "rgba(255,240,255,.85)"; g.lineWidth = 2; g.stroke(); g.restore();
      }
    },
    drawAtt(g, t) {
      let f = 0, at = 0; for (const [tt, ff] of poses) if (t >= tt) { f = ff; at = tt; }
      const prev = poses.filter(([tt]) => tt < at).pop(), since = t - at, px = VIEW.S * FIGHTER_H / SPRITE_META.target, PS = M.poses;
      const pop = 1 + 0.05 * spring(since, 10, 30), x = VIEW.sx(att.x), y = VIEW.sy(0);
      if (H.ghosts && H.ghosts(t)) { this.trail.unshift(att.x); this.trail.length = Math.min(this.trail.length, 9); for (let i = 2; i < this.trail.length; i += 3) domStrip(g, IM.poses, PS, f, VIEW.sx(this.trail[i]), y, px, { flip: s, alpha: 0.35 * (1 - i / 9) }); } else this.trail.length = 0;
      if (prev && since < 0.1) domStrip(g, IM.poses, PS, prev[1], x, y, px, { flip: s, alpha: 1 - since / 0.1 }); // quick cross-fade between poses
      g.save(); g.globalAlpha = 0.45; g.fillStyle = "#000"; g.beginPath(); g.ellipse(x, FLOOR_Y + 3, 0.5 * VIEW.S, 0.08 * VIEW.S, 0, 0, TAU); g.fill(); g.restore();
      domStrip(g, IM.poses, PS, f, x, y, px, { flip: s, ky: pop, kx: 2 - pop });
      if (t < D.expand + 0.3) { // the hand sign glows
        const a = t < D.expand ? 0.5 + 0.5 * Math.sin(t * 18) : 1 - seg(t, D.expand, D.expand + 0.3), hx = VIEW.sx(att.x + s * 0.02), hy = VIEW.sy(1.33);
        g.save(); g.globalCompositeOperation = "lighter"; const gl = g.createRadialGradient(hx, hy, 0, hx, hy, 0.5 * VIEW.S); gl.addColorStop(0, rgba("#ffffff", 0.7 * a)); gl.addColorStop(0.3, rgba(D.gold, 0.5 * a)); gl.addColorStop(1, rgba(D.gold, 0)); g.fillStyle = gl; g.beginPath(); g.arc(hx, hy, 0.5 * VIEW.S, 0, TAU); g.fill(); g.restore();
      }
    },
    chant(g, t) {
      if (t > 0.12 && t < D.expand + 0.1) { // the chant, typed out over the Ranger's head
        const full = "DOMAIN EXPANSION", n = Math.min(full.length, Math.floor((t - 0.12) / 0.03)), a = 1 - seg(t, D.expand - 0.05, D.expand + 0.1);
        g.save(); g.globalAlpha = a; g.font = "16px P2, monospace"; g.textAlign = "center"; g.lineWidth = 6; g.strokeStyle = "#1a0b2e"; const tx = VIEW.sx(att.x), ty = VIEW.sy(2.35);
        g.strokeText(full.slice(0, n), tx, ty); g.fillStyle = "#ffffff"; g.fillText(full.slice(0, n), tx, ty); g.restore();
      }
    },
    draw(g) {
      const t = this.t;
      if (t < D.expand + 0.9) { g.save(); g.fillStyle = `rgba(6,3,16,${0.6 * ss(t, 0, 0.35)})`; g.fillRect(-40, -40, VIEW_W + 80, VIEW_H + 80); g.restore(); }
      this.drawDomain(g, t);
      if (H.drawBack) H.drawBack(g, t);
      H.drawDef(g, t); H.drawProps(g, t); this.drawAtt(g, t);
      P.draw(g); this.chant(g, t); if (H.text) H.text(g, t); if (H.drawTop) H.drawTop(g, t);
    },
    dispose() { att.hidden = def.hidden = false; },
  });
  return c;
}
