#!/usr/bin/env python3
"""Bộ logo Noben để in ấn, sinh từ logo chính thức đã nắn theo tỷ lệ vàng (phương án A): public/images/brand/logo-noben-phi.svg.

    pip install picosvg uharfbuzz fonttools brotli
    python3 scripts/build-logo-kit.py          # ghi các SVG vào brand/logo/
    node scripts/build-logo-icons.js           # sau đó: PNG favicon/icon + ảnh xem trước

Biểu tượng (hình thoi có chữ NOBEN):
  noben-logo.svg          bản gốc có gradient (dùng cho web, màn hình)
  noben-logo-phang.svg    không gradient, không trong suốt: màu phẳng để in offset/in lụa nhiều màu
  noben-logo-den/-trang/-navy.svg   MỘT MÀU: một path ghép duy nhất, phần trắng là khoét (in lụa 1 màu)
Logo kèm chữ (giống đầu trang web: "Noben" Playfair Display 800 + "THUỐC THỦY SẢN" Be Vietnam Pro 600):
  noben-lockup-ngang*.svg / noben-lockup-doc*.svg
  ...-chu.svg   chữ là <text> sửa được (cần cài phông)
  ...-net.svg   chữ đã chuyển nét (gửi nhà in, không cần phông)
"""
import io
import os
import re
import sys

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from picosvg import svg_pathops as sp
from picosvg.svg import SVG
from picosvg.svg_types import SVGPath

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'public', 'images', 'brand', 'logo-noben-phi.svg')  # bản A đã duyệt (logo chính thức nắn theo φ, scripts/build-logo-phi.py)
FONTS = os.path.join(ROOT, 'public', 'fonts')
OUT = os.path.join(ROOT, 'brand', 'logo')

NAVY = '#0b2347'
BLUE = '#1b4db1'    # màu chữ "Noben" ở đầu trang web (--link)
MUTED = '#4a5b78'   # màu dòng "Thuốc thủy sản" (--muted)
ON_INK = '#ffffff'
ON_INK_MUTED = '#a9b9d6'
TAGLINE = 'THUỐC THỦY SẢN'


# ---------- Phông ----------
class Face:
    def __init__(self, files, wght=None):
        self.parts = []
        for f in files:
            font = TTFont(os.path.join(FONTS, f))
            if wght and 'fvar' in font:
                font = instancer.instantiateVariableFont(font, {'wght': wght})
            font.flavor = None
            buf = io.BytesIO()
            font.save(buf)
            data = buf.getvalue()
            font = TTFont(io.BytesIO(data))
            hbfont = hb.Font(hb.Face(hb.Blob(data)))
            self.parts.append((font, font.getBestCmap(), font.getGlyphSet(), hbfont, font.getGlyphOrder()))
        self.upem = self.parts[0][0]['head'].unitsPerEm

    def part_for(self, ch):
        for i, p in enumerate(self.parts):
            if ord(ch) in p[1]:
                return i
        raise SystemExit(f'Phông thiếu ký tự {ch!r}')

    def layout(self, text, size, ls_em=0.0):
        """Trả về [(part, glyphname, x)] tính bằng đơn vị đầu ra, và độ rộng (kể cả giãn chữ sau ký tự cuối như trình duyệt)."""
        import unicodedata
        text = unicodedata.normalize('NFC', text)
        k = size / self.upem
        runs, cur = [], None
        for ch in text:
            i = self.part_for(ch) if ch != ' ' else (cur[0] if cur else 0)
            if cur and cur[0] == i:
                cur[1] += ch
            else:
                cur = [i, ch]
                runs.append(cur)
        x, glyphs = 0.0, []
        for i, s in runs:
            font, cmap, gs, hbfont, order = self.parts[i]
            buf = hb.Buffer()
            buf.add_str(s)
            buf.guess_segment_properties()
            hb.shape(hbfont, buf, {'kern': True, 'liga': False})
            last = None
            for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
                glyphs.append((i, order[info.codepoint], x + pos.x_offset * k))
                x += pos.x_advance * k
                if info.cluster != last:
                    x += ls_em * size
                    last = info.cluster
        return glyphs, x

    def outline(self, glyphs, size, x0, base):
        k = size / self.upem
        pen = SVGPathPen(None)
        bp = BoundsPen(None)
        for i, name, gx in glyphs:
            gs = self.parts[i][2]
            t = (k, 0, 0, -k, x0 + gx, base)
            gs[name].draw(TransformPen(pen, t))
            bp.glyphSet = gs
            pen.glyphSet = gs
            gs[name].draw(TransformPen(bp, t))
        return pen.getCommands(), bp.bounds


PLAYFAIR = Face(['playfair-display-latin-wght-normal.woff2', 'playfair-display-vietnamese-wght-normal.woff2'], wght=800)
BVP600 = Face(['be-vietnam-pro-latin-600-normal.woff2', 'be-vietnam-pro-vietnamese-600-normal.woff2', 'be-vietnam-pro-latin-ext-600-normal.woff2'])
FAM = {
    'serif': "'Playfair Display ExtraBold', 'Playfair Display', Georgia, serif",
    'sans': "'Be Vietnam Pro SemiBold', 'Be Vietnam Pro', Arial, sans-serif",
}


def r2(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


# ---------- Biểu tượng ----------
def mark_parts():
    raw = open(SRC, encoding='utf8').read()
    body = re.sub(r'^[\s\S]*?<svg[^>]*>', '', raw)
    body = re.sub(r'</svg>\s*$', '', body)
    body = re.sub(r'\s*<title>.*?</title>', '', body)
    return raw, body.strip()


def mark_color(prefix='nb'):
    _, body = mark_parts()
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}-{m.group(1)}"', body)
    return re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{prefix}-{m.group(1)})', body)


def mark_flat():
    """Màu phẳng, bỏ gradient và độ trong suốt (pha sẵn màu tương đương)."""
    _, body = mark_parts()
    body = re.sub(r'\s*<defs>[\s\S]*?</defs>', '', body)
    body = body.replace('url(#g)', '#ffc20e').replace('url(#b)', '#1590dd')
    body = re.sub(r'stroke="#fff" stroke-opacity="\.6\d*"', 'stroke="#ffe79f"', body)
    return body


def mark_mono_path():
    svg = SVG.parse(SRC).topicosvg()
    paths = list(svg.shapes())
    if len(paths) != 9:
        raise SystemExit(f'logo-noben.svg có {len(paths)} hình, cần cập nhật mark_mono_path() (mong đợi 9)')
    # thoi, viền thoi trong, nét gãy hai bên, vạch trắng, khung xanh, chấm tròn, viền chữ, ruột chữ, sóng
    diamond, outline, chevrons, bars, panel, dot, word_stroke, word_fill, waves = paths
    seq = lambda p: p.as_cmd_seq()
    nz = lambda n: ['nonzero'] * n
    diff = lambda a, b: sp.difference([a, b], nz(2))
    # Khe mảnh quanh khung xanh để khung không dính vào hình thoi khi in một màu.
    gap = diff(list(sp.stroke(seq(panel), 'butt', 'miter', 9, 4, 0.1)), seq(panel))
    parts = [seq(outline), seq(chevrons), seq(bars), seq(dot), gap, seq(word_fill), seq(waves)]
    ink = diff(seq(diamond), sp.union(parts, nz(len(parts))))
    return SVGPath.from_commands(ink).round_floats(2).d


MONO = None


def mark_mono(color):
    return f'<path fill="{color}" d="{MONO}"/>'


def svg_doc(w, h, body, title, desc=''):
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r2(w)} {r2(h)}" width="{r2(w)}" height="{r2(h)}">\n'
            f'<title>{title}</title>\n' + (f'<desc>{desc}</desc>\n' if desc else '') + body + '\n</svg>\n')


# ---------- Logo kèm chữ ----------
S1, S2, LS2 = 250.0, 66.0, 0.16   # cỡ "Noben", cỡ dòng phụ, giãn chữ dòng phụ (em) — theo mark cao 512


def text_lines(s1, s2):
    g1, w1 = PLAYFAIR.layout('Noben', s1)
    g2, w2 = BVP600.layout(TAGLINE, s2, LS2)
    w2_ink = w2 - LS2 * s2  # trình duyệt cộng giãn chữ cả sau ký tự cuối
    _, b1 = PLAYFAIR.outline(g1, s1, 0, 0)
    _, b2 = BVP600.outline(g2, s2, 0, 0)
    return (g1, w1, b1), (g2, w2_ink, b2)


def lockup(kind, mark_svg, c1, c2, outlined):
    k = 1.0 if kind == 'ngang' else 0.66  # logo dọc: chữ nhỏ hơn để biểu tượng nổi bật
    s1, s2 = S1 * k, S2 * k
    (g1, w1, b1), (g2, w2, b2) = text_lines(s1, s2)
    gap_lines = s1 * 0.2
    if kind == 'ngang':
        gap = 512 * 0.13
        tx = 512 + gap
        block_h = (b1[3] - b1[1]) + gap_lines + (b2[3] - b2[1])
        top = 256 - block_h / 2
        base1 = top - b1[1]  # b1[1] là toạ độ trên của chữ so với đường chân chữ (âm)
        base2 = base1 + b1[3] + gap_lines - b2[1]
        x1 = tx - b1[0]
        x2 = tx - b2[0]
        W = tx + max(b1[2] - b1[0], w2) + 6
        H = 512
        mark_tf = ''
    else:
        gap = 512 * 0.07
        tw = max(b1[2] - b1[0], w2)
        W = max(512, tw + 12)
        mx = (W - 512) / 2
        base1 = 512 + gap - b1[1]
        base2 = base1 + b1[3] + gap_lines - b2[1]
        x1 = W / 2 - (b1[2] - b1[0]) / 2 - b1[0]
        x2 = W / 2 - w2 / 2 - b2[0]
        H = base2 + b2[3] + 6
        mark_tf = f' transform="translate({r2(mx)} 0)"'
    parts = [f'<g id="bieu-tuong"{mark_tf}>{mark_svg}</g>']
    if outlined:
        d1, _ = PLAYFAIR.outline(g1, s1, x1, base1)
        d2, _ = BVP600.outline(g2, s2, x2, base2)
        parts.append(f'<g id="chu"><path fill="{c1}" d="{d1}"/><path fill="{c2}" d="{d2}"/></g>')
    else:
        parts.append(
            f'<g id="chu"><text x="{r2(x1)}" y="{r2(base1)}" font-family="{FAM["serif"]}" font-weight="800" font-size="{r2(s1)}" fill="{c1}">Noben</text>'
            f'<text x="{r2(x2)}" y="{r2(base2)}" font-family="{FAM["sans"]}" font-weight="600" font-size="{r2(s2)}" letter-spacing="{r2(LS2 * s2)}" fill="{c2}">{TAGLINE}</text></g>')
    return W, H, '\n'.join(parts)


def main():
    global MONO
    os.makedirs(OUT, exist_ok=True)
    MONO = mark_mono_path()
    raw, _ = mark_parts()
    written = []

    def write(name, content):
        with open(os.path.join(OUT, name), 'w', encoding='utf8') as f:
            f.write(content)
        written.append(name)

    write('noben-logo.svg', raw if raw.endswith('\n') else raw + '\n')
    write('noben-logo-phang.svg', svg_doc(512, 512, mark_flat(), 'Noben – màu phẳng', 'Không gradient, không trong suốt. Vàng #ffc20e, xanh #1590dd, viền chữ #0a5fb8.'))
    for name, col in (('den', '#000000'), ('trang', '#ffffff'), ('navy', NAVY)):
        write(f'noben-logo-{name}.svg', svg_doc(512, 512, mark_mono(col), f'Noben – một màu {name}', 'Một path ghép duy nhất, phần trắng là khoét để in lụa một màu.'))

    variants = [
        ('', mark_color(), BLUE, MUTED),
        ('-nen-toi', mark_color(), ON_INK, ON_INK_MUTED),
        ('-phang', mark_flat(), BLUE, MUTED),
        ('-den', mark_mono('#000000'), '#000000', '#000000'),
        ('-trang', mark_mono('#ffffff'), '#ffffff', '#ffffff'),
        ('-navy', mark_mono(NAVY), NAVY, NAVY),
    ]
    for kind in ('ngang', 'doc'):
        for suffix, mk, c1, c2 in variants:
            label = f'Noben – logo {"ngang" if kind == "ngang" else "dọc"}{suffix.replace("-", " ")}'
            W, H, body = lockup(kind, mk, c1, c2, outlined=True)
            write(f'noben-lockup-{kind}{suffix}-net.svg', svg_doc(W, H, body, label, 'Chữ đã chuyển nét: gửi nhà in, không cần cài phông.'))
            if suffix in ('', '-nen-toi'):
                W, H, body = lockup(kind, mk, c1, c2, outlined=False)
                write(f'noben-lockup-{kind}{suffix}-chu.svg', svg_doc(W, H, body, label + ' (chữ sửa được)', 'Chữ sửa được: cần cài Playfair Display (ExtraBold 800) và Be Vietnam Pro (SemiBold 600).'))
    print(f'Ghi {len(written)} file vào brand/logo/')
    return 0


if __name__ == '__main__':
    sys.exit(main())
