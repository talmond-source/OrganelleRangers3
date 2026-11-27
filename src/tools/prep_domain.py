"""Prepares the Domain Expansion art (Megaform supers) for Organelle Rangers 3.

usage: python3 tools/prep_domain.py            (run from src/)

Reads the ChatGPT originals in art/domain/<id>/ and writes game-ready images to domain/<id>/
plus domain/meta.json. Every sprite sheet is cut out of its white background with the same
cleaner the fighter sheets use (tools/prep_sprites.py), trimmed, and packed as a horizontal
strip with one frame per cell; meta.json gives each frame's box and the strip's cell size.

Genome Vault (nucleus):
  bg.png      the domain interior, saved as JPEG; floor = the image row the fighters stand on
  poses.png   2 x 2 Nucleus Ranger poses: hand sign, expansion, call down, smug finish
  vault.png   2 x 1 closed / open vault. The closed vault is mirrored so its hinge sits on the
              left like the open door's, with the NUCLEUS sign copied back unmirrored.
  mascot.png  2 x 2 DNA mascot: peek, wink, wave, ta-da

Packing Punt (golgi):
  bg.png      the Golgi warehouse
  poses.png   2 x 2 Golgi Ranger poses: hand sign, expansion, punt approach, punt follow-through
  gift.png    2 x 2 gift vesicle: wrapped, squashed on the ceiling, bursting, the tag close-up

Factory Finesse (rougher):
  bg.png      the rough ER factory. bg-original.png is ChatGPT's picture; bg.png has the bead chains hanging from five
              ribosomes painted out (tools/prep_domain.py does not redo that step): on the rough ER a new protein
              threads through the membrane into the ER, it never dangles loose into the room
  poses.png   2 x 2 Rough ER Ranger poses: hand sign, expansion, operating (claws), crushing clap
  vesicle.png 2 x 2 coated vesicle: half-built cage, closed cage, cage bursting, one ribosome

Precision Cut Theater (crispr):
  bg.png      the gene-editing theater. bg-original.png is ChatGPT's picture; bg.png has its DNA rungs repainted as
              consistent base pairs by tools/fix_base_pairs.py (red with yellow, green with orange)
  poses.png   2 x 2 CRISPR Ranger poses: hand sign, expansion, command, snip finish
  cas9-original.png  Cas9 open and shut (top row). Its DNA pieces (bottom row) are not used: the game draws that DNA
              itself so the pairs, the twist and the cut site are exact

Silent Shadow Interference (rna):
  bg.png      the shadow dojo (lanterns shaped like ribosomes)
  poses.png   2 x 2 RNA Ranger poses: hand sign (two-finger seal), expansion, throw, ninja dash. The shadow ninjas are
              these same poses drawn as silhouettes
  dicer.png   2 x 2: Dicer blades up, Dicer chopping, a smoke puff, a smoke burst -> dicer.png (top row) + smoke.png

mtDNA Disk Barrage (mito):
  bg.png      inside a mitochondrion: cristae with ATP synthase facing the matrix, a grid floor (the matrix)
  poses.png   2 x 2 Mitochondria Ranger poses on a GREEN screen (the suit is white): hand sign, expansion, throw
              wind-up, throw release. Cut with clean_key (green). The mtDNA disks are drawn in code

Twin Serpent Fork (dna):
  bg.png      a temple courtyard in the nucleus (nucleosome lanterns, right-handed helix pillars)
  poses.png   2 x 2 DNA Ranger poses: hand sign (palms together), expansion, unzip, twin strike
  props.png   2 x 2: serpent head closed, head open, helicase (6-lobed ring), DNA polymerase (hand-shaped)
              -> heads.png + enzymes.png. The serpents' bodies are double helices drawn in code

Cellular Craze (mitosis):
  bg.png      a dividing cell: two centrosomes with asters, spindle fibres, fragments of nuclear envelope
  poses.png   2 x 2 Mitosis Ranger poses on a BLUE screen (silver suit with magenta and green): hand sign
              (knuckles together), expansion, pull apart, karate chop. Cut with clean_key (blue)
  props.png   2 x 2: pink X chromosome, green X chromosome, one chromatid, a centrosome (two centrioles at right
              angles). In anaphase the game splits each X down the middle into its two sister chromatids
"""
import os, sys, json
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from prep_sprites import clean_white, bbox  # noqa: E402

SRC, DST = 'art/domain', 'domain'


def cells(path, cols, rows):
    im = np.array(Image.open(path).convert('RGBA')); H, W, _ = im.shape; cw, ch = W // cols, H // rows
    return [im[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw].copy() for r in range(rows) for c in range(cols)]


def strip(cut, scale, anchor='bottom'):
    """Trim each cut frame, scale it, and pack the frames in a row of equal cells.
    Frames are centred horizontally on their box and stand on a shared bottom line."""
    boxes = [bbox(c) for c in cut]
    crops = []
    for c, (x0, y0, x1, y1) in zip(cut, boxes):
        im = Image.fromarray(c[y0:y1 + 1, x0:x1 + 1]); w, h = round(im.width * scale), round(im.height * scale)
        im = im.resize((max(1, w), max(1, h)), Image.LANCZOS); a = np.array(im); a[..., 3] = np.where(a[..., 3] > 110, 255, 0); a[a[..., 3] == 0, :3] = 0
        crops.append(Image.fromarray(a))
    cw = max(c.width for c in crops) + 8; ch = max(c.height for c in crops) + 8
    sheet = Image.new('RGBA', (cw * len(crops), ch), (0, 0, 0, 0)); info = []
    for i, c in enumerate(crops):
        ox = (cw - c.width) // 2; oy = ch - 4 - c.height
        sheet.alpha_composite(c, (i * cw + ox, oy)); info.append([ox, oy, c.width, c.height])
    return sheet, {'cell': [cw, ch], 'base': ch - 4, 'frames': info}


def nucleus(meta):
    src, dst = os.path.join(SRC, 'nucleus'), os.path.join(DST, 'nucleus'); os.makedirs(dst, exist_ok=True)
    m = {}
    # background: the fighters' feet go on the floor a little behind its front edge (image row 790 of 941)
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 790}
    # Ranger poses. The standing hand-sign pose is drawn 12% taller than the fighting stance (200 px in the atlas)
    pc = [clean_white(c) for c in cells(os.path.join(src, 'poses.png'), 2, 2)]
    b0 = bbox(pc[0]); sheet, info = strip(pc, 200 * 1.12 / (b0[3] - b0[1] + 1))
    sheet.save(os.path.join(dst, 'poses.png'), optimize=True); m['poses'] = info
    # vault: closed (mirrored so the hinge is on the left, sign copied back) and open
    vc = cells(os.path.join(src, 'vault.png'), 2, 1)
    closed = vc[0]; flipped = closed[:, ::-1].copy()
    # the sign plate: the rows above the door, between the corner brackets
    flipped[140:270, 190:700] = closed[140:270, 190:700]
    vc = [clean_white(flipped), clean_white(vc[1])]
    # both frames share a scale; the vault body is what lines up. In the open frame the door swings out
    # to the left, so its box is wider: line the two up by their right edge (the body's right wall).
    boxes = [bbox(c) for c in vc]; scale = 300 / (boxes[0][2] - boxes[0][0] + 1)
    crops = []
    for c, (x0, y0, x1, y1) in zip(vc, boxes):
        im = Image.fromarray(c[y0:y1 + 1, x0:x1 + 1]); im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        a = np.array(im); a[..., 3] = np.where(a[..., 3] > 110, 255, 0); a[a[..., 3] == 0, :3] = 0; crops.append(Image.fromarray(a))
    cw = max(c.width for c in crops) + 8; ch = max(c.height for c in crops) + 8
    sheet = Image.new('RGBA', (cw * 2, ch), (0, 0, 0, 0)); info = []
    for i, c in enumerate(crops):
        ox = cw - 4 - c.width; oy = ch - 4 - c.height; sheet.alpha_composite(c, (i * cw + ox, oy)); info.append([ox, oy, c.width, c.height])
    sheet.save(os.path.join(dst, 'vault.png'), optimize=True)
    # body: the closed vault's box (the open frame's body has the same right and bottom edges)
    ox, oy, w, h = info[0]
    # the door opening in the open frame, measured on the original (centre and radius), in strip pixels
    x0, y0 = boxes[1][0], boxes[1][1]; dcx, dcy, dr = 1375 - 887, 515, 158
    hole = [info[1][0] + (dcx - x0) * scale, info[1][1] + (dcy - y0) * scale, dr * scale]
    m['vault'] = {'cell': [cw, ch], 'base': ch - 4, 'frames': info, 'body': [ox, oy, w, h], 'hole': [round(v, 1) for v in hole]}
    # DNA mascot
    mc = [clean_white(c) for c in cells(os.path.join(src, 'mascot.png'), 2, 2)]
    b1 = bbox(mc[1]); sheet, info = strip(mc, 230 / (b1[3] - b1[1] + 1))
    sheet.save(os.path.join(dst, 'mascot.png'), optimize=True); m['mascot'] = info
    meta['nucleus'] = m


def clean_key(rgba, ch=1):
    """Cutout for sheets drawn on a flat screen colour (channel ch: 1 = green, 2 = blue), for characters whose own
    colours would be lost on white. Removes the screen, peels screen-tinted rim pixels and takes the spill out of the
    edge band only, so the character's own green or teal parts are untouched; keeps the biggest piece."""
    from scipy import ndimage
    rgb = rgba[..., :3].astype(int); k = rgb[..., ch]; others = np.delete(rgb, ch, axis=2).max(-1); excess = k - others
    m = ~((k > 150) & (excess > 100))
    for _ in range(3):  # peel rim pixels that are mostly screen colour
        edge = m & ~ndimage.binary_erosion(m)
        peel = edge & (excess > 70) & (others < 120)
        if not peel.any(): break
        m &= ~peel
    m = ndimage.binary_opening(m, structure=np.ones((2, 2)))
    lab, n = ndimage.label(m)
    if n > 1: sizes = ndimage.sum(m, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sizes)))
    band = m & ~ndimage.binary_erosion(m, iterations=2)
    out = rgba.copy(); spill = band & (excess > 30) & (others < 120)
    out[..., ch] = np.where(spill, others + 20, out[..., ch])
    out[..., 3] = np.where(m, 255, 0); out[~m, :3] = 0
    return out


def ranger_poses(src, dst, key=None):
    """2 x 2 Ranger domain poses; the standing hand sign (pose 1) is drawn 12% taller than the fighting stance"""
    pc = [(clean_key(c, key) if key else clean_white(c)) for c in cells(os.path.join(src, 'poses.png'), 2, 2)]
    b0 = bbox(pc[0]); sheet, info = strip(pc, 200 * 1.12 / (b0[3] - b0[1] + 1))
    sheet.save(os.path.join(dst, 'poses.png'), optimize=True); return info


def golgi(meta):
    src, dst = os.path.join(SRC, 'golgi'), os.path.join(DST, 'golgi'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 770}
    m['poses'] = ranger_poses(src, dst)
    gc = [clean_white(c) for c in cells(os.path.join(src, 'gift.png'), 2, 2)]
    b0 = bbox(gc[0]); sheet, info = strip(gc, 300 / (b0[2] - b0[0] + 1))
    sheet.save(os.path.join(dst, 'gift.png'), optimize=True); m['gift'] = info
    meta['golgi'] = m


def rougher(meta):
    src, dst = os.path.join(SRC, 'rougher'), os.path.join(DST, 'rougher'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 795}
    m['poses'] = ranger_poses(src, dst)
    vc = [clean_white(c, keep_all=(i == 2)) for i, c in enumerate(cells(os.path.join(src, 'vesicle.png'), 2, 2))]
    b1 = bbox(vc[1]); sheet, info = strip(vc, 300 / (b1[2] - b1[0] + 1))
    sheet.save(os.path.join(dst, 'vesicle.png'), optimize=True); m['vesicle'] = info
    meta['rougher'] = m


def crispr(meta):
    src, dst = os.path.join(SRC, 'crispr'), os.path.join(DST, 'crispr'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 800}
    m['poses'] = ranger_poses(src, dst)
    cc = [clean_white(c) for c in cells(os.path.join(src, 'cas9-original.png'), 2, 2)[:2]]
    b0 = bbox(cc[0]); sheet, info = strip(cc, 300 / (b0[2] - b0[0] + 1))
    sheet.save(os.path.join(dst, 'cas9.png'), optimize=True); m['cas9'] = info
    meta['crispr'] = m


def rna(meta):
    src, dst = os.path.join(SRC, 'rna'), os.path.join(DST, 'rna'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 790}
    m['poses'] = ranger_poses(src, dst)
    cc = cells(os.path.join(src, 'dicer.png'), 2, 2)
    dc = [clean_white(c) for c in cc[:2]]; b0 = bbox(dc[0]); sheet, info = strip(dc, 300 / (b0[2] - b0[0] + 1))
    sheet.save(os.path.join(dst, 'dicer.png'), optimize=True); m['dicer'] = info
    cc[2][:, -60:] = 255  # a wisp of the burst reaches into the puff's cell
    sm = [clean_white(c, keep_all=True) for c in cc[2:]]; b0 = bbox(sm[0]); sheet, info = strip(sm, 260 / (b0[2] - b0[0] + 1))
    sheet.save(os.path.join(dst, 'smoke.png'), optimize=True); m['smoke'] = info
    meta['rna'] = m


def mito(meta):
    src, dst = os.path.join(SRC, 'mito'), os.path.join(DST, 'mito'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 820}
    m['poses'] = ranger_poses(src, dst, key=1)
    meta['mito'] = m


def dna(meta):
    src, dst = os.path.join(SRC, 'dna'), os.path.join(DST, 'dna'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 770}
    m['poses'] = ranger_poses(src, dst)
    cc = [clean_white(c) for c in cells(os.path.join(src, 'props.png'), 2, 2)]
    b0 = bbox(cc[0]); sheet, info = strip(cc[:2], 300 / (b0[2] - b0[0] + 1)); sheet.save(os.path.join(dst, 'heads.png'), optimize=True); m['heads'] = info
    b0 = bbox(cc[2]); sheet, info = strip(cc[2:], 220 / (b0[2] - b0[0] + 1)); sheet.save(os.path.join(dst, 'enzymes.png'), optimize=True); m['enzymes'] = info
    meta['dna'] = m


def mitosis(meta):
    src, dst = os.path.join(SRC, 'mitosis'), os.path.join(DST, 'mitosis'); os.makedirs(dst, exist_ok=True)
    m = {}
    bg = Image.open(os.path.join(src, 'bg.png')).convert('RGB'); bg.save(os.path.join(dst, 'bg.jpg'), quality=86, optimize=True)
    m['bg'] = {'size': list(bg.size), 'floor': 790, 'poles': [[144, 243], [1519, 244]]}
    m['poses'] = ranger_poses(src, dst, key=2)
    cc = [clean_white(c) for c in cells(os.path.join(src, 'props.png'), 2, 2)]
    b0 = bbox(cc[0]); sheet, info = strip(cc, 200 / (b0[3] - b0[1] + 1)); sheet.save(os.path.join(dst, 'props.png'), optimize=True); m['props'] = info
    meta['mitosis'] = m


def main():
    meta = {}
    nucleus(meta)
    golgi(meta)
    rougher(meta)
    crispr(meta)
    rna(meta)
    mito(meta)
    dna(meta)
    mitosis(meta)
    json.dump(meta, open(os.path.join(DST, 'meta.json'), 'w'))
    print(json.dumps(meta))


if __name__ == '__main__':
    main()
