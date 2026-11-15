#!/usr/bin/env bash
# Renders the three product ads: 9:16 social masters (with synthesized sound bed) and
# compressed 16:9 web cuts (mp4 + webm, muted) with a .webp poster, into ../public/media/ads.
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/ads; mkdir -p "$OUT" out
node make-sfx.mjs
for pair in "G7:g7-phong-va-tri-benh-gan-chet-som" "Caphote:caphote" "Aqualac:aqualac-fs"; do
  id=${pair%%:*}; slug=${pair#*:}
  npx remotion render src/index.ts "Ad${id}Vertical" "$OUT/$slug-9x16.mp4" --codec h264 --crf 18 --audio-codec aac --browser-executable="$B" --overwrite
  npx remotion render src/index.ts "Ad${id}Wide" "out/$slug-16x9-master.mp4" --codec h264 --crf 14 --muted --browser-executable="$B" --overwrite
  ffmpeg -v error -y -i "out/$slug-16x9-master.mp4" -an -c:v libx264 -preset slow -crf 27 -maxrate 1.6M -bufsize 3.2M -pix_fmt yuv420p -movflags +faststart "$OUT/$slug-16x9.mp4"
  ffmpeg -v error -y -i "out/$slug-16x9-master.mp4" -an -c:v libvpx-vp9 -b:v 1.1M -crf 36 -row-mt 1 -deadline good -cpu-used 2 "$OUT/$slug-16x9.webm"
  ffmpeg -v error -y -ss 6.2 -i "out/$slug-16x9-master.mp4" -frames:v 1 -vf scale=1600:-2 -c:v libwebp -quality 78 "$OUT/$slug-16x9.webp"
done
ls -la "$OUT"
