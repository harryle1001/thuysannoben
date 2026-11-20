#!/usr/bin/env python3
"""Xóa chữ cũ trên ảnh nhãn gốc trước khi đặt chữ vector: lấp điểm chữ bằng màu nền xung quanh (khuếch tán).
   python3 xoa-chu-nen.py vao.jpg ra.png '[{"vung":[x,y,w,h],"chu":"sang"|"toi","mau":"#rrggbb","nguong":90,"nen":"trang","le":6}]'
   chu: sang = chữ sáng trên nền tối, toi = chữ tối trên nền sáng; mau: chữ màu cụ thể (khoảng cách màu < nguong);
   nen=trang: tô trắng (vùng chữ trên nền trắng); le: số px nới ra quanh vùng để lấy màu nền.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageFilter

src, dst, regions = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
for r in regions:
    x, y, w, h = r['vung']
    pad = r.get('le', 6)
    x0, y0, x1, y1 = max(x - pad, 0), max(y - pad, 0), min(x + w + pad, img.shape[1]), min(y + h + pad, img.shape[0])
    band = img[y0:y1, x0:x1].copy()
    lum = band.mean(axis=2)
    inner = np.zeros(lum.shape, bool)
    inner[pad:pad + h, pad:pad + w] = True
    if r.get('mau'):
        hx = r['mau'].lstrip('#'); tc = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
        mask = (np.sqrt(((band - tc) ** 2).sum(axis=2)) < r.get('nguong', 90)) & inner
    elif r.get('chu') == 'toi':
        mask = (lum < 150) & inner
    else:
        sat = band.max(axis=2) - band.min(axis=2)
        mask = (lum > 120) & (sat < 110) & inner
    # nới mặt nạ 2 px để lấp cả viền khử răng cưa
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    mask = np.asarray(m) > 0
    if r.get('nen') == 'trang':
        band[np.asarray(Image.fromarray((((band.mean(axis=2) < 235) & inner) * 255).astype(np.uint8))) > 0] = 255
        img[y0:y1, x0:x1] = band
        continue
    known = ~mask
    fill = band.copy()
    fill[mask] = 0
    for _ in range(400):
        acc = np.zeros_like(fill)
        cnt = np.zeros(mask.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(fill, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
        upd = mask & (cnt > 0)
        fill[upd] = acc[upd] / cnt[upd][:, None]
        known = known | upd
        if known.all():
            break
    # làm mịn vùng đã lấp cho liền với nền
    sm = np.asarray(Image.fromarray(fill.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32)
    fill[mask] = sm[mask]
    img[y0:y1, x0:x1] = fill
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save(dst)
