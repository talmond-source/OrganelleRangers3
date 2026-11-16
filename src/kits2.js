/* ================= Specials for the rest of the roster =================
   Built from a few move templates (shot / strike / self) so every ranger shares the same rules. */
const CLIPK = { magic1: [8, 28, 50], magic2: [14, 32, 60], throw: [8, 21, 45], cross: [4, 16, 36], hook: [0, 10, 30], punch1: [4, 12, 28], upper: [0, 9, 34], kick: [5, 19, 44], fireball: [12, 29, 51], jab: [4, 12, 26], kick2: [8, 19, 35], sweep: [4, 22, 50] };
const clipAnim = (clip, S, A, R) => (me, f) => { const k = CLIPK[clip]; return k ? AN(clip, strikeF(f, S, A, R, k[0], k[1], k[2]), { fade: 0.07 }) : AN(clip, f * 0.9, { fade: 0.1 }); };
const stunHit = (n, label) => (att, def) => { if (def.stunImmune <= 0) { def.set("stun"); def.stun = n; def.stunImmune = n + 110; def.vx = 0; if (label) HUD.toast(def.slot, label); } };
/* projectile special */
function mkShot(name, o) {
  const S = o.at || 12, end = o.end || S + 20;
  return Object.assign({ special: true, name, update(me, f) {
    const P = me.game.parts, col = o.col || me.info.hex;
    if (f === 1) { callout(me, name); me.game.sfx("charge"); if (o.pre) o.pre(me); }
    if (f < S && f % 2 === 0) P.gather(handWorld(me, "R"), col, 0.7);
    if (f === S) { const h = V3(me.x + me.face * 0.7, o.y || 1.35, 0.25); P.ring(h, col, 0.25, 12); P.fan(h, col, me.face, 8, 11, 0.7);
      if (o.cool) me.cool[o.cool[0]] = o.cool[1]; me.game.sfx("shoot");
      for (let i = 0; i < (o.n || 1); i++) me.game.spawn(Object.assign({ owner: me.slot, x: me.x + me.face * (0.7 - i * 0.35), y: (o.y || 1.35) + (o.spread || 0) * (i - ((o.n || 1) - 1) / 2), vx: me.face * (o.speed || 10), mesh: o.make(me, i), spin: o.spin ?? 6,
        tick: (p) => { if (p.t % 2 === 0) P.spark(V3(p.x - Math.sign(p.vx) * 0.15, p.y + (Math.random() - 0.5) * 0.12, 0.25), col, 0.16, V3(-Math.sign(p.vx) * 2, 0, 0), 0.25); },
        mv: Object.assign({ dmg: 9, level: "mid", hs: 18, bs: 12, push: 2.4, special: true, sfx: "hit" }, typeof o.mv === "function" ? o.mv(me) : o.mv) }, o.proj ? o.proj(me, i) : {})); }
    return f >= end; },
    anim: clipAnim(o.clip || "magic1", S, 3, end - S - 3) }, o.extra || {});
}
/* melee / grab special. lunge = forward speed during the active frames */
function mkStrike(name, o) {
  const S = o.at || 10, A = o.act || 8, end = o.end || S + A + 18;
  return Object.assign({ special: true, name, dmg: 10, level: "mid", hs: 20, bs: 13, push: 2.6, reach: [0.1, 1.2], ys: [0.6, 1.9], sfx: "heavy", update(me, f) {
    const P = me.game.parts, col = o.trail || me.info.hex;
    if (f === 1) { callout(me, name); me.game.sfx("whoosh"); if (o.pre) o.pre(me); }
    if (f < S && f % 3 === 0) P.gather(V3(me.x, 1.2, 0), col, 0.9);
    if (f === S) { const far = this.reach ? Math.min(this.reach[1], 2.6) : 1; P.fan(V3(me.x + me.face * 0.5, 1.25, 0.25), col, me.face, 9, 6 + far * 5, 0.8); if (far > 1.6) P.ring(V3(me.x + me.face * far * 0.7, 1.2, 0.25), col, 0.3, 9); }
    if (f >= S && f < S + A) { if (f % 2 === 0) P.spark(V3(me.x + me.face * (0.3 + Math.random() * 0.6), 0.9 + Math.random() * 0.8, 0.25), col, 0.22, V3(-me.face * 2.5, 0.5, 0), 0.22);
      if (o.lunge) me.vx = me.face * o.lunge; if (!me.hitDone) me.game.tryHit(me, this); if (me.hitDone && o.lunge && !o.through) me.vx *= 0.3; if (o.lunge && f % 2 === 1) P.spark(V3(me.x - me.face * 0.3, 0.5 + Math.random() * 1.2, 0.2), col, 0.35, V3(-me.face * 4, 0, 0), 0.3); }
    else if (o.lunge) me.vx = 0;
    if (o.each) o.each(me, f);
    return f >= end; },
    anim: clipAnim(o.clip || "cross", S, A, end - S - A) }, o.mv || {});
}
/* self-targeted special (buff, teleport, heal, trap) */
function mkSelf(name, o) {
  const S = o.at || 10, end = o.end || 28;
  return Object.assign({ special: true, name, update(me, f) { const P = me.game.parts, col = o.col || me.info.hex; if (f === 1) { callout(me, name); me.game.sfx("charge"); } if (f < S) { P.gather(V3(me.x, 1.1, 0), col, 1.3); if (f % 2) P.gather(V3(me.x, 1.1, 0), "#ffffff", 1.0); } if (f === S) { P.ring(V3(me.x, 1.1, 0.2), col, 0.4, 13, 0.3); P.ring(V3(me.x, 0.1, 0.2), "#ffffff", 0.3, 9, 0.25); o.fn(me, me.opp, me.game); } return f >= end; }, anim: (me, f) => AN(o.clip || "cast", Math.min(40, f * 1.4), { fade: 0.08 }) }, o.extra || {});
}
function megaMove(clip = "punch1", range = 1.25) {
  return { special: true, ult: true, name: "Megaform", dmg: 2, level: "mid", hs: 20, bs: 16, push: 1, reach: [0, range], ys: [0.6, 1.9], sfx: "heavy",
    onStart(me) { me.meter = 0; me.game.sfx("ultStart"); FX2D.banner("MEGAFORM!", me.info.hex, me.info.name, me.face); },
    onHit(att, def) { att.game.startCine(att, def); },
    update(me, f) { if (f >= 8 && f < 26) { me.vx = me.face * 13; if (!me.hitDone) me.game.tryHit(me, this); if (f % 2 === 0) me.game.parts.spark(V3(me.x, 1.3, 0.2), me.info.hex, 0.4, V3(-me.face * 3, 0, 0), 0.3); } else me.vx = 0; return f >= 46; },
    anim: clipAnim(clip, 8, 20, 18) };
}
const kit = (o) => Object.assign({ ultRange: 3.4, ult: megaMove(), special(dir, me) { const m = this.moves[dir] || this.moves[""]; if (m.cd && me.cool[m.cd] > 0) { HUD.toast(me.slot, m.cdText || "Recharging…"); return null; } return m; } }, o);
const teleport = (me, x, col) => { const g = me.game; g.parts.boom(V3(me.x, 0.9, 0), col, 0.5); me.x = clamp(x, -HALF + 0.3, HALF - 0.3); me.face = me.opp.x >= me.x ? 1 : -1; g.parts.boom(V3(me.x, 0.9, 0), col, 0.5); g.sfx("whoosh"); me.inv = 10; };
const behind = (me) => me.opp.x + (me.opp.x >= me.x ? 1 : -1) * 1.0;
const total = (f) => f.hp + (f.bars - 1) * BAR_HP;
/* copies of the fighter (Replication Clone, Telophase) are drawn from the same sprite sheet */
function ghostModel(me, frameFn) { const d = new Drawable(null); d.draw = (g, x, y) => drawFrame(g, me.id, frameFn(), x, y - 1.1, me.face, { alpha: 0.88 }); return d; }
function cloneRush(me, col, x0) {
  const g = me.game, sx = x0 ?? me.x + me.face * 0.4; g.parts.boom(V3(sx, 0.9, 0), col, 0.5); g.parts.fan(V3(sx, 1.1, 0.2), col, me.face, 10, 12, 0.6);
  let t = 0; const mesh = ghostModel(me, () => (t < 6 ? 5 : 6));
  g.spawn({ owner: me.slot, x: sx, y: 1.1, vx: me.face * 7.5, mesh, spin: 0, life: 70, mv: { dmg: 11, level: "mid", hs: 22, bs: 14, push: 3, special: true, sfx: "heavy", knock: [4, 6] },
    tick: (p) => { t = p.t; if (p.t % 2 === 0) g.parts.spark(V3(p.x - me.face * 0.3, 0.6 + Math.random() * 1.1, 0.2), col, 0.3, V3(-me.face * 4, 0, 0), 0.3); }, onDie: (p) => g.parts.boom(V3(p.x, 0.9, 0), col, 0.5) });
}
/* a visible split: the copy slides out of the original while a ring pinches the two apart (cytokinesis / strand separation) */
function splitMove(name, col, col2, cdKey, cdLen) {
  const N = 24;
  return { special: true, name, cd: cdKey, update(me, f) { const g = me.game, P = g.parts;
      if (f === 1) { callout(me, name); g.sfx("charge"); if (cdKey) me.cool[cdKey] = cdLen; }
      if (f <= N) { const u = smooth(f / N); me._split = { off: me.face * 0.95 * u, ring: Math.max(0.05, 1 - u), col2 };
        if (f % 3 === 0) { P.bolt(V3(me.x, 0.5 + Math.random() * 1.2, 0.2), V3(me.x + me._split.off, 0.5 + Math.random() * 1.2, 0.2), col2); P.gather(V3(me.x + me._split.off / 2, 1.05, 0.2), col, 0.9); } }
      if (f === N) { me._split = null; P.ring(V3(me.x + me.face * 0.5, 1.05, 0.2), col2, 0.3, 14); g.sfx("break"); g.view.shake = Math.max(g.view.shake, 0.12); cloneRush(me, col, me.x + me.face * 0.95); }
      return f >= N + 14; },
    anim: (me, f) => AN("cast", Math.min(40, f * 1.4), { fade: 0.08 }) };
}
function drawSplit(me, g) { const s = me._split; if (!s || me.state !== "attack") { me._split = null; return; }
  drawFrame(g, me.id, 13, me.x + s.off, me.y, me.face, { alpha: 0.85 });
  const cx = VIEW.sx(me.x + s.off / 2), cy = VIEW.sy(me.y + 1.05); g.save(); g.strokeStyle = s.col2; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, 0.12 * VIEW.S * s.ring + 2, 0.75 * VIEW.S * s.ring, 0, 0, TAU); g.stroke(); g.restore(); }

/* ---------------- ORANGE · ROUGH ER ---------------- */
KITS.rougher = kit({ moves: {
  "": mkShot("Ribosome Shot", { clip: "magic1", n: 3, spread: 0.28, speed: 12, make: () => orb("#c9a3ff", 0.1, 0.4), mv: { dmg: 4, hs: 14, push: 1.2, small: true } }),
  fwd: mkStrike("Protein Processor", { clip: "hook", at: 11, act: 7, lunge: 5, mv: { dmg: 8, level: "unblockable", reach: [0.1, 1.0], sfx: "whip", onHit(att, def) { def.set("stun"); def.stun = 75; def.stunImmune = 190; def.vx = 0; def.buff.knot = 75; HUD.pop(def, "FOLDED!", att.info.hex); } } }),
  down: mkStrike("Signal Hook", { clip: "throw", at: 13, act: 8, mv: { dmg: 7, reach: [0.3, 4.2], ys: [0.8, 1.7], hs: 26, sfx: "whip", onHit(att, def) { def.x = att.x + att.face * 1.0; def.vx = 0; att.game.parts.spark(V3(def.x, 1.2, 0.2), att.info.hex, 0.6); } } }),
} });
/* ---------------- YELLOW · GOLGI ---------------- */
KITS.golgi = kit({ moves: {
  "": mkShot("Tag & Ship", { clip: "throw", at: 13, make: () => vesicle("#16b8c3", 0.2), mv: (me) => ({ dmg: me.opp.buff.tag > 0 ? 17 : 8, big: me.opp.buff.tag > 0 ? 1.8 : 1, onHit(att, def) { if (def.buff.tag > 0) { def.buff.tag = 0; HUD.pop(def, "DELIVERED!", "#ffffff"); } else { def.buff.tag = 480; HUD.pop(def, "SUGAR TAGGED", att.info.hex); } } }) }),
  fwd: mkSelf("Vesicle Transport", { at: 9, end: 22, fn: (me) => teleport(me, behind(me), "#16b8c3") }),
  down: mkStrike("Cis-to-Trans Dash", { clip: "cross", at: 8, act: 12, lunge: 15, through: true, trail: "#e4b51d", mv: { dmg: 10, reach: [0, 0.9], knock: [2, 6] } }),
} });
/* ---------------- BLUE · CYTOPLASM ---------------- */
KITS.cytoplasm = kit({ moves: {
  "": mkSelf("Cytoplasmic Streaming", { at: 10, end: 30, fn: (me, opp, g) => { const d = me.face; g.zone({ x: (me.x + opp.x) / 2, w: 5, life: 110, color: "#2f7fe0", op: 0.35, tick: (gm, z) => { if (opp.grounded && Math.abs(opp.x - z.x) < 5) { opp.x = clamp(opp.x + d * 0.055, -HALF, HALF); if (z.life % 8 === 0) gm.parts.spark(V3(opp.x, 0.1, 0.3), "#7fc0ff", 0.25, V3(d * 3, 0.5, 0), 0.3); } } }); } }),
  fwd: mkStrike("Microtubule Staff", { clip: "hook", at: 12, act: 8, mv: { dmg: 11, reach: [0.4, 2.6], ys: [0.7, 1.7], sfx: "heavy", knock: [5, 5] } }),
  down: mkStrike("CytoCurrents", { clip: "magic2", at: 12, act: 8, mv: { dmg: 12, level: "unblockable", reach: [0.3, 3.6], ys: [0, 0.9], sfx: "whoosh", onHit(att, def) { const g = att.game; g.zone({ x: def.x, w: 0.9, life: 40, color: "#1c5fd0" }); def.set("air"); def.y = 4.2; def.vy = -2; def.vx = 0; g.parts.boom(V3(def.x, 4.2, 0), "#2f7fe0", 0.7); HUD.pop(def, "WHIRLPOOL!", att.info.hex); } } }),
},
  draw(me, g) { // the hollow microtubule staff, shown only while swinging
    if (!(me.state === "attack" && me.move === KITS.cytoplasm.moves.fwd)) return; const h = handWorld(me), a = me.st < 12 ? -0.9 : me.st < 20 ? -0.9 + (me.st - 12) / 8 * 1.1 : 0.2;
    const x0 = VIEW.sx(h.x - me.face * 0.3 * Math.cos(a)), y0 = VIEW.sy(h.y - 0.3 * Math.sin(a)), x1 = VIEW.sx(h.x + me.face * 2.2 * Math.cos(a)), y1 = VIEW.sy(h.y + 2.2 * Math.sin(a));
    g.save(); g.lineCap = "round"; g.strokeStyle = "#2f5f80"; g.lineWidth = 9; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = "#8fd0f4"; g.lineWidth = 5; g.stroke(); g.setLineDash([4, 4]); g.strokeStyle = "#e6f7ff"; g.lineWidth = 1.5; g.stroke(); g.restore(); } });
/* ---------------- PINK · CELL MEMBRANE ---------------- */
KITS.membrane = kit({ moves: {
  "": mkSelf("Selective Guard", { at: 4, end: 26, clip: "block", fn: (me) => { me.buff.parry = 50; me.parryName = "SELECTIVELY BLOCKED"; }, extra: { noCopy: false } }),
  fwd: mkStrike("Endocytosis", { clip: "hook", at: 10, act: 7, lunge: 6, mv: { dmg: 14, level: "unblockable", reach: [0.1, 1.0], knock: [3, 7], sfx: "heavy", onHit(att, def) { HUD.pop(def, "ENGULFED", att.info.hex); att.game.parts.boom(V3(def.x, 1, 0), att.info.hex, 0.8); } } }),
  down: Object.assign(mkShot("Na⁺/K⁺ Pump", { clip: "magic2", at: 11, n: 3, spread: 0, speed: 11, cool: ["pump", 180], make: () => orb("#ffd84a", 0.11, 0.7), mv: { dmg: 4, hs: 14, push: 1.4 } }), { cd: "pump", cdText: "Pump resetting: taking in 2 K⁺…" }),
},
  tick(me) { if (me.cool.pump === 120 || me.cool.pump === 60) { me.game.parts.spark(V3(me.x, 1.3, 0.2), "#b06cff", 0.5); HUD.pop(me, "+K⁺", "#b06cff"); } } });
/* ---------------- WHITE · MITOCHONDRIA ---------------- */
KITS.mito = kit({ moves: {
  "": mkStrike("Krebs Cycle", { clip: "sweep", at: 9, act: 16, lunge: 3.5, trail: "#e47a24", mv: { dmg: 9, reach: [0, 1.25], onHit(att) { att.meter = Math.min(100, att.meter + 14); HUD.toast(att.slot, "+ENERGY"); } } }),
  fwd: mkShot("Electron Transport Chain", { clip: "magic2", at: 22, end: 44, speed: 13, make: () => orb("#7fe8ff", 0.2, 1), mv: { dmg: 12, hs: 22 }, pre: (me) => { me._etc = 20; } }),
  down: mkStrike("ATP Synthase Drill", { clip: "cross", at: 10, act: 14, lunge: 10, trail: "#ffd36b", mv: { dmg: 13, reach: [0.1, 1.15], knock: [6, 5], big: 1.6 } }),
},
  tick(me) { if (me._etc > 0) { me._etc--; const o = me.opp; me.game.parts.bolt(V3(o.x, 1.2, 0.2), handWorld(me, "R")); } } });
/* ---------------- PURPLE · NUCLEUS ---------------- */
KITS.nucleus = kit({ moves: {
  "": mkShot("Nucleolus Orb", { clip: "throw", at: 13, speed: 8.5, make: () => orb("#3a1670", 0.24, 0.5), mv: { dmg: 12, hs: 22, push: 3 } }),
  fwd: mkSelf("Nuclear Pore Warp", { at: 9, end: 22, fn: (me) => teleport(me, behind(me), "#8a5cff") }),
  down: mkSelf("Envelope Barrier", { at: 8, end: 24, clip: "block", fn: (me) => { me.buff.shield = 300; HUD.toast(me.slot, "DOUBLE MEMBRANE UP"); } }),
} });
/* ---------------- TEAL · SMOOTH ER ---------------- */
KITS.smoother = kit({ moves: {
  "": mkSelf("Detox", { at: 4, end: 26, clip: "block", fn: (me) => { me.buff.parry = 55; me.parryName = "DETOXIFIED"; me.buff.tag = 0; me.buff.knot = 0; if (me.state === "stun") me.set("idle"); me.game.parts.boom(V3(me.x, 1, 0), "#44e0b0", 0.5); } }),
  fwd: mkStrike("Calcium Burst", { clip: "magic2", at: 10, act: 9, mv: { dmg: 7, reach: [0.2, 2.0], sfx: "zap", onHit: stunHit(65, "MUSCLES LOCKED"), }, each: (me, f) => { if (f >= 10 && f < 19) me.game.parts.spark(V3(me.x + me.face * (0.6 + Math.random() * 1.3), 0.7 + Math.random(), 0.2), "#ffffff", 0.3); } }),
  down: mkSelf("Lipid Slick", { at: 10, end: 28, fn: (me, opp, g) => { g.zone({ x: clamp(me.x + me.face * 2.4, -HALF, HALF), w: 1.3, life: 420, color: "#e8d27a", op: 0.55, tick: (gm, z) => { if (!z.used && opp.grounded && Math.abs(opp.x - z.x) < 1.1 && Math.abs(opp.vx) > 0.5 && !["down", "trip", "getup"].includes(opp.state)) { z.used = 1; z.life = Math.min(z.life, 30); gm.resolve(me, opp, { dmg: 6, level: "unblockable", trip: true, sfx: "whoosh", special: true }, V3(opp.x, 0.2, 0.3)); HUD.pop(opp, "SLIPPED", "#e8d27a"); } } }); } }),
} });
/* ---------------- MAROON · LYSOSOME ---------------- */
KITS.lysosome = kit({ moves: {
  "": mkShot("Enzyme Grenade", { clip: "throw", at: 13, speed: 6.5, y: 1.6, make: () => vesicle("#9bd13a", 0.19), mv: { dmg: 9, level: "unblockable", hs: 22, onHit(att, def) { HUD.pop(def, "GUARD BROKEN", att.info.hex); } }, proj: (me) => { const T = 0.82, d = Math.abs(me.opp.x - me.x) - 0.7; return { vx: me.face * clamp(d / T, 2.5, 10), vy: 4, grav: 14, onGround: (p) => { const g = me.game, o = me.opp; g.parts.boom(V3(p.x, 0.1, 0), "#9bd13a", 0.8); g.parts.ring(V3(p.x, 0.15, 0.2), "#9bd13a", 0.4, 12); g.sfx("boom"); if (o.grounded && Math.abs(o.x - p.x) < 1.2 && o.hurt()) g.resolve(me, o, p.mv, V3(o.x, 0.6, 0.3), p); } }; } }),
  fwd: mkSelf("Autophagy", { at: 12, end: 30, fn: (me, opp, g) => { if (me.meter < 20) { HUD.toast(me.slot, "Needs meter"); return; } me.meter -= 20; me.hp = Math.min(BAR_HP, me.hp + 14); g.parts.boom(V3(me.x, 1, 0), "#9bd13a", 0.6); HUD.pop(me, "+14 RECYCLED", "#9bd13a"); g.sfx("ding"); } }),
  down: mkSelf("Acid Pool", { at: 10, end: 28, fn: (me, opp, g) => { g.zone({ x: clamp(me.x + me.face * 2.2, -HALF, HALF), w: 1.5, life: 360, color: "#9bd13a", op: 0.55, tick: (gm, z) => { if (z.life % 30 === 0 && opp.grounded && Math.abs(opp.x - z.x) < 1.4) { gm.damage(opp, 2, me, true); gm.parts.spark(V3(opp.x, 0.3, 0.3), "#c8f060", 0.4); opp.flash = 0.04; HUD.pop(opp, "pH 4.5", "#9bd13a"); } } }); } }),
} });
/* ---------------- GOLD · DNA ---------------- */
const PAIRS = ["A–T", "G–C", "T–A", "C–G"];
KITS.dna = kit({ moves: {
  "": splitMove("Replication Clone", "#c59a39", "#5a8fe0", "clone", 300),
  fwd: { special: true, name: "Base Pair Lock", update(me, f) { const g = me.game, def = me.opp;
      if (f === 1) { callout(me, "Base Pair Lock"); me._lock = Math.abs(def.x - me.x) < 7 && !["down", "ko", "getup"].includes(def.state) && def.inv <= 0; }
      if (f === 8 && me._lock) { teleport(me, def.x - me.face * 0.95, "#3969b2"); def.set("stun"); def.stun = 60; def.vx = 0; def.y = 0; }
      if (me._lock && [16, 26, 36, 46].includes(f)) { const i = (f - 16) / 10; g.resolve(me, def, { dmg: i === 3 ? 6 : 3, level: "unblockable", hs: 30, push: 0, sfx: "jab", special: true, knock: i === 3 ? [4, 7] : null }, V3(def.x, 1.0 + i * 0.2, 0.3)); HUD.pop(def, PAIRS[i], i % 2 ? "#3969b2" : "#c59a39"); if (i < 3) { def.set("stun"); def.stun = 30; } }
      return f >= (me._lock ? 56 : 30); },
    anim: (me, f) => me._lock && f > 8 ? AN("punchCombo", 5 + f * 0.9, { fade: 0.06 }) : AN("cast", f * 1.2, { fade: 0.08 }) },
  down: mkStrike("Helix Drill", { clip: "upper", at: 8, act: 10, lunge: 4, trail: "#3969b2", mv: { dmg: 12, reach: [0, 1.15], ys: [0.4, 2.6], launch: [2.5, 11.5], big: 1.5 } }),
} });
/* ---------------- SHADOW · RNA ---------------- */
KITS.rna = kit({ special(dir, me) {
    if (dir === "") { const c = me.opp.lastSpecial; if (!c) { HUD.toast(me.slot, "Nothing to transcribe yet"); return null; } HUD.toast(me.slot, "TRANSCRIPT: " + c.name); return c; }
    return this.moves[dir] || this.moves.fwd; },
  moves: {
  fwd: mkSelf("mRNA Malice", { at: 10, end: 26, fn: (me) => { me.buff.sword = 420; HUD.toast(me.slot, "mRNA SWORD: 7 s"); } }),
  down: mkSelf("Uracil Swap", { at: 9, end: 24, fn: (me, opp, g) => { if (!opp.grounded) return; const a = me.x, b = opp.x; g.parts.boom(V3(a, 1, 0), "#7139c8", 0.5); g.parts.boom(V3(b, 1, 0), "#7139c8", 0.5); me.x = b; opp.x = a; me.face = opp.x >= me.x ? 1 : -1; opp.face = -me.face; HUD.pop(opp, "U ⇄ T", "#b48cff"); g.sfx("whoosh"); } }),
},
  draw(me, g) { if (!(me.buff.sword > 0) || ["ko", "down", "air", "trip"].includes(me.state)) return; // the mRNA sword: a strand of colored bases
    const h = handWorld(me), a = me.state === "attack" ? 0.2 : 0.9; for (let i = 0; i < 9; i++) { const t = (i + 1) * 0.11, x = VIEW.sx(h.x + me.face * t * Math.cos(a)), y = VIEW.sy(h.y + t * Math.sin(a)); g.fillStyle = ["#ff5a5a", "#ffd84a", "#5ad1ff", "#7dff7a"][i % 4]; g.shadowColor = "#b48cff"; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 0.05 * VIEW.S, 0, TAU); g.fill(); } g.shadowBlur = 0; } });
/* ---------------- CHROME · MITOSIS ---------------- */
KITS.mitosis = kit({ moves: {
  "": mkSelf("Prophase", { at: 8, end: 24, clip: "block", fn: (me) => { me.buff.shield = 360; HUD.toast(me.slot, "CHROMOSOMES CONDENSED: ARMOR UP"); me.game.parts.boom(V3(me.x, 1, 0), "#d21a9a", 0.5); } }),
  fwd: mkStrike("Metaphase", { clip: "magic2", at: 11, act: 8, mv: { dmg: 7, reach: [0.2, 3.2], sfx: "zap", onHit(att, def) { def.x = clamp((att.game.camX || 0), -HALF + 1, HALF - 1); if (Math.abs(def.x - att.x) < 1) def.x = att.x + att.face * 1.2; stunHit(55, "PINNED AT THE EQUATOR")(att, def); att.game.parts.boom(V3(def.x, 1, 0), "#16c94a", 0.6); } } }),
  down: mkStrike("Anaphase", { clip: "magic2", at: 10, act: 8, mv: { dmg: 9, reach: [0, 2.2], onHit(att, def) { const s = att.face; att.x = clamp(att.x - s * 3.2, -HALF, HALF); def.vx = s * 16; def.vy = 5; HUD.pop(def, "PULLED APART", att.info.hex); }, knock: [14, 5] } }),
  back: splitMove("Telophase / Cytokinesis", "#d21a9a", "#16c94a"),
},
  draw: drawSplit });
/* ---------------- NANOTECH · CRISPR ---------------- */
KITS.crispr = kit({ moves: {
  "": mkSelf("Guide RNA Lock-On", { at: 8, end: 22, fn: (me, opp) => { me.buff.lock = 480; HUD.pop(opp, "TARGET LOCKED", "#e544b8"); } }),
  fwd: { special: true, name: "Cas9 Cut", dmg: 12, level: "mid", hs: 22, bs: 14, push: 3, reach: [0.2, 1.4], ys: [0.6, 1.9], sfx: "heavy", big: 1.5,
    update(me, f) { const g = me.game, def = me.opp;
      if (f === 1) { callout(me, "Cas9 Cut"); if (me.buff.lock > 0) { me.buff.lock = 0; me._cut = 1; teleport(me, def.x - (def.x >= me.x ? 1 : -1) * 1.0, "#13c9c6"); } else me._cut = 0; }
      if (f === 11) { if (me._cut && def.inv <= 0 && !["down", "ko"].includes(def.state)) { g.resolve(me, def, { dmg: 15, level: "unblockable", knock: [5, 7], big: 1.8, sfx: "heavy", special: true }, V3(def.x, 1.2, 0.3)); HUD.pop(def, "DOUBLE-STRAND BREAK", "#13c9c6"); } else g.tryHit(me, this); }
      return f >= 34; }, anim: clipAnim("hook", 11, 6, 17) },
  down: { special: true, name: "PAM Check", noCopy: true, update(me, f) { const g = me.game, def = me.opp;
      if (f === 1) { callout(me, "PAM Check"); g.sfx("charge"); }
      if (f === 24) { const pam = Math.random() < 0.5, who = pam ? def : me, n = Math.floor(total(who) / 2); g.damage(who, n, pam ? me : def, true); who.flash = 0.12; g.view.shake = 0.4; g.parts.hit(V3(who.x, 1.2, 0.3), pam ? "#13c9c6" : "#ff4a4a", 2); g.sfx("heavy"); HUD.pop(who, pam ? "PAM FOUND: NGG ✓" : "NO PAM: BACKFIRE", pam ? "#13c9c6" : "#ff4a4a"); }
      return f >= 46; }, anim: (me, f) => AN("cast", f * 1.1, { fade: 0.08 }) },
  back: mkSelf("Repair Choice", { at: 14, end: 34, fn: (me, opp, g) => { const fast = Math.abs(opp.x - me.x) < 3.2; const n = fast ? 6 : 14; me.hp = Math.min(BAR_HP, me.hp + n); HUD.pop(me, fast ? "NHEJ: +6 (quick, sloppy)" : "HDR: +14 (precise)", "#13c9c6"); g.parts.boom(V3(me.x, 1, 0), "#13c9c6", 0.5); g.sfx("ding"); }, extra: { cd: "repair" } }),
},
  tick(me) { const r = KITS.crispr.moves.back; if (me.state === "attack" && me.move === r && me.st === 14) me.cool.repair = 480; } });
KITS.dna.draw = drawSplit;

/* ---------------- RUST · PHAGE (final boss, not selectable) ---------------- */
KITS.phage = kit({ ultRange: 4, moves: {
  "": mkShot("DNA Injection", { clip: "magic1", at: 11, speed: 13, make: (me) => { const d = orb("#b5d737", 0.14, 0.9); d.add(Object.assign(new Drawable((g) => { g.fillStyle = "#aebbc0"; g.beginPath(); g.moveTo(0.05, -0.05); g.lineTo(0.5, 0); g.lineTo(0.05, 0.05); g.closePath(); g.fill(); }), {})); d.scale.x = me.face; return d; }, spin: 0, mv: { dmg: 10, hs: 20 } }),
  fwd: mkStrike("Tail Fiber Grab", { clip: "throw", at: 12, act: 8, mv: { dmg: 12, level: "unblockable", reach: [0.3, 3.2], ys: [0.5, 1.8], knock: [4, 7], sfx: "whip", onHit(att, def) { def.x = att.x + att.face * 1.1; HUD.pop(def, "RECEPTOR MATCH", att.info.hex); } } }),
  down: mkStrike("Lytic Burst", { clip: "magic2", at: 12, act: 8, mv: { dmg: 12, reach: [-2.4, 2.4], ys: [0, 2.2], launch: [3, 10], big: 1.8, sfx: "boom" }, each: (me, f) => { if (f === 12) { me.game.parts.boom(V3(me.x, 1, 0), "#b5d737", 1.1); me.game.view.shake = 0.3; } } }),
} });
