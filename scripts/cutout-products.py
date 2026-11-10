"""Cut each product package out of its poster background (transparent WebP).

Usage:
  python3 scripts/cutout-products.py                 # all products
  python3 scripts/cutout-products.py caphote oxy-99  # only these slugs
Options via env: MODEL=isnet-general-use (default) | birefnet-general | u2net

Needs: pip install "rembg[cpu]" pillow numpy scipy
The model downloads once to ~/.u2net. Output: public/images/products-cutout/<slug>.webp
"""
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public')
OUT = os.path.join(ROOT, 'public', 'images', 'products-cutout')
MODEL = os.environ.get('MODEL', 'isnet-general-use')


def keep_package(rgba, original):
    """Keep the package: the largest solid region of the mask, plus any big region touching it.
    Drops header text, logos, bubbles and the 'Quy cách' line that the model may also pick up."""
    a = np.array(rgba.split()[-1])
    solid = a > 40
    labels, n = ndimage.label(solid)
    if n == 0:
        return rgba, None
    sizes = ndimage.sum(solid, labels, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    keep = labels == main
    # Two-pack products (e.g. two bags side by side): keep other regions at least 35% of the main one.
    for i, s in enumerate(sizes, start=1):
        if i != main and s >= 0.35 * sizes[main - 1]:
            keep |= labels == i
    # Close small gaps along foil edges, then fill everything enclosed.
    keep = ndimage.binary_closing(keep, structure=np.ones((3, 3)), iterations=6)
    # Fill only small holes (foil glare, clear windows); keep big openings such as a bucket handle.
    holes, hn = ndimage.label(ndimage.binary_fill_holes(keep) & ~keep)
    if hn:
        hsizes = ndimage.sum(np.ones_like(keep), holes, range(1, hn + 1))
        for i, s in enumerate(hsizes, start=1):
            if s < 0.03 * keep.sum():
                keep |= holes == i
    # Drop decorations stuck to the package (bubbles, leaves): open the mask so thin joints break,
    # keep the main body, then grow it back to its original outline.
    r = max(4, int(min(keep.shape) * 0.03))
    core = ndimage.binary_opening(keep, structure=np.ones((3, 3)), iterations=r)
    cl, cn = ndimage.label(core)
    if cn > 1:
        cs = ndimage.sum(core, cl, range(1, cn + 1))
        big = np.zeros_like(core)
        for i, s in enumerate(cs, start=1):
            if s >= 0.35 * cs.max():
                big |= cl == i
        keep &= ndimage.binary_dilation(big, structure=np.ones((3, 3)), iterations=r + 2)
    # Foil and clear bags confuse the model: make the inside of the package fully opaque,
    # keep the model's soft alpha only along the outer edge.
    inside = ndimage.binary_erosion(keep, iterations=4)
    keep = ndimage.binary_dilation(keep, iterations=2)
    alpha = np.where(inside, 255, np.where(keep, a, 0)).astype(np.uint8)
    # Colours come from the original photo so filled areas show the real package, not black.
    out = original.convert('RGBA')
    out.putalpha(Image.fromarray(alpha))
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        return rgba, None
    return out, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def cutout(session, slug, src_path):
    im = Image.open(src_path).convert('RGB')
    # Posters share one layout: logo, name and tagline on top, the package in the middle,
    # the pack size line at the bottom. Work on the package band only.
    if im.height > im.width * 1.4:
        im = im.crop((0, int(im.height * 0.30), im.width, int(im.height * 0.94)))
    # Upscale small posters a little so edges come out cleaner.
    if im.width < 700 and not MODEL.startswith('birefnet'):
        im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    rgba = remove(im, session=session, post_process_mask=True)
    rgba, box = keep_package(rgba, im)
    if not box:
        return None
    x0, y0, x1, y1 = box
    pad = int(max(x1 - x0, y1 - y0) * 0.04)
    rgba = rgba.crop((max(0, x0 - pad), max(0, y0 - pad), min(rgba.width, x1 + pad), min(rgba.height, y1 + pad)))
    # Normalise size: the package fits inside 900x900.
    rgba.thumbnail((900, 900), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    rgba.save(os.path.join(OUT, f'{slug}.webp'), 'WEBP', quality=88, method=6)
    return {'src': f'/images/products-cutout/{slug}.webp', 'w': rgba.width, 'h': rgba.height}


def main():
    only = set(sys.argv[1:])
    products = json.load(open(os.path.join(ROOT, 'content', 'products.json'), encoding='utf-8'))
    session = new_session(MODEL)
    done = {}
    for p in products:
        if only and p['slug'] not in only:
            continue
        if not p.get('images'):
            continue
        r = cutout(session, p['slug'], os.path.join(SRC, p['images'][0]['src'].lstrip('/')))
        if r:
            done[p['slug']] = r
            print('ok  ', p['slug'], r['w'], 'x', r['h'])
        else:
            print('FAIL', p['slug'])
    return done


if __name__ == '__main__':
    main()
