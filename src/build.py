import sys, base64, os, json, io
# Builds the single-file game page from the sources in this folder.
#   python3 build.py         -> ../index.html (the live site)
#   python3 build.py local   -> ../test.html  (same, without the install-as-app bits, for testing)
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
from PIL import Image
args = sys.argv[1:]; LOCAL = 'local' in args
F = 'fonts/'
def face(fam, path, w=400):
    b = base64.b64encode(open(F + path, 'rb').read()).decode()
    return "@font-face{font-family:%s;font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, w, b)
fonts = "\n".join([face('P2', 'press-start-2p-latin-400-normal.woff2'), face('Bangers', 'bangers-latin-400-normal.woff2'),
  face('BC', 'barlow-condensed-latin-400-normal.woff2', 400), face('BC', 'barlow-condensed-latin-700-normal.woff2', 700)])
head = open('head.html').read().replace('/*FONTS*/', fonts)
PWA = '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">\n<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">\n<script>if ("serviceWorker" in navigator && location.protocol === "https:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>'
head = head.replace('<!--PWA-->', '' if LOCAL else PWA)
# sprite atlases (built by tools/prep_sprites.py) and the Cell Rescue district paintings
uri = lambda path, mime: 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())
sprites = {}
for f in sorted(os.listdir('sprites')):
    if f.endswith('.png'):  # embedded as lossless WebP: same pixels, about a quarter smaller
        buf = io.BytesIO(); Image.open('sprites/' + f).convert('RGBA').save(buf, 'WEBP', lossless=True, method=6)
        sprites[f[:-4]] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
meta = json.load(open('sprites/meta.json'))
stages = {}
for name in ['environment', 'membranes', 'archive']:
    im = Image.open('stages/%s.png' % name).convert('RGB'); im.thumbnail((1700, 600), Image.LANCZOS); buf = io.BytesIO(); im.save(buf, 'JPEG', quality=84, optimize=True)
    stages[name] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
megas = {f[:-5]: uri('mega/' + f, 'image/webp') for f in sorted(os.listdir('mega')) if f.endswith('.webp')}
# Domain Expansion art (tools/prep_domain.py): domain/<id>/*.png|jpg and domain/meta.json
domains = {}
for d in sorted(os.listdir('domain')):
    if os.path.isdir('domain/' + d):
        for f in sorted(os.listdir('domain/' + d)):
            if f.endswith('.jpg'): domains.setdefault(d, {})[f[:-4]] = uri('domain/%s/%s' % (d, f), 'image/jpeg')
            elif f.endswith('.png'):  # lossless WebP, like the fighter sprites
                buf = io.BytesIO(); Image.open('domain/%s/%s' % (d, f)).convert('RGBA').save(buf, 'WEBP', lossless=True, method=6)
                domains.setdefault(d, {})[f[:-4]] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
# Story intro, roll call and title logo (tools/prep_intro.py): intro/*.webp|png and intro/meta.json
intro = {}
for f in sorted(os.listdir('intro')):
    if f.endswith('.webp'): intro[f[:-5]] = uri('intro/' + f, 'image/webp')
    elif f.endswith('.png'):  # roll-call strips: high-quality lossy WebP with exact alpha
        buf = io.BytesIO(); Image.open('intro/' + f).convert('RGBA').save(buf, 'WEBP', quality=92, alpha_quality=100, method=6)
        intro[f[:-4]] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
# Story mode panels (ChatGPT illustrations, two panels per picture): art/story/<key>.png -> lossy WebP
story = {}
if os.path.isdir('art/story'):
    for f in sorted(os.listdir('art/story')):
        if f.endswith('.png'):
            im = Image.open('art/story/' + f).convert('RGB'); im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=82, method=6)
            story[f[:-4]] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
data_js = 'const SPRITE_DATA = %s;\nconst SPRITE_META = %s;\nconst STAGE_DATA = %s;\nconst MEGA_DATA = %s;\nconst DOMAIN_DATA = %s;\nconst DOMAIN_META = %s;\nconst INTRO_DATA = %s;\nconst INTRO_META = %s;\nconst STORY_DATA = %s;\n' % (json.dumps(sprites), json.dumps(meta), json.dumps(stages), json.dumps(megas), json.dumps(domains), open('domain/meta.json').read(), json.dumps(intro), open('intro/meta.json').read(), json.dumps(story))
js = "\n".join(open(f).read() for f in ['data.js', 'diagrams.js', 'molecules.js', 'core2d.js', 'pose.js', 'fx.js', 'audio.js', 'music.js', 'fight.js', 'gamepad.js', 'kits.js', 'kits2.js', 'megas2d.js', 'domains2d.js', 'intro2d.js', 'title2d.js', 'story.js', 'story2d.js', 'app.js'])
js += '\nAPP.init();\n'
def esc(s):
    out = []
    for ch in s:
        o = ord(ch)
        if o < 128: out.append(ch)
        elif o < 0x10000: out.append('\\u%04x' % o)
        else: o -= 0x10000; out.append('\\u%04x\\u%04x' % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)))
    return ''.join(out)
page = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n' + head + '</head><body>\n' + open('body.html').read() + '\n<script>\n' + data_js + '</script>\n<script>\n' + esc(js) + '\n</script>\n</body></html>\n'
open('../test.html' if LOCAL else '../index.html', 'w').write(page)
print(len(page))
