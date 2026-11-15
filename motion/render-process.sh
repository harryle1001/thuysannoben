#!/usr/bin/env bash
# ProcessFilm: masters in out/ (not committed) + compressed web files in public/media/factory.
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/factory; mkdir -p "$OUT" out
node make-factory-sfx.mjs
for id in ProcessFilm ProcessFilmVertical HarvestFilm HarvestFilmVertical; do
  npx remotion render src/index.ts "$id" "out/$id-master.mp4" --codec h264 --crf 16 --audio-codec aac --audio-bitrate 192k --browser-executable="$B" --overwrite --concurrency=${CONC:-4}
done
ffmpeg -v error -y -i out/ProcessFilm-master.mp4 -vf "hqdn3d=1.5:1.5:4:4" -c:v libx264 -preset slow -crf 27 -maxrate 0.85M -bufsize 1.7M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-quy-trinh.mp4"
ffmpeg -v error -y -i out/ProcessFilm-master.mp4 -vf "hqdn3d=1.5:1.5:4:4" -c:v libvpx-vp9 -b:v 0.62M -crf 38 -row-mt 1 -deadline good -cpu-used 2 -c:a libopus -b:a 48k "$OUT/noben-quy-trinh.webm"
ffmpeg -v error -y -i out/ProcessFilmVertical-master.mp4 -vf "scale=720:-2,hqdn3d=1.5:1.5:4:4" -c:v libx264 -preset slow -crf 27 -maxrate 0.8M -bufsize 1.6M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-quy-trinh-9x16.mp4"
ffmpeg -v error -y -ss 4.6 -i out/ProcessFilm-master.mp4 -frames:v 1 -vf scale=1120:-2 -c:v libwebp -quality 50 "$OUT/noben-quy-trinh-poster.webp"
# Stand-alone harvest clip (≈19 s)
ffmpeg -v error -y -i out/HarvestFilm-master.mp4 -c:v libx264 -preset slow -crf 25 -maxrate 1.4M -bufsize 2.8M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-thu-hoach.mp4"
ffmpeg -v error -y -i out/HarvestFilm-master.mp4 -c:v libvpx-vp9 -b:v 0.9M -crf 34 -row-mt 1 -deadline good -cpu-used 2 -c:a libopus -b:a 48k "$OUT/noben-thu-hoach.webm"
ffmpeg -v error -y -i out/HarvestFilmVertical-master.mp4 -vf scale=720:-2 -c:v libx264 -preset slow -crf 25 -maxrate 1.2M -bufsize 2.4M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-thu-hoach-9x16.mp4"
ffmpeg -v error -y -ss 12.2 -i out/HarvestFilm-master.mp4 -frames:v 1 -vf scale=1120:-2 -c:v libwebp -quality 55 "$OUT/noben-thu-hoach-poster.webp"
ls -la "$OUT"
