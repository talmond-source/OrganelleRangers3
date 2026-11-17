"""Recolour a Ranger's red helmet so older art matches a redesigned helmet.

usage: python3 -I tools/recolor_helmet.py MODE IN.png OUT.png
  MODE  white   -> white/silver helmet (Mitochondria)
        purple  -> suit-purple helmet (RNA)

Only red pixels are changed (hue within about 25 degrees of pure red, clearly saturated), and only in
large red shapes, so small red details elsewhere stay. The shading is kept: each pixel's brightness
carries over to the new colour. Soft red edge pixels next to the helmet are recoloured too, so no red
fringe is left along the outline.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def hsv(rgb):
    a = rgb.astype(float) / 255; mx = a.max(-1); mn = a.min(-1); d = mx - mn + 1e-9
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / (mx + 1e-9), mx


def recolor(img, mode):
    a = np.array(img.convert('RGBA')); rgb = a[..., :3].astype(float)
    H, S, V = hsv(a[..., :3])
    redh = (H >= 335) | (H <= 14)
    solid = a[..., 3] >= 150  # see-through background speckle is left alone (the cutter drops it)
    core = redh & (S > 0.42) & (V > 0.25) & solid
    lab, n = ndimage.label(core)
    if not n: return img, 0
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    big = np.isin(lab, 1 + np.nonzero(sizes >= max(60, sizes.max() * 0.08))[0])
    # smaller red patches cut off from the helmet by a crest or fin still belong to it
    # (reach scales with the helmet's size; orange-red patches, like Mitochondria's chest emblem, never count)
    reach = max(6, round(np.sqrt(sizes.max()) * 0.3))
    close = ndimage.binary_dilation(big, iterations=reach)
    near_ids = np.unique(lab[close & core]); near_ids = near_ids[near_ids > 0]
    hue_red = lambda i: np.median(np.where(H[lab == i] > 180, H[lab == i] - 360, H[lab == i]))
    big |= np.isin(lab, [i for i in near_ids if sizes[i - 1] >= 25 and hue_red(i) < 4])
    # soft red edge pixels hugging the helmet, and pale pink highlights on it
    near = ndimage.binary_dilation(big, iterations=3)
    inside = ndimage.binary_fill_holes(ndimage.binary_closing(big, iterations=3))
    m = big | (near & redh & (S > 0.12) & solid) | (inside & redh & (S > 0.06) & solid)
    # red tucked behind crests and fins, a little further out: strongly red or red-orange only
    wide = ndimage.binary_dilation(big, iterations=max(4, reach // 2))
    m |= wide & solid & ((H >= 330) | (H <= 12)) & (S > 0.35) & (rgb[..., 0] > rgb[..., 1] + 25)
    m |= wide & solid & (V < 0.5) & (rgb[..., 0] > rgb[..., 1] + 18) & (rgb[..., 0] > rgb[..., 2] + 6)  # dark red shadow lines
    L = (rgb[..., 0] * .3 + rgb[..., 1] * .59 + rgb[..., 2] * .11) / 255  # red reads dark: lift it
    if mode == 'white':
        v = np.clip(0.56 + L * 1.5, 0, 1)
        out = np.stack([v * 242, v * 241, v * 250], -1)  # cool silver-white
    else:  # purple, matching the suit
        v = np.clip(V * 0.9, 0, 1)  # the suit's red-violet purple, shaded by the red's brightness
        base = np.array([0.36, 0.13, 0.40]); hi = np.array([0.66, 0.34, 0.74])
        t = np.clip((v - 0.5) / 0.5, 0, 1)[..., None]
        out = (base * (1 - t) + hi * t) * np.clip(v / 0.55, 0.15, 1.2)[..., None] * 255
    if mode == 'white':  # the dark red outline rim becomes a neutral dark outline, not light grey
        dark = V < 0.38; g = (V * 200)[..., None]; out = np.where(dark[..., None], np.concatenate([g, g, g * 1.05], -1), out)
    a[..., :3][m] = np.clip(out[m], 0, 255).astype(np.uint8)
    return Image.fromarray(a), int(m.sum())


if __name__ == '__main__':
    mode, src, dst = sys.argv[1:4]
    im, n = recolor(Image.open(src), mode)
    im.save(dst); print(dst, n, 'pixels recoloured')
