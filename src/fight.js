/* ================= Fight engine: fighters, moves, hits, meter, health bars, CPU ================= */
const FPS = 60, DT = 1 / FPS, GRAV = 34, HALF = 9.0, MAXSEP = 7.6;
const BAR_HP = 100;

/* ---------- input ---------- */
const KEYMAP = {
  p1: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", punch: "KeyF", kick: "KeyG", special: "KeyH", block: "KeyR", ult: "KeyT" },
  p2: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", punch: "KeyK", kick: "KeyL", special: "Semicolon", block: "KeyO", ult: "KeyP" },
};
const KEYS = new Set();
addEventListener("keydown", (e) => { if (e.target && e.target.closest && e.target.closest("input,textarea")) return; KEYS.add(e.code); if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault(); });
addEventListener("keyup", (e) => KEYS.delete(e.code));
addEventListener("blur", () => KEYS.clear());
/* ---------- touch pad (phones and tablets) ---------- */
const TOUCH = (() => { const q = new URLSearchParams(location.search); return q.has("touch") || (!q.has("nopad") && (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) && /Android|iPhone|iPad|iPod|Mobi|Silk/.test(navigator.userAgent + (navigator.maxTouchPoints > 1 ? " iPad" : ""))); })();
function padPress(code, down) { if (down) { if (KEYS.has(code)) return; KEYS.add(code); if (typeof APP !== "undefined") { const menu = APP.mode !== "fight"; APP.key({ code: menu && code === "KeyX" ? "Escape" : code, repeat: false, preventDefault() {} }); } } else KEYS.delete(code); }
function initPad() {
  if (!TOUCH) return; document.body.classList.add("touch"); const pad = document.getElementById("pad"); pad.hidden = false;
  const dp = document.getElementById("dpad"), DIRS = { u: "ArrowUp", d: "ArrowDown", l: "ArrowLeft", r: "ArrowRight" };
  const setDir = (on) => { for (const k in DIRS) { padPress(DIRS[k], !!on[k]); dp.querySelector("." + k).classList.toggle("on", !!on[k]); } };
  const aim = (e) => { const r = dp.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; if (Math.hypot(x, y) < 0.11) return setDir({}); const a = Math.atan2(y, x), s = Math.round(a / (Math.PI / 4)); setDir({ r: s >= -1 && s <= 1, l: s >= 3 || s <= -3, d: s >= 1 && s <= 3, u: s <= -1 && s >= -3 }); };
  dp.addEventListener("pointerdown", (e) => { try { dp.setPointerCapture(e.pointerId); } catch (_) {} aim(e); e.preventDefault(); }); dp.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") aim(e); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) dp.addEventListener(ev, () => setDir({}));
  pad.querySelectorAll("[data-k]").forEach((b) => { const codes = b.dataset.k.split(","); const up = () => { b.classList.remove("on"); codes.forEach((c) => padPress(c, false)); };
    b.addEventListener("pointerdown", (e) => { try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add("on"); codes.forEach((c) => padPress(c, true)); if (navigator.vibrate) navigator.vibrate(8); e.preventDefault(); }); for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, up); });
  document.addEventListener("contextmenu", (e) => e.preventDefault()); document.addEventListener("gesturestart", (e) => e.preventDefault());
}
class KeyCtrl {
  constructor(map) { this.map = map; this.prev = {}; this.cur = {}; }
  read() { const c = {}; for (const k in this.map) c[k] = KEYS.has(this.map[k]); this.pressed = {}; for (const k in c) this.pressed[k] = c[k] && !this.prev[k]; this.prev = c; this.cur = c; return c; }
}
/* Single-player controls, early-arcade simple: arrows to move, two attack buttons, space for the Megaform.
   Both attack buttons together = special. Hold away from the opponent to block. */
class PlayerCtrl {
  constructor() { this.prev = {}; this.pend = { punch: 0, kick: 0 }; this.cur = {}; this.pressed = {}; }
  read(game, me) {
    const K = (...c) => c.some((k) => KEYS.has(k));
    const raw = { left: K("ArrowLeft"), right: K("ArrowRight"), up: K("ArrowUp"), down: K("ArrowDown"), punch: K("KeyZ", "KeyA", "PadPunch"), kick: K("KeyX", "KeyS", "PadKick"), ult: K("Space", "PadUlt"), special: K("PadSpecial") };
    const edge = {}; for (const k in raw) edge[k] = raw[k] && !this.prev[k]; this.prev = raw;
    const c = { left: raw.left, right: raw.right, up: raw.up, down: raw.down, ult: raw.ult }, pr = { up: edge.up, ult: edge.ult };
    if (edge.punch) this.pend.punch = 4; if (edge.kick) this.pend.kick = 4;
    if (edge.special || (this.pend.punch > 0 && this.pend.kick > 0) || (edge.punch && raw.kick) || (edge.kick && raw.punch)) { pr.special = c.special = true; this.pend.punch = this.pend.kick = 0; }
    else for (const b of ["punch", "kick"]) if (this.pend[b] > 0 && --this.pend[b] === 0) pr[b] = c[b] = true;
    if (me && game && game.proj) { const away = me.face > 0 ? "left" : "right"; if (raw[away]) { const o = me.opp;
        const threat = (o.state === "attack" && o.move && Math.abs(o.x - me.x) < (o.move.special ? 7 : 2.6)) || game.proj.some((p) => p.owner !== me.slot && Math.abs(p.x - me.x) < 4 && Math.sign(p.vx) === Math.sign(me.x - p.x));
        if (threat) { c.block = true; c[away] = false; } } }
    this.cur = c; this.pressed = pr; return c;
  }
}
class NullCtrl { read() { this.cur = {}; this.pressed = {}; return this.cur; } }

/* ---------- melee move table ---------- */
// reach = [near, far] in front of the body; ys = [low, high] relative to the attacker's feet; frames at 60 fps
const MELEE = {
  jab: { basic: true, hitstop: 3, clip: ["jab", 4, 12, 26], start: 5, act: 3, rec: 10, dmg: 5, reach: [0.15, 1.08], ys: [1.15, 1.75], hs: 14, bs: 8, push: 2.2, level: "high", sfx: "jab" },
  kick: { basic: true, hitstop: 3, clip: ["kick", 5, 19, 44], start: 8, act: 4, rec: 15, dmg: 7, reach: [0.2, 1.38], ys: [0.75, 1.55], hs: 17, bs: 10, push: 3.2, level: "mid", sfx: "kick" },
  upper: { basic: true, hitstop: 4, clip: ["upper", 0, 9, 34], start: 8, act: 5, rec: 22, dmg: 11, reach: [0.1, 1.0], ys: [0.6, 2.3], hs: 30, bs: 12, push: 1.5, level: "mid", launch: [2.2, 11.5], sfx: "heavy", crouchStart: true },
  sweep: { basic: true, hitstop: 4, clip: ["sweep", 4, 22, 50], start: 9, act: 4, rec: 22, dmg: 8, reach: [0.2, 1.48], ys: [0, 0.45], hs: 30, bs: 10, push: 1, level: "low", trip: true, sfx: "kick", crouchStart: true },
  jkick: { basic: true, hitstop: 3, clip: ["jkick", 8, 17, 17], start: 4, act: 99, rec: 0, dmg: 8, reach: [0, 1.15], ys: [-0.3, 1.0], hs: 16, bs: 10, push: 2.5, level: "overhead", air: true, sfx: "kick" },
  jpunch: { basic: true, hitstop: 3, clip: ["cross", 6, 16, 16], upperOnly: true, start: 3, act: 99, rec: 0, dmg: 7, reach: [0, 1.0], ys: [0.2, 1.4], hs: 15, bs: 9, push: 2, level: "overhead", air: true, sfx: "jab" },
};

/* ---------- animation helpers ---------- */
// map move frame f onto a mocap clip: wind-up a->pk over S frames, ease through the peak for A frames, recover pk->e over R frames
function strikeF(f, S, A, R, a, pk, e) { if (f < S) return a + (pk - a) * (f / Math.max(1, S)); if (f < S + A) return pk + Math.min(1.5, (f - S) * 0.25); return Math.min(e, pk + 1.5 + (e - pk - 1.5) * Math.min(1, (f - S - A) / Math.max(1, R))); }
// Basic attacks reach the contact pose on the first active frame, then
// follow through continuously into recovery.
function meleeFrame(frame, move) {
  const [, first, contact, last] = move.clip;
  if (frame <= move.start) return lerp(first, contact, frame / move.start);
  const activeEnd = move.start + move.act;
  const follow = Math.min(last, contact + move.act * 0.3);
  if (frame <= activeEnd) return lerp(contact, follow, (frame - move.start) / move.act);
  const recovery = clamp((frame - activeEnd) / move.rec);
  return lerp(follow, last, recovery * (2 - recovery));
}
const STANCE_YAW = 0.38; // turn the chest a little toward the camera, Injustice-style

/* ---------- fighter ---------- */
class Fighter {
  constructor(game, id, slot, ctrl) {
    this.game = game; this.id = id; this.slot = slot; this.ctrl = ctrl; this.info = BYID[id];
    this.kit = KITS[id]; this.reset(slot === 0 ? -2.6 : 2.6);
    this.meter = 0; this.bars = 2; this.hp = BAR_HP; this.dispHp = BAR_HP; this.ghostHp = BAR_HP;
  }
  reset(x) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.face = this.slot === 0 ? 1 : -1; this.state = "idle"; this.st = 0; this.move = null; this.hitDone = false;
    this.stun = 0; this.inv = 0; this.cool = {}; this.buff = {}; this.combo = 0; this.walkPh = 0; this.stunImmune = 0; this.armor = 0; this.chain = 1; this.lastHitBy = null;
  }
  get opp() { return this.game.f[1 - this.slot]; }
  get grounded() { return this.y <= 0.0001; }
  canAct() { return ["idle", "walk", "crouch", "block", "cblock"].includes(this.state); }
  set(state) { this.state = state; this.st = 0; }
  hurt() { // hurtbox [x0,x1,y0,y1]
    if (this.state === "down" || this.state === "getup" || this.inv > 0 || this.state === "ko") return null;
    const crouching = ["crouch", "cblock"].includes(this.state) || (this.state === "attack" && this.move && this.move.crouchStart && this.st < this.move.start);
    const h = crouching ? 1.15 : this.state === "air" ? 1.4 : 1.85;
    return [this.x - 0.34, this.x + 0.34, this.y + (this.state === "air" ? 0.2 : 0), this.y + h];
  }
  startMove(mv) { this.move = mv; this.hitDone = false; this.set("attack"); if (mv.special && !mv.ult && !mv.noCopy) this.lastSpecial = mv; if (mv.onStart) mv.onStart(this); }
  /* ------------- per-frame ------------- */
  step() {
    const g = this.game, c = this.ctrl.cur || {}, pr = this.ctrl.pressed || {};
    const fwd = this.face > 0 ? c.right : c.left, back = this.face > 0 ? c.left : c.right;
    this.st++; if (this.inv > 0) this.inv--; if (this.stunImmune > 0) this.stunImmune--;
    for (const k in this.cool) if (this.cool[k] > 0) this.cool[k]--;
    for (const k in this.buff) if (this.buff[k] > 0) this.buff[k]--;
    if (this.kit.tick) this.kit.tick(this);
    if (g.phase !== "fight") { this.physics(); return; }
    // face the opponent when free
    if (this.canAct() && this.grounded) this.face = this.opp.x >= this.x ? 1 : -1;
    switch (this.state) {
      case "idle": case "walk": case "crouch": case "block": case "cblock": {
        if (pr.ult && this.meter >= 100 && this.kit.ult && !g.noUlt) { this.startMove(this.kit.ult); break; }
        if (pr.special) { const dir = c.down ? "down" : fwd ? "fwd" : back ? "back" : ""; const mv = this.kit.special(dir, this); if (mv) { this.startMove(mv); break; } }
        if (c.down) {
          if (pr.punch) { this.startMove(MELEE.upper); break; }
          if (pr.kick) { this.startMove(MELEE.sweep); break; }
          this.state = c.block ? "cblock" : "crouch"; this.vx = 0; break;
        }
        if (pr.punch) { this.startMove(MELEE.jab); break; }
        if (pr.kick) { this.startMove(MELEE.kick); break; }
        if (c.block) { this.state = "block"; this.vx = 0; break; }
        if (c.up) { this.set("jump"); this.vy = 11.2; this.vx = (fwd ? 3.6 : back ? -3.6 : 0) * this.face; g.sfx("jump"); break; }
        if (fwd || back) { this.state = "walk"; this.vx = (fwd ? 3.4 : -2.7) * this.face; this.walkPh += (fwd ? 1 : -1) * 0.2; }
        else { this.state = "idle"; this.vx = 0; }
        break;
      }
      case "jump": {
        if (pr.kick && !this.move) this.startMove(MELEE.jkick); else if (pr.punch && !this.move) this.startMove(MELEE.jpunch);
        if (this.grounded && this.st > 3) { this.set("idle"); this.landT = g.time; this.vx = 0; g.parts.dust(V3(this.x, 0, 0), 4); }
        break;
      }
      case "attack": this.runMove(); break;
      case "hitstun": case "blockstun": if (this.st >= this.stun) this.set(this.grounded ? "idle" : "air"); break;
      case "air": if (this.grounded && this.st > 2) { this.set("down"); this.vx = 0; g.parts.dust(V3(this.x, 0, 0), 10); g.sfx("land"); g.view.shake = Math.max(g.view.shake, 0.12); } break;
      case "down": if (this.st > 38) { this.set("getup"); this.inv = 30; } break;
      case "getup": if (this.st > 28) { this.set("idle"); this.tripped = false; } break;
      case "stun": if (this.st >= this.stun) this.set("idle"); break;
      case "trip": if (this.grounded && this.st > 6) { this.set("down"); } break;
    }
    this.physics();
  }
  runMove() {
    const m = this.move, f = this.st;
    if (m.air) { // jump attacks stay active until landing
      if (f >= m.start && !this.hitDone) this.game.tryHit(this, m);
      if (this.grounded && f > 2) { this.move = null; this.set("idle"); this.vx = 0; }
      return;
    }
    if (m.update) { const done = m.update(this, f); if (done) { this.move = null; this.set("idle"); } return; }
    if (f >= m.start && f < m.start + m.act && !this.hitDone) this.game.tryHit(this, m);
    if (f >= m.start + m.act + m.rec) { this.move = null; this.set(this.ctrl.cur && this.ctrl.cur.down && m.crouchStart ? "crouch" : "idle"); }
  }
  physics() {
    const air = !this.grounded || this.vy > 0;
    if (air || ["jump", "air", "trip"].includes(this.state) || (this.state === "attack" && this.move && this.move.air)) { this.vy -= GRAV * DT * (this.state === "air" ? 0.9 : 1); }
    this.x += this.vx * DT; this.y += this.vy * DT;
    if (this.y <= 0) { this.y = 0; if (this.vy < 0) this.vy = 0; }
    if (["hitstun", "blockstun", "down", "getup"].includes(this.state) && this.grounded) this.vx *= 0.86;
    this.x = clamp(this.x, -HALF, HALF);
  }
  /* ------------- animation for the current frame ------------- */
  computeAnim(blend = 1) {
    const s = this.state, m = this.move, T = this.game.time * 30;
    const f = m?.basic && this.previousMove === m && this.previousStateFrame <= this.st
      ? lerp(this.previousStateFrame, this.st, blend) : this.st;
    if (s === "attack" && m) {
      if (m.anim) return m.anim(this, f);
      const [clip, a, pk, e] = m.clip;
      if (m.air) { const fr = f < m.start ? a + (pk - a) * f / m.start : pk; return m.upperOnly ? AN("jump", 30, { fixY: 0.95, upper: AN(clip, fr), fade: 0.06 }) : AN(clip, fr, { fixY: 0.95, fade: 0.06 }); }
      const frame = m.basic ? meleeFrame(f, m) : strikeF(f, m.start, m.act, m.rec, a, pk, e);
      return AN(clip, frame, { fade: 0.06 });
    }
    if (s === "walk") { const fwd = this.vx * this.face > 0; return AN(fwd ? "walkF" : "walkB", T * 1.25, { loop: true, fade: 0.12 }); }
    if (s === "crouch") return AN("crouch", T, { loop: true, fade: 0.08 });
    if (s === "block") return AN("block", T * 0.6, { loop: true, fade: 0.06 });
    if (s === "cblock") return AN("crouch", T, { loop: true, fade: 0.06, upper: AN("block", T * 0.6, { loop: true }) });
    if (s === "blockstun") return this.lowBlock ? AN("crouch", 10, { upper: AN("blockHit", 6 + f * 1.4), fade: 0.03, tag: f < 1 ? "r" : "" }) : AN("blockHit", 6 + f * 1.4, { fade: 0.03 });
    if (s === "jump") { const k = clamp(1 - this.vy / 11.2, 0, 2); return AN("jump", 24 + k * 9, { fixY: 0.98, fade: 0.08 }); }
    if (s === "hitstun") { const n = Math.max(8, this.stun); return AN(this.lowHit ? "hitLow" : this.hitAlt ? "hitHigh2" : "hitHigh", 2 + (f / n) * 28, { fade: 0.03, tag: this.hitTag }); }
    if (s === "air") { const k = this.vy > 0 ? 8 + (1 - this.vy / 12) * 16 : 24 + clamp(-this.vy / 12, 0, 1) * 10; return AN("knockback", k, { fixY: 0.9, fade: 0.05 }); }
    if (s === "trip") return AN("trip", Math.min(34, f * 1.6), { fade: 0.04 });
    if (s === "down") return this.tripped ? AN("trip", 50, { fade: 0.12 }) : AN("knockback", 36 + Math.min(10, f * 0.5), { fade: 0.1 });
    if (s === "getup") return AN("getupSlow", 112 + f * 2.2, { fade: 0.14 });
    if (s === "stun") return AN("dizzy", T, { loop: true, fade: 0.1 });
    if (s === "ko") return AN("ko", Math.min(70, f * 0.8 + 6), { fade: 0.06 });
    if (s === "win") return AN("win", Math.min(50, f * 0.5), { fade: 0.2 });
    if (s === "intro") return AN(this.slot === 0 ? "intro2" : "intro", Math.min(49, f * 0.55), { fade: 0.15 });
    if (s === "cine") return this.cineAnim || AN("idle", T, { loop: true });
    return AN(this.idleClip || "idle", T + this.slot * 17, {
      loop: true, fade: 0.14, ribosomeGuard: this.id === "ribosome" && s === "idle",
    });
  }
  render(dt, x = this.x, y = this.y, blend = 1) {
    this.anim = this.computeAnim(blend);
    if (this.flash > 0) this.flash -= dt;
  }
  draw(g) { drawFighter(g, this); if (this.kit.draw) this.kit.draw(this, g); }
}

class Game {
  constructor(view, opts) {
    this.view = view; this.opts = opts; this.parts = new Particles2D(); this.proj = []; this.time = 0; this.hitstop = 0; this.slow = 1;
    this.zones = []; this.stage = { id: opts.stage || "environment" }; view.setStage(this.stage.id);
    this.f = [new Fighter(this, opts.p1, 0, opts.c1), new Fighter(this, opts.p2, 1, opts.c2)];
    this.camX = 0; this.camD = 9; this.timer = 99; this.phase = "intro"; this.pt = 0; this.cine = null; this.result = null;
    this.f.forEach((f) => f.set("intro")); this.sfx = (n) => AUDIO.sfx(n);
  }
  dispose() { this.parts.clear(); this.proj = []; this.zones = []; if (this.cine && this.cine.dispose) this.cine.dispose(); }
  /* hit resolution */
  tryHit(att, mv, box) {
    const def = att.opp; const hb = def.hurt(); if (!hb) return false;
    const r = box || [att.x + att.face * mv.reach[0], att.x + att.face * mv.reach[1], att.y + mv.ys[0], att.y + mv.ys[1]];
    const x0 = Math.min(r[0], r[1]), x1 = Math.max(r[0], r[1]);
    if (x1 < hb[0] || x0 > hb[1] || r[3] < hb[2] || r[2] > hb[3]) return false;
    att.hitDone = true; this.resolve(att, def, mv, V3(clamp(att.x + att.face * mv.reach[1] * 0.8, hb[0], hb[1]), clamp(att.y + (mv.ys[0] + mv.ys[1]) / 2, hb[2] + 0.1, hb[3] - 0.1), 0.3));
    return true;
  }
  blocks(def, level) {
    if (!(def.state === "block" || def.state === "cblock" || def.state === "blockstun")) return false;
    const low = def.state === "cblock" || (def.state === "blockstun" && def.lowBlock);
    if (level === "low" && !low) return false; if (level === "overhead" && low) return false; if (level === "unblockable") return false; return true;
  }
  resolve(att, def, mv, at, proj) {
    const dir = proj ? Math.sign(proj.vx) || att.face : att.face;
    if (proj && def.buff.parry > 0 && !proj.mv.small) { this.parts.block(at); this.sfx("block"); HUD.toast(def.slot, def.parryName || "BLOCKED"); def.meter = Math.min(100, def.meter + 8); return "block"; }
    if (def.buff.shield > 0 && mv.level !== "unblockable" && this.phase === "fight") { def.buff.shield = 0; this.parts.block(at); this.sfx("break"); this.hitstop = 5; HUD.toast(def.slot, "BARRIER ABSORBED IT"); return "block"; }
    if (this.blocks(def, mv.level)) {
      const chip = mv.special ? Math.ceil(mv.dmg * 0.15) : 0; this.damage(def, chip, att, true);
      def.set("blockstun"); def.stun = mv.bs || 10; def.lowBlock = def.state === "cblock"; def.vx = dir * (mv.push || 2) * 0.8;
      this.parts.block(at); this.hitstop = 4; this.sfx("block"); att.meter = Math.min(100, att.meter + 1); def.meter = Math.min(100, def.meter + 2);
      if (mv.onBlock) mv.onBlock(att, def); return "block";
    }
    const scale = def.combo > 0 ? Math.max(0.5, 1 - def.combo * 0.08) : 1; // combo damage scaling
    const dmg = Math.round(mv.dmg * scale * (att.buff.sword > 0 && !mv.special ? 1.5 : 1) * ((this.dmgMul && this.dmgMul[att.slot]) || 1));
    def.combo++; this.comboShow(att, def.combo);
    this.damage(def, dmg, att);
    att.meter = Math.min(100, att.meter + dmg * 0.9); def.meter = Math.min(100, def.meter + dmg * 0.55);
    this.parts.hit(at, att.info.hex, mv.big || (dmg >= 10 ? 1.4 : 1)); this.hitstop = mv.hitstop ?? (dmg >= 10 ? 8 : 5); this.view.shake = Math.max(this.view.shake, dmg >= 10 ? 0.22 : 0.1);
    this.sfx(mv.sfx || "hit"); def.flash = 0.08; def.lowHit = mv.level === "low";
    if (typeof PAD !== "undefined") PAD.rumble(def.slot === 0 ? (dmg >= 10 ? 0.9 : 0.5) : (dmg >= 10 ? 0.35 : 0.15), dmg >= 10 ? 200 : 90);
    if (this.phase !== "fight") return "hit";
    if (mv.launch || !def.grounded) { def.tripped = false; def.set("air"); def.vx = dir * (mv.launch ? mv.launch[0] : 2.5); def.vy = mv.launch ? mv.launch[1] : 6.5; def.y = Math.max(def.y, 0.01); }
    else if (mv.trip) { def.tripped = true; def.set("trip"); def.vy = 4.5; def.y = 0.01; def.vx = dir * 1.2; }
    else if (mv.knock) { def.tripped = false; def.set("air"); def.vx = dir * mv.knock[0]; def.vy = mv.knock[1]; def.y = 0.01; }
    else { def.set("hitstun"); def.stun = mv.hs || 14; def.vx = dir * (mv.push || 2); def.hitAlt = !def.hitAlt; def.hitTag = (def.hitTag || 0) + 1; }
    if (mv.onHit) mv.onHit(att, def, at);
    return "hit";
  }
  damage(def, n, att, chip) {
    if (n <= 0) return; def.hp -= n; def.lastHitBy = att;
    if (def.hp <= 0) {
      if (def.bars > 1) { def.bars--; def.hp = BAR_HP + def.hp; def.ghostHp = BAR_HP; def.dispHp = BAR_HP; HUD.barBreak(def.slot); this.view.shake = 0.35; this.sfx("break"); if (this.onBarBreak) this.onBarBreak(def);
        if (!chip && this.phase === "fight") { def.set("air"); def.vx = att.face * 5; def.vy = 9; def.y = 0.01; } }
      else if (this.noKO && this.noKO(def)) def.hp = 1;
      else { def.hp = 0; if (this.phase === "fight" || this.phase === "cine") this.ko(def); }
    }
  }
  comboShow(att, n) { if (n >= 2) HUD.combo(att.slot, n); }
  spawn(p) { p.t = 0; p.dead = false; this.proj.push(p); return p; }
  zone(z) { z.op = z.op || 0.6; z.max = z.life; this.zones.push(z); return z; }
  ko(def) {
    this.koPending = def; if (this.phase === "cine") return;
    this.phase = "ko"; this.pt = 0; this.slow = 0.25; def.set("ko"); def.y = Math.max(def.y, 0.01); def.vy = 7; def.vx = -def.face * 4;
    HUD.announce("K.O.", "ko"); this.sfx("ko"); this.view.impact = 0.12; FX2D.cx = VIEW.sx(def.x) / VIEW_W; FX2D.cy = VIEW.sy(1.1) / VIEW_H;
  }
  /* ------------- main step (fixed 60 Hz) ------------- */
  step() {
    this.previousPhase = this.phase;
    for (const f of this.f) {
      f.previousX = f.x;
      f.previousY = f.y;
      f.previousMove = f.move;
      f.previousStateFrame = f.st;
    }
    for (const p of this.proj) {
      p.previousX = p.x;
      p.previousY = p.y;
    }
    this.time += DT; this.pt += DT;
    this.f.forEach((f) => f.ctrl.read && f.ctrl.read(this, f));
    if (this.phase === "intro") return this.introStep();
    if (this.phase === "cine") { if (this.cine.step(DT)) this.endCine(); return; }
    if (this.hitstop > 0) { this.hitstop--; return; }
    this.f.forEach((f) => f.step());
    this.pushApart();
    // projectiles
    for (const p of this.proj) {
      p.t++; p.x += p.vx * DT; if (p.grav) p.vy = (p.vy || 0) - p.grav * DT; p.y += (p.vy || 0) * DT; if (p.tick) p.tick(p); if (p.grav && p.y < 0.08) { p.dead = true; if (p.onGround) p.onGround(p); }
      const owner = this.f[p.owner], def = owner.opp;
      if (!p.dead && p.t > 2) { const hb = def.hurt(); if (hb && p.x + 0.25 > hb[0] && p.x - 0.25 < hb[1] && p.y > hb[2] && p.y < hb[3]) { p.dead = true; this.resolve(owner, def, p.mv, V3(p.x, p.y, 0.3), p); } }
      for (const q of this.proj) if (q !== p && q.owner !== p.owner && !q.dead && !p.dead && Math.abs(q.x - p.x) < 0.4 && Math.abs(q.y - p.y) < 0.6) { p.dead = q.dead = true; this.parts.hit(V3(p.x, p.y, 0.3), "#ffffff", 1.2); this.sfx("block"); }
      if (Math.abs(p.x) > HALF + 2 || p.t > (p.life || 240)) p.dead = true;
    }
    this.proj = this.proj.filter((p) => { if (p.dead) { if (p.onDie) p.onDie(p); return false; } return true; });
    // combo reset
    this.f.forEach((f) => { if (!["hitstun", "air", "trip", "stun"].includes(f.state)) f.combo = 0; });
    for (const z of this.zones) { z.life--; if (z.tick) z.tick(this, z); }
    this.zones = this.zones.filter((z) => z.life > 0);
    if (this.phase === "fight") { this.timer -= DT; if (this.timer <= 0) { this.timer = 0; const [a, b] = this.f; const ha = a.hp + (a.bars - 1) * BAR_HP, hb = b.hp + (b.bars - 1) * BAR_HP; this.ko(ha >= hb ? b : a); HUD.announce("TIME", "ko"); } }
    if (this.phase === "ko") { if (this.pt > 0.9) this.slow = 1; if (this.pt > 2.2 && !this.result) { const w = this.f[1 - this.koPending.slot]; w.set("win"); w.face = w.opp.x >= w.x ? 1 : -1; HUD.announce(w.info.name.toUpperCase() + " WINS", "win"); this.result = { winner: w.slot }; this.sfx("win"); } if (this.pt > 5.2) this.phase = "over"; }
  }
  introStep() {
    const t = this.pt, [a, b] = this.f;
    if (t > 0.3 && !this._i1) { this._i1 = 1; a.set("intro"); this.parts.boom(V3(a.x, 0, -1.4), a.info.hex, 1.0); this.sfx("boom"); FX2D.banner(a.info.name.toUpperCase(), a.info.hex, a.info.color + " Ranger", 1); }
    if (t > 1.7 && !this._i2) { this._i2 = 1; b.set("intro"); this.parts.boom(V3(b.x, 0, -1.4), b.info.hex, 1.0); this.sfx("boom"); FX2D.banner(b.info.name.toUpperCase(), b.info.hex, b.info.color + " Ranger", -1); }
    if (t > 3.1 && !this._i3) { this._i3 = 1; a.set("idle"); b.set("idle"); HUD.announce("FIGHT!", "fight"); this.sfx("fight"); }
    if (t > 3.6 || (this.skipIntro && t > 0.2)) { this.phase = "fight"; a.set("idle"); b.set("idle"); if (!this._i3) HUD.announce("FIGHT!", "fight"); }
    this.f.forEach((f) => f.physics());
  }
  pushApart() {
    const [a, b] = this.f; const dx = b.x - a.x;
    if (Math.abs(dx) < 0.74 && a.y < 1.2 && b.y < 1.2 && !["down", "ko"].includes(a.state) && !["down", "ko"].includes(b.state)) { const push = (0.74 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); a.x -= push; b.x += push; }
    if (Math.abs(b.x - a.x) > MAXSEP) { const mid = (a.x + b.x) / 2, s = Math.sign(b.x - a.x); a.x = mid - (s * MAXSEP) / 2; b.x = mid + (s * MAXSEP) / 2; }
    a.x = clamp(a.x, -HALF, HALF); b.x = clamp(b.x, -HALF, HALF);
  }
  startCine(att, def) {
    this.phase = "cine"; att.meter = 0; this.proj.forEach((p) => (p.dead = true));
    this.cine = (typeof domainCine === "function" && domainCine(this, att, def)) || megaCine(this, att, def); this.sfx("ultStart");
  }
  endCine() {
    const { att, def, dmg } = this.cine; const mv = Object.assign({ dmg, level: "unblockable", knock: [6, 10], big: 2, hitstop: 0, sfx: "heavy" }, this.cine.mv || {});
    if (this.cine.dispose) this.cine.dispose(); this.cine = null; this.phase = "fight"; att.cineAnim = def.cineAnim = null;
    att.set("idle"); def.set("idle"); def.combo = 0; this.resolve(att, def, mv, V3(def.x, 1.2, 0.3)); def.combo = 0;
    if (this.koPending && this.koPending.hp <= 0) { this.phase = "fight"; this.ko(this.koPending); }
  }
  /* ------------- per-render-frame visuals ------------- */
  render(dt, fraction = 1) {
    const blend = this.phase === "fight" && this.previousPhase === "fight" && this.hitstop === 0 ? fraction : 1;
    for (const f of this.f) { f.drawX = lerp(f.previousX ?? f.x, f.x, blend); f.drawY = lerp(f.previousY ?? f.y, f.y, blend); f.render(dt, f.drawX, f.drawY, blend); }
    this.parts.update(dt * (this.hitstop > 0 ? 0.3 : 1));
    for (const p of this.proj) { p.drawX = lerp(p.previousX ?? p.x, p.x, blend); p.drawY = lerp(p.previousY ?? p.y, p.y, blend); if (p.spin && p.mesh) p.mesh.rotation.z += p.spin * dt; if (p.render) p.render(p, dt); }
    // camera: follow the midpoint, zoom out as the fighters separate or fly
    const V = this.view, [a, b] = this.f;
    let tx, tS;
    if (this.phase === "cine" && this.cine) { tx = this.cine.camX ?? (a.x + b.x) / 2; tS = this.cine.camS ?? 112; }
    else {
      const mid = (a.drawX + b.drawX) / 2, sep = Math.abs(a.drawX - b.drawX), top = Math.max(a.drawY, b.drawY);
      tS = clamp(Math.min(VIEW_W / (sep + 3.0), (FLOOR_Y - 30) / (top + 2.4)), 90, 124);
      if (this.phase === "intro") { const who = this.pt < 1.7 ? a : b; if (this.pt < 3.1) { tS = 150; tx = who.x * 0.85; } }
      if ((this.phase === "ko" || this.phase === "over") && this.result) { const w = this.f[this.result.winner], k = smooth(clamp((this.pt - 2.2) / 1.2)); tS = lerp(tS, 150, k); tx = lerp(mid, w.x, k); }
      const lim = Math.max(0, HALF + 0.9 - VIEW_W / 2 / tS); tx = clamp(tx ?? mid, -lim, lim);
    }
    const k = this.phase === "cine" ? 1 : 1 - Math.pow(0.0005, dt);
    V.camX = lerp(V.camX, tx, k); V.S = lerp(V.S, tS, k);
  }
  draw(dt) {
    const g = this.view.x;
    for (const z of this.zones) { const a = z.op * Math.min(1, z.life / 30), x = VIEW.sx(z.x), w = z.w * VIEW.S, y = FLOOR_Y + 2;
      g.save(); g.globalAlpha = a; const gr = g.createRadialGradient(x, y, 2, x, y, w); gr.addColorStop(0, z.color); gr.addColorStop(1, rgba(z.color, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, w * 0.16, 0, 0, TAU); g.fill();
      g.globalAlpha = a * 0.8; g.strokeStyle = lighten(z.color, 0.4); g.lineWidth = 2; for (let i = 0; i < 3; i++) { const ph = ((this.time * 0.8 + i / 3) % 1); g.beginPath(); g.ellipse(x, y, w * ph, w * 0.16 * ph, 0, 0, TAU); g.stroke(); } g.restore(); }
    const order = [...this.f].sort((p, q) => (p.state === "attack") - (q.state === "attack"));
    for (const f of order) f.draw(g);
    for (const p of this.proj) if (p.mesh) p.mesh.draw(g, p.drawX ?? p.x, (p.drawY ?? p.y) + (p.dy || 0));
    this.parts.draw(g);
    if (this.phase === "cine" && this.cine && this.cine.draw) this.cine.draw(g, dt);
  }
}

/* ---------- CPU opponent ---------- */
class AICtrl {
  constructor(level = 0.5) { this.level = level; this.cur = {}; this.pressed = {}; this.wait = 0; this.hold = {}; this.plan = null; }
  read(game, me) {
    const c = {}, pr = {}; this.cur = c; this.pressed = pr; if (!game || game.phase !== "fight") return c;
    const opp = me.opp, dx = opp.x - me.x, dist = Math.abs(dx), toward = dx > 0 ? "right" : "left", away = dx > 0 ? "left" : "right";
    const L = this.level; const R = Math.random;
    // keep holding a chosen action for a few frames
    for (const k in this.hold) { if (this.hold[k] > 0) { c[k] = true; this.hold[k]--; } }
    if (this.wait > 0) { this.wait--; return c; }
    if (L < 0.3 && R() < 0.5 - L) { this.wait = 14 + ((R() * 30) | 0); return c; } // low levels spend a lot of time just standing there
    const threat = opp.state === "attack" && opp.move && !opp.hitDone && dist < 2.2 + (opp.move.special ? 4 : 0);
    const projIncoming = game.proj.some((p) => p.owner !== me.slot && Math.sign(p.vx) === Math.sign(me.x - p.x) && Math.abs(p.x - me.x) < 3.2);
    if ((threat || projIncoming) && R() < 0.35 + L * 0.5 && me.canAct()) { const low = opp.move && opp.move.level === "low"; c.block = true; if (low) c.down = true; this.hold = { block: 10 + (R() * 10) | 0 }; if (low) this.hold.down = this.hold.block; this.wait = 4; return c; }
    if (!me.canAct()) return c;
    if (me.meter >= 100 && dist < (me.kit.ultRange || 2.6) && R() < 0.05 + L * 0.08) { pr.ult = c.ult = true; return c; }
    if (opp.state === "jump" && dist < 2.4 && R() < 0.2 + L * 0.4) { c.down = true; pr.punch = c.punch = true; this.wait = 20; return c; }
    if (dist > 3.6) {
      const roll = R();
      if (roll < 0.03 + L * 0.03) { pr.special = c.special = true; this.wait = 25; return c; }
      if (roll < 0.05 + L * 0.03) { c.up = true; c[toward] = true; this.wait = 30; return c; }
      c[toward] = true; this.hold = { [toward]: 8 }; this.wait = 6; return c;
    }
    if (dist > 1.5) {
      const roll = R();
      if (roll < 0.04 + L * 0.05) { c[toward] = true; pr.special = c.special = true; this.wait = 30; return c; }
      if (roll < 0.08) { pr.special = c.special = true; this.wait = 25; return c; }
      if (roll < 0.12) { c[away] = true; this.hold = { [away]: 12 }; this.wait = 14; return c; }
      c[toward] = true; this.hold = { [toward]: 6 }; this.wait = 4; return c;
    }
    const roll = R();
    if (roll < 0.25) { pr.punch = c.punch = true; this.wait = 8 + ((1 - L) * 14) | 0; }
    else if (roll < 0.45) { pr.kick = c.kick = true; this.wait = 12 + ((1 - L) * 14) | 0; }
    else if (roll < 0.55) { c.down = true; pr.kick = c.kick = true; this.wait = 24; }
    else if (roll < 0.62) { c.down = true; pr.punch = c.punch = true; this.wait = 24; }
    else if (roll < 0.70) { c.down = true; pr.special = c.special = true; this.wait = 30; }
    else if (roll < 0.80) { c.block = true; this.hold = { block: 14 }; this.wait = 12; }
    else { c[away] = true; this.hold = { [away]: 10 }; this.wait = 10; }
    return c;
  }
}
class DummyCtrl { constructor() { this.cur = {}; this.pressed = {}; this.mode = "stand"; } read() { this.cur = this.mode === "block" ? { block: true } : this.mode === "crouch" ? { down: true, block: true } : {}; this.pressed = {}; return this.cur; } }
