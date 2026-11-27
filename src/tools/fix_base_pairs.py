# Used once by hand on art/domain/crispr/bg-original.png -> bg.png (rows 150-410): ChatGPT drew mismatched base pairs.
# usage: python3 -I tools/fix_base_pairs.py SRC DST x0 y0 x1 y1
"""Repaint every DNA rung as one consistent base pair (red-yellow or green-orange), keeping the shading.
A rung is found as a tall thin coloured bar; its full length is traced up and down its middle column
until it meets a backbone (purple or bright cyan) or the dark background."""
import sys, random
import numpy as np
from PIL import Image
from scipy import ndimage
import colorsys

TARGET = {'red': (226, 52, 48), 'yellow': (250, 206, 40), 'green': (96, 196, 56), 'orange': (246, 132, 28)}
PAIRS = [('red', 'yellow'), ('yellow', 'red'), ('green', 'orange'), ('orange', 'green')]

def hsv_img(sub):
    f = sub / 255.0; mx = f.max(-1); mn = f.min(-1); d = mx - mn + 1e-9
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    h = np.where(mx == r, (g - b) / d % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / (mx + 1e-9), mx

def fix(img, box, seed=5, minh=12):
    a = np.array(img.convert('RGB')).astype(float); x0, y0, x1, y1 = box; sub = a[y0:y1, x0:x1]
    h, s, v = hsv_img(sub)
    warm = (s > 0.45) & (v > 0.35) & ((h < 135) | (h > 345))
    backbone = ((h > 250) & (h < 330) & (s > 0.35)) | ((h >= 172) & (h < 205) & (s > 0.5) & (v > 0.6))
    rungish = (v > 0.42) & (s > 0.3) & ~backbone
    lab, n = ndimage.label(ndimage.binary_closing(warm, structure=np.ones((5, 1)), iterations=2))
    rnd = random.Random(seed); out = a.copy(); used = np.zeros(warm.shape, bool); count = 0
    for k in range(1, n + 1):
        m = lab == k; ys, xs = np.nonzero(m)
        if ys.max() - ys.min() < minh or (xs.max() - xs.min()) > (ys.max() - ys.min()): continue
        xa, xb = xs.min(), xs.max(); cx = (xa + xb) // 2
        if used[ys.min():ys.max(), cx].any(): continue
        # trace the whole rung along its middle column
        top = ys.min(); bot = ys.max()
        def run(y, step):  # follow the bar, stepping over the thin dark seam some rungs have between their halves
            while True:
                nxt = [y + step * j for j in range(1, 5) if 0 <= y + step * j < m.shape[0] and rungish[y + step * j, cx]]
                if not nxt: return y
                y = nxt[0]
        top = run(top, -1); bot = run(bot, 1)
        region = np.zeros_like(m); region[top:bot + 1, max(0, xa - 1):xb + 2] = True; region &= rungish | ((v > 0.25) & ~backbone & (s > 0.3))
        used |= region; mid = (top + bot) / 2; c1, c2 = rnd.choice(PAIRS)
        L = sub.mean(-1)
        for half, col in ((region & (np.arange(m.shape[0])[:, None] < mid), c1), (region & (np.arange(m.shape[0])[:, None] >= mid), c2)):
            if not half.any(): continue
            yy, xx = np.nonzero(half)
            # shading across the bar: brightness relative to the bar's own middle
            ref = np.median(L[half]); f = np.clip(L[half] / max(ref, 1), 0.5, 1.5)
            out[y0 + yy, x0 + xx] = np.clip(np.array(TARGET[col])[None, :] * f[:, None], 0, 255)
        count += 1
    return Image.fromarray(out.astype('uint8')), count

if __name__ == '__main__':
    src, dst, *box = sys.argv[1:]; res, n = fix(Image.open(src), tuple(map(int, box))); res.save(dst); print(n, 'rungs')
