/* ================= Screen effects: impact frames and the anime-style move banner ================= */
const FX2D = {
  cx: 0.5, cy: 0.5,
  init() { this.bannerEl = document.getElementById("banner"); },
  /* impact frame: the whole screen flips to a hard black-and-white burst for a few frames */
  impactDraw(x, odd) {
    const w = VIEW_W, h = VIEW_H; x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = "difference"; x.fillStyle = "#fff"; if (odd) x.fillRect(0, 0, w, h); x.globalCompositeOperation = "source-over";
    x.fillStyle = odd ? "#000" : "#fff"; const cx = w * this.cx, cy = h * this.cy;
    for (let i = 0; i < 90; i++) { const a = Math.random() * TAU, r0 = h * (0.18 + Math.random() * 0.2), wd = 0.004 + Math.random() * 0.012; x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a - wd) * w * 1.5, cy + Math.sin(a - wd) * w * 1.5); x.lineTo(cx + Math.cos(a + wd) * w * 1.5, cy + Math.sin(a + wd) * w * 1.5); x.closePath(); x.fill(); }
    x.restore();
  },
  /* anime-style attack callout across the screen */
  banner(text, color, sub, side = 1) {
    const el = this.bannerEl; if (!el) return;
    el.innerHTML = `<div class="bn-band" style="--c:${color}"><div class="bn-lines"></div><div class="bn-sub">${sub || ""}</div><div class="bn-text" data-t="${text}">${text.split("").map((ch, i) => `<span style="animation-delay:${i * 18}ms">${ch === " " ? "&nbsp;" : ch}</span>`).join("")}</div></div>`;
    el.className = "show " + (side > 0 ? "fromL" : "fromR"); clearTimeout(this._bt);
    this._bt = setTimeout(() => (el.className = "hide " + (side > 0 ? "fromL" : "fromR")), 1150);
  },
};
