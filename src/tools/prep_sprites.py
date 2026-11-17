"""Builds the fighter sprite atlases for Organelle Rangers 3 from the Cell Rescue art.

usage: python3 tools/prep_sprites.py CELLRESCUE_ASSETS_DIR OUT_DIR

For each Ranger sheet (4x4, the Cell Rescue frame order) it removes the background, keeps the
character, scales every frame by one factor (idle height = TARGET px), keeps each frame's
horizontal centre where the artist put it and stands the feet on a shared baseline.
Output: <id>.png, a 4x4 sheet of CELL_W x CELL_H cells, feet at BASE, centre at CELL_W/2.
Also writes <id>-portrait.png (busts for the select screen) and phage.png (4x2, boss scale).
"""
import sys, os, json
from collections import deque
import numpy as np
from PIL import Image

TARGET, CELL_W, CELL_H, BASE = 200, 320, 256, 248
DEFRINGE = os.environ.get("DEFRINGE", "1") == "1"
RANGERS = ['atp','ribosome','rougher','golgi','cytoplasm','membrane','mito','nucleus','smoother','lysosome','dna','rna','mitosis','crispr']

def pale0(rgb):
    return (rgb.min(-1) > 190) & (rgb.max(-1) - rgb.min(-1) < 35)

def _flood(passable, seed):
    """Everything in `passable` connected (4-way) to `seed`."""
    from scipy import ndimage
    lab, _ = ndimage.label(passable)
    ids = np.unique(lab[seed & passable]); ids = ids[ids > 0]
    return np.isin(lab, ids)

def clean(rgba, slate=False):
    h, w, _ = rgba.shape; rgb = rgba[..., :3].astype(int); a = rgba[..., 3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    border = np.zeros((h, w), bool); border[0] = border[-1] = True; border[:, 0] = border[:, -1] = True
    if slate: bg = _flood((a < 150) | ((r >= 45) & (r < 95) & (g >= 60) & (g < 118) & (b >= 90) & (b < 160) & (b - g > 18) & (g - r > 4)), border)
    else:
        # 1) transparent or near-white background, flooded in from the edges
        pale = (rgb.min(-1) > 195) & (rgb.max(-1) - rgb.min(-1) < 28)
        bg = _flood((a < 150) | pale, border)
        # 2) Some sheets (ribosome, golgi, membrane, lysosome, crispr) were exported with a soft, half-opaque
        # background matte (alpha ~180-225, tinted by the character); the characters are alpha >= ~235.
        # On those, soft pixels touching the background are background too. Vivid soft pixels (glows,
        # muzzle flashes) stay. Sheets with a clean transparent background skip this, so thin details survive.
        ring = np.concatenate([a[:3].ravel(), a[-3:].ravel(), a[:, :3].ravel(), a[:, -3:].ravel()])
        if np.median(ring) >= 120:
            vivid = (rgb.max(-1) - rgb.min(-1) > 100) & (a >= 150)
            soft = (a < 232) & ~vivid
            bg = bg | _flood(soft | bg, bg)
        # 3) background trapped between an arm and the body: a flat, pale patch tinted toward the suit
        # colour (the matte), unlike the artist's white suit parts, which are shaded and cool
        from scipy import ndimage
        lab, n = ndimage.label(~bg & pale0(rgb))
        for i in range(1, n + 1):
            s = lab == i
            if s.sum() < 100: continue
            px = rgb[s]; mu = px.mean(0)
            if px.std(0).mean() < 11.5 and mu[0] - mu[2] >= 8: bg |= s
    keep = ~bg & (a >= 150)
    # largest connected shape only
    lab = np.zeros((h, w), np.int32); best, bestn, n = 0, 0, 0
    for sy, sx in zip(*np.nonzero(keep)):
        if lab[sy, sx]: continue
        n += 1; lab[sy, sx] = n; q = deque([(sy, sx)]); size = 0
        while q:
            y, x = q.popleft(); size += 1
            for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                if 0 <= ny < h and 0 <= nx < w and keep[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
        if size > bestn: best, bestn = n, size
    m = lab == best; m[:2] = m[-2:] = False; m[:, :2] = m[:, -2:] = False
    m = defringe(rgba, m) if DEFRINGE else m
    # transparent pixels get black colour so resampling never bleeds the old white background into the edge
    out = rgba.copy(); out[..., 3] = np.where(m, 255, 0); out[~m, :3] = 0
    return out

def _nb(m):
    """4-neighbour shifts of a mask (no wrap-around)."""
    p = np.pad(m, 1); return p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]

def defringe(rgba, m):
    """The generated art was cut from a white background, which can leave a pale, half-transparent rim
    just outside the characters' dark ink outline. Peel that rim back to the ink line (two pixels at
    most). Only pale or soft pixels right next to ink go, so glows, gun flashes and thin parts stay."""
    from scipy import ndimage
    rgb = rgba[..., :3].astype(int); a = rgba[..., 3].astype(int)
    L = rgb[..., 0] * .3 + rgb[..., 1] * .59 + rgb[..., 2] * .11
    lo, hi = rgb.min(-1), rgb.max(-1)
    ink = m & (L < 80)
    near_ink = ndimage.binary_dilation(ink, iterations=2)
    rimlike = ((lo > 185) & (hi - lo < 60)) | ((L > 90) & (hi - lo < 40)) | (a < 238)
    for _ in range(2):
        up, dn, lf, rt = _nb(m)
        edge = m & ~(up & dn & lf & rt)
        peel = edge & ~ink & near_ink & rimlike
        if not peel.any(): break
        m = m & ~peel
    lab, n = ndimage.label(m)
    if n > 1: sizes = ndimage.sum(m, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sizes)))
    return m

def bbox(c):
    ys, xs = np.nonzero(c[..., 3]); return (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) else None

def atlas(path, cols, rows, target, cell_w, cell_h, base, scale=None, ref_cell=None):
    im = np.array(Image.open(path).convert('RGBA')); H, W, _ = im.shape; cw, ch = W // cols, H // rows
    cells = [clean(im[r*ch:(r+1)*ch, c*cw:(c+1)*cw]) for r in range(rows) for c in range(cols)]
    if scale is None: b0 = bbox(cells[0]); scale = target / (b0[3] - b0[1] + 1)
    elif ref_cell: scale = scale * ref_cell / cw  # extra sheets may be a different size: keep the Ranger the same height
    sheet = Image.new('RGBA', (cell_w * cols, cell_h * rows), (0, 0, 0, 0)); info = []
    for i, c in enumerate(cells):
        b = bbox(c)
        x0, y0, x1, y1 = b; crop = Image.fromarray(c[y0:y1+1, x0:x1+1])
        tw, th = max(1, round((x1-x0+1) * scale)), max(1, round((y1-y0+1) * scale))
        crop = crop.resize((tw, th), Image.LANCZOS); arr = np.array(crop); arr[..., 3] = np.where(arr[..., 3] > 120, 255, 0)
        # keep the artist's horizontal placement: cell centre maps to output centre
        ox = round(cell_w / 2 + (x0 - cw / 2) * scale); oy = base - th
        ox = max(0, min(cell_w - tw, ox)); oy = max(0, oy)
        sheet.alpha_composite(Image.fromarray(arr), ((i % cols) * cell_w + ox, (i // cols) * cell_h + oy))
        info.append([int(ox), int(oy), int(tw), int(th)])
    return sheet, info, scale

def portrait(path, out):
    im = np.array(Image.open(path).convert('RGBA')); c = clean(im, slate=True); x0, y0, x1, y1 = bbox(c)
    crop = Image.fromarray(c[y0:y1+1, x0:x1+1]); crop.thumbnail((240, 320), Image.LANCZOS); crop.save(out, optimize=True)

def main():
    src, dst = sys.argv[1], sys.argv[2]; os.makedirs(dst, exist_ok=True); meta = {}
    for rid in RANGERS:
        sheet, info, scale = atlas(os.path.join(src, rid + '-sheet.png'), 4, 4, TARGET, CELL_W, CELL_H, BASE)
        sheet.save(os.path.join(dst, rid + '.png'), optimize=True); meta[rid] = info
        # optional extra poses (EXTRA-POSE-PROMPTS.md): <id>-extra.png, 4x4, scaled to match the main sheet
        extra = os.path.join(src, rid + '-extra.png')
        if os.path.exists(extra):
            main_cell = Image.open(os.path.join(src, rid + '-sheet.png')).size[0] // 4
            xs, xinfo, _ = atlas(extra, 4, 4, TARGET, CELL_W, CELL_H, BASE, scale=scale, ref_cell=main_cell)
            xs.save(os.path.join(dst, rid + '-extra.png'), optimize=True); meta[rid + '-extra'] = xinfo
        portrait(os.path.join(src, rid + '-approved.png'), os.path.join(dst, rid + '-portrait.png'))
        print(rid, 'ok')
    sheet, info, _ = atlas(os.path.join(src, 'phage-sheet.png'), 4, 2, int(TARGET * 1.3), 400, 320, 312)
    sheet.save(os.path.join(dst, 'phage.png'), optimize=True); meta['phage'] = info
    json.dump({'cell': [CELL_W, CELL_H], 'base': BASE, 'target': TARGET, 'phageCell': [400, 320], 'phageBase': 312, 'frames': meta}, open(os.path.join(dst, 'meta.json'), 'w'))
    print('done')

if __name__ == '__main__':
    main()
