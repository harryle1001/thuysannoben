#!/usr/bin/env bash
# Làm lại toàn bộ bộ nhãn mẫu T từ dữ liệu, không vẽ lại.
# Sửa thông tin trong nhan/san-pham-son-ha.json (giá trong catalog/gia.json), rồi chạy:
#   bash brand/bo-nhan-T/lam-lai.sh          nhãn in (PDF + PNG), túi trước/sau, trang xoay 360°
#   bash brand/bo-nhan-T/lam-lai.sh --3d     thêm ảnh 3D tĩnh và catalogue PDF (chậm hơn)
set -euo pipefail
cd "$(dirname "$0")"
DPI=${DPI:-600}
echo "1/4 Nhãn chai 1 lít và nhãn túi"
DATA=nhan/san-pham-son-ha.json DPI=$DPI node nhan/build.js --concept t
echo "2/4 Nhãn chai 500 ml (khổ 159,4 × 80 mm)"
mkdir -p nhan/out500
DATA=nhan/san-pham-son-ha.json LABEL_H=80 SIDE_W=55 OUT_DIR=nhan/out500 DPI=$DPI node nhan/build.js --chi mega-cid-new --concept t
echo "3/4 Mặt trước, mặt sau túi bột và file in túi (PDF vector)"
node tui.js
node tui-in.js
echo "4/4 Trang xoay 360°"
python3 xuat-360.py
if [[ "${1:-}" == "--3d" ]]; then
  echo "Ảnh 3D và catalogue"
  mkdir -p out/3d
  python3 - <<'PY'
import json, subprocess
d = json.load(open('nhan/san-pham-son-ha.json'))['san_pham']
x = json.load(open('xoay-360/san-pham.json')); by = {p['slug']: p for p in x}
for p in d:
    s = p['slug']; it = by[s]
    if it['kieu'] == 'tui':
        subprocess.run(['node', 'pouch3d.js', '--items', f"out/tui/{s}-truoc.png:{it['w']}:{it['h']}", '--shot', 'single', '--out', f'out/3d/{s}.png', '--w', '1600', '--h', '2000'], check=True)
    elif it['kieu'] == 'chai1l':
        subprocess.run(['node', 'noben3d.js', '--labels', f'nhan/out/{s}-concept-t.png', '--out', f'out/3d/{s}.png', '--shot', 'front', '--w', '1200', '--h', '1600'], check=True)
chai = [p['slug'] for p in x if p['kieu'] == 'chai1l'][:5]; tui = [p for p in x if p['kieu'] == 'tui'][:5]
subprocess.run(['node', 'noben3d.js', '--labels', ','.join(f'nhan/out/{s}-concept-t.png' for s in chai), '--out', 'out/3d/00-chai.png', '--shot', 'line', '--w', '3840', '--h', '2160'], check=True)
subprocess.run(['node', 'pouch3d.js', '--items', ','.join(f"out/tui/{p['slug']}-truoc.png:{p['w']}:{p['h']}" for p in tui), '--out', 'out/3d/00-tui.png', '--w', '3840', '--h', '2160'], check=True)
PY
  node catalog/build.js
fi
echo "Xong. Nhãn chai in: nhan/out/*.pdf · file in túi: out/in/ · ảnh túi: out/tui · xoay 360°: xoay-360/index.html"
