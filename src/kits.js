/* ================= Special moves and ultimate activations ================= */
const KITS = {};
function callout(me, name) { FX2D.banner(name.toUpperCase() + "!", me.info.hex, me.info.name, me.face); HUD.science(me, name); }

/* ---------------- GREEN · ATP ---------------- */
KITS.atp = {
  ultRange: 3.4,
  special(dir, me) {
    if (dir === "fwd") return KITS.atp.power;
    if (dir === "down") return KITS.atp.overdrive;
    if (me.cool.snap > 0) { HUD.toast(me.slot, "ADP: recharging phosphate…"); return null; }
    return KITS.atp.snap;
  },
  snap: { special: true, name: "Phosphate Snap",
    update(me, f) {
      if (f === 1) { callout(me, "Phosphate Snap"); me.game.sfx("charge"); }
      if (f === 12) { me.cool.snap = 180; me.game.sfx("shoot");
        const mesh = phosphateModel(1.25); me.game.spawn({ owner: me.slot, x: me.x + me.face * 0.75, y: 1.38, vx: me.face * 11.5, mesh, spin: 9, mv: { dmg: 10, level: "mid", hs: 18, bs: 12, push: 2.6, special: true, sfx: "hit" },
          tick: (p) => { if (p.t % 2 === 0) me.game.parts.spark(V3(p.x, p.y + (Math.random() - 0.5) * 0.2, 0.25), "#ffd36b", 0.25, V3(-p.vx * 0.1, 0, 0), 0.3); } }); }
      return f >= 30;
    },
    anim(me, f) { return AN("magic1", strikeF(f, 12, 3, 15, 8, 28, 50), { fade: 0.08 }); } },
  power: { special: true, name: "Power Stroke", dmg: 12, level: "mid", knock: [5.5, 6], special: true, sfx: "heavy", big: 1.4, hs: 20, bs: 14, push: 3,
    update(me, f) {
      if (f === 1) { callout(me, "Power Stroke"); me.game.sfx("charge"); }
      if (f >= 10 && f < 22) { me.vx = me.face * 12.5; if (f % 2 === 0) me.game.parts.spark(V3(me.x - me.face * 0.3, 1.2 + Math.random() * 0.5, 0.2), "#7ef25a", 0.35, V3(-me.face * 3, 0, 0), 0.25); if (!me.hitDone) me.game.tryHit(me, this); if (me.hitDone) me.vx *= 0.3; }
      else me.vx = 0;
      return f >= 40;
    },
    reach: [0.1, 1.15], ys: [0.85, 1.85],
    anim(me, f) { return AN("cross", strikeF(f, 11, 15, 14, 4, 16, 36), { fade: 0.06 }); } },
  overdrive: { special: true, name: "Overdrive", dmg: 7, level: "mid", hs: 20, bs: 12, push: 1.2, reach: [0.2, 1.75], ys: [0.5, 1.95], sfx: "zap",
    onHit(att, def) { if (def.stunImmune <= 0) { def.set("stun"); def.stun = 60; def.stunImmune = 170; def.vx = 0; HUD.toast(def.slot, "PARALYZED"); } },
    update(me, f) {
      if (f === 1) { callout(me, "Overdrive"); me.game.sfx("charge"); }
      if (f >= 9 && f < 18) { const h = handWorld(me, "R"); for (let k = 0; k < 2; k++) me.game.parts.bolt(h, V3(me.x + me.face * (0.8 + Math.random() * 0.9), 0.7 + Math.random() * 1.1, 0.2)); if (f % 3 === 0) me.game.sfx("zap"); if (!me.hitDone) me.game.tryHit(me, this); }
      return f >= 38;
    },
    anim(me, f) { return AN("magic2", strikeF(f, 9, 11, 18, 14, 32, 60), { fade: 0.06 }); } },
  ult: { special: true, ult: true, name: "Megaform", dmg: 2, level: "mid", hs: 20, bs: 16, push: 1, reach: [0, 1.25], ys: [0.6, 1.9], sfx: "heavy",
    onStart(me) { me.meter = 0; me.game.sfx("ultStart"); FX2D.banner("MEGAFORM!", me.info.hex, me.info.name, me.face); },
    onHit(att, def) { att.game.startCine(att, def); },
    update(me, f) {
      if (f >= 8 && f < 26) { me.vx = me.face * 13; if (!me.hitDone) me.game.tryHit(me, this); if (f % 2 === 0) me.game.parts.spark(V3(me.x, 1.3, 0.2), "#f4d63d", 0.4, V3(-me.face * 3, 0, 0), 0.3); } else me.vx = 0;
      return f >= 46;
    },
    anim(me, f) { return AN("punch1", strikeF(f, 8, 20, 18, 4, 12, 28), { fade: 0.06 }); } },
  // three phosphate groups float over the shoulder; the third one is spent while Phosphate Snap recharges
  draw(me, g) {
    const adp = me.cool.snap > 0; if (me._adp && !adp) { me._pop = 0.3; me.game.parts.spark(V3(me.x - me.face * 0.1, me.y + 2.15, 0), "#f4d63d", 0.6); me.game.sfx("ding"); } me._adp = adp; if (me._pop > 0) me._pop -= 1 / 60;
    if (["ko", "down", "air", "trip"].includes(me.state) || me.game.phase === "cine") return;
    for (let i = 0; i < 3; i++) { if (i === 2 && adp) continue; const x = VIEW.sx(me.x - me.face * (0.25 - i * 0.17)), y = VIEW.sy(me.y + 2.12 + Math.sin(me.game.time * 3 + i) * 0.03), r = 0.065 * VIEW.S * (i === 2 && me._pop > 0 ? 1.6 : 1);
      g.fillStyle = "#f2a23a"; g.strokeStyle = "#6b3a05"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#3a1d00"; g.font = `900 ${r * 1.4}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("P", x, y + 0.5); }
  },
};

/* ---------------- RED · RIBOSOME ---------------- */
const CODONS = ["AUG", "GCU", "UUC", "UAA · STOP"];
KITS.ribosome = {
  ultRange: 4.3,
  special(dir, me) { if (dir === "fwd") return KITS.ribosome.lash; if (dir === "down") return KITS.ribosome.codon; return KITS.ribosome.trna; },
  trna: { special: true, name: "tRNA Delivery",
    update(me, f) {
      if (f === 1) { callout(me, "tRNA Delivery"); }
      if (f === 13) { me.game.sfx("shoot"); const mesh = trnaModel(AA_COLORS[(Math.random() * AA_COLORS.length) | 0]); mesh.scale.setScalar(1.15);
        me.game.spawn({ owner: me.slot, x: me.x + me.face * 0.75, y: 1.35, vx: me.face * 9.5, mesh, spin: me.face * -7, mv: { dmg: 10, level: "mid", hs: 18, bs: 12, push: 2.5, special: true, sfx: "hit" },
          tick: (p) => { if (p.t % 3 === 0) me.game.parts.spark(V3(p.x, p.y, 0.25), "#ff8fa0", 0.22, V3(-p.vx * 0.1, 0, 0), 0.3); } }); }
      return f >= 32;
    },
    anim(me, f) { return AN("throw", strikeF(f, 13, 3, 16, 8, 21, 45), { fade: 0.08 }); } },
  lash: { special: true, name: "Polypeptide Lash", level: "mid", hs: 18, bs: 12, push: 3, ys: [0.8, 1.8], sfx: "whip",
    get dmg() { return 7 + this._me.chain; },
    update(me, f) {
      this._me = me; this.reach = [0.3, 1.25 + 0.5 * me.chain];
      if (f === 1) { callout(me, "Polypeptide Lash"); me.game.sfx("whoosh"); }
      if (f >= 12 && f < 20 && !me.hitDone) { if (me.game.tryHit(me, this)) { me.chain = Math.min(4, me.chain + 1); HUD.toast(me.slot, "+1 amino acid (" + me.chain + " links)"); } }
      return f >= 38;
    },
    anim(me, f) { return AN("hook", strikeF(f, 12, 10, 16, 0, 10, 30), { fade: 0.06 }); } },
  codon: { special: true, name: "Codon Combo", dmg: 5, level: "mid", hs: 40, bs: 12, push: 0.6, reach: [0.1, 1.15], ys: [0.7, 1.85], sfx: "jab",
    onStart(me) { me.codon = 0; },
    onHit(att, def) { att.codon = 1; HUD.pop(def, CODONS[0], att.info.hex); },
    update(me, f) {
      const g = me.game, def = me.opp;
      if (f === 1) callout(me, "Codon Combo");
      if (!me.codon) { me.vx = f >= 3 && f < 11 ? me.face * 6.5 : 0; if (f >= 8 && f < 13 && !me.hitDone) g.tryHit(me, this); return f >= 36; }
      me.vx = 0; def.x = me.x + me.face * 0.95; def.vx = 0;
      const hit = (i, final) => { const mv = { dmg: final ? 10 : 5, level: "unblockable", hs: 40, push: 0, sfx: final ? "heavy" : "jab", launch: final ? [4, 10] : null, special: true, big: final ? 1.6 : 1 };
        g.resolve(me, def, mv, V3(def.x, 1.3 + Math.random() * 0.3, 0.3)); HUD.pop(def, CODONS[i], i === 3 ? "#ffffff" : me.info.hex); if (final) g.view.shake = 0.3; };
      if (f === 24) hit(1); if (f === 38) hit(2); if (f === 54) hit(3, true);
      return f >= 76;
    },
    anim(me, f) { if (!me.codon || f < 12) return AN("jab", strikeF(f, 8, 5, 20, 4, 12, 26), { fade: 0.05 });
      if (f < 24) return AN("cross", strikeF(f - 12, 12, 2, 10, 4, 16, 30), { fade: 0.05 });
      if (f < 38) return AN("kick2", strikeF(f - 24, 14, 2, 10, 8, 19, 35), { fade: 0.05 });
      return AN("upper", strikeF(f - 38, 16, 3, 20, 0, 9, 34), { fade: 0.05 }); } },
  ult: { special: true, ult: true, name: "Megaform", dmg: 2, level: "mid", hs: 20, bs: 16, push: 1, ys: [0.6, 1.9], sfx: "whip",
    onStart(me) { me.meter = 0; me.game.sfx("ultStart"); FX2D.banner("MEGAFORM!", me.info.hex, me.info.name, me.face); },
    onHit(att, def) { att.game.startCine(att, def); },
    update(me, f) { const ext = f < 10 ? 0 : Math.min(4.3, (f - 10) * 0.24); this.reach = [0.2, 0.6 + ext]; me.lassoExt = ext; if (f >= 10 && f < 30 && !me.hitDone) me.game.tryHit(me, this); if (f === 10) me.game.sfx("whoosh"); if (f >= 50 || me.hitDone && f > 32) { me.lassoExt = 0; return true; } return false; },
    anim(me, f) { return AN("fireball", strikeF(f, 10, 30, 10, 12, 29, 51), { fade: 0.06 }); } },
  // the growing amino-acid whip and the mRNA lasso
  draw(me, g) {
    const mv = me.move, f = me.st; let len = 0;
    if (me.state === "attack" && mv === KITS.ribosome.lash && f >= 11 && f < 24) len = (1.0 + 0.5 * me.chain) * Math.sin(Math.PI * clamp((f - 11) / 12));
    if (me.state === "attack" && mv === KITS.ribosome.ult) len = me.lassoExt || 0;
    if (len <= 0.05) return;
    const h = handWorld(me), n = Math.max(3, Math.min(12, Math.round(len / 0.17)));
    if (mv === KITS.ribosome.ult) { g.strokeStyle = "#c9b0ff"; g.lineWidth = 4; g.beginPath(); g.moveTo(VIEW.sx(h.x), VIEW.sy(h.y)); for (let i = 1; i <= 16; i++) { const t = i / 16; g.lineTo(VIEW.sx(h.x + me.face * len * t), VIEW.sy(h.y + Math.sin(t * 9 + me.game.time * 20) * 0.08)); } g.stroke(); }
    for (let i = 0; i < n; i++) { const t = i / (n - 1 || 1), x = VIEW.sx(h.x + me.face * len * t), y = VIEW.sy(h.y + Math.sin(t * Math.PI * 2 + me.game.time * 20) * 0.08 * (1 - t)), c = AA_COLORS[i % AA_COLORS.length], r = 0.075 * VIEW.S;
      g.fillStyle = c; g.strokeStyle = "#1a1206"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); }
  },
};
