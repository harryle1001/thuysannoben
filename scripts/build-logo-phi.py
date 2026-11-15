#!/usr/bin/env python3
"""Bản ĐỀ XUẤT tinh chỉnh logo chính thức Noben theo tỷ lệ vàng φ = 1,61803 (chưa dùng trên web).

    python3 scripts/build-logo-phi.py     # ghi brand/logo/de-xuat-phi/*.svg

GIỮ ĐÚNG FORM logo đang dùng (hình thoi vuông vàng, viền trong, hai nét gãy hai bên, khung xanh có khuyết
và chấm tròn, hai vạch trắng trên dưới khung, chữ NOBEN tràn ngang khung có viền xanh, ba sóng nước).
Chỉ tinh chỉnh bằng φ:
  - Khung xanh: hình chữ nhật vàng (rộng : cao = φ), diện tích = 38,2% hình thoi (vàng 61,8% / xanh 38,2%).
  - Chữ NOBEN: Playfair Display đậm, cao chữ hoa = cao khung / φ², giãn chữ 1/φ⁵ em, viền = cao chữ / φ⁵.
  - Chấm tròn, khuyết, vạch, nét gãy, sóng, khoảng cách: mỗi bậc nhỏ hơn bậc trước φ lần.
  - Màu vàng kim và xanh sapphire, chuyển màu theo điểm dừng 0 – 38,2% – 61,8% – 100%.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('kit', os.path.join(HERE, 'build-logo-kit.py'))
kit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kit)

PHI = (1 + 5 ** 0.5) / 2
OUT = os.path.join(kit.ROOT, 'brand', 'logo', 'de-xuat-phi')
r2 = kit.r2

# Màu: vàng kim và xanh sapphire đậm
GOLD = ('#f7e7a1', '#e3c35a', '#c9a227', '#9c7a12')     # sáng → kim → đậm
BLUE = ('#1d4fa3', '#123a82', '#0b2a63', '#071a40')
IVORY = '#fffaf0'
NAVY = '#0b2347'

W, H = 1000.0, 1000.0                  # hình thoi vuông như logo gốc
CX, CY = W / 2, H / 2
A, B = W / 2, H / 2
PW = (W * H / 2 / PHI ** 2 * PHI) ** 0.5   # chữ nhật vàng PW / PH = φ, diện tích 38,2% hình thoi
PH = PW / PHI
PX, PY = CX - PW / 2, CY - PH / 2

SERIF = kit.Face(['playfair-display-latin-wght-normal.woff2', 'playfair-display-vietnamese-wght-normal.woff2'], wght=700)
SANS = kit.BVP600
LS_WORD = 1 / PHI ** 5                 # giãn chữ NOBEN (em)
LS_TAG = 1 / PHI ** 2                  # giãn chữ dòng phụ (em)


def text_path(face, text, size, ls, cx, cy_mid=None, base=None, fill='#fff'):
    """Chữ đã chuyển nét, căn giữa theo cx; cy_mid = tâm chiều cao chữ, hoặc base = đường chân chữ."""
    g, adv = face.layout(text, size, ls)
    _, b = face.outline(g, size, 0, 0)
    x = cx - (b[0] + b[2]) / 2
    y = base if base is not None else cy_mid - (b[1] + b[3]) / 2
    d, bb = face.outline(g, size, x, y)
    return f'<path fill="{fill}" d="{d}"/>', bb


def cap_size(face, cap_h):
    g, _ = face.layout('N', 1000, 0)
    _, b = face.outline(g, 1000, 0, 0)
    return cap_h / ((b[3] - b[1]) / 1000)


def defs(p='p'):
    stops = lambda c: ''.join(f'<stop offset="{o}" stop-color="{col}"/>' for o, col in zip(('0', '.382', '.618', '1'), c))
    return (f'<defs><linearGradient id="{p}-gold" x1="0" y1="0" x2="1" y2="1">{stops(GOLD)}</linearGradient>'
            f'<linearGradient id="{p}-blue" x1="0" y1="0" x2="0" y2="1">{stops(BLUE)}</linearGradient>'
            f'<linearGradient id="{p}-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{GOLD[2]}"/><stop offset=".382" stop-color="{GOLD[0]}"/><stop offset="1" stop-color="{GOLD[2]}"/></linearGradient></defs>')


def mark(flat=False, p='p'):
    gold = GOLD[2] if flat else f'url(#{p}-gold)'
    blue = BLUE[2] if flat else f'url(#{p}-blue)'
    deep = BLUE[3]
    rh = lambda k: f'M{r2(CX)} {r2(CY - B * k)} L{r2(CX + A * k)} {r2(CY)} L{r2(CX)} {r2(CY + B * k)} L{r2(CX - A * k)} {r2(CY)} Z'
    dot = PH / PHI ** 4                      # bán kính chấm tròn
    notch = dot * PHI ** 0.5                 # bán kính khuyết trên khung
    bar = dot / PHI ** 2                     # dày vạch trắng
    hair = bar / PHI ** 2                    # nét mảnh (viền trong, nét gãy)
    gap = bar                                # khe giữa khung và vạch
    cap = PH / PHI ** 2                      # cao chữ hoa NOBEN
    size = cap_size(SERIF, cap)
    g, _ = SERIF.layout('NOBEN', size, LS_WORD)
    _, b0 = SERIF.outline(g, size, 0, 0)
    d, wb = SERIF.outline(g, size, CX - (b0[0] + b0[2]) / 2, CY - (b0[1] + b0[3]) / 2)
    stroke = cap / PHI ** 5 * 2
    bar_w = PW + 2 * dot / PHI
    top, bot = PY - gap - bar / 2, PY + PH + gap + bar / 2
    apex = A * (1 - 1 / PHI ** 5)            # đỉnh nét gãy cách tâm
    cx_end = PW / 2 - hair
    chev = lambda sgn: f'M{r2(CX + sgn * cx_end)} {r2(top)} L{r2(CX + sgn * apex)} {r2(CY)} L{r2(CX + sgn * cx_end)} {r2(bot)}'
    parts = [
        f'<path d="{rh(1)}" fill="{gold}"/>',
        f'<path d="{rh(1 - 1 / PHI ** 6)}" fill="none" stroke="{IVORY}" stroke-opacity=".618" stroke-width="{r2(hair)}"/>',
        f'<path d="{chev(1)} {chev(-1)}" fill="none" stroke="{BLUE[1]}" stroke-width="{r2(hair * PHI)}" stroke-linejoin="round" stroke-linecap="round"/>',
        f'<path d="M{r2(CX - bar_w / 2)} {r2(top)} H{r2(CX + bar_w / 2)} M{r2(CX - bar_w / 2)} {r2(bot)} H{r2(CX + bar_w / 2)}" stroke="{IVORY}" stroke-width="{r2(bar)}"/>',
        f'<path d="M{r2(PX)} {r2(PY)} H{r2(CX - notch)} A{r2(notch)} {r2(notch)} 0 0 0 {r2(CX + notch)} {r2(PY)} H{r2(PX + PW)} V{r2(PY + PH)} H{r2(PX)} Z" fill="{blue}"/>',
        f'<circle cx="{r2(CX)}" cy="{r2(PY - gap)}" r="{r2(dot)}" fill="{IVORY}"/>',
        f'<path d="{d}" fill="none" stroke="{deep}" stroke-width="{r2(stroke)}" stroke-linejoin="round"/>',
        f'<path d="{d}" fill="{IVORY}"/>',
    ]
    # ba sóng nước dưới khung: rộng và dày giảm dần theo φ
    y, w, t, step = bot + bar / 2, PW / PHI, bar / PHI ** 0.5, dot * PHI ** 0.5
    for i in range(3):
        y += step
        parts.append(f'<path d="M{r2(CX - w / 2)} {r2(y)} Q{r2(CX)} {r2(y - t * PHI)} {r2(CX + w / 2)} {r2(y)}" fill="none" stroke="{IVORY}" stroke-width="{r2(t)}" stroke-linecap="round"/>')
        w, t, step = w / PHI ** 0.5, t / PHI ** 0.5, step / PHI ** 0.5
    return '\n'.join(parts), dict(dot=dot, notch=notch, hair=hair, cap=cap, size=size, word=wb)


def doc(w, h, body, title, bg=None):
    rect = f'<rect width="{r2(w)}" height="{r2(h)}" fill="{bg}"/>' if bg else ''
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r2(w)} {r2(h)}" width="{r2(w)}" height="{r2(h)}">\n'
            f'<title>{title}</title>\n{rect}{body}\n</svg>\n')


def lockup(kind, dark=False):
    m, info = mark()
    c1, c2 = (IVORY, GOLD[1]) if dark else (NAVY, GOLD[3])
    tag_cap = info['cap'] / PHI ** 2               # dòng phụ nhỏ hơn chữ NOBEN φ² lần
    ts = cap_size(SANS, tag_cap)
    sub_cap = tag_cap / PHI
    ss = cap_size(SANS, sub_cap)
    pad = H / PHI ** 4                             # khoảng trống quanh logo = H/φ⁴
    if kind == 'doc':
        t1, b1 = text_path(SANS, 'THUỐC THỦY SẢN', ts, LS_TAG, CX + pad, base=pad + H + pad / PHI + tag_cap, fill=c1)
        t2, b2 = text_path(SANS, 'ISO 9001:2015 · TỪ 2002', ss, LS_TAG, CX + pad, base=b1[3] + tag_cap / PHI + sub_cap * PHI, fill=c2)
        body = f'{defs()}<g transform="translate({r2(pad)} {r2(pad)})">{m}</g>{t1}{t2}'
        return W + 2 * pad, b2[3] + pad, body
    gap = pad
    x0 = pad + W + gap
    rule = f'<rect x="{r2(x0)}" y="{r2(pad + H / 2 - H / PHI ** 2 / 2)}" width="{r2(info["hair"] * PHI)}" height="{r2(H / PHI ** 2)}" fill="{GOLD[2]}"/>'
    g1, _ = SANS.layout('THUỐC THỦY SẢN', ts, LS_TAG)
    _, bb1 = SANS.outline(g1, ts, 0, 0)
    g2, _ = SANS.layout('ISO 9001:2015 · TỪ 2002', ss, LS_TAG)
    _, bb2 = SANS.outline(g2, ss, 0, 0)
    tw = max(bb1[2], bb2[2])
    tx = x0 + gap / PHI
    cy = pad + H / 2
    block = tag_cap + tag_cap * PHI + sub_cap
    base1 = cy - block / 2 + tag_cap
    base2 = base1 + tag_cap * PHI + sub_cap
    d1, _ = SANS.outline(g1, ts, tx - bb1[0], base1)
    d2, _ = SANS.outline(g2, ss, tx - bb2[0], base2)
    body = f'{defs()}<g transform="translate({r2(pad)} {r2(pad)})">{m}</g>{rule}<path fill="{c1}" d="{d1}"/><path fill="{c2}" d="{d2}"/>'
    return tx + tw + pad, H + 2 * pad, body


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {}
    m, _ = mark()
    files['noben-phi-logo.svg'] = doc(W, H, defs() + m, 'Noben – logo đề xuất theo tỷ lệ vàng')
    mf, _ = mark(flat=True)
    files['noben-phi-logo-phang.svg'] = doc(W, H, mf, 'Noben – logo đề xuất, màu phẳng')
    for kind in ('ngang', 'doc'):
        w, h, body = lockup(kind)
        files[f'noben-phi-lockup-{kind}.svg'] = doc(w, h, body, f'Noben – logo đề xuất, xếp {kind}')
        w, h, body = lockup(kind, dark=True)
        files[f'noben-phi-lockup-{kind}-nen-toi.svg'] = doc(w, h, body, f'Noben – logo đề xuất, xếp {kind}, nền tối', bg=NAVY)
    for name, content in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf8') as f:
            f.write(content)
    print(f'Ghi {len(files)} file vào brand/logo/de-xuat-phi/')


if __name__ == '__main__':
    sys.exit(main())
