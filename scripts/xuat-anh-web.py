#!/usr/bin/env python3
"""Đưa nhãn cũ đã vẽ lại (brand/nhan-cu/<slug>.png + .json) lên web.

    python3 scripts/xuat-anh-web.py                # mọi nhãn đã vẽ
    python3 scripts/xuat-anh-web.py g7-... aqua-bac

Mỗi sản phẩm tạo:
  public/images/products/<slug>.webp          ảnh bao bì 3D 4K (2160 × 3840) trên nền studio
  public/images/products-cutout/<slug>.webp   bao bì 3D nền trong (1080 × 1920, cắt sát) cho khung xoay trên trang
  public/images/products-label/<slug>.webp    nhãn phẳng đọc được (rộng tối đa 3200 px) cho nút "Xem nhãn"
  public/images/products-3d/<slug>.jpg        ảnh dán lên mô hình 3D xoay (rộng tối đa 2048 px)
rồi xoá bản sm/ cũ để scripts/make-small.py làm lại.
"""
import glob
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'brand', 'nhan-cu')
IMG = os.path.join(ROOT, 'public', 'images')


BAO_BI = json.load(open(os.path.join(SRC, 'bao-bi-3d.json'), encoding='utf8'))


def front(spec, im, kieu):
    """Ảnh và khổ (mm) dán lên bao bì: chai/hũ/xô quấn cả nhãn; túi/bao chỉ mặt trước."""
    mw, mh = spec.get('kich_thuoc_mm') or [240, 135]
    if not kieu.startswith(('tui', 'bao')) or not spec.get('mat_truoc'):
        return im, mw, mh
    W0, H0 = spec['kich_thuoc_goc']
    k = im.width / W0
    x0, y0, x1, y1 = spec['mat_truoc']
    crop = im.crop((round(x0 * k), round(y0 * k), round(x1 * k), round(y1 * k)))
    return crop, mw * (x1 - x0) / W0, mh * (y1 - y0) / H0


def render(png, kind, mw, mh, slug, out, extra):
    cmd = ['node', os.path.join(ROOT, 'scripts', 'mockup-pack.js'), '--anh', png, '--kho', kind, '--mm', f'{mw:.1f}x{mh:.1f}', '--ten', slug, '--out', out] + extra
    subprocess.run(cmd, check=True, capture_output=True)
    return os.path.join(out, f'{slug}.png')


def main():
    slugs = sys.argv[1:] or sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(SRC, '*.json')))
    for d in ('products', 'products-cutout', 'products-label', 'products-3d'):
        os.makedirs(os.path.join(IMG, d), exist_ok=True)
    for slug in slugs:
        jf, pf = os.path.join(SRC, f'{slug}.json'), os.path.join(SRC, f'{slug}.png')
        if not (os.path.exists(jf) and os.path.exists(pf)):
            print(f'{slug}: chưa có nhãn vẽ lại, bỏ qua')
            continue
        spec = json.load(open(jf))
        bb3 = BAO_BI.get(slug, {})
        kind = bb3.get('kieu') or {'chai': 'chai1l', 'xo': 'xo'}.get(spec.get('bao_bi'), 'tuibac')
        extra_mau = ['--mau', bb3['mau']] if bb3.get('mau') else []
        im = Image.open(pf).convert('RGB')
        tex, mw, mh = front(spec, im, kind)
        with tempfile.TemporaryDirectory() as tmp:
            tp = os.path.join(tmp, 'tex.png')
            tex.save(tp)
            # 1) ảnh 4K nền studio
            a = Image.open(render(tp, kind, mw, mh, slug, os.path.join(tmp, 'a'), ['--w', '2160', '--h', '3840'] + extra_mau)).convert('RGB')
            a.save(os.path.join(IMG, 'products', f'{slug}.webp'), 'WEBP', quality=84, method=6)
            # 2) nền trong, cắt sát
            b = Image.open(render(tp, kind, mw, mh, slug, os.path.join(tmp, 'b'), ['--w', '1080', '--h', '1920', '--trong'] + extra_mau)).convert('RGBA')
            bb = b.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
            if bb:
                pad = 24
                b = b.crop((max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, b.width), min(bb[3] + pad, b.height)))
            b.save(os.path.join(IMG, 'products-cutout', f'{slug}.webp'), 'WEBP', quality=86, method=6)
        lab = im.copy()
        lab.thumbnail((3200, 3200), Image.LANCZOS)
        lab.save(os.path.join(IMG, 'products-label', f'{slug}.webp'), 'WEBP', quality=86, method=6)
        t3 = tex.copy()
        t3.thumbnail((2048, 2048), Image.LANCZOS)
        t3.save(os.path.join(IMG, 'products-3d', f'{slug}.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
        for d in ('products', 'products-cutout'):
            sm = os.path.join(IMG, d, 'sm', f'{slug}.webp')
            if os.path.exists(sm):
                os.remove(sm)
        print(f'{slug}: {kind} {mw:.0f}×{mh:.0f} mm → products, cutout, label, 3d')
    # cập nhật kích thước ảnh chính trong content/products.json
    pj = os.path.join(ROOT, 'content', 'products.json')
    raw = open(pj, encoding='utf8').read()
    prods = json.loads(raw)
    for p in prods:
        f = os.path.join(IMG, 'products', f"{p['slug']}.webp")
        if p['slug'] in slugs and p.get('images') and os.path.exists(f):
            w, h = Image.open(f).size
            p['images'][0].update({'src': f"/images/products/{p['slug']}.webp", 'w': w, 'h': h})
    out = json.dumps(prods, ensure_ascii=False, indent=2) + '\n'
    if out != raw:
        open(pj, 'w', encoding='utf8').write(out)
    subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'make-small.py')], check=True)


main()
