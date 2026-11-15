"""Make the smaller copies (sm/) that src/routes.js offers in srcset.
Product photos and cutouts: 360px wide. Article covers (posts, kien-thuc): 768px wide.
Only creates missing files, so it is safe to run again after adding images:
    python3 scripts/make-small.py
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
DIRS = {'products': 360, 'products-cutout': 360, 'posts': 768, 'kien-thuc': 768}

for d, width in DIRS.items():
    src_dir = os.path.join(ROOT, d)
    out_dir = os.path.join(src_dir, 'sm')
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith('.webp') or (d == 'posts' and not name.endswith('-cover.webp')):
            continue  # posts/: only covers go through img(); photos inside articles are plain HTML
        out = os.path.join(out_dir, name)
        if os.path.exists(out):
            continue
        im = Image.open(os.path.join(src_dir, name))
        if im.width <= width * 1.1:
            continue  # already small: the original is served alone
        h = round(im.height * width / im.width)
        im.resize((width, h), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
        print(os.path.relpath(out, ROOT))
