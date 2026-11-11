"""Sharper, cleaner product cutouts (transparent WebP) from the poster images.

Each poster holds a small package photo, so a plain cutout is soft and its edges come out
ragged where silver foil meets a light background. This script:
  1. finds the package on the poster and crops it,
  2. enlarges the crop 4x with Real-ESRGAN (sharp label text, no smearing),
  3. cuts the background away at that high resolution (rembg, IS-Net),
  4. tidies the outline by package type: pouches and bags get a smooth fitted outline,
     bottles a symmetric one (drops water splashes and stray background), others are cleaned,
  5. removes background colour bleeding into the edge, then saves at most 900 px.

Usage:
  python3 scripts/enhance-products.py                  # every product
  python3 scripts/enhance-products.py ap-79 rovazyme   # only these slugs

Needs: pip install "rembg[cpu]" pillow numpy scipy spandrel torch torchvision
       Real-ESRGAN weights in ~/.sr/RealESRGAN_x4plus.pth (or SR_MODEL=/path/to.pth):
       https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
Output: public/images/products-cutout/<slug>.webp
"""
import json
import os
import sys

import numpy as np
import torch
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage
from spandrel import ModelLoader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public')
OUT = os.environ.get('OUT') or os.path.join(ROOT, 'public', 'images', 'products-cutout')
SR_MODEL = os.environ.get('SR_MODEL', os.path.expanduser('~/.sr/RealESRGAN_x4plus.pth'))
SEG_MODEL = os.environ.get('MODEL', 'isnet-general-use')  # keeps silver foil better than BiRefNet here
WORK_SIDE = 1600  # enlarged crop is cut out at this size at most (memory)
MAX_SIDE = 900
# Earlier cutouts (if any) are used to find the package on the poster; keep a copy here when
# re-running, because the output overwrites them.
REF = os.environ.get('REF') or os.path.join(ROOT, 'public', 'images', 'products-cutout')

# Package shape decides how the outline is tidied.
POUCH = set('''amylac ap-79 aqua-bac aqua-bz aqua-yucca bacpower beta-13-16-glucan bio-book bio-max bio-mos
bio-premix bzt clear-12h d-oc kalimix marimix mega-cid miral-n8 mix-79 nb-algae nb-biopond
nb-brown-gay-mau-nuoc-mau-tra nb-c-sormin nb-mix-5000-ho-tro-phong-cong-than-duc-co-mem-vo-tang-trong
nb-sorbitol-b12 prawnzyme premix-10000 premix-9999 premix-khoang-khoang-kich-lot pro-algae prolac rimix
rova-otic rovabio-ap rovazyme sorbest sun-blue super-cut-algae top-weigh us-lacto toxic-algae
vi-sinh-3-trong-1-chuyen-lam-sach-day-nuoc-cat-tao-sach-nhot-bat down-max-ha-phen'''.split())
BOTTLE = set('''amin-care aminovit aqua-biotic aqua-squick aqua-tech ben-com ben-copper-500 ben-gold-rv ben-iq
ben-mkc-4000 ben-xid-3000 biotic-99 biozyme bronopol butypho bz-99 calcipho caphote davi-cid-liquid de-zoo
flophen g7-phong-va-tri-benh-gan-chet-som hepaliver-fs hepatic hufa iodine-99 liver-max nb-helvirol-b12
prazi-s proticbest rocaphos super-aqua-80 super-bioca super-din-600 super-gold super-yucca yucca-99
zicotrim'''.split())
# Hand fixes where the poster art hides the package edge (fractions of the package height).
# Package box on the poster (x0, y0, x1, y1) where automatic finding fails.
BOX = {'down-max-ha-phen': (78, 410, 466, 922)}
TRIM_BOTTOM = {'nb-brown-gay-mau-nuoc-mau-tra': 0.10}

torch.set_num_threads(os.cpu_count() or 4)


def load_sr():
    model = ModelLoader().load_from_file(SR_MODEL)
    model.eval()
    return model


def upscale(model, im, tile=160, overlap=16):
    """4x enlarge in overlapping tiles so memory stays small; tiles are feathered together."""
    src = np.asarray(im.convert('RGB'), dtype=np.float32) / 255
    h, w, _ = src.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    weight = np.zeros((h * 4, w * 4, 1), np.float32)
    step = tile - overlap
    for ty in range(0, max(1, h - overlap), step):
        for tx in range(0, max(1, w - overlap), step):
            y0, x0 = min(ty, max(0, h - tile)), min(tx, max(0, w - tile))
            y1, x1 = min(h, y0 + tile), min(w, x0 + tile)
            x = torch.from_numpy(src[y0:y1, x0:x1].copy()).permute(2, 0, 1)[None]
            with torch.inference_mode():
                y = model(x)[0].permute(1, 2, 0).clamp(0, 1).numpy()
            th, tw = y.shape[:2]
            ramp = lambda n: np.minimum(1, np.minimum(np.arange(n) + 1, n - np.arange(n)) / (overlap * 4 / 2))
            wgt = (ramp(th)[:, None] * ramp(tw)[None, :])[..., None].astype(np.float32)
            out[y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] += y * wgt
            weight[y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] += wgt
    out /= np.maximum(weight, 1e-6)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8))


def main_region(alpha, close=6):
    """Largest solid region of a cutout mask, plus big neighbours (two-pack products), holes filled."""
    solid = alpha > 40
    labels, n = ndimage.label(solid)
    if n == 0:
        return None
    sizes = ndimage.sum(solid, labels, range(1, n + 1))
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s >= 0.35 * sizes.max()])
    keep = ndimage.binary_closing(keep, structure=np.ones((3, 3)), iterations=close)
    # Fill small holes (foil glare, clear windows) but keep big openings such as a bucket handle.
    holes, hn = ndimage.label(ndimage.binary_fill_holes(keep) & ~keep)
    if hn:
        hs = ndimage.sum(np.ones_like(keep), holes, range(1, hn + 1))
        small = [i + 1 for i, s in enumerate(hs) if s < 0.03 * keep.sum()]
        keep |= np.isin(holes, small)
    # Break thin joints to decorations (bubbles, leaves, splashes), keep the body, grow it back.
    r = max(4, int(min(keep.shape) * 0.03))
    core = ndimage.binary_opening(keep, structure=np.ones((3, 3)), iterations=r)
    cl, cn = ndimage.label(core)
    if cn > 1:
        cs = ndimage.sum(core, cl, range(1, cn + 1))
        big = np.isin(cl, [i + 1 for i, s in enumerate(cs) if s >= 0.35 * cs.max()])
        keep &= ndimage.binary_dilation(big, structure=np.ones((3, 3)), iterations=r + 2)
    return keep


def robust_poly(t, v, deg=2):
    """Fit v(t) with a low-order polynomial, ignoring outliers (notches, blobs, splashes)."""
    keep = np.ones(len(t), bool)
    coef = np.polyfit(t, v, deg)
    for _ in range(5):
        res = v - np.polyval(coef, t)
        mad = np.median(np.abs(res[keep] - np.median(res[keep]))) + 1e-6
        keep = np.abs(res - np.median(res[keep])) < 2.5 * 1.4826 * mad + 2
        if keep.sum() < deg + 3:
            break
        coef = np.polyfit(t[keep], v[keep], deg)
    return coef


def fit_side(t, v, max_slope=0.06):
    """Nearly straight package side: robust line with a capped slope."""
    a, _ = robust_poly(t, v, 1)
    a = float(np.clip(a, -max_slope, max_slope))
    return np.array([a, float(np.median(v - a * t))])


def fit_edge(t, v, span, height):
    """Top or bottom edge: a gentle curve if the data supports one, else a near-level line."""
    c = robust_poly(t, v, 2)
    mid = (t.min() + t.max()) / 2
    sag = abs(np.polyval(c, mid) - (np.polyval(c, t.min()) + np.polyval(c, t.max())) / 2)
    if sag <= 0.04 * height and abs(np.polyval(np.polyder(c), mid)) <= 0.1:
        return c
    a, b = fit_side(t, v, 0.04)
    return np.array([0.0, a, b])


def pouch_outline(mask):
    """Smooth outline for pouches and bags: robust, nearly straight sides and gently curved
    top and bottom, so ragged foil edges and stray background disappear."""
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    h, w = y1 - y0 + 1, x1 - x0 + 1
    rows = np.arange(int(y0 + 0.15 * h), int(y1 - 0.15 * h))
    rows = rows[mask[rows].any(axis=1)]
    left = np.array([np.argmax(mask[y]) for y in rows], float)
    right = np.array([mask.shape[1] - 1 - np.argmax(mask[y][::-1]) for y in rows], float)
    cl, cr = fit_side(rows, left), fit_side(rows, right)
    ym = (y0 + y1) / 2
    mid_l, mid_r = np.polyval(cl, ym), np.polyval(cr, ym)
    if not x0 - 2 <= mid_l < mid_r <= x1 + 2:
        mid_l, mid_r = x0, x1
    cols = np.arange(int(mid_l + 0.12 * (mid_r - mid_l)), int(mid_r - 0.12 * (mid_r - mid_l)))
    cols = cols[mask[:, cols].any(axis=0)]
    top = np.array([np.argmax(mask[:, x]) for x in cols], float)
    bot = np.array([mask.shape[0] - 1 - np.argmax(mask[:, x][::-1]) for x in cols], float)
    ct, cb = fit_edge(cols, top, w, h), fit_edge(cols, bot, w, h)
    yy, xx = np.mgrid[0:mask.shape[0], 0:mask.shape[1]]
    out = (xx >= np.polyval(cl, yy)) & (xx <= np.polyval(cr, yy)) & (yy >= np.polyval(ct, xx)) & (yy <= np.polyval(cb, xx))
    rad = max(3, int(min(h, w) * 0.025))
    disk = np.hypot(*np.mgrid[-rad:rad + 1, -rad:rad + 1]) <= rad
    out = ndimage.binary_opening(out, structure=disk)
    return ndimage.binary_erosion(out, iterations=max(2, int(w * 0.004)))


def overlap(a, b):
    return (a & b).sum() / max(1, (a | b).sum())


def bottle_outline(mask):
    """Symmetric outline for bottles: the narrower side of each row, mirrored, then smoothed.
    Water splashes and background stuck to one side disappear; the real bottle edge stays."""
    rows = np.where(mask.any(axis=1))[0]
    left = np.array([np.argmax(mask[y]) for y in rows], float)
    right = np.array([mask.shape[1] - 1 - np.argmax(mask[y][::-1]) for y in rows], float)
    body = slice(int(len(rows) * 0.3), int(len(rows) * 0.9))
    c = np.median((left[body] + right[body]) / 2)
    half = np.minimum(c - left, right - c)
    win = max(3, (len(rows) // 60) | 1)
    half = ndimage.median_filter(half, size=win, mode='nearest')
    half = ndimage.uniform_filter1d(half, size=max(3, win // 2), mode='nearest')
    out = np.zeros_like(mask)
    xx = np.arange(mask.shape[1])
    for y, hh in zip(rows, half):
        out[y] = np.abs(xx - c) <= hh
    return ndimage.binary_opening(out, structure=np.ones((3, 3)), iterations=2)


def decontaminate(rgb, alpha):
    """Replace background colour bleeding into semi-transparent edge pixels with the package's own
    colour (taken from the nearest solid pixel), so no green or yellow halo shows on new backgrounds."""
    solid = alpha >= 250
    if not solid.any():
        return rgb
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    near = rgb[iy, ix]
    a = (alpha.astype(np.float32) / 255)[..., None]
    w = np.clip((a - 0.5) * 2, 0, 1) * 0.5  # mostly the solid colour, a touch of the original
    mix = rgb * w + near * (1 - w)
    return np.where(solid[..., None], rgb, mix).astype(np.uint8)


def locate_by_cutout(poster, ref):
    """Find where an existing cutout sits on the poster (multi-scale template match on the
    package pixels). Gives an exact box and a coarse outline even where a fresh cutout of the
    small poster would miss the package."""
    import cv2
    P = cv2.cvtColor(np.asarray(poster), cv2.COLOR_RGB2GRAY).astype(np.float32)
    rgba = np.asarray(ref.convert('RGBA'))
    T0 = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32)
    M0 = (rgba[..., 3] > 200).astype(np.float32)
    best = (-1, None)
    for scale in np.geomspace(0.12, 1.2, 60):
        w, h = int(rgba.shape[1] * scale), int(rgba.shape[0] * scale)
        # The package fills a good part of the poster; tiny matches on flat colour are wrong.
        if w < 0.3 * P.shape[1] or h < 40 or w > P.shape[1] or h > P.shape[0]:
            continue
        T = cv2.resize(T0, (w, h), interpolation=cv2.INTER_AREA)
        M = cv2.resize(M0, (w, h), interpolation=cv2.INTER_AREA)
        res = cv2.matchTemplate(P, T, cv2.TM_CCOEFF_NORMED, mask=M)
        res[~np.isfinite(res)] = -1
        _, score, _, loc = cv2.minMaxLoc(res)
        if score > best[0]:
            best = (score, (loc[0], loc[1], w, h))
    if best[1] is None or best[0] < 0.6:
        return None
    x, y, w, h = best[1]
    return (x, y, x + w, y + h), np.asarray(ref.convert('RGBA'))[..., 3] > 127


def locate(session, poster, ref=None):
    """Package box on the poster plus a coarse outline of the package inside that box."""
    if ref is not None:
        found = locate_by_cutout(poster, ref)
        if found:
            (x0, y0, x1, y1), shape = found
            pad = int(max(x1 - x0, y1 - y0) * 0.06)
            box = (max(0, x0 - pad), max(0, y0 - pad), min(poster.width, x1 + pad), min(poster.height, y1 + pad))
            # Place the outline inside the padded box, at 2x the poster scale.
            coarse = np.zeros(((box[3] - box[1]) * 2, (box[2] - box[0]) * 2), bool)
            sized = np.array(Image.fromarray(shape.astype(np.uint8) * 255).resize(((x1 - x0) * 2, (y1 - y0) * 2), Image.BILINEAR)) > 127
            oy, ox = (y0 - box[1]) * 2, (x0 - box[0]) * 2
            coarse[oy:oy + sized.shape[0], ox:ox + sized.shape[1]] = sized[:coarse.shape[0] - oy, :coarse.shape[1] - ox]
            return box, coarse
    # No earlier cutout: cut the middle band of the poster enlarged 2x.
    band_top = 0
    im = poster
    if im.height > im.width * 1.4:
        band_top = int(im.height * 0.30)
        im = im.crop((0, band_top, im.width, int(im.height * 0.94)))
    im2 = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    a = np.array(remove(im2, session=session, post_process_mask=True).split()[-1])
    keep = main_region(a)
    if keep is None or not keep.any():
        return None
    ys, xs = np.where(keep)
    x0, y0, x1, y1 = xs.min() // 2, ys.min() // 2 + band_top, xs.max() // 2 + 1, ys.max() // 2 + 1 + band_top
    pad = int(max(x1 - x0, y1 - y0) * 0.08)
    box = (max(0, x0 - pad), max(0, y0 - pad), min(poster.width, x1 + pad), min(poster.height, y1 + pad))
    full = np.zeros((poster.height * 2, poster.width * 2), bool)
    full[band_top * 2:band_top * 2 + keep.shape[0], :keep.shape[1]] = keep
    return box, full[box[1] * 2:box[3] * 2, box[0] * 2:box[2] * 2]


def enhance(seg, sr, slug, src):
    poster = Image.open(src).convert('RGB')
    ref_path = os.path.join(REF, f'{slug}.webp')
    ref = Image.open(ref_path) if os.path.exists(ref_path) else None
    found = (BOX[slug], None) if slug in BOX else locate(seg, poster, ref)
    if not found:
        return None
    box, coarse = found
    crop = poster.crop(box)
    big = upscale(sr, crop)
    big.thumbnail((WORK_SIDE, WORK_SIDE), Image.LANCZOS)
    rgba = remove(big, session=seg, post_process_mask=True)
    soft = np.array(rgba.split()[-1])
    keep = main_region(soft)
    if coarse is None:
        # Hand-set box: the silver pouch is the grey (unsaturated) area against a coloured
        # poster; the printed label inside it is filled in.
        hsv = np.asarray(big.convert('HSV'), dtype=np.float32) / 255
        grey = (hsv[..., 1] < 0.16) & (hsv[..., 2] > 0.45)
        keep = main_region(ndimage.binary_fill_holes(ndimage.binary_closing(grey, iterations=4)).astype(np.uint8) * 255)
        soft = (keep * 255).astype(np.uint8)
        rough = keep
    else:
        rough = np.array(Image.fromarray((coarse * 255).astype(np.uint8)).resize(big.size, Image.BILINEAR)
                         .filter(ImageFilter.GaussianBlur(3))) > 127
    # The sharp cutout sometimes keeps only the printed label of a silver pouch: then trust the
    # coarse outline found on the poster instead.
    if keep is None or overlap(keep, rough) < 0.85:
        keep = rough
        soft = np.array(Image.fromarray((rough * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)))

    if slug in POUCH:
        shape = pouch_outline(keep)
        if overlap(shape, keep) < 0.88:  # the fitted outline does not match: keep the cutout
            shape = keep
    elif slug in BOTTLE:
        shape = bottle_outline(keep)
    else:
        shape = keep
    if slug in TRIM_BOTTOM:
        ys = np.where(shape.any(axis=1))[0]
        shape[int(ys.max() - TRIM_BOTTOM[slug] * (ys.max() - ys.min())):] = False

    # Solid inside, soft anti-aliased edge (the outline is smooth, so a light blur is enough;
    # free shapes keep the model's own soft edge).
    if slug in POUCH or slug in BOTTLE:
        alpha = np.array(Image.fromarray((shape * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)))
    else:
        inside = ndimage.binary_erosion(shape, iterations=6)
        ring = ndimage.binary_dilation(shape, iterations=2)
        alpha = np.where(inside, 255, np.where(ring, soft, 0)).astype(np.uint8)

    rgb = decontaminate(np.array(big), alpha)
    out = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    ys, xs = np.where(alpha > 8)
    pad = int(max(np.ptp(xs), np.ptp(ys)) * 0.03)
    out = out.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(out.width, xs.max() + 1 + pad), min(out.height, ys.max() + 1 + pad)))
    out.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, f'{slug}.webp'), 'WEBP', quality=86, method=6)
    return out.size


def main():
    only = set(sys.argv[1:])
    products = json.load(open(os.path.join(ROOT, 'content', 'products.json'), encoding='utf-8'))
    seg = new_session(SEG_MODEL)
    sr = load_sr()
    for p in products:
        if (only and p['slug'] not in only) or not p.get('images'):
            continue
        try:
            size = enhance(seg, sr, p['slug'], os.path.join(SRC, p['images'][0]['src'].lstrip('/')))
        except Exception as err:  # keep the previous cutout for this product
            print('FAIL %s %s' % (p['slug'], err), flush=True)
            continue
        print(('ok   %s %dx%d' % (p['slug'], *size)) if size else 'FAIL ' + p['slug'], flush=True)


if __name__ == '__main__':
    main()
