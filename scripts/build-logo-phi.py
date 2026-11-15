#!/usr/bin/env python3
"""Bản ĐỀ XUẤT: logo chính thức Noben nắn lại theo tỷ lệ vàng φ = 1,61803 (chưa dùng trên web).

    python3 scripts/build-logo-phi.py     # ghi brand/logo/de-xuat-phi/*.svg

GIỮ NGUYÊN vẻ logo đang dùng: hình thoi vuông vàng tươi, khung xanh da trời, chữ NOBEN nghiêng đậm viền xanh
(dùng đúng nét chữ gốc), chấm tròn, hai vạch trắng, nét gãy hai bên, ba sóng nước. Chỉ đặt lại kích thước,
vị trí và độ dày theo φ. Đơn vị: khung 512 như logo gốc; a = 250 là nửa đường chéo hình thoi.

  Viền trong        lùi vào a/φ⁶
  Khung xanh        bốn góc nằm đúng trên cạnh hình thoi (rộng + cao = 2a);
                    phương án A: rộng : cao = √φ (sát bản gốc) · phương án B: rộng : cao = φ (chữ nhật vàng)
  Chấm tròn         bán kính a/φ⁵; khuyết = chấm × √φ
  Vạch trắng        dày = chấm/φ²; dài = khung + 2 × độ dày
  Nét mảnh          = vạch/φ² (viền trong), × √φ cho nét gãy; đỉnh nét gãy cách tâm a(1 − 1/φ⁵)
  Chữ NOBEN         rộng = 2a/√φ, viền = độ dày vạch, tâm chữ trùng tâm hình thoi
  Sóng nước         rộng = khung/φ rồi giảm √φ mỗi sóng; dày = vạch/φ; cách nhau = chấm/√φ
  Màu chuyển        điểm dừng ở 61,8%
"""
import os
import re
import sys

from picosvg.svg_types import SVGPath

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'public', 'images', 'brand', 'logo-noben.svg')
OUT = os.path.join(ROOT, 'brand', 'logo', 'de-xuat-phi')
PHI = (1 + 5 ** 0.5) / 2
RT = PHI ** 0.5
C, A = 256.0, 250.0


def r2(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def word():
    s = open(SRC, encoding='utf8').read()
    m = re.search(r'<g transform="translate\([\d. ]+\)">\s*<path d="([^"]+)"', s)
    d = m.group(1)
    b = SVGPath(d=d).bounding_box()
    return d, b


def mark(ratio):
    w = 2 * A * ratio / (1 + ratio)          # rộng + cao = 2a, rộng / cao = ratio
    h = 2 * A - w
    px, py = C - w / 2, C - h / 2
    dot = A / PHI ** 5
    notch = dot * RT
    bar = dot / PHI ** 2
    hair = bar / PHI ** 2
    top, bot = py - bar, py + h + bar        # tâm hai vạch trắng (cách khung nửa độ dày)
    bar_w = w + 2 * bar
    apex = A * (1 - 1 / PHI ** 5)
    ex = w / 2 - bar
    chev = lambda sg: f'M{r2(C + sg * ex)} {r2(top)} L{r2(C + sg * apex)} {r2(C)} L{r2(C + sg * ex)} {r2(bot)}'
    k_in = 1 - 1 / PHI ** 6
    d, b = word()
    ww = 2 * A / RT
    k = ww / b.w
    tx = C - (b.x + b.w / 2) * k
    ty = C - (b.y + b.h / 2) * k
    rh = lambda q: f'M{r2(C)} {r2(C - A * q)} L{r2(C + A * q)} {r2(C)} L{r2(C)} {r2(C + A * q)} L{r2(C - A * q)} {r2(C)} Z'
    parts = [
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdb57"/><stop offset=".618" stop-color="#ffc20e"/><stop offset="1" stop-color="#f2a900"/></linearGradient>'
        '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22a8ec"/><stop offset=".618" stop-color="#1289d8"/><stop offset="1" stop-color="#0878cc"/></linearGradient></defs>',
        f'<path d="{rh(1)}" fill="url(#g)"/>',
        f'<path d="{rh(k_in)}" fill="none" stroke="#fff" stroke-opacity=".618" stroke-width="{r2(hair)}"/>',
        f'<path d="{chev(1)} {chev(-1)}" fill="none" stroke="#0878cc" stroke-width="{r2(hair * RT)}" stroke-linejoin="round" stroke-linecap="round"/>',
        f'<path d="M{r2(C - bar_w / 2)} {r2(top)} H{r2(C + bar_w / 2)} M{r2(C - bar_w / 2)} {r2(bot)} H{r2(C + bar_w / 2)}" stroke="#fff" stroke-width="{r2(bar)}"/>',
        f'<path d="M{r2(px)} {r2(py)} H{r2(C - notch)} A{r2(notch)} {r2(notch)} 0 0 0 {r2(C + notch)} {r2(py)} H{r2(px + w)} V{r2(py + h)} H{r2(px)} Z" fill="url(#b)"/>',
        f'<circle cx="{r2(C)}" cy="{r2(py - bar)}" r="{r2(dot)}" fill="#fff"/>',
        f'<g transform="translate({r2(tx)} {r2(ty)}) scale({k:.5f})"><path d="{d}" fill="none" stroke="#0a5fb8" stroke-width="{r2(bar / k)}" stroke-linejoin="round"/><path d="{d}" fill="#fff"/></g>',
    ]
    y, ws = bot + bar / 2 + dot / RT, w / PHI
    waves = []
    for _ in range(3):
        waves.append(f'M{r2(C - ws / 2)} {r2(y)} Q{r2(C)} {r2(y - bar)} {r2(C + ws / 2)} {r2(y)}')
        y += dot / RT
        ws /= RT
    parts.append(f'<path d="{" ".join(waves)}" fill="none" stroke="#fff" stroke-width="{r2(bar / PHI)}" stroke-linecap="round"/>')
    info = dict(w=w, h=h, dot=dot, notch=notch, bar=bar, hair=hair, word_w=ww, word_cap=63.3 * k)
    return '\n'.join(parts), info


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, ratio, label in (('A', RT, 'khung √φ'), ('B', PHI, 'khung chữ nhật vàng φ')):
        body, i = mark(ratio)
        svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Noben">\n'
               f'<title>Noben – logo nắn theo tỷ lệ vàng, phương án {name} ({label})</title>\n{body}\n</svg>\n')
        with open(os.path.join(OUT, f'noben-phi-{name}.svg'), 'w', encoding='utf8') as f:
            f.write(svg)
        print(f'{name}: khung {i["w"]:.1f}×{i["h"]:.1f}, chấm r={i["dot"]:.1f}, vạch {i["bar"]:.1f}, chữ rộng {i["word_w"]:.1f} cao {i["word_cap"]:.1f}')


if __name__ == '__main__':
    sys.exit(main())
