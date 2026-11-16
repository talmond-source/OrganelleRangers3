/* ================= Menu backdrops: the title parade and the character-select showcase ================= */
const INTRO = {
  phase: "logo", on: false, t: 0,
  init() {}, show(on) { this.on = on; }, start() { this.phase = "logo"; this.t = 0; }, toLogo() { this.phase = "logo"; },
  update(dt) {
    if (!this.on) return; this.t += dt; const t = this.t, g = VIEW.x;
    VIEW.camX = Math.sin(t * 0.08) * 1.5; VIEW.S = 104; VIEW.setStage("environment"); VIEW.begin(dt);
    g.save(); g.fillStyle = "rgba(4,6,18,.45)"; g.fillRect(0, 0, VIEW_W, VIEW_H); g.restore();
    // the Phage looms over the city
    if (SPR.img.phage) { g.save(); g.globalAlpha = 0.5; drawFrame(g, "phage", 0, VIEW.camX + 3.2, 0.6 + Math.sin(t * 0.9) * 0.08, -1, { scale: 1.6, silhouette: "#3a1758" }); g.restore(); }
    // every Ranger runs past in a loop
    const ids = ROSTER.map((r) => r.id), spacing = 1.35, loop = (ids.length + 3) * spacing;
    ids.forEach((id, i) => { const x = ((i * spacing + t * 1.6) % loop) - loop / 2 + VIEW.camX; const hop = (Math.floor(t / 2.4) + i) % 6 === 0; const lift = hop ? Math.abs(Math.sin((t % 2.4) / 2.4 * Math.PI)) * 0.7 : 0;
      const fr = hop ? 11 : [1, 2, 3, 2][Math.floor(t * 10 + i * 1.7) % 4];
      g.save(); g.globalAlpha = 0.45; g.fillStyle = "#000"; g.beginPath(); g.ellipse(VIEW.sx(x), FLOOR_Y + 3, 0.4 * VIEW.S, 0.06 * VIEW.S, 0, 0, TAU); g.fill(); g.restore();
      drawFrame(g, id, fr, x, lift, 1, { scale: 0.62 }); });
    VIEW.end(dt);
  },
};
const SHOW = {
  parts: new Particles2D(), picks: ["atp", null], t: 0, on: false,
  setVisible(on) { this.on = on; },
  update(dt) {
    if (!this.on) return; this.t += dt; const t = this.t, g = VIEW.x, id = this.picks[0]; if (!id) return;
    VIEW.camX = 0; VIEW.S = 118; VIEW.setStage("membranes"); VIEW.begin(dt);
    g.save(); g.fillStyle = "rgba(4,6,18,.5)"; g.fillRect(0, 0, VIEW_W, VIEW_H); g.restore();
    const info = BYID[id], x = -3.05;
    const cx = VIEW.sx(x), cy = VIEW.sy(1.0), gr = g.createRadialGradient(cx, cy, 10, cx, cy, 2.2 * VIEW.S); gr.addColorStop(0, rgba(info.hex, 0.45)); gr.addColorStop(1, rgba(info.hex, 0)); g.fillStyle = gr; g.fillRect(cx - 300, cy - 300, 600, 600);
    // showcase: idle, then a quick punch, kick and blaster pose
    const k = t % 4.6, seq = [[2.2, 0], [2.32, 4], [2.44, 5], [2.56, 6], [2.68, 7], [2.82, 8], [3.1, 9], [3.24, 10], [3.42, 12], [3.56, 13], [3.9, 14], [4.0, 13]];
    let fr = 0; for (const [end, f] of seq) if (k < end) { fr = k < 2.2 ? 0 : f; break; }
    g.save(); g.fillStyle = "rgba(0,0,0,.5)"; g.beginPath(); g.ellipse(cx, FLOOR_Y + 3, 0.6 * VIEW.S, 0.09 * VIEW.S, 0, 0, TAU); g.fill(); g.restore();
    drawFrame(g, id, fr, x, 0, 1, { scale: 1.05, squash: fr ? 1 : 1 + Math.sin(t * 3) * 0.008, flash: this.flashT > 0 ? this.flashT : 0 });
    if (this.flashT > 0) this.flashT -= dt;
    this.parts.update(dt); this.parts.draw(g);
    VIEW.end(dt);
  },
  lockFx(id) { this.flashT = 0.25; this.parts.boom(V3(-3.05, 0, 0), BYID[id].hex, 0.9); },
};
/* portraits for menus and the HUD: the approved Ranger art, plus the Phage's head from its sheet */
const PORTRAITS = {};
function makePortraits() {
  for (const r of ROSTER) {
    const img = SPR.port[r.id], c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, 256); bg.addColorStop(0, r.dark || "#1b1530"); bg.addColorStop(1, "#05040a"); g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    if (img) { const s = 256 / img.width * 1.25; g.drawImage(img, 128 - img.width * s / 2, 8, img.width * s, img.height * s); }
    PORTRAITS[r.id] = c.toDataURL();
  }
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); g.fillStyle = "#1a0d24"; g.fillRect(0, 0, 256, 256);
  const M = SPRITE_META, img = SPR.img.phage; g.drawImage(img, 0, 0, M.phageCell[0], M.phageCell[1], -150, -20, M.phageCell[0] * 1.4, M.phageCell[1] * 1.4); PORTRAITS.phage = c.toDataURL();
}
