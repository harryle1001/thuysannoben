#!/usr/bin/env bash
# Masters for the π-timed films into out/ (not committed), then the web cuts via compress.sh.
# out/<slug>-9x16-hq.mp4 is the 1080x1920 social master with sound.  Usage: bash render-all.sh [slug ...]
set -euo pipefail
cd "$(dirname "$0")"
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p out; node make-sfx-v2.mjs
ALL="AdSorbest:sorbest:6.4 AdProticbest:proticbest:6.4 AdSuperYucca:super-yucca:6.4 AdTopWeigh:top-weigh:6.4
StoryAoBat:ao-bat-mat-do-cao:20.3 StoryMuaMua:mua-mua:12.6 StoryOem:gia-cong-oem:10.6 StoryDaiLy:dai-ly:2.6"
want="${*:-}"
for row in $ALL; do
  IFS=: read -r id slug pt <<<"$row"
  [[ -n "$want" && " $want " != *" $slug "* ]] && continue
  npx remotion render src/index.ts "${id}Vertical" "out/$slug-9x16-hq.mp4" --codec h264 --crf 18 --audio-codec aac --concurrency=4 --browser-executable="$B" --overwrite --log=error
  npx remotion render src/index.ts "${id}Wide" "out/$slug-16x9-master.mp4" --codec h264 --crf 14 --muted --concurrency=4 --browser-executable="$B" --overwrite --log=error
  bash compress.sh "$slug" "$pt"
done
