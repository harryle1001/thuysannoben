#!/usr/bin/env python3
"""Xuất ảnh dán (texture) và danh sách sản phẩm cho trang xoay 360° (xoay-360/).
Đọc: nhan/san-pham-son-ha.json, nhan/out/*-concept-t.png (nhãn chai), nhan/out500/ (chai 500 ml), out/tui/*.png (túi).
Ghi: xoay-360/tex/*.jpg và xoay-360/san-pham.json. Chạy lại sau mỗi lần sửa dữ liệu (xem lam-lai.sh)."""
import json, re, pathlib, os, shutil, subprocess
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
D = pathlib.Path(__file__).parent
src = (D / 'nhan' / 'build.js').read_text(encoding='utf-8')
def table(name):
    body = src[src.index(f'const {name} = {{'):]
    body = body[:body.index('\n};')]
    return dict(re.findall(r"'?([a-z-]+)'?:\s*'([^']+)'", body))
LOAI, MAU = table('LOAI'), table('MAU_LOAI')
KT = json.loads((D / 'kich-thuoc.json').read_text(encoding='utf-8'))  # khổ bao bì thật (mm)
# Các bộ dữ liệu: (file dữ liệu, thư mục nhãn chai, thư mục nhãn chai 500 ml, thư mục ảnh túi). Bộ trước ưu tiên khi trùng slug.
BO = [
    ('nhan/san-pham-son-ha.json', 'nhan/out', 'nhan/out500', 'out/tui'),
    ('nhan/san-pham-nhuong.json', 'out/nhuong/nhan', None, 'out/nhuong/tui'),
]
# Trang trên web (/xoay-360): chỉ sản phẩm đang hiện trên web và không còn chỗ [ĐIỀN]. WEB=0 để xuất bản nội bộ đủ sản phẩm.
ROOT = D.parent.parent
WEB = os.environ.get('WEB', '1') != '0'
ALIAS = {'super-cut-alga': 'super-cut-algae', 'prozym': 'prozyme', 'mega-cid-new': 'mega-cid'}
web_slugs = set()
if WEB:
    js = subprocess.run(['node', '-e', "const c=require('./src/content');process.stdout.write(JSON.stringify(c.products.map(p=>p.slug)))"], cwd=ROOT, capture_output=True, text=True).stdout
    web_slugs = set(json.loads(js[js.rindex('["'):]))
DEST = (ROOT / 'public' / 'xoay-360') if WEB else (D / 'xoay-360')
TEX = DEST / 'tex'; shutil.rmtree(TEX, ignore_errors=True); TEX.mkdir(parents=True, exist_ok=True)
out, seen = [], set()
for data_f, lab, lab500, tui in BO:
    if not (D / data_f).exists(): continue
    for p in json.loads((D / data_f).read_text(encoding='utf-8'))['san_pham']:
        s = p['slug']
        if s in seen: continue
        web = ALIAS.get(s, s)
        if WEB and (web not in web_slugs or '[ĐIỀN' in json.dumps(p, ensure_ascii=False)): continue
        seen.add(s)
        it = {k: p[k] for k in ('slug', 'ten', 'quy_cach', 'ma_so', 'tccs', 'the_tich')}
        it.update(web=web if web in web_slugs else None, loai=LOAI.get(p['loai'], ''), mau=MAU.get(p['loai'], '#0c2a63'), cach='Trộn ăn' if p['cach_dung'] == 'tron-an' else 'Tạt ao',
                  hoat_chat=re.sub(r'\s*\(min\)', '', p['thanh_phan'][0]).replace(':', ''), cong_dung=p['cong_dung'])
        if p['dang'] == 'goi':
            wm, hm = KT['tui'].get(p['the_tich'], KT['tui_mac_dinh'])
            it.update(kieu='tui', w=wm / 10, h=hm / 10)
            for k in ('truoc', 'sau'):
                im = Image.open(D / tui / f'{s}-{k}.png').convert('RGB')
                im.resize((round(2048 * im.width / im.height), 2048), Image.LANCZOS).save(TEX / f'{s}-{k}.jpg', quality=84, optimize=True, progressive=True)
        else:
            f500 = D / lab500 / f'{s}-concept-t.png' if lab500 else None
            is500 = bool(f500 and f500.exists())
            im = Image.open(f500 if is500 else D / lab / f'{s}-concept-t.png').convert('RGB')
            it.update(kieu='chai500' if is500 else 'chai1l', nhan_mm=[159.4, 80] if is500 else [161.8, 100])
            im.resize((2400, round(2400 * im.height / im.width)), Image.LANCZOS).save(TEX / f'{s}.jpg', quality=84, optimize=True, progressive=True)
        out.append(it)
(DEST / 'san-pham.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print('xoay-360:', len(out), 'sản phẩm →', DEST.relative_to(ROOT))
