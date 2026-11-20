#!/usr/bin/env python3
"""Làm nét hình nét vẽ trên nhãn cũ (chữ G7, con tôm, logo, con dấu) khi phóng ×4, giữ y màu và bóng gốc.
   python3 lam-net-hinh.py goc.png nen-4x.jpg ra.jpg '[{"vung":[x0,y0,x1,y1],"net":["#c5262e",...],"k":8}]'

Cách làm cho từng vùng (toạ độ ảnh gốc):
  1. Gom màu vùng thành k cụm (k-means). Cụm gần màu trong "net" là phần hình cần làm nét.
  2. Tính bản đồ thuộc cụm (mềm) ở độ phân giải gốc, phóng ×8 bằng bicubic rồi lấy cụm lớn nhất:
     mép giữa các mảng màu thành đường cong mượt, sắc (giống dò nét vector), thu về ×4 có khử răng cưa.
  3. Màu trong mỗi mảng lấy màu gốc làm mịn của chính cụm đó, nên giữ nguyên chuyển sắc, bóng.
  Điểm thuộc cụm nền (lá, nền xanh) giữ nguyên ảnh phóng Lanczos.
"""
import json
import sys

import numpy as np
from PIL import Image

SC, SS = 4, 2  # phóng ×4, lấy mẫu dư ×2


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def kmeans(px, k, it=30):
    rng = np.random.default_rng(0)
    c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(it):
        lab = ((px[:, None] - c[None]) ** 2).sum(2).argmin(1)
        c = np.array([px[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
    return c


def up(arr, w, h, method=Image.BICUBIC):
    return np.asarray(Image.fromarray(arr.astype(np.float32), 'F').resize((w, h), method))


def blur(arr, r):
    # Gauss tách trục (PIL không làm mờ ảnh số thực)
    n = max(1, int(r * 3))
    k = np.exp(-0.5 * (np.arange(-n, n + 1) / r) ** 2)
    k /= k.sum()
    a = np.pad(arr.astype(np.float32), n, mode='edge')
    a = sum(k[i] * a[i:i + a.shape[0] - 2 * n, :] for i in range(2 * n + 1))
    a = sum(k[i] * a[:, i:i + a.shape[1] - 2 * n] for i in range(2 * n + 1))
    return a


src, bgf, out, regions = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4])
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
bg = np.asarray(Image.open(bgf).convert('RGB')).astype(np.float32).copy()

for r in regions:
    x0, y0, x1, y1 = r['vung']
    reg = img[y0:y1, x0:x1]
    h, w = reg.shape[:2]
    cent = np.array([hexrgb(c) for c in r['bang_mau']]) if r.get('bang_mau') else kmeans(reg.reshape(-1, 3), r.get('k', 8))
    keep = sorted({int(((cent - hexrgb(c)) ** 2).sum(1).argmin()) for c in r['net']})
    d = ((reg[:, :, None, :] - cent[None, None]) ** 2).sum(3)
    T = r.get('mem', 900.0)
    soft = np.exp(-(d - d.min(2, keepdims=True)) / T)
    soft /= soft.sum(2, keepdims=True)
    W2, H2 = w * SC * SS, h * SC * SS
    maps = np.stack([up(blur(soft[:, :, i], 0.35), W2, H2) for i in range(len(cent))], 2)
    lab = maps.argmax(2)
    hard = np.argmin(d, 2)
    res = np.zeros((H2, W2, 3), np.float32)
    sel = np.zeros((H2, W2), np.float32)
    for i in keep:
        m = (hard == i).astype(np.float32)
        mb = blur(m, 1.2) + 1e-4
        col = np.stack([up(blur(reg[:, :, ch] * m, 1.2) / mb, W2, H2, Image.BILINEAR) for ch in range(3)], 2)
        # điểm xa cụm (mb nhỏ) dùng màu tâm cụm
        wgt = np.clip(up(mb, W2, H2, Image.BILINEAR) * 3, 0, 1)[..., None]
        col = col * wgt + cent[i] * (1 - wgt)
        phang = r.get('mau', {})
        for src_hex, out_hex in phang.items():
            if int(((cent - hexrgb(src_hex)) ** 2).sum(1).argmin()) == i:
                col[:] = hexrgb(out_hex)
        on = lab == i
        res[on] = col[on]
        sel[on] = 1
    # thu ×2 (khử răng cưa) và ghép vào nền ×4
    Wo, Ho = w * SC, h * SC
    res_s = np.asarray(Image.fromarray(res.clip(0, 255).astype(np.uint8)).resize((Wo, Ho), Image.LANCZOS)).astype(np.float32)
    a = up(sel, Wo, Ho, Image.BOX)[..., None]
    region = bg[y0 * SC:y0 * SC + Ho, x0 * SC:x0 * SC + Wo]
    with np.errstate(invalid='ignore', divide='ignore'):
        pre = np.where(a > 1e-3, res_s / np.maximum(a, 1e-3), 0)
    bg[y0 * SC:y0 * SC + Ho, x0 * SC:x0 * SC + Wo] = pre * a + region * (1 - a)

Image.fromarray(bg.clip(0, 255).astype(np.uint8)).save(out, quality=95)
