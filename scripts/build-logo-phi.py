#!/usr/bin/env python3
"""Bản ĐỀ XUẤT làm mới logo chính thức Noben theo tỷ lệ vàng φ = 1,61803 (chưa dùng trên web).

    python3 scripts/build-logo-phi.py     # ghi brand/logo/de-xuat-phi/*.svg

Giữ ý tưởng logo gốc (hình thoi vàng, khung xanh, chữ NOBEN, chấm tròn, sóng nước), dựng lại bằng φ:
  - Hình thoi vàng: hai đường chéo theo tỷ lệ φ : 1 (góc nhọn 63,43°, góc tù 116,57°).
  - Khung xanh: hình chữ nhật vàng (rộng : cao = φ), diện tích = 38,2% hình thoi (vàng 61,8% / xanh 38,2%).
  - Chữ NOBEN: Playfair Display, cao chữ hoa = cao khung / φ³, giãn chữ 1/φ⁴ em.
  - Chấm tròn, viền, sóng, khoảng cách: mỗi bậc nhỏ hơn bậc trước φ lần.
  - Màu chuyển theo điểm dừng 0 – 38,2% – 61,8% – 100%.
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

W, H = 1000.0, 1000.0 / PHI            # hình thoi: đường chéo φ : 1
CX, CY = W / 2, H / 2
A, B = W / 2, H / 2
S = (1 / PHI ** 2 / 0.5) ** 0.5        # khung xanh = 38,2% diện tích hình thoi
PW, PH = A * S, B * S                  # chữ nhật vàng, PW / PH = φ
PX, PY = CX - PW / 2, CY - PH / 2

SERIF = kit.Face(['playfair-display-latin-wght-normal.woff2', 'playfair-display-vietnamese-wght-normal.woff2'], wght=700)
SANS = kit.BVP600
LS_WORD = 1 / PHI ** 4                 # giãn chữ NOBEN (em)
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
    line = GOLD[0] if flat else f'url(#{p}-line)'
    rh = lambda k: f'M{r2(CX)} {r2(CY - B * k)} L{r2(CX + A * k)} {r2(CY)} L{r2(CX)} {r2(CY + B * k)} L{r2(CX - A * k)} {r2(CY)} Z'
    dot = PH / PHI ** 5                      # bán kính chấm tròn
    notch = dot * PHI ** 0.5                 # bán kính khuyết trên khung
    hair = dot / PHI ** 4                    # nét mảnh
    cap = PH / PHI ** 3                      # cao chữ hoa NOBEN
    size = cap_size(SERIF, cap)
    word, wb = text_path(SERIF, 'NOBEN', size, LS_WORD, CX, cy_mid=CY + dot / PHI, fill=IVORY)
    rule_w = (wb[2] - wb[0]) / PHI
    rule_y = wb[3] + cap / PHI ** 2
    parts = [
        f'<path d="{rh(1)}" fill="{gold}"/>',
        f'<path d="{rh(1 - 1 / PHI ** 6)}" fill="none" stroke="{IVORY}" stroke-opacity=".618" stroke-width="{r2(hair)}"/>',
        # khung xanh có khuyết tròn phía trên
        f'<path d="M{r2(PX)} {r2(PY)} H{r2(CX - notch)} A{r2(notch)} {r2(notch)} 0 0 0 {r2(CX + notch)} {r2(PY)} H{r2(PX + PW)} V{r2(PY + PH)} H{r2(PX)} Z" fill="{blue}"/>',
        f'<rect x="{r2(PX + hair * PHI ** 3)}" y="{r2(PY + hair * PHI ** 3)}" width="{r2(PW - 2 * hair * PHI ** 3)}" height="{r2(PH - 2 * hair * PHI ** 3)}" fill="none" stroke="{line}" stroke-width="{r2(hair)}" stroke-opacity=".618"/>',
        f'<circle cx="{r2(CX)}" cy="{r2(PY)}" r="{r2(dot)}" fill="{IVORY}"/>',
        word,
        f'<rect x="{r2(CX - rule_w / 2)}" y="{r2(rule_y)}" width="{r2(rule_w)}" height="{r2(hair * PHI)}" fill="{line}"/>',
    ]
    # ba sóng nước dưới khung: rộng, dày, cách nhau giảm dần theo φ
    y, w, t, gap = PY + PH, PW / PHI, hair * PHI ** 3, dot
    for i in range(3):
        y += gap
        sag = t * PHI
        parts.append(f'<path d="M{r2(CX - w / 2)} {r2(y)} Q{r2(CX)} {r2(y - sag)} {r2(CX + w / 2)} {r2(y)}" fill="none" stroke="{NAVY if flat else blue}" stroke-width="{r2(t)}" stroke-linecap="round"/>')
        w, t, gap = w / PHI, t / PHI, gap / PHI ** 0.5
    return '\n'.join(parts), dict(dot=dot, notch=notch, hair=hair, cap=cap, size=size, word=wb, rule_y=rule_y)


def doc(w, h, body, title, bg=None):
    rect = f'<rect width="{r2(w)}" height="{r2(h)}" fill="{bg}"/>' if bg else ''
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r2(w)} {r2(h)}" width="{r2(w)}" height="{r2(h)}">\n'
            f'<title>{title}</title>\n{rect}{body}\n</svg>\n')


def lockup(kind, dark=False):
    m, info = mark()
    c1, c2 = (IVORY, GOLD[1]) if dark else (NAVY, GOLD[3])
    tag_cap = info['cap'] / PHI                    # dòng phụ nhỏ hơn chữ NOBEN φ lần
    ts = cap_size(SANS, tag_cap)
    sub_cap = tag_cap / PHI
    ss = cap_size(SANS, sub_cap)
    pad = H / PHI ** 3                             # khoảng trống quanh logo = H/φ³
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


def construction():
    """Bản vẽ cấu trúc: các tỷ lệ φ chồng lên logo."""
    m, info = mark()
    pad = 150
    g = '#b4232c'
    t = lambda x, y, s, anchor='start': f'<text x="{r2(x)}" y="{r2(y)}" font-family="Be Vietnam Pro, Arial, sans-serif" font-size="20" fill="{g}" text-anchor="{anchor}">{s}</text>'
    ln = lambda x1, y1, x2, y2: f'<line x1="{r2(x1)}" y1="{r2(y1)}" x2="{r2(x2)}" y2="{r2(y2)}" stroke="{g}" stroke-width="1.5" stroke-dasharray="6 4"/>'
    o = [f'<g transform="translate({pad} {pad})">', f'<g opacity=".9">{m}</g>',
         ln(0, CY, W, CY), ln(CX, 0, CX, H),
         f'<rect x="{r2(PX)}" y="{r2(PY)}" width="{r2(PW)}" height="{r2(PH)}" fill="none" stroke="{g}" stroke-width="1.5"/>',
         ln(PX, PY + PH + 14, PX + PW, PY + PH + 14), ln(PX + PW + 14, PY, PX + PW + 14, PY + PH),
         t(CX, -70, 'Đường chéo ngang a = 1000', 'middle'), ln(0, -50, W, -50),
         t(W + 30, CY - 8, 'b = a / φ'), t(W + 30, CY + 18, '= 618'),
         t(CX, H + 60, 'Góc nhọn 63,43° · góc tù 116,57° (hình thoi vàng)', 'middle'),
         t(PX + PW + 24, PY + PH / 2, 'cao = rộng / φ'),
         t(CX, PY + PH + 40, 'Khung xanh = 38,2% diện tích · vàng 61,8%', 'middle'),
         t(PX + 12, info['word'][1] - 12, 'Cao chữ = cao khung / φ³ · giãn chữ 1/φ⁴ em'),
         t(CX + info['notch'] + 12, PY - 14, 'r chấm = cao khung / φ⁵'),
         '</g>']
    return W + 2 * pad, H + 2 * pad, defs() + ''.join(o)


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
    w, h, body = construction()
    files['noben-phi-cau-truc.svg'] = doc(w, h, body, 'Noben – bản vẽ cấu trúc tỷ lệ vàng', bg='#ffffff')
    for name, content in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf8') as f:
            f.write(content)
    print(f'Ghi {len(files)} file vào brand/logo/de-xuat-phi/')


if __name__ == '__main__':
    sys.exit(main())
