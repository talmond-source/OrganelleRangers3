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
    if f.endswith('.png'): sprites[f[:-4]] = uri('sprites/' + f, 'image/png')
meta = json.load(open('sprites/meta.json'))
stages = {}
for name in ['environment', 'membranes', 'archive']:
    im = Image.open('stages/%s.png' % name).convert('RGB'); im.thumbnail((1700, 600), Image.LANCZOS); buf = io.BytesIO(); im.save(buf, 'JPEG', quality=84, optimize=True)
    stages[name] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
megas = {f[:-5]: uri('mega/' + f, 'image/webp') for f in sorted(os.listdir('mega')) if f.endswith('.webp')}
data_js = 'const SPRITE_DATA = %s;\nconst SPRITE_META = %s;\nconst STAGE_DATA = %s;\nconst MEGA_DATA = %s;\n' % (json.dumps(sprites), json.dumps(meta), json.dumps(stages), json.dumps(megas))
js = "\n".join(open(f).read() for f in ['data.js', 'diagrams.js', 'molecules.js', 'core2d.js', 'pose.js', 'fx.js', 'audio.js', 'fight.js', 'gamepad.js', 'kits.js', 'kits2.js', 'megas2d.js', 'title2d.js', 'app.js'])
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
