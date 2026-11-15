#!/usr/bin/env bash
# Renders the first three product ads (17 s classic cut): 9:16 social masters with the synthesized sound bed
# into out/ (not committed), then the web cuts into ../public/media/ads via compress.sh.
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/ads; mkdir -p "$OUT" out
node make-sfx.mjs
for pair in "G7:g7-phong-va-tri-benh-gan-chet-som" "Caphote:caphote" "Aqualac:aqualac-fs"; do
  id=${pair%%:*}; slug=${pair#*:}
  npx remotion render src/index.ts "Ad${id}Vertical" "out/$slug-9x16-hq.mp4" --codec h264 --crf 18 --audio-codec aac --browser-executable="$B" --overwrite
  npx remotion render src/index.ts "Ad${id}Wide" "out/$slug-16x9-master.mp4" --codec h264 --crf 14 --muted --browser-executable="$B" --overwrite
  bash compress.sh "$slug" 6.2
done
