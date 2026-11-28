/* ================= Poses: turns the fight engine's animation requests into sprite frames ================= */
// Cell Rescue frame order: 0 idle · 1-3 run · 4-7 punch (wind-up, extend, full, recover) · 8-10 kick (chamber, extend, recover)
// 11 airborne tuck · 12-14 blaster (no longer used) · 15 hurt (holds the blaster; replaced by the extra sheet).
// Two optional ChatGPT sheets per Ranger (EXTRA-POSE-PROMPTS.md), used whenever a Ranger has them. Pose 0 of
// each is the idle stance (it sets the scale). "extra": fight poses that replace the blaster and hurt frames.
const XE = { idle: 0, hitHigh: 1, hitBody: 2, block: 3, crouch: 4, cblock: 5, launch: 6, down: 7, getup: 8, dizzy: 9, palm: 10, power: 11, throwWind: 12, throwRel: 13, win: 14, ko: 15 };
// "motion": in-between frames that smooth out idle, walking, jumping, punches and kicks
const XM = { idle: 0, breatheIn: 1, breatheOut: 2, walk1: 3, walk2: 4, walk3: 5, walk4: 6, jumpCrouch: 7, jumpRise: 8, jumpFall: 9, jab: 10, wind: 11, upper: 12, roundhouse: 13, sweep: 14, flykick: 15 };
// "flow": the moments before and after each big attack (wind-ups, recoveries, landings)
const XF = { idle: 0, upDip: 1, upRise: 2, upRecover: 3, hookWind: 4, hookHit: 5, frontChamber: 6, roundChamber: 7, roundFollow: 8, sweepDrop: 9, sweepFollow: 10, land: 11, dash: 12, backHop: 13, spin: 14, dive: 15 };
// the Phage's 16-pose move sheet (his first sheet has only 8 poses)
const XP = { idle: 0, breathe: 1, walk1: 2, walk2: 3, jab: 4, wind: 5, strike: 6, rise: 7, kick: 8, sweep: 9, lash: 10, block: 11, crouch: 12, jump: 13, hit: 14, taunt: 15 };
const F = (me, k, o) => (SPR.flow[me.id] ? Object.assign({ frame: XF[k], flow: true }, o || {}) : null);
const PM = (k, o) => (SPR.motion.phage ? Object.assign({ frame: XP[k], motion: true }, o || {}) : null);
const hasE = (me) => !!SPR.extra[me.id], hasM = (me) => !!SPR.motion[me.id], hasF = (me) => !!SPR.flow[me.id];
const E = (me, k, o) => (SPR.extra[me.id] ? Object.assign({ frame: XE[k], extra: true }, o || {}) : null);
const M = (me, k, o) => (SPR.motion[me.id] ? Object.assign({ frame: XM[k], motion: true }, o || {}) : null);
const AN = (clip, f = 0, o = {}) => Object.assign({ clip, f }, o);
// [wind-up start, peak, end] of each move clip, in the move clock the engine sends
const CLIP_PEAK = { jab: [4, 12, 26], cross: [4, 16, 36], punch1: [4, 12, 28], hook: [0, 10, 30], upper: [0, 9, 34], kick: [5, 19, 44], kick2: [8, 19, 35], sweep: [4, 22, 50], jkick: [8, 17, 17], magic1: [8, 28, 50], magic2: [14, 32, 60], throw: [8, 21, 45], fireball: [12, 29, 51] };
const PUNCHES = ["jab", "cross", "punch1", "hook", "upper", "throw"], KICKS = ["kick", "kick2", "sweep", "jkick"], BLASTS = ["magic1", "magic2", "fireball"];
/* ---- special-move looks ----
   Specials ask for a "look" on top of their timing clip, so every special reads differently even though
   each Ranger sheet only has 16 poses: an energy palm, a pitcher's throw, a held beam, a crouch-and-rise
   power-up, a ground slam, a spinning warp, a pointing lock-on. Timing comes from the clip (or from the
   move's own release frame `at` for self-moves); the look only picks frames, motion and glow. */
function lookPhase(a) {
  if (a.at) { const f = a.f; return f < a.at ? { wind: true, u: clamp(f / a.at) } : { wind: false, u: clamp((f - a.at) / Math.max(1, (a.end || a.at + 16) - a.at)) }; }
  return phaseOf(a.clip, a.f);
}
const LOOKS = {
  // energy gathers at the chambered fist, then a full-arm thrust releases it
  palm(me, a, T) { const p = lookPhase(a);
    if (p.wind) return p.u < 0.45 ? { frame: 4, orb: [0.42, 1.3, 0.06 + 0.1 * p.u, p.u] } : { frame: 5, orb: [0.6, 1.33, 0.1 + 0.08 * p.u, 0.7 + 0.3 * p.u], push: -0.04 };
    return p.u < 0.55 ? (E(me, "palm", { push: 0.12 * (1 - p.u), orb: [0.8, 1.32, 0.2 * (1 - p.u * 1.6), 1 - p.u * 1.6] }) || { frame: 6, push: 0.12 * (1 - p.u), orb: [0.86, 1.36, 0.2 * (1 - p.u * 1.6), 1 - p.u * 1.6] }) : { frame: 7 }; },
  // a pitcher's wind-up: knee up and arm cocked, then the throwing arm snaps through
  toss(me, a, T) { const p = lookPhase(a);
    if (p.wind) return p.u < 0.6 ? (E(me, "throwWind", { orb: [-0.3, 1.75, 0.09, 0.8] }) || { frame: 8, rot: 0.1 * p.u, pivot: 0.3, orb: [-0.15, 1.55, 0.09, 0.8] }) : { frame: 5, rot: -0.06, pivot: 0.3 };
    return p.u < 0.45 ? (E(me, "throwRel", { push: 0.1 }) || { frame: 6, rot: -0.12 * (1 - p.u), pivot: 0.2, push: 0.1 }) : { frame: 7 }; },
  // a held, trembling thrust for beams and bursts
  beam(me, a, T) { const p = lookPhase(a);
    if (p.wind) return p.u < 0.5 ? { frame: 4, aura: p.u, orb: [0.42, 1.3, 0.08 + 0.1 * p.u, p.u] } : { frame: 5, aura: p.u, orb: [0.6, 1.33, 0.16, 1], push: -0.05 * p.u };
    if (p.u < 0.7) return E(me, "palm", { aura: 0.8, push: -0.03 + Math.sin(T * 70) * 0.012, orb: [0.8, 1.32, 0.17 + Math.sin(T * 40) * 0.03, 1] }) || { frame: 6, aura: 0.8, push: -0.03 + Math.sin(T * 70) * 0.012, orb: [0.86, 1.36, 0.17 + Math.sin(T * 40) * 0.03, 1] };
    return { frame: 7 }; },
  // long charge (Electron Transport Chain): a knee-up stance gathering a big orb overhead, then a thrust
  charge(me, a, T) { const p = lookPhase(a);
    if (p.wind) return { frame: 8, aura: p.u, drop: -0.08 * p.u, orb: [0.1, 2.15, 0.08 + 0.2 * p.u, 0.6 + 0.4 * p.u] };
    return p.u < 0.55 ? { frame: 6, push: 0.14 * (1 - p.u), orb: [0.86, 1.36, 0.2 * (1 - p.u * 1.6), 1] } : { frame: 7 }; },
  // three quick alternating jabs (Na+/K+ Pump)
  rapid(me, a, T) { const p = lookPhase(a);
    if (p.wind) return { frame: 4, orb: [0.42, 1.3, 0.08, p.u] };
    return { frame: p.u < 0.75 ? [6, 5, 6, 5, 6][Math.min(4, Math.floor(p.u * 6.6))] : 7, orb: p.u < 0.6 ? [0.8, 1.36, 0.1, 0.8] : null }; },
  // crouch and gather, then rise into a floating crane stance with a flare of aura
  power(me, a, T) { const p = lookPhase(a);
    if (p.wind) return { frame: 11, aura: 0.3 + 0.7 * p.u, squash: 1 - 0.04 * Math.sin(T * 30), column: p.u };
    const lift = Math.sin(Math.min(1, p.u * 1.4) * Math.PI) * 0.28;
    return p.u < 0.85 ? Object.assign(E(me, "power") || { frame: 8 }, { drop: -lift, aura: 1 - p.u * 0.8, column: 1 - p.u, scale: 1 + 0.03 * (1 - p.u) }) : { frame: 0 }; },
  // hop up, tuck, and slam the ground
  slam(me, a, T) { const p = lookPhase(a);
    if (hasF(me)) { if (p.wind) { const h = Math.sin(clamp(p.u / 0.85) * Math.PI) * 0.75; return p.u < 0.45 ? { frame: 11, drop: -h, aura: p.u * 0.6 } : F(me, "dive", { drop: -h, rot: 0.9 + p.u * 0.6, pivot: 1.0, aura: p.u * 0.6 }); }
      return p.u < 0.4 ? F(me, "sweepDrop", { squash: 0.9 + p.u * 0.25, aura: 0.6 * (1 - p.u) }) : p.u < 0.7 ? F(me, "land") : { frame: 0 }; }
    if (p.wind) { const h = Math.sin(clamp(p.u / 0.85) * Math.PI) * 0.75; return { frame: 11, drop: -h, rot: p.u > 0.55 ? -0.25 : 0, pivot: 0.6, aura: p.u * 0.6 }; }
    return p.u < 0.35 ? { frame: 11, squash: 0.86 + p.u * 0.3, aura: 0.6 * (1 - p.u) } : p.u < 0.7 ? { frame: 10 } : { frame: 0 }; },
  // spin into a blur and vanish; spin back in at the new spot
  warp(me, a, T) { const p = lookPhase(a);
    if (hasF(me)) { const sp = Math.floor(T * 20) % 2 ? F(me, "spin") : { frame: 0 };
      if (p.wind) return Object.assign(sp, { drop: -0.3 * Math.sin(p.u * Math.PI * 0.5), alpha: 1 - p.u * 0.75, scale: 1 - p.u * 0.25, ghosts: true });
      return p.u < 0.5 ? Object.assign(sp, { alpha: 0.4 + p.u * 1.2, scale: 0.85 + p.u * 0.3 }) : F(me, "land"); }
    if (p.wind) return { frame: 11, rot: p.u * TAU * 1.5, pivot: 0.7, drop: -0.45 * Math.sin(p.u * Math.PI * 0.5), alpha: 1 - p.u * 0.75, scale: 1 - p.u * 0.25, ghosts: true };
    return p.u < 0.5 ? { frame: 11, rot: -(1 - p.u * 2) * TAU, pivot: 0.7, drop: -0.45 * (1 - p.u * 2), alpha: 0.4 + p.u * 1.2, scale: 0.85 + p.u * 0.3 } : { frame: 4 }; },
  // point the arm at the target: a reticle forms at the fingertip
  aim(me, a, T) { const p = lookPhase(a);
    if (p.wind) return { frame: p.u < 0.5 ? 4 : 5, reticle: p.u };
    return p.u < 0.75 ? { frame: 6, reticle: 1, push: Math.sin(T * 50) * 0.006 } : { frame: 7 }; },
  // cell division: a braced knee-up stance while the copy separates
  split(me, a, T) { return Object.assign(E(me, "power") || { frame: 8 }, { aura: 0.7, drop: -0.04 * Math.sin(T * 9) }); },
};
function phaseOf(clip, f) { const [a, pk, e] = CLIP_PEAK[clip] || [0, 10, 30]; if (f < pk) return { wind: true, u: clamp((f - a) / Math.max(1, pk - a)) }; return { wind: false, u: clamp((f - pk) / Math.max(1, e - pk)) }; }
// where the lead fist is in each sprite frame (metres from the feet, measured from the art)
const HAND = { 6: [0.8, 1.36], 9: [0.78, 1.25], 5: [0.6, 1.33], 8: [0.25, 1.25], 11: [0.35, 0.9] };
const HAND_E = { 10: [0.8, 1.32], 13: [0.85, 1.4], 11: [0.4, 1.2] }, HAND_M = { 10: [0.7, 1.38], 12: [0.35, 2.05], 13: [0.85, 1.5] }, HAND_F = { 2: [0.45, 1.45], 5: [0.7, 1.5] };
function handWorld(me) { const p = me.anim && me.id !== "phage" ? poseFor(me) : { frame: 0 }, tbl = p.flow ? HAND_F : p.extra ? HAND_E : p.motion ? HAND_M : HAND, h = tbl[p.frame] || [0.5, 1.3]; return V3(me.x + me.face * h[0], me.y + h[1], 0.2); }

/* returns { frame, rot, pivot, drop, extra, scale, aura } for the fighter's current animation */
function poseFor(me) {
  const a = me.anim || AN("idle"), c = a.clip, f = a.f, T = me.game ? me.game.time : 0;
  if (me.id === "phage") return phagePose(me, c, f);
  if (a.look && LOOKS[a.look]) return LOOKS[a.look](me, a, T);
  if (me.buff && me.buff.knot > 0) return { frame: 11, rot: Math.sin(T * 9) * 0.5, pivot: 0.6, scale: 0.6, drop: -0.35 };
  if (PUNCHES.includes(c)) {
    const p = phaseOf(c, f);
    if (c === "upper") { const up = M(me, "upper"); if (up && hasF(me)) return p.wind ? (p.u < 0.55 ? F(me, "upDip") : F(me, "upRise")) : p.u < 0.6 ? up : F(me, "upRecover"); /* dip, spring up, uppercut, recover */
      if (up) return p.wind ? (p.u < 0.6 ? E(me, "crouch") || M(me, "jumpCrouch") : M(me, "jumpCrouch")) : p.u < 0.7 ? up : { frame: 7 }; return p.wind ? { frame: p.u < 0.5 ? 11 : 4 } : { frame: 6, rot: -0.75 * (1 - p.u * 0.6), pivot: 0.9 }; }
    if (c === "throw" && !p.wind && p.u < 0.5) { const t = E(me, "throwRel"); if (t) return t; }
    if (c === "jab") { const j = M(me, "jab"); if (j) return p.wind ? (p.u < 0.5 ? { frame: 4 } : j) : p.u < 0.4 ? { frame: 6 } : p.u < 0.75 ? j : { frame: 4 }; }
    if (c === "hook" && hasF(me)) return p.wind ? (p.u < 0.6 ? F(me, "hookWind") : F(me, "hookHit")) : p.u < 0.55 ? F(me, "hookHit") : { frame: 7 };
    if (p.wind && p.u < 0.45) { const w = M(me, "wind"); if (w) return w; }
    const fr = p.wind ? (p.u < 0.45 ? 4 : 5) : p.u < 0.45 ? 6 : 7;
    return { frame: fr, rot: c === "hook" && fr === 6 ? 0.12 : 0, pivot: 0.9 };
  }
  if (KICKS.includes(c)) {
    const p = phaseOf(c, f);
    if (c === "sweep" && hasF(me) && hasM(me)) return p.wind ? (p.u < 0.55 ? F(me, "sweepDrop") : M(me, "sweep")) : p.u < 0.6 ? M(me, "sweep") : F(me, "sweepFollow");
    if (c === "sweep") { const sw = M(me, "sweep"); if (sw) return p.wind && p.u < 0.5 ? (E(me, "crouch") || { frame: 11 }) : !p.wind && p.u > 0.7 ? (E(me, "crouch") || sw) : sw; return p.wind ? { frame: 11 } : p.u < 0.55 ? { frame: 9, rot: 0.62, pivot: 0.2, drop: 0.12 } : { frame: 11 }; }
    if (c === "jkick") return (p.wind && p.u < 0.4 && M(me, "jumpRise")) || M(me, "flykick") || { frame: p.wind && p.u < 0.6 ? 8 : 9, rot: 0.42, pivot: 0.95 };
    if (c === "kick2" && hasF(me) && hasM(me)) return p.wind ? (p.u < 0.6 ? F(me, "roundChamber") : M(me, "roundhouse")) : p.u < 0.5 ? M(me, "roundhouse") : F(me, "roundFollow");
    if (c === "kick2" && (p.wind ? p.u > 0.6 : p.u < 0.55)) { const r = M(me, "roundhouse"); if (r) return r; }
    if (c === "kick" && p.wind && p.u < 0.6 && hasF(me)) return F(me, "frontChamber");
    return { frame: p.wind ? (p.u < 0.75 ? 8 : 9) : p.u < 0.5 ? 9 : 10 };
  }
  if (BLASTS.includes(c)) return LOOKS.palm(me, a, T);
  if (c === "punchCombo") { const seq = hasM(me) ? [5, 6, 9, 6, 4, 9] : [5, 6, 9, 6, 4, 9]; return { frame: seq[Math.floor(f / 6) % 6] }; }
  if (c === "cast") return Object.assign(E(me, "power") || { frame: 8 }, { aura: clamp(f / 30), column: clamp(f / 30) });
  if (c === "block" || c === "blockHit") return Object.assign(E(me, "block") || { frame: 0 }, { shield: c === "blockHit" ? 2 : 1, push: c === "blockHit" ? -0.06 : 0 });
  if (c === "walkF" || c === "walkB") { const i = ((Math.floor((c === "walkB" ? -f : f) / 5) % 4) + 4) % 4;
    return M(me, ["walk1", "walk2", "walk3", "walk4"][i]) || { frame: [1, 2, 3, 2][i] }; }
  if (c === "crouch") return a.upper ? Object.assign(E(me, "cblock") || { frame: 11, drop: 0.02 }, { shield: 1, low: true }) : E(me, "crouch") || { frame: 11, drop: 0.02 };
  if (c === "jump") { if (hasM(me)) return f < 29 ? M(me, "jumpRise") : f > 37 ? M(me, "jumpFall") : { frame: 11 }; return { frame: 11 }; }
  if (c === "hitHigh" || c === "hitHigh2" || c === "hitLow") { const push = -0.05 * Math.sin(Math.min(Math.PI, f / 6)); return Object.assign(E(me, c === "hitLow" || c === "hitHigh2" ? "hitBody" : "hitHigh") || { frame: 15 }, { push }); }
  if (c === "knockback") { const lie = me.state === "down"; if (lie) return E(me, "down") || { frame: 15, rot: -Math.PI / 2, pivot: 0.32, drop: -0.1 }; return E(me, "launch") || { frame: 15, rot: -clamp(0.3 + f / 40, 0, 1.3), pivot: 0.9 }; }
  if (c === "trip") return (f < 10 && E(me, "hitBody")) || E(me, "down") || { frame: 15, rot: -Math.min(Math.PI / 2, f / 20), pivot: 0.32, drop: -0.1 * Math.min(1, f / 30) };
  if (c === "getupSlow") return E(me, "getup") || { frame: 11, alpha: 0.85 + 0.15 * Math.sin(T * 30) };
  if (c === "dizzy") return Object.assign(E(me, "dizzy") || { frame: 15 }, { rot: Math.sin(T * 4) * 0.06, pivot: 0.1, stars: true });
  if (c === "ko") { if (hasE(me)) return f < 22 ? E(me, "ko") : E(me, "down"); return { frame: 15, rot: -Math.min(Math.PI / 2, 0.4 + f / 25), pivot: 0.32, drop: -0.1 * Math.min(1, f / 30) }; }
  // victory: a tuck flip, then a victory pose (or a floating crane stance) in a burst of colour
  if (c === "win") { if (f < 16) return { frame: 11, drop: -Math.sin(f / 16 * Math.PI) * 0.9, rot: f / 16 * TAU, pivot: 0.7 }; return Object.assign(E(me, "win") || { frame: 8 }, { aura: 0.8, column: 0.6, drop: -0.05 - Math.sin(T * 4) * 0.03 }); }
  // entrance: land from a jump, rise into a guard
  if (c === "intro" || c === "intro2") return f < 10 ? { frame: 11, drop: -(1 - f / 10) * 1.2 } : f < 16 ? { frame: 11, squash: 0.9 } : f < 36 ? Object.assign(c === "intro2" ? E(me, "power") || { frame: 8 } : { frame: 4 }, { aura: 0.6, column: 0.5 }) : { frame: 0 };
  if (c === "charge") return Object.assign(E(me, "power") || { frame: 8 }, { aura: 1, column: 1, drop: -0.12 });
  // just landed from a jump: knees bend to soak it up
  if (c === "idle" && me.landT != null && me.game && me.game.time - me.landT < 0.12 && hasF(me)) return F(me, "land");
  // idle: breathing (in-between frames when the Ranger has them, otherwise a slow bob)
  if (hasM(me)) { const k = Math.floor(T * 2.2 + me.slot * 1.3) % 4; return k === 1 ? M(me, "breatheIn") : k === 3 ? M(me, "breatheOut") : { frame: 0 }; }
  return { frame: 0, squash: 1 + Math.sin(T * 3 + me.slot) * 0.008 };
}
function phagePose(me, c, f) {
  const T = me.game ? me.game.time : 0;
  if (SPR.motion.phage) { // his 16-pose move sheet
    if (PUNCHES.includes(c)) { const p = phaseOf(c, f);
      if (c === "jab") return p.wind ? (p.u < 0.5 ? PM("idle") : PM("jab")) : p.u < 0.6 ? PM("jab") : PM("idle");
      if (c === "upper") return p.wind ? PM("crouch") : p.u < 0.65 ? PM("rise") : PM("idle");
      return p.wind ? PM("wind") : p.u < 0.6 ? PM("strike") : PM("idle"); }
    if (KICKS.includes(c)) { const p = phaseOf(c, f);
      if (c === "sweep") return p.wind ? PM("crouch") : p.u < 0.7 ? PM("sweep") : PM("crouch");
      if (c === "jkick") return p.wind ? PM("jump") : PM("kick");
      if (c === "kick2") return p.wind ? PM("crouch") : p.u < 0.65 ? PM("lash") : PM("idle");
      return p.wind ? PM("wind") : p.u < 0.6 ? PM("kick") : PM("idle"); }
    if (c === "walkF" || c === "walkB") { const i = ((Math.floor((c === "walkB" ? -f : f) / 8) % 4) + 4) % 4; return i === 0 ? PM("walk1") : i === 2 ? PM("walk2") : PM("idle"); }
    if (c === "hitHigh" || c === "hitHigh2" || c === "hitLow") return PM("hit");
    if (c === "knockback" && me.state === "air") return PM("hit");
    if (c === "crouch") return PM("crouch");
    if (c === "block" || c === "blockHit") return PM("block", { shield: c === "blockHit" ? 2 : 1 });
    if (c === "jump") return PM("jump");
    if (c === "win") return PM("taunt", { aura: 0.5 });
    if (c === "idle") return Math.floor(T * 1.6) % 3 === 1 ? PM("breathe") : PM("idle");
  }
  if (PUNCHES.includes(c) || KICKS.includes(c)) { const p = phaseOf(c, f); return { frame: p.wind ? 2 : 3 }; }
  if (BLASTS.includes(c) || c === "cast") { const p = phaseOf(BLASTS.includes(c) ? c : "magic1", f); return { frame: p.wind ? 4 : 5, aura: p.wind ? p.u : 0 }; }
  if (c === "walkF" || c === "walkB") return { frame: Math.floor(Math.abs(f) / 9) % 2 };
  if (c === "hitHigh" || c === "hitHigh2" || c === "hitLow" || c === "dizzy") return { frame: 6 };
  if (c === "knockback" || c === "trip" || c === "ko") return { frame: me.state === "air" ? 6 : 7 };
  if (c === "getupSlow" || c === "crouch") return { frame: 7 };
  if (c === "block" || c === "blockHit") return { frame: 0, shield: 1 };
  if (c === "win" || c === "intro" || c === "intro2") return { frame: f < 20 ? 4 : 0, aura: 0.5 };
  return { frame: 0, squash: 1 + Math.sin(T * 2.4) * 0.01 };
}
function drawFighter(g, me) {
  if (me.hidden) return;
  const p = poseFor(me), x = me.drawX ?? me.x, y = me.drawY ?? me.y, col = me.info.hex;
  // floor shadow
  g.save(); g.globalAlpha = 0.45 * clamp(1 - y * 0.25, 0.3, 1); g.fillStyle = "#000"; g.beginPath(); g.ellipse(VIEW.sx(x), FLOOR_Y + 3, 0.5 * VIEW.S * clamp(1 - y * 0.2, 0.4, 1), 0.08 * VIEW.S, 0, 0, TAU); g.fill(); g.restore();
  if (p.aura) { const r = (0.9 + p.aura * 0.4) * VIEW.S, cx = VIEW.sx(x), cy = VIEW.sy(y + 1.0); g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, rgba(col, 0.35 * p.aura)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.restore(); }
  if (me.buff && me.buff.parry > 0) { const cx = VIEW.sx(x + me.face * 0.45), cy = VIEW.sy(y + 1.0); g.save(); g.globalAlpha = 0.5 + 0.3 * Math.sin(me.game.time * 30); g.strokeStyle = me.id === "smoother" ? "#44e0b0" : "#ff7fbf"; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 7; i++) { const yy = cy - 0.9 * VIEW.S + i * 0.3 * VIEW.S; g.moveTo(cx, yy); g.arc(cx, yy, 5, 0, TAU); } g.stroke(); g.restore(); }
  // a rising column of light under power-ups
  if (p.column > 0.02) { const cx = VIEW.sx(x), w = 0.55 * VIEW.S, top = VIEW.sy(y + 2.6), bot = FLOOR_Y + 2, t = me.game ? me.game.time : 0; g.save(); g.globalCompositeOperation = "lighter";
    const gr = g.createLinearGradient(0, bot, 0, top); gr.addColorStop(0, rgba(col, 0.2 * p.column)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; for (const k of [1, 0.66, 0.33]) g.fillRect(cx - w * k, top, w * 2 * k, bot - top);
    g.strokeStyle = rgba(col, 0.8 * p.column); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, bot, w * (0.8 + 0.2 * Math.sin(t * 9)), 0.1 * VIEW.S, 0, 0, TAU); g.stroke();
    g.fillStyle = rgba("#ffffff", 0.8 * p.column); for (let i = 0; i < 6; i++) { const k = (t * 1.6 + i / 6) % 1, sx = cx + Math.sin(i * 2.3 + t * 3) * w * 0.7, sy = bot - k * (bot - top); g.globalAlpha = 1 - k; g.fillRect(sx - 1.5, sy - 5, 3, 10); } g.restore(); }
  // after-images: dashing specials, and the spin of a warp
  const dash = me.state === "attack" && Math.abs(me.vx) > 6;
  if (dash || p.ghosts) { const tr = me._trail || (me._trail = []); tr.unshift([x, y, p.frame, p.rot || 0, p.extra, p.motion, p.flow]); tr.length = Math.min(tr.length, 10);
    for (let i = 3; i < tr.length; i += 3) { const [gx, gy, gf, gr, ge, gm, gfl] = tr[i]; drawFrame(g, me.id, gf, gx, gy, me.face, { rot: gr, pivot: p.pivot, drop: p.drop, alpha: 0.4 * (1 - i / 10), silhouette: col, extra: ge, motion: gm, flow: gfl }); } }
  else if (me._trail) me._trail.length = 0;
  drawFrame(g, me.id, p.frame, x + me.face * (p.push || 0), y, me.face, { rot: p.rot, pivot: p.pivot, drop: p.drop, alpha: p.alpha, scale: p.scale, squash: p.squash, extra: p.extra, motion: p.motion, flow: p.flow, flash: me.flash });
  // a hijacked Ranger (story mode): a sickly green glow pulsing over the suit
  if (me.infected) { const t = me.game ? me.game.time : 0; g.save(); g.globalCompositeOperation = "lighter"; drawFrame(g, me.id, p.frame, x + me.face * (p.push || 0), y, me.face, { rot: p.rot, pivot: p.pivot, drop: p.drop, alpha: 0.2 + 0.1 * Math.sin(t * 5), scale: p.scale, squash: p.squash, extra: p.extra, motion: p.motion, flow: p.flow, silhouette: "#59ff2e" }); g.restore();
    if (me.game && Math.random() < 0.12) me.game.parts.spark(V3(x + (Math.random() - 0.5) * 0.7, y + 0.3 + Math.random() * 1.5, 0.2), "#7dff4a", 0.06, V3((Math.random() - 0.5) * 0.6, 1 + Math.random(), 0), 0.5); }
  // energy held at the fist (or overhead) while a special charges
  if (p.orb && p.orb[3] > 0.02 && p.orb[2] > 0.01) { const [ox, oy, orr, oa] = p.orb, cx = VIEW.sx(x + me.face * (ox + (p.push || 0))), cy = VIEW.sy(y + oy) + (p.drop || 0) * VIEW.S, r = orr * VIEW.S, t = me.game ? me.game.time : 0;
    g.save(); g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4); gr.addColorStop(0, rgba("#ffffff", 0.95 * oa)); gr.addColorStop(0.25, rgba(col, 0.8 * oa)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * 2.4, 0, TAU); g.fill();
    g.strokeStyle = rgba(col, 0.7 * oa); g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const a0 = t * 8 + i * TAU / 3; g.beginPath(); g.arc(cx, cy, r * 1.5, a0, a0 + 1.2); g.stroke(); } g.restore(); }
  // a targeting reticle at the fingertip
  if (p.reticle > 0) { const cx = VIEW.sx(x + me.face * 1.05), cy = VIEW.sy(y + 1.38), r = (0.22 + 0.25 * (1 - p.reticle)) * VIEW.S, t = me.game ? me.game.time : 0; g.save(); g.strokeStyle = rgba(col, 0.9 * p.reticle); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.translate(cx, cy); g.rotate(t * 3); for (let i = 0; i < 4; i++) { g.rotate(TAU / 4); g.beginPath(); g.moveTo(r * 0.55, 0); g.lineTo(r * 1.35, 0); g.stroke(); } g.restore(); }
  if (p.shield) { const cx = VIEW.sx(x + me.face * 0.42), cy = VIEW.sy(y + (p.low ? 0.55 : 1.05)), r = (p.low ? 0.55 : 0.85) * VIEW.S; g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = rgba("#8ad8ff", p.shield > 1 ? 0.95 : 0.6); g.lineWidth = p.shield > 1 ? 5 : 3; g.beginPath(); g.arc(cx - me.face * r * 0.55, cy, r, -0.9, 0.9, false); if (me.face < 0) { g.beginPath(); g.arc(cx + r * 0.55, cy, r, Math.PI - 0.9, Math.PI + 0.9, false); } g.stroke(); g.restore(); }
  if (me.buff && me.buff.shield > 0) { const cx = VIEW.sx(x), cy = VIEW.sy(y + 1.0), r = 1.05 * VIEW.S, sc = me.id === "mitosis" ? "#ff5fd0" : "#a98cff"; g.save(); g.globalAlpha = 0.22 + 0.06 * Math.sin(me.game.time * 5); g.fillStyle = sc; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.globalAlpha = 0.7; g.strokeStyle = sc; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, r * 0.93, 0, TAU); g.stroke(); g.restore(); }
  if (p.stars || me.state === "stun") { const cx = VIEW.sx(x), cy = VIEW.sy(y + 2.05), t = me.game ? me.game.time : 0; g.save(); g.fillStyle = "#ffe66b"; for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3, sx = cx + Math.cos(a) * 26, sy = cy + Math.sin(a) * 7; g.beginPath(); for (let k = 0; k < 10; k++) { const aa = k * TAU / 10, rr = k % 2 ? 2.5 : 6; g.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } g.fill(); } g.restore(); }
}
/* a moving copy of the fighter (Replication Clone, Telophase) */
function drawGhost(g, me, x, y, frame, alpha = 0.85) { drawFrame(g, me.id, frame, x, y, me.face, { alpha }); }
