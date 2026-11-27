"""Repaint DNA rungs as consistent base pairs (red with yellow, green with orange), touching only rung pixels.
Rungs are found column by column: a rung is a run of columns full of non-backbone colour between y0 and y1. Inside each
rung, every pixel that isn't backbone (blue), silver (grey) or outline (dark) is repainted, top half above the helix axis
and bottom half below. Rungs inside a 'faded' x-range (a just-joined stretch) keep a pale look.
Used once by hand on art/intro/sleeper-dna-original.png -> sleeper-dna.png. Each panel was first mirrored left-right
(ChatGPT drew a left-handed helix; a mirror image of a helix has the opposite twist), then:
  python3 -I tools/fix_rungs_only.py SRC DST y0 y1 axis skip_x0 skip_x1 faded_x0 faded_x1"""
import sys, random
import numpy as np
from PIL import Image
from scipy import ndimage

TARGET = {'red': (226, 52, 48), 'yellow': (250, 206, 40), 'green': (96, 196, 56), 'orange': (246, 132, 28)}
PAIRS = [('red', 'yellow'), ('yellow', 'red'), ('green', 'orange'), ('orange', 'green')]

def run(src, dst, y0, y1, axis, skip, faded, seed=7):
    a = np.array(Image.open(src).convert('RGB')).astype(float); f = a / 255
    mx, mn = f.max(-1), f.min(-1); d = mx - mn + 1e-9; r, g, b = f[..., 0], f[..., 1], f[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-9)
    warm = ((h < 75) | (h > 330)) & (s > 0.3) & (mx > 0.35)              # reds, oranges, yellows
    teal = (h >= 140) & (h <= 205) & (s > 0.3)                           # the backbone's green/teal tint where the viral DNA joined
    green = (h >= 75) & (h < 140) & (s > 0.3) & (mx > 0.35) & ~ndimage.binary_dilation(teal, iterations=6)
    rung = warm | green  # never blue backbone, silver backbone, dark outline, or the tinted backbone
    rung[:y0] = False; rung[y1:] = False; rung[:, skip[0]:skip[1]] = False
    col = rung.sum(0) > 22
    lab, n = ndimage.label(col); rnd = random.Random(seed); out = a.copy(); L = a.mean(-1); done = 0
    for i in range(1, n + 1):
        xs = np.nonzero(lab == i)[0]; xa, xb = xs.min(), xs.max() + 1
        if xb - xa < 8 or xb - xa > 60: continue
        m = np.zeros(rung.shape, bool); m[:, xa:xb] = rung[:, xa:xb]
        c1, c2 = rnd.choice(PAIRS); pale = faded[0] <= (xa + xb) / 2 < faded[1]
        if pale: m[:axis - 40] = False; m[axis + 42:] = False  # the just-joined stretch: only between the strands, never the tinted backbone
        for half, colname in ((m & (np.arange(m.shape[0])[:, None] < axis), c1), (m & (np.arange(m.shape[0])[:, None] >= axis), c2)):
            if not half.any(): continue
            yy, xx = np.nonzero(half); ref = np.median(L[half]); k = np.clip(L[half] / max(ref, 1), 0.55, 1.4)
            tgt = np.array(TARGET[colname], float)
            if pale: tgt = tgt * 0.65 + np.array([200, 255, 215]) * 0.35
            out[yy, xx] = np.clip(tgt[None, :] * k[:, None], 0, 255)
        done += 1
    # the pale rungs of the just-joined stretch sit against the tinted backbone, so they are found separately: pale-green
    # columns in the faded range, between the strands only; each gets a pale pair
    pg = (h >= 75) & (h < 150) & (mx > 0.6) & (s > 0.15) & (s < 0.6); pg[:axis - 40] = False; pg[axis + 42:] = False
    pg[:, :faded[0]] = False; pg[:, faded[1]:] = False
    lab, n = ndimage.label(pg.sum(0) > 20)
    for i in range(1, n + 1):
        xs = np.nonzero(lab == i)[0]; xa, xb = xs.min(), xs.max() + 1
        if xb - xa < 6: continue
        m = np.zeros(pg.shape, bool); m[:, xa:xb] = pg[:, xa:xb]; c1, c2 = rnd.choice(PAIRS)
        for half, colname in ((m & (np.arange(m.shape[0])[:, None] < axis), c1), (m & (np.arange(m.shape[0])[:, None] >= axis), c2)):
            if not half.any(): continue
            yy, xx = np.nonzero(half); ref = np.median(L[half]); k = np.clip(L[half] / max(ref, 1), 0.6, 1.3)
            tgt = np.array(TARGET[colname], float) * 0.65 + np.array([200, 255, 215]) * 0.35
            out[yy, xx] = np.clip(tgt[None, :] * k[:, None], 0, 255)
        done += 1
    Image.fromarray(out.astype('uint8')).save(dst); return done

if __name__ == '__main__':
    src, dst, y0, y1, axis, s0, s1, f0, f1 = sys.argv[1:]
    print(run(src, dst, int(y0), int(y1), int(axis), (int(s0), int(s1)), (int(f0), int(f1))), 'rungs')
