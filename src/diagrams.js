/* Bio-scan diagrams: clean, flat, labeled illustrations drawn on a canvas for each mission question.
   drawDiagram(canvas, name, options). The drawing space is 640 x 270 units (rendered at 2x for sharpness).
   Lettered markers (gold circles) point at the parts a question asks about; leader lines are thin and pale. */
const DGW = 640, DGH = 270;
const BASE_COL = {A:'#e8505b', T:'#f2b631', G:'#3fae7a', C:'#3d7bf0', U:'#a86cff', '?':'#2a3d55'};
const DGC = {
 ink:'#e8f6ff', soft:'#a9c7d8', lead:'#8fb4c8', mark:'#ffd36b', markInk:'#1d1404', bg0:'#0c1a2c', bg1:'#132a44',
 cyto:'#18455a', cytoEdge:'#ff89bd', nuc:'#3a2668', nucEdge:'#b48cff', rer:'#c46a2c', rerEdge:'#ffb071', ribo:'#ff5a6e',
 ser:'#1b8f86', serEdge:'#7ff1e2', golgi:'#e5b33c', golgiEdge:'#fff0b0', mito:'#e9823a', mitoIn:'#6a2a12', mitoEdge:'#ffc58a',
 lyso:'#8f2a48', lysoEdge:'#ff8fb0', lipidHead:'#f7a8c8', lipidTail:'#f3d77a', protein:'#4f8fe0', pump:'#9b6cff'
};

/* ---------- drawing helpers ---------- */
function dgPath(g, fill, stroke, lw = 2, dash) {
 if (fill) { g.fillStyle = fill; g.fill(); }
 if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); }
}
function dgCirc(g, x, y, r, fill, stroke, lw) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); dgPath(g, fill, stroke, lw); }
function dgEll(g, x, y, rx, ry, rot, fill, stroke, lw, dash) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); dgPath(g, fill, stroke, lw, dash); }
function dgRect(g, x, y, w, h, r, fill, stroke, lw, dash) {
 g.beginPath(); r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
 dgPath(g, fill, stroke, lw, dash);
}
function dgLine(g, pts, stroke, lw = 2, dash) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); dgPath(g, null, stroke, lw, dash); }
function dgCurve(g, x1, y1, cx, cy, x2, y2, stroke, lw = 2, dash) { g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2); dgPath(g, null, stroke, lw, dash); }
function dgHead(g, x, y, ang, color, size = 8) {
 g.beginPath(); g.moveTo(x, y); g.lineTo(x - size * Math.cos(ang - .45), y - size * Math.sin(ang - .45)); g.lineTo(x - size * Math.cos(ang + .45), y - size * Math.sin(ang + .45)); g.closePath(); g.fillStyle = color; g.fill();
}
function dgArrow(g, x1, y1, x2, y2, color = DGC.ink, lw = 2.5, dash) { dgLine(g, [[x1, y1], [x2 - (x2 - x1) * .02, y2 - (y2 - y1) * .02]], color, lw, dash); dgHead(g, x2, y2, Math.atan2(y2 - y1, x2 - x1), color, 6 + lw * 1.5); }
function dgCurveArrow(g, x1, y1, cx, cy, x2, y2, color = DGC.ink, lw = 2.5) { dgCurve(g, x1, y1, cx, cy, x2, y2, color, lw); dgHead(g, x2, y2, Math.atan2(y2 - cy, x2 - cx), color, 6 + lw * 1.5); }
function dgText(g, s, x, y, size = 12, color = DGC.ink, align = 'center', weight = 650) {
 g.font = weight + ' ' + size + 'px system-ui, -apple-system, "Segoe UI", sans-serif'; g.textAlign = align; g.textBaseline = 'middle';
 g.fillStyle = '#06101d'; g.fillText(s, x + 1, y + 1); g.fillStyle = color; g.fillText(s, x, y);
}
/* label with a leader line from a feature point (fx,fy) to the label anchor (lx,ly) */
function dgLabel(g, s, fx, fy, lx, ly, align, size = 12, color = DGC.ink) {
 align = align || (lx < fx ? 'right' : 'left');
 dgLine(g, [[fx, fy], [lx, ly]], DGC.lead, 1.2); dgCirc(g, fx, fy, 2.2, DGC.lead);
 const pad = align === 'right' ? -5 : align === 'left' ? 5 : 0;
 const lines = String(s).split('\n'); lines.forEach((t, i) => dgText(g, t, lx + pad, ly + (i - (lines.length - 1) / 2) * (size + 2), size, color, align));
}
function dgMark(g, letter, fx, fy, lx, ly) {
 if (lx !== undefined) { dgLine(g, [[fx, fy], [lx, ly]], DGC.mark, 1.6); dgCirc(g, fx, fy, 2.6, DGC.mark); } else { lx = fx; ly = fy; }
 dgCirc(g, lx, ly, 12, DGC.mark, '#2b1d04', 2); dgText(g, letter, lx, ly + .5, 14, DGC.markInk, 'center', 850);
}
function dgQ(g, x, y, r = 13) { dgCirc(g, x, y, r, '#102236', '#ffd36b', 2); dgText(g, '?', x, y + .5, r * 1.15, '#ffd36b', 'center', 850); }
function dgBg(g) {
 const gr = g.createLinearGradient(0, 0, 0, DGH); gr.addColorStop(0, DGC.bg1); gr.addColorStop(1, DGC.bg0); g.fillStyle = gr; g.fillRect(0, 0, DGW, DGH);
 g.fillStyle = '#1e3a57'; for (let x = 10; x < DGW; x += 20) for (let y = 10; y < DGH; y += 20) g.fillRect(x, y, 1, 1);
}
function dgCaption(g, s) { dgText(g, s, 12, DGH - 11, 11, DGC.soft, 'left', 600); }
function dgMarks(g, marks, anchors) {
 for (const [letter, key] of Object.entries(marks || {})) { const a = anchors[key]; if (a) dgMark(g, letter, a[0], a[1], a[2], a[3]); }
}
function dgSeeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ---------- reusable cell parts ---------- */
function dgNucleus(g, x, y, rx, ry, o = {}) {
 dgEll(g, x, y, rx + 4, ry + 4, 0, null, DGC.nucEdge, 2.4);
 dgEll(g, x, y, rx, ry, 0, DGC.nuc, DGC.nucEdge, 2);
 if (o.pores !== false) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; const px = x + Math.cos(a) * (rx + 2), py = y + Math.sin(a) * (ry + 2); g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = '#0d1d30'; g.fillRect(-3, -2.5, 6, 5); g.fillStyle = '#e4d0ff'; g.fillRect(-3, -3.6, 6, 1.4); g.fillRect(-3, 2.2, 6, 1.4); g.restore(); }
 const r = dgSeeded(7); g.save(); g.beginPath(); g.ellipse(x, y, rx - 4, ry - 4, 0, 0, Math.PI * 2); g.clip();
 for (let k = 0; k < (o.chromatin === false ? 0 : 10); k++) { let px = x + (r() - .5) * rx * 1.4, py = y + (r() - .5) * ry * 1.3; g.beginPath(); g.moveTo(px, py); for (let j = 0; j < 5; j++) { const cx2 = px + (r() - .5) * rx * .3, cy2 = py + (r() - .5) * ry * .3; px += (r() - .5) * rx * .32; py += (r() - .5) * ry * .3; g.quadraticCurveTo(cx2, cy2, px, py); } g.lineCap = 'round'; dgPath(g, null, o.hiChromatin ? '#7cf7df' : '#c9a8ff', o.hiChromatin ? 2.8 : 1.7); g.lineCap = 'butt'; }
 g.restore();
 if (o.nucleolus !== false) { dgCirc(g, x + rx * .28, y - ry * .18, Math.min(rx, ry) * .28, '#241447', '#8c6ad6', 1.5); }
}
function dgRibo(g, x, y, s = 1) { dgCirc(g, x, y, 2.4 * s, DGC.ribo); }
function dgRoughER(g, cx, cy, rIn, a0, a1, n = 3) {
 for (let i = 0; i < n; i++) {
  const r = rIn + i * 14; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.arc(cx, cy, r + 7, a1, a0, true); g.closePath(); dgPath(g, DGC.rer, DGC.rerEdge, 1.6);
  for (let a = a0 + .06; a < a1; a += .14) { dgRibo(g, cx + Math.cos(a) * (r + 10), cy + Math.sin(a) * (r + 10)); if (i === 0) dgRibo(g, cx + Math.cos(a + .07) * (r - 3), cy + Math.sin(a + .07) * (r - 3)); }
 }
}
function dgSmoothER(g, x, y, w, h) {
 const tubes = [[[0, .35], [.22, .08], [.48, .38], [.74, .12], [1, .32]], [[.02, .82], [.3, .62], [.56, .9], [.82, .66], [1, .86]], [[.22, .08], [.18, .45], [.3, .62]], [[.74, .12], [.7, .42], [.82, .66]], [[.48, .38], [.56, .9]]];
 const smooth = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); const L = pts[pts.length - 1]; g.lineTo(L[0], L[1]); };
 g.lineCap = 'round'; g.lineJoin = 'round';
 for (const t of tubes) { const pts = t.map(([a, b]) => [x + a * w, y + b * h]); smooth(pts); dgPath(g, null, DGC.serEdge, Math.max(7, h * .2)); }
 for (const t of tubes) { const pts = t.map(([a, b]) => [x + a * w, y + b * h]); smooth(pts); dgPath(g, null, DGC.ser, Math.max(4, h * .2 - 4)); }
 g.lineCap = 'butt'; g.lineJoin = 'miter';
}
function dgGolgi(g, x, y, w, h) {
 for (let i = 0; i < 5; i++) {
  const yy = y + i * h / 5, ww = w * (1 - Math.abs(i - 2) * .12), xx = x + (w - ww) / 2;
  g.beginPath(); g.moveTo(xx, yy + 6); g.quadraticCurveTo(xx + ww / 2, yy - 6, xx + ww, yy + 6); g.lineTo(xx + ww, yy + 12); g.quadraticCurveTo(xx + ww / 2, yy, xx, yy + 12); g.closePath(); dgPath(g, DGC.golgi, DGC.golgiEdge, 1.5);
  dgCirc(g, xx - 5, yy + 9, 4, DGC.golgi, DGC.golgiEdge, 1.2); dgCirc(g, xx + ww + 5, yy + 9, 4, DGC.golgi, DGC.golgiEdge, 1.2);
 }
}
function dgMito(g, x, y, w, h, rot = 0, o = {}) {
 g.save(); g.translate(x, y); g.rotate(rot);
 const t = Math.max(3, h * .06);
 dgRect(g, -w / 2, -h / 2, w, h, h / 2, o.worn ? '#8a7466' : DGC.mito, o.worn ? '#c8b3a3' : DGC.mitoEdge, 2);
 dgRect(g, -w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t, (h - 2 * t) / 2, o.worn ? '#4b3c34' : DGC.mitoIn, o.worn ? '#a08d80' : '#f7b26a', Math.max(1.5, t * .7));
 g.save(); dgRect(g, -w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t, (h - 2 * t) / 2); g.clip();
 const n = Math.max(3, Math.floor(w / 18)), fw = Math.max(2.5, w / n * .22);
 for (let i = 0; i < n; i++) {
  const xx = -w / 2 + h * .35 + i * (w - h * .7) / Math.max(1, n - 1), up = i % 2 === 0, y0 = up ? -h / 2 : h / 2, y1 = up ? h * .12 : -h * .12;
  g.beginPath(); g.moveTo(xx - fw, y0); g.bezierCurveTo(xx - fw * 1.6, (y0 + y1) / 2, xx - fw * .4, y1, xx, y1); g.bezierCurveTo(xx + fw * .4, y1, xx + fw * 1.6, (y0 + y1) / 2, xx + fw, y0); g.closePath();
  dgPath(g, o.worn ? '#a08d80' : '#f7b26a', null);
 }
 g.restore(); g.restore();
}
function dgLyso(g, x, y, r, o = {}) {
 dgCirc(g, x, y, r, DGC.lyso, DGC.lysoEdge, 2);
 const rr = dgSeeded(r * 13); for (let i = 0; i < Math.max(3, r / 3); i++) { const a = rr() * 6.28, d = rr() * r * .65; dgCirc(g, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(1.4, r * .09), '#ffd0dc'); }
}
function dgVesicle(g, x, y, r, fill = DGC.golgi, edge = DGC.golgiEdge) { dgCirc(g, x, y, r, fill, edge, 1.6); }
function dgTRNA(g, x, y, anti, aa, s = 1) {
 // simplified tRNA (cloverleaf body) standing on the mRNA, anticodon at the bottom, amino acid on top
 g.save(); g.translate(x, y); g.scale(s, s);
 g.beginPath(); g.moveTo(-14, 0); g.lineTo(-14, -26); g.quadraticCurveTo(-34, -30, -32, -46); g.quadraticCurveTo(-22, -58, -10, -48); g.lineTo(-8, -66); g.lineTo(8, -66); g.lineTo(10, -48); g.quadraticCurveTo(22, -58, 32, -46); g.quadraticCurveTo(34, -30, 14, -26); g.lineTo(14, 0); g.closePath(); dgPath(g, '#3b2a6e', '#b99cff', 2);
 dgLine(g, [[0, -66], [0, -78]], '#b99cff', 3);
 g.restore();
 const letters = String(anti || '').split('');
 letters.forEach((b, i) => { const bx = x + (i - 1) * 13 * s; dgRect(g, bx - 6 * s, y - 2, 12 * s, 14 * s, 2, BASE_COL[b] || BASE_COL['?'], '#0b1424', 1); dgText(g, b, bx, y + 5 * s, 10 * s, '#fff', 'center', 800); });
 if (aa) { dgCirc(g, x, y - 88 * s, 13 * s, '#ffd36b', '#7a5a10', 2); dgText(g, aa, x, y - 88 * s, 9.5 * s, '#2b1d04', 'center', 800); }
}
function dgBases(g, seq, x, y, w = 22, h = 22, gap = 3, label = true) {
 seq.split('').forEach((b, i) => { const bx = x + i * (w + gap); dgRect(g, bx, y, w, h, 3, BASE_COL[b] || BASE_COL['?'], '#0b1424', 1.2); if (label) dgText(g, b, bx + w / 2, y + h / 2 + .5, Math.min(14, h * .62), b === '?' ? '#ffd36b' : '#fff', 'center', 850); });
}
function dgPhospholipid(g, x, y, up = true, s = 1) {
 const d = up ? 1 : -1; dgLine(g, [[x - 2.5 * s, y], [x - 3.5 * s, y + d * 9 * s], [x - 2 * s, y + d * 17 * s]], DGC.lipidTail, 1.8 * s); dgLine(g, [[x + 2.5 * s, y], [x + 1.5 * s, y + d * 9 * s], [x + 3 * s, y + d * 17 * s]], DGC.lipidTail, 1.8 * s);
 dgCirc(g, x, y, 5.2 * s, DGC.lipidHead, '#9c4f73', 1);
}
function dgBilayer(g, x0, x1, yTop, gapAt) {
 for (let x = x0; x <= x1; x += 12) { if (gapAt && gapAt.some(([a, b]) => x > a - 6 && x < b + 6)) continue; dgPhospholipid(g, x, yTop, true); dgPhospholipid(g, x, yTop + 46, false); }
}
function dgGlucose(g, x, y, r = 7, fill = '#ffe27a') {
 g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); dgPath(g, fill, '#7a5b10', 1.2);
}
function dgPhage(g, x, y, s = 1, angle = 0) {
 g.save(); g.translate(x, y); g.rotate(angle); g.scale(s, s);
 g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.lineTo(Math.cos(a) * 16, -40 + Math.sin(a) * 19); } g.closePath(); dgPath(g, '#a9e3d2', '#e8fff8', 1.6);
 dgRect(g, -5, -22, 10, 30, 2, '#8fa6b0', '#dbe8ee', 1.2); for (let i = 0; i < 6; i++) dgLine(g, [[-5, -18 + i * 5], [5, -18 + i * 5]], '#5d7480', 1);
 dgRect(g, -10, 8, 20, 4, 1, '#dbe8ee'); for (const sx of [-1, 1]) for (const k of [0, 1]) dgLine(g, [[sx * (4 + k * 4), 12], [sx * (14 + k * 8), 24], [sx * (12 + k * 10), 36]], '#dbe8ee', 1.4);
 g.restore();
}
function dgChromosome(g, x, y, s = 1, color = '#ff8fd0', rot = 0, single = false) {
 g.save(); g.translate(x, y); g.rotate(rot); g.lineCap = 'round';
 if (single) dgLine(g, [[0, -9 * s], [0, 9 * s]], color, 4 * s);
 else { dgLine(g, [[-6 * s, -10 * s], [0, 0], [-6 * s, 10 * s]], color, 4 * s); dgLine(g, [[6 * s, -10 * s], [0, 0], [6 * s, 10 * s]], color, 4 * s); dgCirc(g, 0, 0, 2.2 * s, '#fff2fb'); }
 g.lineCap = 'butt'; g.restore();
}

function dgMitosisCell(g, cx, cy, stage, r = 52) {
 const pink = '#ff8fd0', blue = '#8fd0ff';
   if (stage === 'telophase') {
    dgEll(g, cx - 28, cy, 42, 46, 0, '#1c4a5c', DGC.cytoEdge, 3); dgEll(g, cx + 28, cy, 42, 46, 0, '#1c4a5c', DGC.cytoEdge, 3); dgRect(g, cx - 6, cy - 34, 12, 68, 4, '#1c4a5c');
    for (const s of [-1, 1]) { dgEll(g, cx + s * 34, cy, 18, 16, 0, '#3a2668', '#b48cff', 1.5); dgLine(g, [[cx + s * 34 - 8, cy - 4], [cx + s * 34 + 6, cy + 5]], pink, 2.4); dgLine(g, [[cx + s * 34 - 6, cy + 6], [cx + s * 34 + 7, cy - 6]], blue, 2.4); }
    return;
   }
   const stretch = stage === 'anaphase' ? 1.18 : 1;
   dgEll(g, cx, cy, r * stretch, r, 0, '#1c4a5c', DGC.cytoEdge, 3);
   const L = cx - r * stretch + 10, R = cx + r * stretch - 10;
   if (stage !== 'prophase') { dgCirc(g, L, cy, 3.5, '#ffe7a0'); dgCirc(g, R, cy, 3.5, '#ffe7a0'); }
   if (stage === 'prophase') {
    dgEll(g, cx, cy, r * .62, r * .56, 0, null, '#b48cff', 1.5, [4, 4]);
    [[-14, -12, .4], [12, -16, -.6], [-10, 14, -.3], [16, 12, .8]].forEach(([dx, dy, rot], i) => dgChromosome(g, cx + dx, cy + dy, .9, i % 2 ? blue : pink, rot));
    dgCirc(g, cx - 22, cy - r + 14, 3.5, '#ffe7a0'); dgCirc(g, cx - 8, cy - r + 10, 3.5, '#ffe7a0');
   } else if (stage === 'metaphase') {
    [-27, -9, 9, 27].forEach((dy, i) => { dgLine(g, [[L, cy], [cx - 6, cy + dy]], '#cfe3ff88', 1); dgLine(g, [[R, cy], [cx + 6, cy + dy]], '#cfe3ff88', 1); dgChromosome(g, cx, cy + dy, .85, i % 2 ? blue : pink, Math.PI / 2); });
   } else if (stage === 'anaphase') {
    [-24, -8, 8, 24].forEach((dy, i) => { const c = i % 2 ? blue : pink; for (const s of [-1, 1]) { const x = cx + s * r * .62; dgLine(g, [[s < 0 ? L : R, cy], [x, cy + dy * .8]], '#cfe3ff88', 1); g.save(); g.translate(x, cy + dy * .8); g.lineCap = 'round'; dgLine(g, [[-s * 9, -5], [0, 0], [-s * 9, 5]], c, 3.2); g.restore(); } });
   }
  }

/* ---------- the diagrams ---------- */
const DIAGRAMS = {
 /* overview animal cell; o.marks = {A:'nucleus', ...}; o.highlight = 'cytoplasm' */
 cell(g, o) {
  const cx = 320, cy = 136, rx = 212, ry = 106;
  dgEll(g, cx, cy, rx, ry, 0, o.highlight === 'cytoplasm' ? '#246a73' : DGC.cyto, null);
  if (o.highlight === 'cytoplasm') { dgEll(g, cx, cy, rx - 10, ry - 9, 0, null, '#7cf7df', 2, [6, 5]); }
  dgEll(g, cx, cy, rx, ry, 0, null, DGC.cytoEdge, 5);
  const r = dgSeeded(3); for (let i = 0; i < 46; i++) { const a = r() * 6.28, d = Math.sqrt(r()); const x = cx + Math.cos(a) * d * (rx - 16), y = cy + Math.sin(a) * d * (ry - 14); if (Math.hypot((x - 240) / 70, (y - 128) / 62) > 1.2) dgRibo(g, x, y, .8); }
  dgNucleus(g, 240, 128, 58, 50);
  dgRoughER(g, 240, 128, 70, -1.05, 1.05, 3);
  dgSmoothER(g, 360, 188, 96, 34);
  dgGolgi(g, 405, 66, 70, 52);
  dgVesicle(g, 488, 86, 6); dgVesicle(g, 470, 128, 5);
  dgMito(g, 150, 188, 74, 30, -.25); dgMito(g, 470, 172, 60, 26, .5);
  dgLyso(g, 150, 78, 15); dgLyso(g, 494, 128, 11);
  if (o.highlight === 'cytoplasm') dgText(g, 'shaded region', 120, 128, 11, '#7cf7df', 'center', 700);
  dgMarks(g, o.marks, {
   nucleus: [214, 110, 48, 96], roughER: [296, 58, 262, 16], smoothER: [400, 200, 592, 214], golgi: [440, 80, 592, 90],
   mito: [150, 188, 48, 214], lysosome: [150, 78, 48, 36], cytoplasm: [140, 140, 48, 150], membrane: [530, 140, 592, 150]
  });
  dgCaption(g, 'Animal cell (simplified, not to scale)');
 },
 atp(g, o) {
  if (o.mode === 'molecule') {
   const y = 140;
   // adenine: hexagon + pentagon
   g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + Math.PI / 6; g.lineTo(105 + Math.cos(a) * 26, y + Math.sin(a) * 26); } g.closePath(); dgPath(g, '#3c8dff', '#bcd8ff', 2);
   g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + Math.PI; g.lineTo(148 + Math.cos(a) * 21, y + Math.sin(a) * 21); } g.closePath(); dgPath(g, '#2f6fd8', '#bcd8ff', 2);
   dgLine(g, [[166, y], [210, y + 22]], '#cfe3ff', 3);
   // ribose
   g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 - Math.PI / 2; g.lineTo(235 + Math.cos(a) * 26, y + 22 + Math.sin(a) * 26); } g.closePath(); dgPath(g, '#f4a742', '#ffe0a8', 2);
   const P = [[320, y], [395, y], [470, y]];
   dgLine(g, [[258, y + 16], [296, y]], '#cfe3ff', 3); dgLine(g, [[344, y], [371, y]], '#cfe3ff', 3);
   // high-energy bond to the last phosphate, drawn as a wavy line
   g.beginPath(); for (let i = 0; i <= 20; i++) { const xx = 419 + i * 1.35; g.lineTo(xx, y + Math.sin(i / 20 * Math.PI * 3) * 5); } dgPath(g, null, '#ffd36b', 3);
   P.forEach(([px, py]) => { dgCirc(g, px, py, 24, '#ffd84a', '#7a5a10', 2); dgText(g, 'P', px, py + 1, 18, '#3a2a05', 'center', 850); });
   dgText(g, 'phosphate groups', 395, y + 42, 12, DGC.soft);
   dgText(g, 'ATP  (adenosine triphosphate)', 320, 30, 15, DGC.ink, 'center', 750);
   dgMarks(g, o.marks, { adenine: [105, 125, 70, 60], ribose: [235, 170, 235, 222], bond: [432, 136, 470, 70] });
   dgCaption(g, 'Simplified structure — real ATP has many more atoms');
   return;
  }
  // ATP ⇄ ADP + P cycle
  const mini = (x, y, n) => { dgRect(g, x - 40, y - 10, 18, 20, 4, '#3c8dff'); dgRect(g, x - 20, y - 10, 18, 20, 4, '#f4a742'); for (let i = 0; i < n; i++) dgCirc(g, x + 9 + i * 18, y, 8, '#ffd84a', '#7a5a10', 1.4); };
  mini(150, 135, 3); dgText(g, 'ATP', 165, 105, 18, DGC.ink, 'center', 800); dgText(g, 'charged', 165, 160, 11, DGC.soft);
  if (o.hide === 'products') { dgRect(g, 420, 112, 120, 46, 8, '#102236', '#ffd36b', 2, [5, 4]); dgText(g, '?', 480, 135, 24, '#ffd36b', 'center', 850); }
  else { mini(455, 135, 2); dgText(g, '+', 512, 135, 18); dgCirc(g, 530, 135, 8, '#ffd84a', '#7a5a10', 1.4); dgText(g, 'ADP  +  P', 480, 105, 18, DGC.ink, 'center', 800); dgText(g, 'discharged', 480, 160, 11, DGC.soft); }
  dgCurveArrow(g, 205, 112, 320, 50, 425, 108, '#ffd36b', 3);
  dgArrow(g, 320, 80, 320, 30, '#ff8f70', 3); dgText(g, 'energy released → powers pumps, movement, building', 320, 18, 12, '#ffb49e', 'center', 700);
  dgCurveArrow(g, 425, 162, 320, 222, 205, 160, '#7cf7df', 3);
  if (o.hide === 'energyIn') { dgArrow(g, 320, 262, 320, 210, '#7cf7df', 3); dgQ(g, 360, 246, 13); dgText(g, 'energy in from…', 300, 246, 12, '#9ef6e6', 'right', 700); }
  else { dgArrow(g, 320, 262, 320, 210, '#7cf7df', 3); dgText(g, 'energy in from breaking down food (glucose)', 336, 250, 12, '#9ef6e6', 'left', 700); }
  dgCaption(g, 'The ATP cycle');
 },
 translation(g, o) {
  const codons = o.codons || ['AUG', 'GGC', 'UUU', 'UAA'], cw = 3 * 26 + 6, x0 = 120, my = 196;
  dgLine(g, [[30, my + 11], [610, my + 11]], '#c9b0ff', 2);
  codons.forEach((c, i) => {
   const x = x0 + i * (cw + 18); dgBases(g, c, x, my, 24, 22, 2);
   if (o.stop && i === o.at) dgRect(g, x - 4, my - 4, 3 * 26 + 4, 30, 5, null, '#ff6b7f', 2.5);
   if (o.bracket === i) { dgRect(g, x - 5, my - 6, 3 * 26 + 6, 34, 5, null, '#ffd36b', 2.5, [5, 4]); }
  });
  dgText(g, 'mRNA', 26, my + 11, 12, '#c9b0ff', 'left', 750); dgText(g, '5′', 22, my - 8, 10, DGC.soft); dgText(g, '3′', 616, my - 8, 10, DGC.soft);
  if (o.at >= 0) {
   const x = x0 + o.at * (cw + 18) + 38;
   // ribosome: large subunit above, small below the mRNA
   dgEll(g, x, my - 46, 92, 58, 0, '#b8384d', '#ff8a9a', 2.5); dgEll(g, x, my + 30, 78, 24, 0, '#d9566a', '#ff9aaa', 2.5);
   dgBases(g, codons[o.at], x - 39, my, 24, 22, 2);
   if (o.trna) dgTRNA(g, x, my - 16, o.trna, o.aa, .95);
   if (o.chain && o.chain.length) {
    let px = x - 30, py = my - 112;
    o.chain.slice().reverse().forEach((aa, i) => { const cx2 = px - i * 30, cy2 = py - Math.sin(i) * 10; if (i) dgLine(g, [[cx2 + 30, cy2 - Math.sin(i - 1) * 0], [cx2, cy2]], '#ffd36b', 3); dgCirc(g, cx2, cy2, 12, '#ffd36b', '#7a5a10', 2); dgText(g, aa, cx2, cy2, 9, '#2b1d04', 'center', 800); });
    if (!o.marks) dgText(g, 'growing protein chain', x - 70, my - 140, 11, '#ffe39b', 'center', 700);
   }
   if (!o.marks) dgLabel(g, 'ribosome', x + 80, my - 80, 560, 40, 'left');
   dgMarks(g, o.marks, { anticodon: [x + 14, my - 11, x + 140, my - 56], aa: [x + 10, my - 100, x + 140, my - 128], codon: [x + 24, my + 18, x + 140, my + 52] });
  }
  dgCaption(g, 'Translation at the ribosome');
 },
 er(g, o) {
  if (o.mode === 'zoom') {
   dgRect(g, 30, 128, 580, 22, 10, DGC.rer, DGC.rerEdge, 2); dgRect(g, 30, 150, 580, 70, 0, '#3a1f12', null); dgRect(g, 30, 220, 580, 22, 10, DGC.rer, DGC.rerEdge, 2);
   dgText(g, 'inside the ER (lumen)', 370, 200, 12, '#ffcfa6', 'center', 700);
   dgLine(g, [[30, 92], [610, 92]], '#c9b0ff', 2); dgText(g, 'mRNA', 40, 80, 11, '#c9b0ff', 'left', 700);
   [130, 290, 450].forEach((x, i) => {
    dgEll(g, x, 104, 30, 16, 0, '#d9566a', '#ff9aaa', 2); dgEll(g, x, 80, 22, 13, 0, '#b8384d', '#ff8a9a', 2);
    g.beginPath(); g.moveTo(x, 118); for (let k = 0; k < 9; k++) g.lineTo(x + (k % 2 ? 7 : -7), 128 + k * 7 + i * 2); dgPath(g, null, '#ffd36b', 2.4);
   });
   dgLabel(g, '?', 130, 104, 70, 40, 'right', 18, '#ffd36b');
   dgLabel(g, 'new protein chain entering the ER', 452, 172, 606, 250, 'right', 11);
   dgLabel(g, 'ER membrane', 600, 139, 610, 112, 'right', 11);
   dgCaption(g, 'Zoomed-in view of rough ER');
   return;
  }
  // route: nucleus edge → rough ER → vesicle → ?
  g.save(); g.beginPath(); g.rect(0, 0, 150, DGH); g.clip(); dgNucleus(g, 40, 135, 90, 105); g.restore();
  dgText(g, 'nucleus', 60, 135, 12, '#e3d0ff', 'center', 700);
  dgRoughER(g, 40, 135, 112, -.75, .75, 3);
  dgVesicle(g, 300, 135, 16, DGC.rer, DGC.rerEdge); g.beginPath(); g.moveTo(292, 135); for (let k = 0; k < 4; k++) g.lineTo(296 + k * 4, 130 + (k % 2) * 10); dgPath(g, null, '#ffd36b', 2);
  dgLabel(g, 'vesicle with a new protein', 300, 120, 300, 46, 'center', 12);
  dgArrow(g, 325, 135, 470, 135, DGC.ink, 3, [7, 6]);
  dgRect(g, 480, 85, 120, 100, 12, '#102236', '#ffd36b', 2, [6, 5]); dgText(g, '?', 540, 135, 34, '#ffd36b', 'center', 850);
  dgLabel(g, 'rough ER', 150, 208, 220, 248, 'left', 12);
  dgCaption(g, 'Shipping route for a new protein');
 },
 golgi(g, o) {
  if (o.mode === 'tags') {
   dgGolgi(g, 230, 70, 180, 130);
   dgVesicle(g, 120, 150, 16, DGC.rer, DGC.rerEdge); dgText(g, 'from ER', 120, 182, 11, DGC.soft);
   dgArrow(g, 140, 140, 210, 110, DGC.ink, 2.5);
   const prot = (x, y, tag) => { g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x - 3, y - 8, x, y); g.quadraticCurveTo(x + 3, y + 8, x + 9, y); dgPath(g, null, '#4fb2ff', 3); if (tag) { dgLine(g, [[x + 9, y], [x + 16, y - 9]], '#ff6fb0', 2); dgCirc(g, x + 17, y - 11, 3, '#ff6fb0'); dgCirc(g, x + 23, y - 15, 3, '#ff9fd0'); } };
   prot(120, 150, false);
   prot(270, 86, false); prot(310, 112, true); prot(330, 140, true);
   dgVesicle(g, 500, 120, 18); prot(495, 122, true);
   dgArrow(g, 420, 120, 474, 120, DGC.ink, 2.5);
   dgLabel(g, 'chemical tag\n(sugar chain)', 352, 128, 420, 210, 'left', 11, '#ffb7da');
   dgLabel(g, 'Golgi apparatus', 320, 70, 320, 30, 'center', 12);
   dgText(g, 'tagged protein ready to ship', 500, 155, 11, DGC.soft);
   dgCaption(g, 'Proteins are modified as they move through the Golgi');
   return;
  }
  // routes from the Golgi to three destinations
  dgGolgi(g, 60, 70, 120, 110); dgText(g, 'Golgi', 120, 200, 12, '#ffe7a0', 'center', 750);
  dgVesicle(g, 222, 125, 15); dgRect(g, 160, 26, 130, 30, 6, '#102236', '#ffd36b', 1.5); dgText(g, 'Cargo: ' + (o.cargo || 'protein'), 225, 41, 11, '#ffe39b', 'center', 750);
  dgLine(g, [[222, 110], [222, 58]], '#ffd36b', 1.2);
  const dest = { outside: 'out of the cell', membrane: 'into the membrane', lysosome: 'to a lysosome' };
  const ys = [60, 135, 210];
  Object.entries(o.routes || { A: 'outside', B: 'membrane', C: 'lysosome' }).forEach(([letter, kind], i) => {
   const y = ys[i]; dgArrow(g, 245, 125, 420, y, '#cfe3ff', 2.4, [6, 5]);
   const ix = 440;
   if (kind === 'lysosome') dgLyso(g, ix + 12, y, 22);
   else {
    dgRect(g, ix, y - 26, 12, 52, 3, DGC.lipidHead); dgRect(g, ix + 12, y - 26, 8, 52, 0, DGC.lipidTail); dgRect(g, ix + 20, y - 26, 12, 52, 3, DGC.lipidHead);
    if (kind === 'membrane') dgRect(g, ix + 1, y - 10, 30, 20, 6, DGC.protein, '#a8d4ff', 1.5);
    else { for (let k = 0; k < 4; k++) dgCirc(g, ix + 52 + (k % 2) * 10, y - 12 + k * 8, 3.2, '#4fb2ff'); dgArrow(g, ix + 34, y, ix + 70, y, '#4fb2ff', 1.8); }
   }
   dgText(g, dest[kind], 520, y, 12, DGC.ink, 'left', 650);
   if (!o.named) dgMark(g, letter, 245 + (420 - 245) * .58, 125 + (y - 125) * .58);
  });
  dgCaption(g, 'Where should the Golgi send this vesicle?');
 },
 cytosol(g, o) {
  dgRect(g, 20, 16, 600, o.mode === 'diffusion' ? 214 : 230, 18, '#123f52', '#7cf7df', 2);
  const r = dgSeeded(11);
  const water = (x, y) => { dgCirc(g, x, y, 3.2, '#7ab8ff'); dgCirc(g, x - 3.4, y + 2.6, 1.8, '#e8f4ff'); dgCirc(g, x + 3.4, y + 2.6, 1.8, '#e8f4ff'); };
  if (o.mode === 'diffusion') {
   dgLine(g, [[320, 30], [320, 232]], '#7cf7df', 1, [4, 6]);
   for (let i = 0; i < 46; i++) dgGlucose(g, 40 + r() * 260, 36 + r() * 170, 6);
   for (let i = 0; i < 6; i++) dgGlucose(g, 340 + r() * 260, 36 + r() * 170, 6);
   dgText(g, 'crowded side', 170, 252, 12, DGC.ink); dgText(g, 'less crowded side', 470, 252, 12, DGC.ink);
   dgCaption(g, '');
   return;
  }
  for (let i = 0; i < 70; i++) { const x = 36 + r() * 568, y = 30 + r() * 200; if (o.mode === 'glycolysis' && x > 120 && x < 520 && y > 70 && y < 200) continue; water(x, y); }
  if (o.mode === 'contents') {
   for (let i = 0; i < 6; i++) dgGlucose(g, 60 + r() * 520, 40 + r() * 180, 7);
   for (let i = 0; i < 6; i++) { const x = 60 + r() * 520, y = 40 + r() * 180; dgCirc(g, x, y, 5, '#ffb04a'); dgText(g, i % 2 ? '+' : '−', x, y, 9, '#2b1704', 'center', 900); }
   for (let i = 0; i < 4; i++) { const x = 80 + r() * 480, y = 50 + r() * 160; dgEll(g, x, y, 14, 9, r() * 3, '#c46ad6', '#f2b7ff', 1.5); }
   // legend
   dgRect(g, 440, 186, 170, 52, 8, '#0c2533e6', '#4b8c9a', 1);
   water(456, 200); dgText(g, 'water', 466, 200, 11, DGC.ink, 'left'); dgGlucose(g, 526, 200, 6); dgText(g, 'sugars', 536, 200, 11, DGC.ink, 'left');
   dgCirc(g, 456, 222, 5, '#ffb04a'); dgText(g, 'salts (ions)', 466, 222, 11, DGC.ink, 'left'); dgEll(g, 540, 222, 9, 6, 0, '#c46ad6'); dgText(g, 'proteins', 552, 222, 11, DGC.ink, 'left');
   dgCaption(g, 'Zoomed-in view of cytosol');
   return;
  }
  // glycolysis
  dgGlucose(g, 170, 120, 26); dgText(g, 'glucose', 170, 162, 12, '#ffe7a0', 'center', 750); dgText(g, '6 carbons', 170, 178, 10, DGC.soft);
  dgArrow(g, 210, 120, 330, 120, DGC.ink, 3); dgText(g, 'glycolysis', 270, 104, 12, '#9ef6e6', 'center', 750);
  for (const y of [90, 150]) { g.beginPath(); g.moveTo(370, y); g.lineTo(395, y - 14); g.lineTo(420, y); g.lineTo(395, y + 14); g.closePath(); dgPath(g, '#ffb04a', '#7a4410', 1.5); }
  dgText(g, '2 pyruvate', 395, 186, 12, '#ffcf9a', 'center', 750); dgText(g, '+ 2 ATP', 470, 120, 14, '#ffd36b', 'center', 800);
  dgMark(g, '?', 560, 60); dgText(g, 'You are here', 560, 86, 11, '#ffe39b', 'center', 700);
  dgCaption(g, 'Glucose is split before the mitochondria get involved');
 },
 membrane(g, o) {
  const top = 98;
  if (o.mode === 'parts') {
   dgBilayer(g, 40, 600, top, [[300, 340]]);
   dgRect(g, 296, top - 12, 48, 70, 12, DGC.protein, '#a8d4ff', 2); dgRect(g, 314, top - 12, 12, 70, 4, '#0d2a4a');
   for (let i = 0; i < 9; i++) { dgCirc(g, 60 + i * 64, 50 + (i % 2) * 10, 3, '#7ab8ff'); dgCirc(g, 80 + i * 64, 196 + (i % 2) * 10, 3, '#7ab8ff'); }
   dgText(g, 'water outside the cell', 30, 28, 11, '#9fd0ff', 'left', 650); dgText(g, 'water inside the cell', 30, 240, 11, '#9fd0ff', 'left', 650);
   if (o.marks) dgMarks(g, o.marks, { head: [196, top, 196, 40], tails: [460, top + 24, 560, 24], protein: [330, top + 50, 400, 232] });
   else { dgLabel(g, 'phosphate heads (attracted to water)', 196, top, 230, 22, 'left', 11); dgLabel(g, 'fatty-acid tails (avoid water)', 460, top + 24, 470, 232, 'left', 11); dgLabel(g, 'transport protein', 330, top - 12, 470, 56, 'left', 11); }
   dgCaption(g, 'Phospholipid bilayer');
   return;
  }
  const isPump = o.mode === 'pump', barrier = o.mode === 'barrier';
  dgBilayer(g, 40, 600, top, barrier ? [] : [[296, 344]]);
  if (!barrier) {
   if (isPump) { dgRect(g, 292, top - 18, 56, 82, 16, DGC.pump, '#d7c2ff', 2); dgRect(g, 296, top + 76, 48, 22, 6, '#ffd84a', '#7a5a10', 1.5); dgText(g, 'ATP', 320, top + 87, 12, '#3a2a05', 'center', 850); dgArrow(g, 320, top + 76, 320, top + 66, '#ffd84a', 2); }
   else { dgRect(g, 296, top - 12, 48, 70, 12, DGC.protein, '#a8d4ff', 2); dgRect(g, 314, top - 12, 12, 70, 4, '#0d2a4a'); }
  }
  dgText(g, 'OUTSIDE the cell', 40, 26, 12, '#9fd0ff', 'left', 800); dgText(g, 'INSIDE the cell', 40, 246, 12, '#9fd0ff', 'left', 800);
  if (barrier) {
   dgCirc(g, 220, 50, 13, '#ff6fa8', '#ffd0e4', 2); dgText(g, '+', 220, 50, 15, '#3a0820', 'center', 900); dgLine(g, [[220, 64], [232, top - 12]], '#ff6fa8', 2, [4, 3]); dgText(g, '✕', 240, top - 14, 18, '#ff6b7f', 'center', 900);
   dgLabel(g, 'charged toxin', 234, 44, 290, 36, 'left', 11);
   dgCirc(g, 450, 60, 6, '#9fe8ff'); dgCirc(g, 461, 60, 6, '#9fe8ff'); dgArrow(g, 456, 72, 456, 200, '#9fe8ff', 2, [5, 4]); dgCirc(g, 450, 214, 6, '#9fe8ff'); dgCirc(g, 461, 214, 6, '#9fe8ff');
   dgText(g, 'O₂ slips through', 470, 60, 11, '#c8f2ff', 'left', 700);
   return;
  }
  const r = dgSeeded(isPump ? 5 : 9), out = o.outside ?? 8, ins = o.inside ?? 2;
  for (let i = 0; i < out; i++) { let x; do x = 60 + r() * 520; while (Math.abs(x - 320) < 50 || (x > 400 && x < 540)); dgGlucose(g, x, 40 + r() * 34, 7); }
  for (let i = 0; i < ins; i++) { let x; do x = 60 + r() * 520; while (Math.abs(x - 320) < 60); dgGlucose(g, x, 176 + r() * 48, 7); }
  dgText(g, out + ' molecules', 600, 26, 12, '#ffe7a0', 'right', 750); dgText(g, ins + ' molecules', 600, 246, 12, '#ffe7a0', 'right', 750);
  dgLabel(g, isPump ? 'pump protein' : 'channel protein', 340, top - 8, 410, 50, 'left', 11);
  dgCaption(g, '');
 },
 mito(g, o) {
  if (o.mode === 'gradient') {
   dgRect(g, 20, 120, 600, 34, 6, '#f7b26a', '#ffd6a8', 2);
   dgText(g, 'space between the membranes', 30, 30, 12, '#ffcf9a', 'left', 750); dgText(g, 'matrix (inside)', 30, 240, 12, '#ffcf9a', 'left', 750);
   const r = dgSeeded(4); for (let i = 0; i < 26; i++) { const x = 40 + r() * 400, y = 50 + r() * 58; dgCirc(g, x, y, 7, '#ff6b8a'); dgText(g, 'H⁺', x, y, 7.5, '#fff', 'center', 800); }
   for (let i = 0; i < 4; i++) { const x = 230 + r() * 190, y = 182 + r() * 40; dgCirc(g, x, y, 7, '#ff6b8a'); dgText(g, 'H⁺', x, y, 7.5, '#fff', 'center', 800); }
   dgRect(g, 120, 112, 50, 50, 10, '#4f8fe0', '#a8d4ff', 2); dgArrow(g, 145, 190, 145, 92, '#ffd36b', 2.5); dgText(g, 'electron transport', 145, 206, 11, '#cfe3ff');
   // ATP synthase
   dgRect(g, 500, 112, 26, 50, 4, '#6f5ad8', '#cbbcff', 2); dgEll(g, 513, 186, 30, 20, 0, '#8a74f0', '#cbbcff', 2); dgArrow(g, 513, 70, 513, 160, '#ff6b8a', 3);
   dgText(g, 'ATP synthase', 620, 112, 12, '#e3dcff', 'right', 750);
   dgText(g, 'ADP + P  →', 590, 236, 12, DGC.ink, 'right', 700); dgQ(g, 614, 236, 12); dgLine(g, [[530, 200], [560, 222]], DGC.lead, 1.2);
   dgCaption(g, '');
   return;
  }
  if (o.mode === 'equation') {
   dgMito(g, 320, 135, 190, 74, 0);
   dgArrow(g, 60, 90, 205, 120, DGC.ink, 2.5); dgText(g, 'glucose', 60, 76, 13, '#ffe7a0', 'center', 750);
   dgArrow(g, 60, 190, 205, 152, DGC.ink, 2.5); if (o.full) dgText(g, 'O₂ (oxygen)', 64, 206, 13, '#9fe8ff', 'center', 750); else { dgQ(g, 60, 206, 14); dgText(g, 'gas', 92, 206, 12, DGC.soft, 'left'); }
   dgArrow(g, 435, 120, 560, 70, DGC.ink, 2.5); dgText(g, 'CO₂', 585, 64, 13, '#cfe3ff', 'center', 750);
   dgArrow(g, 435, 135, 560, 135, DGC.ink, 2.5); dgText(g, 'H₂O', 585, 135, 13, '#9fd0ff', 'center', 750);
   dgArrow(g, 435, 150, 560, 200, '#ffd36b', 3); dgText(g, 'lots of ATP', 585, 214, 13, '#ffd36b', 'center', 800);
   dgCaption(g, 'Aerobic cellular respiration');
   return;
  }
  dgMito(g, 320, 132, 470, 160, 0);
  dgCirc(g, 250, 150, 12, null, '#ffe3c9', 1.5); for (let i = 0; i < 12; i++) dgRibo(g, 180 + i * 26, 128 + (i % 3) * 10, .8);
  if (o.marks) dgMarks(g, o.marks, { outer: [200, 53, 120, 24], inner: [376, 92, 480, 24], matrix: [430, 160, 540, 236] });
  else { dgLabel(g, 'outer membrane', 200, 53, 120, 24, 'center', 11); dgLabel(g, 'inner membrane (folded into cristae)', 376, 92, 470, 20, 'center', 11); dgLabel(g, 'matrix', 430, 160, 540, 236, 'center', 11); }
  dgCaption(g, 'Mitochondrion (cut open)');
 },
 nucleus(g, o) {
  if (o.mode === 'transcription') {
   g.save(); g.beginPath(); g.rect(0, 0, 400, DGH); g.clip(); dgNucleus(g, 150, 135, 230, 120, { chromatin: false, nucleolus: false }); g.restore();
   dgText(g, 'NUCLEUS', 60, 40, 12, '#e3d0ff', 'left', 800); dgText(g, 'CYTOPLASM', 470, 40, 12, '#9ef6e6', 'left', 800);
   // DNA unwinding with mRNA peeling off
   for (let i = 0; i < 16; i++) { const x = 60 + i * 16, open = i > 5 && i < 11; const a = 135 - (open ? 18 : 6), b = 135 + (open ? 18 : 6); dgLine(g, [[x, a], [x, b]], open ? '#2a3d55' : '#c9d6e8', 3); }
   dgLine(g, [[52, 129], [150, 129], [165, 117], [225, 117], [240, 129], [320, 129]], '#3d7bf0', 3); dgLine(g, [[52, 141], [150, 141], [165, 153], [225, 153], [240, 141], [320, 141]], '#3d7bf0', 3);
   // the envelope's right edge is at x≈380 around mid-height; draw a pore there and send the mRNA through it
   g.fillStyle = '#0d1d30'; g.fillRect(372, 176, 14, 14); dgLine(g, [[372, 175], [386, 175]], '#e4d0ff', 2.5); dgLine(g, [[372, 191], [386, 191]], '#e4d0ff', 2.5);
   g.beginPath(); g.moveTo(170, 160); g.quadraticCurveTo(240, 196, 300, 186); g.quadraticCurveTo(340, 180, 378, 183); dgPath(g, null, '#b67be9', 4);
   dgArrow(g, 378, 183, 478, 183, '#b67be9', 3);
   dgEll(g, 528, 172, 36, 22, 0, '#b8384d', '#ff8a9a', 2); dgEll(g, 528, 192, 30, 10, 0, '#d9566a', '#ff9aaa', 2);
   dgLabel(g, 'DNA (the gene)', 110, 129, 110, 82, 'center', 11); dgLabel(g, 'mRNA copy', 260, 192, 240, 236, 'center', 11); dgLabel(g, 'nuclear pore', 379, 192, 420, 240, 'left', 11); dgLabel(g, 'ribosome', 546, 160, 570, 110, 'center', 11);
   dgCaption(g, '');
   return;
  }
  dgNucleus(g, 320, 135, 200, 104, { hiChromatin: o.highlight === 'chromatin' });
  if (o.marks) dgMarks(g, o.marks, { envelope: [320, 27, 140, 24], pore: [520, 135, 600, 135], nucleolus: [376, 116, 500, 236] });
  else { dgLabel(g, 'nuclear envelope (double membrane)', 320, 27, 200, 16, 'center', 11); dgLabel(g, 'nuclear pore', 520, 135, 600, 135, 'right', 11); dgLabel(g, 'nucleolus', 376, 116, 500, 236, 'center', 11); dgLabel(g, 'chromatin (DNA)', 230, 150, 120, 236, 'center', 11); }
  if (o.highlight === 'chromatin') dgText(g, 'highlighted threads', 320, 252, 11, '#7cf7df', 'center', 750);
  dgCaption(g, 'Nucleus');
 },
 smoothER(g, o) {
  if (o.mode === 'liver') {
   dgRect(g, 70, 24, 500, 210, 30, DGC.cyto, DGC.cytoEdge, 4);
   dgNucleus(g, 160, 130, 46, 40, { pores: true });
   dgSmoothER(g, 230, 40, 140, 70); dgSmoothER(g, 250, 140, 160, 70); dgSmoothER(g, 400, 70, 140, 80);
   const pill = (x, y) => { dgRect(g, x - 12, y - 6, 24, 12, 6, '#ff7a7a', '#ffd0d0', 1.2); dgRect(g, x, y - 6, 12, 12, 0, '#f2f2f2'); dgRect(g, x - 12, y - 6, 24, 12, 6, null, '#ffd0d0', 1.2); };
   pill(40, 70); pill(40, 120); dgArrow(g, 56, 96, 110, 104, DGC.ink, 2);
   dgText(g, 'drugs & alcohol in', 40, 46, 11, DGC.ink, 'left', 700);
   dgText(g, 'broken down → removed', 600, 252, 11, '#9ef6e6', 'right', 700);
   dgText(g, 'liver cell', 570, 14, 11, '#ffb7da', 'right', 700);
   dgCaption(g, 'Liver cell (simplified)');
   return;
  }
  if (o.mode === 'calcium') {
   for (let i = 0; i < 4; i++) { const y = 40 + i * 52; dgRect(g, 40, y, 560, 34, 16, '#b9455e', '#ff9aaf', 2); for (let x = 60; x < 590; x += 34) dgLine(g, [[x, y + 4], [x, y + 30]], '#7a2236', 2); }
   for (let i = 0; i < 4; i++) dgSmoothER(g, 60 + i * 140, 70 + (i % 2) * 52, 120, 26);
   const r = dgSeeded(8); for (let i = 0; i < 18; i++) { const x = 80 + r() * 480, y = 60 + r() * 150; dgCirc(g, x, y, 7, '#e7f7ff', '#7fb8d8', 1.2); dgText(g, 'Ca', x, y, 6.5, '#123', 'center', 800); }
   dgLabel(g, 'smooth ER (sarcoplasmic reticulum)', 190, 96, 190, 18, 'center', 11); dgLabel(g, 'Ca²⁺ released', 330, 150, 470, 18, 'center', 11);
   dgText(g, 'muscle fibers  →', 584, 252, 11, '#ffb7c6', 'right', 700); dgQ(g, 606, 252, 11);
   dgCaption(g, '');
   return;
  }
  // lipids made → sent to "?"
  dgSmoothER(g, 50, 60, 200, 120);
  dgLabel(g, 'smooth ER', 150, 70, 150, 26, 'center', 12);
  for (let i = 0; i < 5; i++) dgPhospholipid(g, 290 + i * 14, 120 + (i % 2) * 6, true, 1);
  dgText(g, 'lipids (phospholipids)', 320, 176, 11, '#ffd9a8', 'center', 700);
  dgArrow(g, 370, 128, 470, 128, DGC.ink, 3, [7, 6]);
  dgRect(g, 480, 80, 120, 96, 12, '#102236', '#ffd36b', 2, [6, 5]); dgText(g, '?', 540, 128, 34, '#ffd36b', 'center', 850);
  dgCaption(g, 'Lipids built here are used to build…');
 },
 lysosome(g, o) {
  if (o.mode === 'ph') {
   dgLyso(g, 170, 86, 46); dgText(g, 'lysosome', 170, 24, 13, '#ffb7c6', 'center', 750); dgText(g, 'pH ≈ 5', 250, 92, 16, '#fff', 'left', 850);
   dgText(g, 'cytosol', 470, 70, 13, '#9ef6e6', 'center', 750); dgText(g, 'pH ≈ 7.2', 470, 100, 16, '#fff', 'center', 850);
   const gr = g.createLinearGradient(40, 0, 600, 0); ['#e8333b', '#f27a2b', '#f4c534', '#8fcf43', '#34b26a', '#2e9ad4', '#4c55c8', '#7a3fb8'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
   dgRect(g, 40, 196, 560, 22, 6, null); g.fillStyle = gr; g.fill();
   for (let p = 0; p <= 14; p += 1) { const x = 40 + p / 14 * 560; dgLine(g, [[x, 218], [x, 224]], DGC.soft, 1); if (p % 2 === 0) dgText(g, String(p), x, 234, 10, DGC.soft); }
   dgText(g, 'acidic', 44, 182, 11, '#ff9a9a', 'left', 700); dgText(g, 'neutral', 320, 182, 11, '#bfe8a8', 'center', 700); dgText(g, 'basic', 596, 182, 11, '#c0b0ff', 'right', 700);
   dgArrow(g, 170, 136, 40 + 5 / 14 * 560, 194, '#ff8fb0', 2); dgArrow(g, 470, 124, 40 + 7.2 / 14 * 560, 194, '#9ef6e6', 2);
   dgCaption(g, '');
   return;
  }
  if (o.mode === 'burst') {
   dgRect(g, 30, 20, 580, 230, 30, DGC.cyto, DGC.cytoEdge, 4);
   dgMito(g, 140, 80, 90, 36, -.2); dgMito(g, 470, 190, 90, 36, .3); dgNucleus(g, 480, 80, 60, 46);
   g.beginPath(); g.arc(300, 150, 46, .4, 5.6); dgPath(g, DGC.lyso, DGC.lysoEdge, 2.5);
   dgText(g, '!', 300, 150, 30, '#ffd36b', 'center', 900);
   const r = dgSeeded(2); for (let i = 0; i < 16; i++) { const a = -.6 + r() * 1.2, d = 50 + r() * 110; const x = 300 + Math.cos(a) * d, y = 150 + Math.sin(a) * d * .7; dgCirc(g, x, y, 3, '#ffd0dc'); }
   dgLabel(g, 'enzymes leaking out', 360, 150, 430, 240, 'left', 11);
   dgLabel(g, 'lysosome bursting', 270, 118, 200, 230, 'center', 11);
   dgCaption(g, '');
   return;
  }
  // autophagy sequence
  dgMito(g, 100, 130, 100, 42, -.2, { worn: true }); dgText(g, 'worn-out mitochondrion', 100, 196, 11, DGC.soft);
  dgArrow(g, 160, 130, 205, 130, DGC.ink, 2.5);
  dgEll(g, 270, 130, 62, 40, 0, '#1e3f58', '#cfe3ff', 2.5); dgMito(g, 270, 130, 90, 36, -.2, { worn: true }); dgText(g, 'wrapped in a membrane', 270, 196, 11, DGC.soft);
  dgArrow(g, 336, 130, 380, 130, DGC.ink, 2.5);
  dgLyso(g, 432, 110, 34); dgEll(g, 432, 150, 36, 22, 0, '#5c2e44', '#cfe3ff', 2); dgText(g, 'joins a lysosome', 432, 196, 11, DGC.soft);
  dgArrow(g, 474, 130, 520, 130, DGC.ink, 2.5); dgQ(g, 560, 130, 18);
  dgCaption(g, 'Recycling a worn-out part');
 },
 dna(g, o) {
  if (o.mode === 'replication') {
   const old = '#3d7bf0', fresh = '#ff9a3c';
   dgLine(g, [[30, 112], [240, 112]], old, 5); dgLine(g, [[30, 158], [240, 158]], old, 5);
   for (let x = 40; x < 240; x += 16) dgLine(g, [[x, 116], [x, 154]], '#c9d6e8', 3);
   dgText(g, 'original DNA', 120, 90, 12, DGC.ink, 'center', 750);
   dgCurve(g, 240, 112, 290, 112, 330, 60, old, 5); dgCurve(g, 240, 158, 290, 158, 330, 210, old, 5);
   dgLine(g, [[330, 60], [560, 60]], old, 5); dgLine(g, [[350, 96], [560, 96]], fresh, 5); for (let x = 360; x < 560; x += 16) dgLine(g, [[x, 64], [x, 92]], '#c9d6e8', 3);
   dgLine(g, [[330, 210], [560, 210]], old, 5); dgLine(g, [[350, 174], [560, 174]], fresh, 5); for (let x = 360; x < 560; x += 16) dgLine(g, [[x, 178], [x, 206]], '#c9d6e8', 3);
   dgText(g, 'copy 1', 572, 78, 12, DGC.ink, 'left', 750); dgText(g, 'copy 2', 572, 192, 12, DGC.ink, 'left', 750);
   dgRect(g, 30, 214, 210, 44, 8, '#0c2533e6', '#4b8c9a', 1); dgLine(g, [[44, 226], [74, 226]], old, 5); dgText(g, 'original strand', 82, 226, 11, DGC.ink, 'left'); dgLine(g, [[44, 246], [74, 246]], fresh, 5); dgText(g, 'newly built strand', 82, 246, 11, DGC.ink, 'left');
   dgCaption(g, '');
   return;
  }
  const pairs = o.pairs, n = pairs.length, w = 44, gap = 18, x0 = 320 - (n * (w + gap) - gap) / 2;
  dgLine(g, [[x0 - 30, 66], [x0 + n * (w + gap) + 10, 66]], '#7d93b0', 8); dgLine(g, [[x0 - 30, 206], [x0 + n * (w + gap) + 10, 206]], '#7d93b0', 8);
  pairs.forEach(([a, b], i) => {
   const x = x0 + i * (w + gap);
   dgRect(g, x, 72, w, 60, 5, BASE_COL[a], '#0b1424', 1.5); dgText(g, a, x + w / 2, 102, 22, '#fff', 'center', 850);
   const blank = b === '?';
   dgRect(g, x, 140, w, 60, 5, blank ? '#102236' : BASE_COL[b], blank ? '#ffd36b' : '#0b1424', 1.5, blank ? [5, 4] : null); dgText(g, b, x + w / 2, 170, 22, blank ? '#ffd36b' : '#fff', 'center', 850);
  });
  if (o.marks) for (const [letter, i] of Object.entries(o.marks)) dgMark(g, letter, x0 + i * (w + gap) + w / 2, 236);
  dgText(g, 'sugar-phosphate backbone', x0 - 34, 48, 11, DGC.soft, 'left');
  dgCaption(g, '');
 },
 rna(g, o) {
  if (o.mode === 'compare') {
   dgRect(g, 30, 22, 280, 220, 12, '#10233a', '#3d7bf0', 2); dgRect(g, 330, 22, 280, 220, 12, '#1a1638', '#a86cff', 2);
   dgText(g, 'DNA', 170, 44, 18, '#a8c8ff', 'center', 850); dgText(g, 'RNA', 470, 44, 18, '#d4b8ff', 'center', 850);
   dgBases(g, 'ATGC', 92, 80, 34, 34, 6); dgBases(g, 'A?GC', 392, 80, 34, 34, 6);
   dgText(g, 'two strands (double helix)', 170, 150, 12, DGC.ink); dgText(g, 'one strand', 470, 150, 12, DGC.ink);
   dgText(g, 'sugar: deoxyribose', 170, 178, 12, DGC.soft); dgText(g, 'sugar: ribose', 470, 178, 12, DGC.soft);
   dgText(g, 'stays in the nucleus', 170, 206, 12, DGC.soft); dgText(g, 'can leave the nucleus', 470, 206, 12, DGC.soft);
   dgCaption(g, '');
   return;
  }
  if (o.mode === 'transcribe') {
   const t = o.template || 'TAC';
   dgText(g, 'DNA template strand', 320, 40, 13, '#a8c8ff', 'center', 750); dgBases(g, t, 250, 56, 40, 40, 10);
   for (let i = 0; i < t.length; i++) dgLine(g, [[270 + i * 50, 100], [270 + i * 50, 140]], '#c9d6e8', 2, [4, 4]);
   dgBases(g, '???', 250, 144, 40, 40, 10); dgText(g, 'new mRNA', 320, 204, 13, '#d4b8ff', 'center', 750);
   dgEll(g, 470, 122, 60, 44, 0, '#24496e', '#8fc1ff', 2); dgText(g, 'RNA', 470, 114, 11, '#d6e9ff', 'center', 750); dgText(g, 'polymerase', 470, 130, 11, '#d6e9ff', 'center', 750);
   dgCaption(g, 'Transcription');
   return;
  }
  if (o.mode === 'strands') {
   // A: double helix
   for (let i = 0; i < 40; i++) { const y = 40 + i * 4.6, a = Math.sin(i / 6) * 32; dgCirc(g, 120 + a, y, 2.6, '#3d7bf0'); dgCirc(g, 120 - a, y, 2.6, '#7aa8ff'); if (i % 4 === 0) dgLine(g, [[120 - a, y], [120 + a, y]], '#c9d6e8', 1.5); }
   // B: single strand with bases
   g.beginPath(); for (let i = 0; i <= 30; i++) g.lineTo(320 + Math.sin(i / 5) * 22, 40 + i * 6); dgPath(g, null, '#a86cff', 4);
   'AUGCUA'.split('').forEach((b, i) => { const y = 52 + i * 29, x = 320 + Math.sin((y - 40) / 6 / 5) * 22; dgRect(g, x + 8, y - 8, 18, 16, 3, BASE_COL[b]); dgText(g, b, x + 17, y, 10, '#fff', 'center', 850); });
   // C: chain of amino acids
   const shapes = ['#ffd36b', '#7cf7df', '#ff8fb0', '#a8d4ff', '#c7f27a']; for (let i = 0; i < 7; i++) { const y = 46 + i * 28, x = 520 + (i % 2 ? 14 : -14); if (i) dgLine(g, [[520 + ((i - 1) % 2 ? 14 : -14), y - 28], [x, y]], '#cfe3ff', 2.5); dgCirc(g, x, y, 11, shapes[i % 5], '#0b1424', 1.5); }
   dgMarks(g, o.marks, { dna: [120, 140, 60, 236], rna: [320, 140, 380, 236], protein: [520, 140, 590, 236] });
   dgCaption(g, '');
   return;
  }
  // trio: mRNA, tRNA, ribosome (rRNA)
  dgEll(g, 290, 140, 120, 66, 0, '#b8384d', '#ff8a9a', 2.5); dgEll(g, 290, 238, 100, 20, 0, '#d9566a', '#ff9aaa', 2.5);
  dgLine(g, [[40, 210], [600, 210]], '#c9b0ff', 3); dgBases(g, 'AUGGGCUUU', 172, 199, 24, 22, 2, true);
  dgTRNA(g, 278, 196, 'CCG', 'Gly', .9);
  const named = !o.marks;
  if (named) { dgLabel(g, 'mRNA (message)', 480, 210, 560, 246, 'center', 11); dgLabel(g, 'tRNA (delivery)', 306, 150, 470, 60, 'left', 11); dgLabel(g, 'ribosome, built from rRNA', 190, 120, 110, 40, 'center', 11); }
  dgMarks(g, o.marks, { mrna: [500, 210, 560, 246], trna: [306, 150, 470, 60], rrna: [190, 120, 90, 50] });
  dgCaption(g, '');
 },
 mitosis(g, o) {
  const pink = '#ff8fd0', blue = '#8fd0ff';
  const cellAt = (cx, cy, stage, r = 52) => dgMitosisCell(g, cx, cy, stage, r);
  if (o.mode === 'count') {
   cellAt(140, 130, 'metaphase', 62); dgText(g, '4 chromosomes', 140, 214, 13, DGC.ink, 'center', 750); dgText(g, 'parent cell', 140, 232, 11, DGC.soft);
   dgArrow(g, 220, 130, 300, 130, DGC.ink, 3); dgText(g, 'mitosis', 260, 112, 12, '#9ef6e6', 'center', 750);
   for (const [x, y] of [[400, 80], [520, 180]]) { dgCirc(g, x, y, 44, '#1c4a5c', DGC.cytoEdge, 3); dgQ(g, x, y, 15); }
   dgText(g, 'daughter cells', 470, 252, 11, DGC.soft);
   dgCaption(g, '');
   return;
  }
  const cells = o.cells || [], n = cells.length, step = 600 / n;
  cells.forEach((st, i) => { const cx = 20 + step * (i + .5); cellAt(cx, 118, st, n > 3 ? 48 : 56); dgMark(g, 'ABCD'[i], cx, 222); });
  dgCaption(g, '');
 },
 crispr(g, o) {
  if (o.mode === 'guide') {
   dgText(g, 'guide RNA', 120, 52, 13, '#d4b8ff', 'left', 750); dgBases(g, o.guide, 220, 36, 30, 30, 6);
   Object.entries(o.targets).forEach(([letter, seq], i) => { const y = 106 + i * 52; dgMark(g, letter, 186, y + 15); dgBases(g, seq, 220, y, 30, 30, 6); dgText(g, 'DNA target', 430, y + 15, 12, DGC.soft, 'left'); });
   dgCaption(g, 'Which DNA target pairs with the guide RNA?');
   return;
  }
  if (o.mode === 'cut') {
   dgLine(g, [[30, 150], [610, 150]], '#3d7bf0', 6); dgLine(g, [[30, 178], [610, 178]], '#3d7bf0', 6); for (let x = 40; x < 610; x += 16) dgLine(g, [[x, 154], [x, 174]], '#c9d6e8', 2.5);
   dgEll(g, 320, 140, 150, 92, 0, '#0f6f69cc', '#6bf4dc', 3);
   dgLine(g, [[230, 136], [380, 136]], '#a86cff', 5); g.beginPath(); g.moveTo(230, 136); g.quadraticCurveTo(200, 90, 250, 70); g.quadraticCurveTo(290, 60, 300, 90); dgPath(g, null, '#a86cff', 5);
   dgQ(g, 410, 164, 15);
   dgLabel(g, 'Cas9 protein', 400, 70, 520, 40, 'left', 12); dgLabel(g, 'guide RNA', 260, 74, 140, 40, 'right', 12); dgLabel(g, 'DNA', 560, 164, 590, 230, 'center', 12); dgLabel(g, 'matching sequence', 300, 150, 250, 230, 'center', 11);
   dgCaption(g, '');
   return;
  }
  // library / phage: a bacterium with its CRISPR array
  dgRect(g, 150, 60, 440, 170, 85, '#2b5a3a', '#9ff2b4', 4);
  const cols = ['#ff8f70', '#7cf7df', '#ffd36b', '#c08cff'];
  dgText(g, 'bacterium', 370, 80, 12, '#cfffd9', 'center', 750);
  const ax = 220, ay = 150;
  for (let i = 0; i < 4; i++) { const x = ax + i * 58; g.beginPath(); g.moveTo(x, ay); g.lineTo(x + 8, ay - 9); g.lineTo(x + 16, ay); g.lineTo(x + 8, ay + 9); g.closePath(); dgPath(g, '#9aa8b8'); dgRect(g, x + 18, ay - 9, 38, 18, 3, cols[i]); }
  dgLabel(g, 'CRISPR array: saved virus DNA pieces', 330, 160, 330, 200, 'center', 11);
  if (o.mode === 'phage') {
   dgPhage(g, 92, 108, 1.4, .9);
   g.beginPath(); g.moveTo(130, 130); g.quadraticCurveTo(170, 150, 190, 110); g.quadraticCurveTo(215, 80, 240, 106); dgPath(g, null, cols[2], 3);
   dgEll(g, 500, 125, 40, 28, 0, '#0f6f69', '#6bf4dc', 2.5); dgLine(g, [[476, 125], [522, 125]], '#a86cff', 3);
   dgLabel(g, 'phage injecting its DNA', 92, 60, 60, 24, 'left', 11); dgLabel(g, 'Cas protein + guide RNA', 500, 100, 540, 40, 'center', 11);
  } else {
   [[60, 40, 0], [70, 180, 2], [610, 30, 1], [612, 170, 3]].forEach(([x, y, c], i) => { dgPhage(g, x, y + 20, .7, (i - 1.5) * .2); dgRect(g, x - 9, y + 46, 18, 6, 2, cols[c]); });
   dgText(g, 'viruses from earlier attacks', 90, 252, 11, DGC.soft, 'left');
  }
  dgCaption(g, '');
 }
};
function drawDiagram(canvas, name, o) {
 const g = canvas.getContext('2d'); g.setTransform(canvas.width / DGW, 0, 0, canvas.height / DGH, 0, 0); g.clearRect(0, 0, DGW, DGH);
 dgBg(g); (DIAGRAMS[name] || (() => {}))(g, o || {});
}
