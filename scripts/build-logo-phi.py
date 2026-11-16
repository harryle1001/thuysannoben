#!/usr/bin/env python3
"""Bản ĐỀ XUẤT: logo chính thức Noben nắn lại theo tỷ lệ vàng φ = 1,61803 (chưa dùng trên web).

    python3 scripts/build-logo-phi.py     # ghi brand/logo/de-xuat-phi/*.svg

GIỮ NGUYÊN vẻ logo đang dùng: hình thoi vuông vàng tươi, khung xanh da trời, chữ NOBEN nghiêng đậm viền xanh
(dùng đúng nét chữ gốc), chấm tròn, hai vạch trắng, nét gãy hai bên, ba sóng nước. Chỉ đặt lại kích thước,
vị trí và độ dày theo φ. Đơn vị: khung 512 như logo gốc; a = 250 là nửa đường chéo hình thoi.

  Bo góc            hình thoi R = a/φ⁴; viền trong, nét gãy bo đồng tâm; khung xanh R/φ³; vạch trắng bo tròn hai đầu
  Viền trong        lùi vào a/φ⁶
  Khung xanh        nằm gọn trong viền trong; hai vạch trắng dài bằng khung, đầu vạch chạm viền trong;
                    phương án A: rộng : cao = √φ (sát bản gốc) · phương án B: rộng : cao = φ (chữ nhật vàng)
  Chấm tròn         bán kính a/φ⁵; khuyết = chấm × √φ
  Vạch trắng        dày = chấm/φ²; dài = khung + 2 × độ dày
  Nét mảnh          = vạch/φ² (viền trong), × √φ cho nét gãy; đỉnh nét gãy cách tâm a(1 − 1/φ⁵)
  Chữ NOBEN         nét chữ gốc, tách từng chữ: khoảng hở đều nhau = cao chữ / φ⁴ (đo theo chữ dựng đứng);
                    rộng cả chữ = khung × √φ, viền = độ dày vạch, tâm chữ trùng tâm hình thoi
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


def letters():
    """Tách chữ NOBEN gốc thành từng chữ (gộp lỗ của O, B vào chữ chứa nó)."""
    d, _ = word()
    subs = [x for x in re.split(r'(?=M)', d) if x.strip()]
    groups = []
    for sp_ in subs:
        b = SVGPath(d=sp_).bounding_box()
        for g in groups:
            if b.x >= g['x0'] - 0.5 and b.x + b.w <= g['x1'] + 0.5:
                g['d'] += sp_
                break
        else:
            groups.append({'d': sp_, 'x0': b.x, 'x1': b.x + b.w, 'y0': b.y, 'y1': b.y + b.h})
    return groups


def slant(groups):
    """Độ nghiêng chữ: góc làm tổng bề rộng các chữ (sau khi dựng đứng lại) nhỏ nhất."""
    best = (9e9, 0)
    for i in range(0, 61):
        t = i / 200
        tot = 0
        for g in groups:
            x0, x1, _, _ = sbox(g['d'], t)
            tot += x1 - x0
        best = min(best, (tot, t))
    return best[1]


def sbox(d, t):
    """Khung bao (xmin, xmax, ymin, ymax) của chữ sau khi dựng đứng (bỏ nghiêng t)."""
    from picosvg.svg_transform import Affine2D
    b = SVGPath(d=d).apply_transform(Affine2D(1, 0, t, 1, 0, 0)).bounding_box()
    return b.x, b.x + b.w, b.y, b.y + b.h


def rounded(points, radii, closed=True):
    """Đường gấp khúc có góc bo tròn (bán kính riêng từng đỉnh)."""
    import math
    n = len(points)
    out = []
    rng = range(n) if closed else range(1, n - 1)
    seg = {}
    for i in rng:
        p, a, b = points[i], points[i - 1], points[(i + 1) % n]
        u1 = ((a[0] - p[0]), (a[1] - p[1])); l1 = math.hypot(*u1); u1 = (u1[0] / l1, u1[1] / l1)
        u2 = ((b[0] - p[0]), (b[1] - p[1])); l2 = math.hypot(*u2); u2 = (u2[0] / l2, u2[1] / l2)
        ang = math.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1])))
        r = radii[i]
        t = r / math.tan(ang / 2)
        p1 = (p[0] + u1[0] * t, p[1] + u1[1] * t)
        p2 = (p[0] + u2[0] * t, p[1] + u2[1] * t)
        sweep = 1 if (u1[0] * u2[1] - u1[1] * u2[0]) < 0 else 0
        seg[i] = (p1, p2, r, sweep)
    if closed:
        p1, p2, r, sw = seg[0]
        out.append(f'M{r2(p2[0])} {r2(p2[1])}')
        for i in list(range(1, n)) + [0]:
            p1, p2, r, sw = seg[i]
            out.append(f'L{r2(p1[0])} {r2(p1[1])} A{r2(r)} {r2(r)} 0 0 {sw} {r2(p2[0])} {r2(p2[1])}')
        out.append('Z')
    else:
        out.append(f'M{r2(points[0][0])} {r2(points[0][1])}')
        for i in rng:
            p1, p2, r, sw = seg[i]
            out.append(f'L{r2(p1[0])} {r2(p1[1])} A{r2(r)} {r2(r)} 0 0 {sw} {r2(p2[0])} {r2(p2[1])}')
        out.append(f'L{r2(points[-1][0])} {r2(points[-1][1])}')
    return ' '.join(out)


def mark(ratio, lines=True):
    dot = A / PHI ** 5
    notch = dot * RT
    bar = dot / PHI ** 2
    hair = bar / PHI ** 2
    k_in = 1 - 1 / PHI ** 6
    ai = A * k_in                            # nửa đường chéo của viền trong
    # Khung xanh và hai vạch trắng nằm GỌN trong viền trong: đầu ngoài của vạch chạm đúng viền trong
    # (trừ nửa nét viền), vạch dài bằng khung. w/2 + h/2 + 1,5·vạch = ai − nét mảnh.
    s_half = ai - hair - 1.5 * bar
    w = 2 * s_half * ratio / (1 + ratio)
    h = 2 * s_half - w
    px, py = C - w / 2, C - h / 2
    top, bot = py - bar, py + h + bar        # tâm hai vạch trắng (cách khung nửa độ dày)
    bar_w = w
    apex = A * (1 - 1 / PHI ** 5)
    ex = w / 2 - bar
    R = A / PHI ** 4                         # bo góc hình thoi
    off = lambda q: (A - q) / 2 ** 0.5       # khoảng lùi vuông góc giữa hai hình thoi đồng tâm
    dia = lambda q: [(C, C - q), (C + q, C), (C, C + q), (C - q, C)]
    r_in = R - off(ai)
    chev_r = max(R - off(apex), hair)
    chev = lambda sg: rounded([(C + sg * ex, top), (C + sg * apex, C), (C + sg * ex, bot)], [0, chev_r, 0], closed=False)
    rb = bar                                 # bo góc khung xanh = độ dày vạch = R/φ³
    # chữ NOBEN: tách từng chữ, khoảng hở giữa các chữ (đo theo chữ đã dựng đứng) = cao chữ / φ⁴
    gs = letters()
    tsl = slant(gs)
    cap0 = max(g['y1'] - g['y0'] for g in gs)
    gap0 = cap0 / PHI ** 4
    x = 0
    shifts = []
    for g in gs:
        lo, hi, _, _ = sbox(g['d'], tsl)
        shifts.append(x - lo)
        x += (hi - lo) + gap0
    total = x - gap0
    ww = w * RT                              # chữ rộng = khung × √φ
    k = ww / total
    ys = [g['y0'] for g in gs] + [g['y1'] for g in gs]
    tx = C - ww / 2
    ty = C - (min(ys) + max(ys)) / 2 * k
    # dịch theo trục nghiêng: tâm khối chữ ở tâm hình thoi
    mid_y = (min(ys) + max(ys)) / 2
    tx += mid_y * tsl * k
    sw = bar / k
    letters_svg = ''.join(f'<path transform="translate({r2(sh)} 0)" d="{g["d"]}"/>' for g, sh in zip(gs, shifts))
    parts = [
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdb57"/><stop offset=".618" stop-color="#ffc20e"/><stop offset="1" stop-color="#f2a900"/></linearGradient>'
        '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22a8ec"/><stop offset=".618" stop-color="#1289d8"/><stop offset="1" stop-color="#0878cc"/></linearGradient></defs>',
        f'<path d="{rounded(dia(A), [R] * 4)}" fill="url(#g)"/>',
        *([f'<path d="{rounded(dia(ai), [r_in] * 4)}" fill="none" stroke="#fff" stroke-opacity=".618" stroke-width="{r2(hair)}"/>',
           f'<path d="{chev(1)} {chev(-1)}" fill="none" stroke="#0878cc" stroke-width="{r2(hair * RT)}" stroke-linejoin="round" stroke-linecap="round"/>'] if lines else []),
        f'<rect x="{r2(C - bar_w / 2)}" y="{r2(top - bar / 2)}" width="{r2(bar_w)}" height="{r2(bar)}" rx="{r2(bar / 2)}" fill="#fff"/>',
        f'<rect x="{r2(C - bar_w / 2)}" y="{r2(bot - bar / 2)}" width="{r2(bar_w)}" height="{r2(bar)}" rx="{r2(bar / 2)}" fill="#fff"/>',
        f'<path d="M{r2(px + rb)} {r2(py)} H{r2(C - notch)} A{r2(notch)} {r2(notch)} 0 0 0 {r2(C + notch)} {r2(py)} H{r2(px + w - rb)} A{r2(rb)} {r2(rb)} 0 0 1 {r2(px + w)} {r2(py + rb)} V{r2(py + h - rb)} A{r2(rb)} {r2(rb)} 0 0 1 {r2(px + w - rb)} {r2(py + h)} H{r2(px + rb)} A{r2(rb)} {r2(rb)} 0 0 1 {r2(px)} {r2(py + h - rb)} V{r2(py + rb)} A{r2(rb)} {r2(rb)} 0 0 1 {r2(px + rb)} {r2(py)} Z" fill="url(#b)"/>',
        f'<circle cx="{r2(C)}" cy="{r2(py - bar)}" r="{r2(dot)}" fill="#fff"/>',
        f'<g transform="translate({r2(tx)} {r2(ty)}) scale({k:.5f})"><g fill="none" stroke="#0a5fb8" stroke-width="{r2(sw)}" stroke-linejoin="round">{letters_svg}</g><g fill="#fff">{letters_svg}</g></g>',
    ]
    y, ws = bot + bar / 2 + dot / RT, w / PHI
    waves = []
    for _ in range(3):
        waves.append(f'M{r2(C - ws / 2)} {r2(y)} Q{r2(C)} {r2(y - bar)} {r2(C + ws / 2)} {r2(y)}')
        y += dot / RT
        ws /= RT
    parts.append(f'<path d="{" ".join(waves)}" fill="none" stroke="#fff" stroke-width="{r2(bar / PHI)}" stroke-linecap="round"/>')
    info = dict(w=w, h=h, dot=dot, notch=notch, bar=bar, hair=hair, word_w=ww, word_cap=cap0 * k, gap=gap0 * k, R=R, slant=tsl)
    return '\n'.join(parts), info


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, ratio, label, lines in (('A', RT, 'khung √φ', True), ('B', PHI, 'khung chữ nhật vàng φ', True), ('A-gon', RT, 'khung √φ, bỏ viền trong và nét gãy', False)):
        body, i = mark(ratio, lines)
        svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Noben">\n'
               f'<title>Noben – logo nắn theo tỷ lệ vàng, phương án {name} ({label})</title>\n{body}\n</svg>\n')
        with open(os.path.join(OUT, f'noben-phi-{name}.svg'), 'w', encoding='utf8') as f:
            f.write(svg)
        print(f'{name}: khung {i["w"]:.1f}×{i["h"]:.1f}, bo góc {i["R"]:.1f}, chữ rộng {i["word_w"]:.1f} cao {i["word_cap"]:.1f}, cách chữ {i["gap"]:.1f}, nghiêng {i["slant"]:.3f}')


if __name__ == '__main__':
    sys.exit(main())
