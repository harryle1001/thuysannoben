#!/usr/bin/env bash
# Web encodes tuned for smooth playback (phones first): H.264 High@4.0, yuv420p, 30 fps, a keyframe every second,
# faststart, NO audio; 1280x720 and 720x1280 (each <= 4 MB); VP9 webm kept only if smaller; webp poster <= 40 KB.
# Usage: bash render-web.sh <master16x9.mp4> <master9x16.mp4> <out-basename> <poster-seconds>
set -euo pipefail
H=$1; V=$2; BASE=$3; POS=$4
X264="-c:v libx264 -profile:v high -level:v 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -preset slow -movflags +faststart -an"
enc() { # in out scale maxrate
  local br=$4
  for try in 1 2 3 4 5; do
    ffmpeg -v error -y -i "$1" -vf "scale=$3:flags=lanczos,hqdn3d=1:1:3:3" $X264 -crf 26 -maxrate ${br}k -bufsize $((br*2))k "$2"
    [ "$(stat -c%s "$2")" -le 4000000 ] && return 0
    br=$((br*80/100))
  done
}
enc "$H" "$BASE.mp4" 1280:720 560
enc "$V" "$BASE-9x16.mp4" 720:1280 560
ffmpeg -v error -y -i "$H" -vf "scale=1280:720:flags=lanczos,hqdn3d=1:1:3:3" -c:v libvpx-vp9 -b:v 420k -crf 38 -row-mt 1 -deadline good -cpu-used 2 -r 30 -g 30 -an "$BASE.webm"
if [ "$(stat -c%s "$BASE.webm")" -ge "$(stat -c%s "$BASE.mp4")" ]; then rm -f "$BASE.webm"; echo "webm not smaller: dropped"; fi
q=60; while :; do ffmpeg -v error -y -ss "$POS" -i "$H" -frames:v 1 -vf scale=1280:720 -c:v libwebp -quality $q "$BASE-poster.webp"; [ "$(stat -c%s "$BASE-poster.webp")" -le 40000 ] || [ $q -le 20 ] && break; q=$((q-8)); done
ls -la "$BASE"*
