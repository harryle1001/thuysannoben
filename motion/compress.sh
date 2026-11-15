#!/usr/bin/env bash
# Web cuts from the masters in out/: 16:9 mp4 + webm (≤ 3 MB, muted, 2-pass), 16:9 poster (≤ 60 KB),
# 9:16 mp4 for phones (720x1280, ≤ 4 MB, AAC 64k kept for the download link) + 9:16 poster.
# Usage: bash compress.sh <slug> <poster-second> [vertical-source] [wide-source]
set -euo pipefail
cd "$(dirname "$0")"
slug=$1; pt=$2; V=${3:-out/$slug-9x16-hq.mp4}; M=${4:-out/$slug-16x9-master.mp4}
OUT=../public/media/ads; P=out/$slug-pass
kbps() { python3 -c "print(int($1*8192/$2))"; }
if [[ -f "$M" ]]; then
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$M"); w=$(kbps 2.75 "$d")
  ffmpeg -v error -y -i "$M" -an -c:v libx264 -preset slow -b:v ${w}k -pass 1 -passlogfile "$P" -pix_fmt yuv420p -f mp4 /dev/null
  ffmpeg -v error -y -i "$M" -an -c:v libx264 -preset slow -b:v ${w}k -maxrate $((w*2))k -bufsize $((w*4))k -pass 2 -passlogfile "$P" -pix_fmt yuv420p -movflags +faststart "$OUT/$slug-16x9.mp4"
  ffmpeg -v error -y -i "$M" -an -c:v libvpx-vp9 -b:v ${w}k -pass 1 -passlogfile "$P-vp9" -row-mt 1 -deadline good -cpu-used 4 -f webm /dev/null
  ffmpeg -v error -y -i "$M" -an -c:v libvpx-vp9 -b:v ${w}k -pass 2 -passlogfile "$P-vp9" -row-mt 1 -deadline good -cpu-used 2 "$OUT/$slug-16x9.webm"
  ffmpeg -v error -y -ss "$pt" -i "$M" -frames:v 1 -vf scale=1280:-2 -c:v libwebp -quality 72 "$OUT/$slug-16x9.webp"
  mkdir -p "$OUT/sm"; ffmpeg -v error -y -i "$OUT/$slug-16x9.webp" -vf scale=640:-2 -c:v libwebp -quality 74 "$OUT/sm/$slug-16x9.webp"
fi
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V"); v=$(( $(kbps 3.75 "$d") - 70 ))
ffmpeg -v error -y -i "$V" -an -vf scale=720:1280 -c:v libx264 -preset slow -b:v ${v}k -pass 1 -passlogfile "$P-v" -pix_fmt yuv420p -f mp4 /dev/null
ffmpeg -v error -y -i "$V" -vf scale=720:1280 -c:v libx264 -preset slow -b:v ${v}k -maxrate $((v*2))k -bufsize $((v*4))k -pass 2 -passlogfile "$P-v" -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/$slug-9x16.mp4.tmp.mp4"
mv "$OUT/$slug-9x16.mp4.tmp.mp4" "$OUT/$slug-9x16.mp4"
ffmpeg -v error -y -ss "$pt" -i "$V" -frames:v 1 -vf scale=720:-2 -c:v libwebp -quality 70 "$OUT/$slug-9x16.webp"
rm -f "$P"*
ls -la "$OUT"/$slug-*
