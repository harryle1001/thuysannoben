#!/usr/bin/env bash
# FactoryFilm: high-quality masters (social, NOT committed: out/) + compressed web files (public/media/factory).
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/factory; mkdir -p "$OUT" out
node make-factory-sfx.mjs
for id in FactoryFilm FactoryFilmVertical FactoryFilm20 FactoryFilm20Vertical; do
  npx remotion render src/index.ts "$id" "out/$id-master.mp4" --codec h264 --crf 16 --audio-codec aac --audio-bitrate 192k --browser-executable="$B" --overwrite --concurrency=${CONC:-4}
done
# Web 16:9 (full film, with the sound bed; the page starts it muted)
ffmpeg -v error -y -i out/FactoryFilm-master.mp4 -vf "hqdn3d=1.5:1.5:4:4" -c:v libx264 -preset slow -crf 27 -maxrate 0.85M -bufsize 1.7M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-nha-may.mp4"
ffmpeg -v error -y -i out/FactoryFilm-master.mp4 -vf "hqdn3d=1.5:1.5:4:4" -c:v libvpx-vp9 -b:v 0.62M -crf 38 -row-mt 1 -deadline good -cpu-used 2 -c:a libopus -b:a 48k "$OUT/noben-nha-may.webm"
# Phone 9:16
ffmpeg -v error -y -i out/FactoryFilmVertical-master.mp4 -vf "scale=720:-2,hqdn3d=1.5:1.5:4:4" -c:v libx264 -preset slow -crf 27 -maxrate 0.8M -bufsize 1.6M -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/noben-nha-may-9x16.mp4"
ffmpeg -v error -y -ss 36.5 -i out/FactoryFilm-master.mp4 -frames:v 1 -vf scale=1280:-2 -c:v libwebp -quality 72 "$OUT/noben-nha-may-poster.webp"
ls -la "$OUT" out
