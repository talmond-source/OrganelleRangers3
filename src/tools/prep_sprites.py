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
RANGERS = ['atp','ribosome','rougher','golgi','cytoplasm','membrane','mito','nucleus','smoother','lysosome','dna','rna','mitosis','crispr']

def clean(rgba, slate=False):
    h, w, _ = rgba.shape; rgb = rgba[..., :3].astype(int); a = rgba[..., 3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if slate: bgl = (a < 150) | ((r >= 45) & (r < 95) & (g >= 60) & (g < 118) & (b >= 90) & (b < 160) & (b - g > 18) & (g - r > 4))
    else: bgl = (a < 150) | ((rgb.min(-1) > 195) & (rgb.max(-1) - rgb.min(-1) < 28))
    bg = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgl[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bgl[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and bgl[ny, nx]: bg[ny, nx] = True; q.append((ny, nx))
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
    out = rgba.copy(); out[..., 3] = np.where(m, 255, 0)
    return out

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
