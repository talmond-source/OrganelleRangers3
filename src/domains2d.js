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
  defPose(g, def, key, x, y, { flash: o.flash, alpha: o.alpha }); g.restore();
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
      const n = Math.floor(u / 0.03), W = 230, H = 18 + lines.length * 22, x0 = clamp(bx + 40, 8, VIEW_W - W - 8), y0 = Math.max(70, top - H - 14);
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
