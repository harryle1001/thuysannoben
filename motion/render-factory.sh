#!/usr/bin/env bash
# FactoryFilm + ProcessFilm + HarvestFilm: masters with the sound bed in out/ (social, NOT committed),
# then silent web encodes in public/media/factory via render-web.sh.
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../public/media/factory; mkdir -p "$OUT" out
node make-factory-sfx.mjs
for id in ${IDS:-FactoryFilm FactoryFilmVertical ProcessFilm ProcessFilmVertical HarvestFilm HarvestFilmVertical FactoryFilm20 FactoryFilm20Vertical}; do
  npx remotion render src/index.ts "$id" "out/$id-master.mp4" --codec h264 --crf 16 --audio-codec aac --audio-bitrate 192k --browser-executable="$B" --overwrite --concurrency=${CONC:-4}
done
bash render-web.sh out/FactoryFilm-master.mp4 out/FactoryFilmVertical-master.mp4 "$OUT/noben-nha-may" 2.6
bash render-web.sh out/ProcessFilm-master.mp4 out/ProcessFilmVertical-master.mp4 "$OUT/noben-quy-trinh" 4.6
bash render-web.sh out/HarvestFilm-master.mp4 out/HarvestFilmVertical-master.mp4 "$OUT/noben-thu-hoach" 12.2
