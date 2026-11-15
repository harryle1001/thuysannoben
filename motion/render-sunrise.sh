#!/usr/bin/env bash
# LogoSunrise: the golden mark rises like the sun (4π s), then LogoSunriseLoop (2π s, seamless).
# Masters in out/ (not committed); web files in public/media/sunrise/.
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/sunrise; mkdir -p "$OUT" out
if [ "${SKIP_RENDER:-}" != 1 ]; then
  for id in LogoSunrise LogoSunriseLoop LogoSunriseVertical LogoSunriseLoopVertical; do
    npx remotion render src/index.ts "$id" "out/$id-master.mp4" --codec h264 --crf 10 --pixel-format yuv444p --browser-executable="$B" --overwrite --concurrency=${CONC:-4}
  done
fi
# H.264 High, yuv420p, 30 fps, keyframe every 2 s, no audio, faststart.
X264="-c:v libx264 -profile:v high -preset veryslow -tune animation -pix_fmt yuv420p -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -an -movflags +faststart"
VP9="-c:v libvpx-vp9 -pix_fmt yuv420p -r 30 -g 60 -row-mt 1 -deadline good -cpu-used 1 -an"
enc() { # master name crf maxrate vp9crf
  ffmpeg -v error -y -i "out/$1-master.mp4" $X264 -crf "$3" -maxrate "$4" -bufsize 2M "$OUT/$2.mp4"
  ffmpeg -v error -y -i "out/$1-master.mp4" $VP9 -crf "$5" -b:v "$4" "$OUT/$2.webm"
}
enc LogoSunrise             sunrise-rise        ${CRF:-23} 900k 36
enc LogoSunriseLoop         sunrise-loop        ${CRF:-23} 900k 36
enc LogoSunriseVertical     sunrise-rise-9x16   ${CRF:-23} 900k 36
enc LogoSunriseLoopVertical sunrise-loop-9x16   ${CRF:-23} 900k 36
# Posters: last frame of the rise (logo up) = first frame of the loop.
ffmpeg -v error -y -i out/LogoSunriseLoop-master.mp4 -frames:v 1 -c:v libwebp -quality 72 -compression_level 6 "$OUT/sunrise-poster.webp"
ffmpeg -v error -y -i out/LogoSunriseLoopVertical-master.mp4 -frames:v 1 -c:v libwebp -quality 66 -compression_level 6 "$OUT/sunrise-poster-9x16.webp"
ls -la "$OUT"
