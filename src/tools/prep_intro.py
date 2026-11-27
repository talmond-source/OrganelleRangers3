"""Prepares the story intro, the roll call and the title logo for Organelle Rangers 3.

usage: python3 tools/prep_intro.py            (run from src/)

Reads the ChatGPT originals and writes game-ready images to intro/ plus intro/meta.json:

art/intro/<shot>.png      full-frame story shots (16:9), saved as WebP. Two of them are two-panel pictures:
  lyso-visor.png          Lysosome's visor before / after the virus wakes -> visor1, visor2 (panels lined up so the
                          flicker between them doesn't jump)
  sleeper-dna.png         the phage DNA arriving / spliced in -> dna1, dna2. This is the fixed copy (mirrored so the
                          helices are right-handed, rungs repainted as matching base pairs); sleeper-dna-original.png is
                          ChatGPT's picture and is not used
art/rollcall/stage.png    the roll-call stage
art/rollcall/<id>.png     3 x 1 sheet per Ranger: dive, superhero landing, signature pose. White background, except
                          mito (green screen) and mitosis (blue screen). Packed as a 3-frame strip on a shared floor
art/title/title-logo.png  ORGANELLE RANGERS logo on a blue screen
art/domain/<id>/poses.png the Ranger's domain-expansion hand sign (pose 1 of the 2 x 2 sheet), cut again at full size and
                          added as a 4th roll-call frame, scaled to the same body height as the roll-call art
"""
import os, sys, json
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from prep_sprites import clean_white, bbox  # noqa: E402
from prep_domain import cells, strip, clean_key  # noqa: E402

DST = 'intro'
SHOTS = ['phage-rise', 'phage-inject', 'lyso-blindside', 'phage-looms', 'crispr-leap', 'blade-stop-closeup',
         'blade-stop-wide', 'visor-reflection', 'nucleus-call']
IDS = ['atp', 'ribosome', 'rougher', 'golgi', 'cytoplasm', 'membrane', 'mito', 'nucleus', 'smoother', 'lysosome',
       'dna', 'rna', 'mitosis', 'crispr']
KEY = {'mito': 1, 'mitosis': 2}


def webp(im, path, q=88):
    im.save(path, 'WEBP', quality=q, method=6)


def panels(path, names, meta):
    """split a two-panel picture down the middle; the second panel is shifted so both line up"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); H, W, _ = a.shape; half = W // 2
    L, R = a[:, :half], a[:, half:]
    best = min(((np.abs(L[100:-100, 60:-60:2] - R[100:-100, 60 + dx:R.shape[1] - 60 + dx:2]).mean(), dx) for dx in range(-12, 13)), key=lambda p: p[0])
    dx = best[1]; m = 14  # trim the divider and the panel edges
    p1 = a[:, m:half - m]; p2 = a[:, half + m + dx:half + m + dx + p1.shape[1]]
    for n, p in zip(names, (p1, p2)):
        webp(Image.fromarray(p.astype(np.uint8)), os.path.join(DST, n + '.webp')); meta['shots'][n] = [p.shape[1], p.shape[0]]
    print(path, 'panel offset', dx)


def nucleus_fix(c):
    """the dive frame has a pink shine on the stomach that isn't on his suit: turn it suit purple"""
    rgb = c[..., :3].astype(int); H, W = rgb.shape[:2]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    zone = np.zeros((H, W), bool); zone[int(H * .38):int(H * .58), int(W * .3):int(W * .7)] = True
    pink = zone & (r > 120) & (r > b * 0.85) & (g < r * 0.75) & (b > 90) & (b > g + 5) & (c[..., 3] > 0)
    out = c.copy(); out[pink, 0] = (b[pink] * 0.62).astype(np.uint8); out[pink, 1] = (g[pink] * 0.5).astype(np.uint8)
    print('nucleus: recoloured', int(pink.sum()), 'pink pixels')
    return out


def logo(meta):
    a = np.asarray(Image.open('art/title/title-logo.png').convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    from scipy import ndimage
    screen = (b > 170) & (r < 60) & (g < 60)
    m = ndimage.binary_opening(~screen, structure=np.ones((2, 2)))
    edge = m & ~ndimage.binary_erosion(m, iterations=2)
    out = np.dstack([a, np.where(m, 255, 0)]).astype(np.uint8)
    spill = edge & (b > r + 60) & (b > g + 60)  # blue fringe on the outline: darken to the outline colour
    out[spill, :3] = (out[spill, :3] * 0.25).astype(np.uint8)
    x0, y0, x1, y1 = bbox(out); im = Image.fromarray(out[y0:y1 + 1, x0:x1 + 1]); im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
    im.save(os.path.join(DST, 'logo.webp'), 'WEBP', quality=90, alpha_quality=100, method=6); meta['logo'] = [im.width, im.height]


DOMKEY = {'mito': 1, 'mitosis': 2}


def sign(i, target_h):
    c = cells('art/domain/%s/poses.png' % i, 2, 2)[0]
    c = clean_key(c, DOMKEY[i]) if i in DOMKEY else clean_white(c)
    x0, y0, x1, y1 = bbox(c); im = Image.fromarray(c[y0:y1 + 1, x0:x1 + 1]); f = target_h / im.height
    return np.array(im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS))


def main():
    os.makedirs(DST, exist_ok=True); meta = {'shots': {}, 'rollcall': {}}
    for s in SHOTS:
        im = Image.open('art/intro/%s.png' % s).convert('RGB'); webp(im, os.path.join(DST, s + '.webp')); meta['shots'][s] = list(im.size)
    panels('art/intro/lyso-visor.png', ['visor1', 'visor2'], meta)
    panels('art/intro/sleeper-dna.png', ['dna1', 'dna2'], meta)
    im = Image.open('art/rollcall/stage.png').convert('RGB'); webp(im, os.path.join(DST, 'stage.webp')); meta['shots']['stage'] = list(im.size)
    cuts = {}
    for i in IDS:
        cut = [(clean_key(c, KEY[i]) if i in KEY else clean_white(c)) for c in cells('art/rollcall/%s.png' % i, 3, 1)]
        if i == 'nucleus': cut[0] = nucleus_fix(cut[0])
        cuts[i] = cut
    # a standing Ranger's height in the roll-call art: the taller half of the signature poses (some crouch or lunge)
    hs = sorted(bbox(c[2])[3] - bbox(c[2])[1] + 1 for c in cuts.values()); stand = float(np.median(hs[len(hs) // 2:]))
    print('standing height', stand)
    for i in IDS:
        cut = cuts[i] + [sign(i, stand * 0.97)]
        sheet, info = strip(cut, 0.74)
        sheet.save(os.path.join(DST, 'rc-%s.png' % i), optimize=True); meta['rollcall'][i] = info
    logo(meta)
    json.dump(meta, open(os.path.join(DST, 'meta.json'), 'w'))
    print('ok')


if __name__ == '__main__':
    main()
