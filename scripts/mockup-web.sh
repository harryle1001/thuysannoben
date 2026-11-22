#!/bin/bash
# Xuất ảnh bao bì 3D (giữ nhãn cũ) cho website: nền trong suốt, xoay nhẹ 20°, cao 900 px, WebP
# -> public/images/products-cutout/<slug>.webp (thay ảnh tách nền cũ; ảnh poster ở public/images/products giữ nguyên).
#   bash scripts/mockup-web.sh <thư mục thông số (json + nhãn)> [slug ...]
# Thông số và nhãn: brand/mockup-4k/nhan-cu (tạo bằng scripts/mockup-tu-dong.py).
cd "$(dirname "$0")/.." || exit 1
DIR=${1:-brand/mockup-4k/nhan-cu}; shift
OUT=public/images/products-cutout
TMP=$(mktemp -d)
declare -A TAY=([super-yucca]=chai [bio-aq]=hu [clear-12h]=tui [mix-79]=bao)   # 4 mẫu dựng tay đã duyệt
SLUGS=${*:-$(ls "$DIR"/*.json | xargs -n1 basename | sed 's/\.json$//') ${!TAY[*]}}
for s in $SLUGS; do
  if [ -n "${TAY[$s]}" ]; then
    node scripts/mockup-3d-cu.js --kieu cu --shot "${TAY[$s]}" --dir brand/mockup-4k/nhan-cu --goc 20 --trong --w 1600 --h 2000 --out "$TMP/$s.png" >/dev/null || continue
  else
    node scripts/mockup-3d-cu.js --spec "$DIR/$s.json" --goc 20 --trong --w 1600 --h 2000 --out "$TMP/$s.png" >/dev/null || continue
  fi
  python3 - "$TMP/$s.png" "$OUT/$s.webp" <<'EOF'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
k = (900 - 54) / im.height                       # lề 27 px như ảnh tách nền cũ
im = im.resize((round(im.width * k), 900 - 54), Image.LANCZOS)
out = Image.new('RGBA', (im.width + 54, 900), (0, 0, 0, 0)); out.paste(im, (27, 27))
out.save(sys.argv[2], quality=88, method=6)
EOF
  echo "$s"
done
rm -rf "$TMP"
