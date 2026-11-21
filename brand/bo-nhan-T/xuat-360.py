#!/usr/bin/env python3
"""Xuất ảnh dán (texture) và danh sách sản phẩm cho trang xoay 360° (xoay-360/).
Đọc: nhan/san-pham-son-ha.json, nhan/out/*-concept-t.png (nhãn chai), nhan/out500/ (chai 500 ml), out/tui/*.png (túi).
Ghi: xoay-360/tex/*.jpg và xoay-360/san-pham.json. Chạy lại sau mỗi lần sửa dữ liệu (xem lam-lai.sh)."""
import json, re, pathlib
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
D = pathlib.Path(__file__).parent
src = (D / 'nhan' / 'build.js').read_text(encoding='utf-8')
def table(name):
    body = src[src.index(f'const {name} = {{'):]
    body = body[:body.index('\n};')]
    return dict(re.findall(r"'?([a-z-]+)'?:\s*'([^']+)'", body))
LOAI, MAU = table('LOAI'), table('MAU_LOAI')
data = json.loads((D / 'nhan' / 'san-pham-son-ha.json').read_text(encoding='utf-8'))['san_pham']
TEX = D / 'xoay-360' / 'tex'; TEX.mkdir(parents=True, exist_ok=True)
KT = json.loads((D / 'kich-thuoc.json').read_text(encoding='utf-8'))  # khổ bao bì thật (mm)
out = []
for p in data:
    s = p['slug']; it = {k: p[k] for k in ('slug', 'ten', 'quy_cach', 'ma_so', 'tccs', 'the_tich')}
    it.update(loai=LOAI.get(p['loai'], ''), mau=MAU.get(p['loai'], '#0c2a63'), cach='Trộn ăn' if p['cach_dung'] == 'tron-an' else 'Tạt ao',
              hoat_chat=re.sub(r'\s*\(min\)', '', p['thanh_phan'][0]).replace(':', ''), cong_dung=p['cong_dung'])
    if p['dang'] == 'goi':
        wm, hm = KT['tui'].get(p['the_tich'], KT['tui_mac_dinh'])
        it.update(kieu='tui', w=wm / 10, h=hm / 10)
        for k in ('truoc', 'sau'):
            im = Image.open(D / 'out' / 'tui' / f'{s}-{k}.png').convert('RGB')
            im.resize((round(2048 * im.width / im.height), 2048), Image.LANCZOS).save(TEX / f'{s}-{k}.jpg', quality=86, optimize=True, progressive=True)
    else:
        f500 = D / 'nhan' / 'out500' / f'{s}-concept-t.png'
        f = f500 if f500.exists() else D / 'nhan' / 'out' / f'{s}-concept-t.png'
        im = Image.open(f).convert('RGB')
        it.update(kieu='chai500' if f500.exists() else 'chai1l', nhan_mm=[159.4, 80] if f500.exists() else [161.8, 100])
        im.resize((2400, round(2400 * im.height / im.width)), Image.LANCZOS).save(TEX / f'{s}.jpg', quality=86, optimize=True, progressive=True)
    out.append(it)
(D / 'xoay-360' / 'san-pham.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print('xoay-360:', len(out), 'sản phẩm')
