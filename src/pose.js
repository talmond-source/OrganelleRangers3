/* ================= Poses: turns the fight engine's animation requests into sprite frames ================= */
// Cell Rescue frame order: 0 idle · 1-3 run · 4-7 punch (wind-up, extend, full, recover) · 8-10 kick (chamber, extend, recover)
// 11 airborne tuck · 12-14 blaster (draw, aim, fire) · 15 hurt.
// Optional "extra" sheet per Ranger (see EXTRA-POSE-PROMPTS.md; 16 poses in this order), used when present:
const XF = { block: 0, crouch: 1, cblock: 2, sweep: 3, upper: 4, jkick: 5, down: 6, getup: 7, cast: 8, charge: 9, win: 10, win2: 11, dizzy: 12, launch: 13, throw: 14, ko: 15 };
const AN = (clip, f = 0, o = {}) => Object.assign({ clip, f }, o);
// [wind-up start, peak, end] of each move clip, in the move clock the engine sends
const CLIP_PEAK = { jab: [4, 12, 26], cross: [4, 16, 36], punch1: [4, 12, 28], hook: [0, 10, 30], upper: [0, 9, 34], kick: [5, 19, 44], kick2: [8, 19, 35], sweep: [4, 22, 50], jkick: [8, 17, 17], magic1: [8, 28, 50], magic2: [14, 32, 60], throw: [8, 21, 45], fireball: [12, 29, 51] };
const PUNCHES = ["jab", "cross", "punch1", "hook", "upper", "throw"], KICKS = ["kick", "kick2", "sweep", "jkick"], BLASTS = ["magic1", "magic2", "fireball"];
function phaseOf(clip, f) { const [a, pk, e] = CLIP_PEAK[clip] || [0, 10, 30]; if (f < pk) return { wind: true, u: clamp((f - a) / Math.max(1, pk - a)) }; return { wind: false, u: clamp((f - pk) / Math.max(1, e - pk)) }; }
function handWorld(me) { return V3(me.x + me.face * 0.5, me.y + 1.3, 0.2); }

/* returns { frame, rot, pivot, drop, extra, scale, aura } for the fighter's current animation */
function poseFor(me) {
  const a = me.anim || AN("idle"), c = a.clip, f = a.f, X = SPR.extra[me.id], T = me.game ? me.game.time : 0;
  const x = (k, fallback) => (X ? { frame: XF[k], extra: true } : fallback);
  if (me.id === "phage") return phagePose(me, c, f);
  if (me.buff && me.buff.knot > 0) return { frame: 11, rot: Math.sin(T * 9) * 0.5, pivot: 0.6, scale: 0.6, drop: -0.35 };
  if (PUNCHES.includes(c)) {
    const p = phaseOf(c, f);
    if (c === "upper") { if (X) return { frame: XF.upper, extra: true }; return p.wind ? { frame: p.u < 0.5 ? 11 : 4 } : { frame: 6, rot: -0.75 * (1 - p.u * 0.6), pivot: 0.9 }; }
    if (c === "throw" && X && !p.wind && p.u < 0.5) return { frame: XF.throw, extra: true };
    const fr = p.wind ? (p.u < 0.45 ? 4 : 5) : p.u < 0.45 ? 6 : 7;
    return { frame: fr, rot: c === "hook" && fr === 6 ? 0.12 : 0, pivot: 0.9 };
  }
  if (KICKS.includes(c)) {
    const p = phaseOf(c, f);
    if (c === "sweep") { if (X) return { frame: XF.sweep, extra: true }; return p.wind ? { frame: 11 } : p.u < 0.55 ? { frame: 9, rot: 0.62, pivot: 0.2, drop: 0.12 } : { frame: 11 }; }
    if (c === "jkick") return X ? { frame: XF.jkick, extra: true } : { frame: p.wind && p.u < 0.6 ? 8 : 9, rot: 0.42, pivot: 0.95 };
    return { frame: p.wind ? (p.u < 0.75 ? 8 : 9) : p.u < 0.5 ? 9 : 10 };
  }
  if (BLASTS.includes(c)) { const p = phaseOf(c, f); return p.wind ? { frame: p.u < 0.5 ? 12 : 13, aura: p.u } : { frame: p.u < 0.3 ? 14 : 13 }; }
  if (c === "punchCombo") return { frame: [5, 6, 9, 6, 4, 9][Math.floor(f / 6) % 6] };
  if (c === "cast") return x("cast", { frame: 13, aura: clamp(f / 30), rot: -0.05 });
  if (c === "block" || c === "blockHit") return Object.assign(x("block", { frame: 0 }), { shield: c === "blockHit" ? 2 : 1, push: c === "blockHit" ? -0.06 : 0 });
  if (c === "walkF" || c === "walkB") { const i = ((Math.floor((c === "walkB" ? -f : f) / 5) % 4) + 4) % 4; return { frame: [1, 2, 3, 2][i] }; }
  if (c === "crouch") return a.upper ? Object.assign(x("cblock", { frame: 11, drop: 0.02 }), { shield: 1, low: true }) : x("crouch", { frame: 11, drop: 0.02 });
  if (c === "jump") return { frame: 11 };
  if (c === "hitHigh" || c === "hitHigh2" || c === "hitLow") return { frame: 15, push: -0.05 * Math.sin(Math.min(Math.PI, f / 6)) };
  if (c === "knockback") { const lie = me.state === "down"; if (lie) return x("down", { frame: 15, rot: -Math.PI / 2, pivot: 0.32, drop: -0.1 }); return x("launch", { frame: 15, rot: -clamp(0.3 + f / 40, 0, 1.3), pivot: 0.9 }); }
  if (c === "trip") return x("down", { frame: 15, rot: -Math.min(Math.PI / 2, f / 20), pivot: 0.32, drop: -0.1 * Math.min(1, f / 30) });
  if (c === "getupSlow") return x("getup", { frame: 11, alpha: 0.85 + 0.15 * Math.sin(T * 30) });
  if (c === "dizzy") return x("dizzy", { frame: 15, rot: Math.sin(T * 4) * 0.08, pivot: 0.1, stars: true });
  if (c === "ko") return x("ko", { frame: 15, rot: -Math.min(Math.PI / 2, 0.4 + f / 25), pivot: 0.32, drop: -0.1 * Math.min(1, f / 30) });
  if (c === "win") return x(f > 25 ? "win2" : "win", { frame: f < 18 ? 12 : 13, aura: 0.6 });
  if (c === "intro" || c === "intro2") return { frame: f < 14 ? 12 : f < 34 ? 13 : 0, aura: f < 34 ? 0.5 : 0 };
  if (c === "charge") return x("charge", { frame: 13, aura: 1 });
  // idle: a slow breathing bob
  return { frame: 0, squash: 1 + Math.sin(T * 3 + me.slot) * 0.008 };
}
function phagePose(me, c, f) {
  if (PUNCHES.includes(c) || KICKS.includes(c)) { const p = phaseOf(c, f); return { frame: p.wind ? 2 : 3 }; }
  if (BLASTS.includes(c) || c === "cast") { const p = phaseOf(BLASTS.includes(c) ? c : "magic1", f); return { frame: p.wind ? 4 : 5, aura: p.wind ? p.u : 0 }; }
  if (c === "walkF" || c === "walkB") return { frame: Math.floor(Math.abs(f) / 9) % 2 };
  if (c === "hitHigh" || c === "hitHigh2" || c === "hitLow" || c === "dizzy") return { frame: 6 };
  if (c === "knockback" || c === "trip" || c === "ko") return { frame: me.state === "air" ? 6 : 7 };
  if (c === "getupSlow" || c === "crouch") return { frame: 7 };
  if (c === "block" || c === "blockHit") return { frame: 0, shield: 1 };
  if (c === "win" || c === "intro" || c === "intro2") return { frame: f < 20 ? 4 : 0, aura: 0.5 };
  return { frame: 0, squash: 1 + Math.sin((me.game ? me.game.time : 0) * 2.4) * 0.01 };
}
function drawFighter(g, me) {
  if (me.hidden) return;
  const p = poseFor(me), x = me.drawX ?? me.x, y = me.drawY ?? me.y, col = me.info.hex;
  // floor shadow
  g.save(); g.globalAlpha = 0.45 * clamp(1 - y * 0.25, 0.3, 1); g.fillStyle = "#000"; g.beginPath(); g.ellipse(VIEW.sx(x), FLOOR_Y + 3, 0.5 * VIEW.S * clamp(1 - y * 0.2, 0.4, 1), 0.08 * VIEW.S, 0, 0, TAU); g.fill(); g.restore();
  if (p.aura) { const r = (0.9 + p.aura * 0.4) * VIEW.S, cx = VIEW.sx(x), cy = VIEW.sy(y + 1.0); g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, rgba(col, 0.35 * p.aura)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.restore(); }
  if (me.buff && me.buff.parry > 0) { const cx = VIEW.sx(x + me.face * 0.45), cy = VIEW.sy(y + 1.0); g.save(); g.globalAlpha = 0.5 + 0.3 * Math.sin(me.game.time * 30); g.strokeStyle = me.id === "smoother" ? "#44e0b0" : "#ff7fbf"; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 7; i++) { const yy = cy - 0.9 * VIEW.S + i * 0.3 * VIEW.S; g.moveTo(cx, yy); g.arc(cx, yy, 5, 0, TAU); } g.stroke(); g.restore(); }
  drawFrame(g, me.id, p.frame, x + me.face * (p.push || 0), y, me.face, { rot: p.rot, pivot: p.pivot, drop: p.drop, alpha: p.alpha, scale: p.scale, squash: p.squash, extra: p.extra, flash: me.flash });
  if (p.shield) { const cx = VIEW.sx(x + me.face * 0.42), cy = VIEW.sy(y + (p.low ? 0.55 : 1.05)), r = (p.low ? 0.55 : 0.85) * VIEW.S; g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = rgba("#8ad8ff", p.shield > 1 ? 0.95 : 0.6); g.lineWidth = p.shield > 1 ? 5 : 3; g.beginPath(); g.arc(cx - me.face * r * 0.55, cy, r, -0.9, 0.9, false); if (me.face < 0) { g.beginPath(); g.arc(cx + r * 0.55, cy, r, Math.PI - 0.9, Math.PI + 0.9, false); } g.stroke(); g.restore(); }
  if (me.buff && me.buff.shield > 0) { const cx = VIEW.sx(x), cy = VIEW.sy(y + 1.0), r = 1.05 * VIEW.S, sc = me.id === "mitosis" ? "#ff5fd0" : "#a98cff"; g.save(); g.globalAlpha = 0.22 + 0.06 * Math.sin(me.game.time * 5); g.fillStyle = sc; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.globalAlpha = 0.7; g.strokeStyle = sc; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, r * 0.93, 0, TAU); g.stroke(); g.restore(); }
  if (p.stars || me.state === "stun") { const cx = VIEW.sx(x), cy = VIEW.sy(y + 2.05), t = me.game ? me.game.time : 0; g.save(); g.fillStyle = "#ffe66b"; for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3, sx = cx + Math.cos(a) * 26, sy = cy + Math.sin(a) * 7; g.beginPath(); for (let k = 0; k < 10; k++) { const aa = k * TAU / 10, rr = k % 2 ? 2.5 : 6; g.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } g.fill(); } g.restore(); }
}
/* a moving copy of the fighter (Replication Clone, Telophase) */
function drawGhost(g, me, x, y, frame, alpha = 0.85) { drawFrame(g, me.id, frame, x, y, me.face, { alpha }); }
