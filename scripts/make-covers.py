"""Generate 1200x630 cover images for knowledge articles (card image + Open Graph image).

Usage: python3 scripts/make-covers.py
Needs Pillow and fontTools (pip install pillow fonttools brotli). Re-run after adding an article.
"""
import io
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES = os.path.join(ROOT, 'content', 'kien-thuc')
OUT = os.path.join(ROOT, 'public', 'images', 'kien-thuc')
TOPICS = {'benh-tom': 'Bệnh tôm', 'moi-truong': 'Môi trường ao', 'ky-thuat': 'Kỹ thuật nuôi', 'dinh-duong': 'Dinh dưỡng & thức ăn'}
INK = (11, 35, 71)
SUN = (255, 194, 14)


_FONT_CACHE = {}


def font(weight, width, size):
    """Archivo at a fixed weight/width, built from the site's woff2 subsets (Latin + Vietnamese) merged into one TTF."""
    key = (weight, width)
    if key not in _FONT_CACHE:
        from fontTools.ttLib import TTFont
        from fontTools.merge import Merger
        from fontTools.varLib import instancer
        cache = os.path.join(OUT, '.fonts')
        os.makedirs(cache, exist_ok=True)
        ttf = os.path.join(cache, f'archivo-{weight}-{width}.ttf')
        if not os.path.exists(ttf):
            parts = []
            for sub in ('latin', 'latin-ext', 'vietnamese'):
                f = TTFont(os.path.join(ROOT, 'public', 'fonts', f'archivo-{sub}-wdth-normal.woff2'))
                f.flavor = None
                f = instancer.instantiateVariableFont(f, {'wght': weight, 'wdth': width})
                part = os.path.join(cache, f'{sub}-{weight}-{width}.ttf')
                f.save(part)
                parts.append(part)
            Merger().merge(parts).save(ttf)
        _FONT_CACHE[key] = ttf
    return ImageFont.truetype(_FONT_CACHE[key], size)


def wrap(draw, text, fnt, max_w):
    words, lines, line = text.split(), [], ''
    for w in words:
        test = (line + ' ' + w).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            line = test
        else:
            lines.append(line)
            line = w
    lines.append(line)
    return lines


def front_matter(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n([\s\S]*?)\n---', raw)
    meta = {}
    for line in (m.group(1) if m else '').split('\n'):
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip()
    return meta


def cover(slug, meta):
    W, H = 1200, 630
    photo = meta.get('photo')
    base = Image.new('RGB', (W, H), INK)
    if photo and os.path.exists(os.path.join(ROOT, 'public', photo.lstrip('/'))):
        im = Image.open(os.path.join(ROOT, 'public', photo.lstrip('/'))).convert('RGB')
        scale = max(W / im.width, H / im.height)
        im = im.resize((int(im.width * scale) + 1, int(im.height * scale) + 1), Image.LANCZOS)
        left = (im.width - W) // 2
        top = (im.height - H) // 2
        base = im.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(1.2))
    # Ink gradient from the left so the title always reads.
    shade = Image.new('L', (W, 1))
    for x in range(W):
        shade.putpixel((x, 0), int(245 - 150 * (x / W) ** 1.4))
    shade = shade.resize((W, H))
    base = Image.composite(Image.new('RGB', (W, H), INK), base, shade)
    d = ImageDraw.Draw(base)

    # Topic pill
    label = TOPICS.get(meta.get('category', ''), 'Kiến thức nuôi tôm')
    f_label = font(700, 90, 30)
    tw = d.textlength(label, font=f_label)
    d.rounded_rectangle((72, 70, 72 + tw + 44, 70 + 54), radius=27, fill=SUN)
    d.text((72 + 22, 70 + 10), label, font=f_label, fill=(43, 32, 0))

    # Title
    title = meta.get('title', slug).split(':')[0]
    size = 74
    while size > 46:
        f_title = font(800, 78, size)
        lines = wrap(d, title, f_title, 900)
        if len(lines) <= 3:
            break
        size -= 4
    y = 170
    for line in lines:
        d.text((72, y), line, font=f_title, fill=(255, 255, 255))
        y += int(size * 1.08)

    # Footer: diamond mark + brand
    d.polygon([(92, 532), (112, 512), (132, 532), (112, 552)], fill=SUN)
    d.text((150, 512), 'Thủy sản Noben', font=font(800, 85, 34), fill=(255, 255, 255))
    d.text((150, 552), 'thuysannoben.vn  ·  Kiến thức nuôi tôm', font=font(500, 100, 24), fill=(169, 185, 214))

    os.makedirs(OUT, exist_ok=True)
    base.save(os.path.join(OUT, f'{slug}.webp'), 'WEBP', quality=80, method=5)
    base.save(os.path.join(OUT, f'{slug}.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)


def main():
    only = set(sys.argv[1:])
    for f in sorted(os.listdir(ARTICLES)):
        if not f.endswith('.md'):
            continue
        slug = f[:-3]
        if only and slug not in only:
            continue
        cover(slug, front_matter(os.path.join(ARTICLES, f)))
        print('cover', slug)


if __name__ == '__main__':
    main()
