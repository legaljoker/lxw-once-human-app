"""Generate Android launcher, splash and notification icons from the LxW logo.

Usage: python3 tools/make_icons.py www/img/logo.png android/app/src/main/res
"""
import sys, os, glob
from PIL import Image, ImageDraw

logo_path, res = sys.argv[1], sys.argv[2]
BG = (8, 7, 15, 255)
logo = Image.open(logo_path).convert('RGBA')
logo = logo.crop(logo.getbbox())

def fit(img, size):
    img = img.copy(); img.thumbnail((size, size), Image.LANCZOS); return img

def centered(canvas, img):
    canvas.alpha_composite(img, ((canvas.width - img.width) // 2, (canvas.height - img.height) // 2))
    return canvas

densities = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in densities.items():
    d = f'{res}/mipmap-{name}'
    s = int(48 * k)
    # Legacy square + round icons
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(sq).rounded_rectangle([0, 0, s - 1, s - 1], radius=s // 5, fill=BG)
    centered(sq, fit(logo, int(s * .78))).save(f'{d}/ic_launcher.png')
    rd = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(rd).ellipse([0, 0, s - 1, s - 1], fill=BG)
    centered(rd, fit(logo, int(s * .66))).save(f'{d}/ic_launcher_round.png')
    # Adaptive foreground: 108dp canvas, logo kept inside the 66dp safe zone
    f = int(108 * k)
    centered(Image.new('RGBA', (f, f), (0, 0, 0, 0)), fit(logo, int(f * .58))).save(f'{d}/ic_launcher_foreground.png')

    # Notification icon: white silhouette of the letters (drop shadow removed)
    n = int(24 * k)
    px = logo.load()
    mask = Image.new('L', logo.size)
    mp = mask.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = px[x, y]
            mp[x, y] = 255 if a > 200 and max(r, g, b) > 70 else 0
    sil = Image.new('RGBA', logo.size, (255, 255, 255, 0)); sil.putalpha(mask)
    sil = sil.crop(sil.getbbox())
    os.makedirs(f'{res}/drawable-{name}', exist_ok=True)
    centered(Image.new('RGBA', (n, n), (0, 0, 0, 0)), fit(sil, int(n * .92))).save(f'{res}/drawable-{name}/ic_stat_lxw.png')

# Splash screens: dark background, logo centred
for path in glob.glob(f'{res}/drawable*/splash.png'):
    w, h = Image.open(path).size
    centered(Image.new('RGBA', (w, h), BG), fit(logo, int(min(w, h) * .32))).convert('RGB').save(path)
