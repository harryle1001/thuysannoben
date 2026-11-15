// Dev helper: render a few stills per composition into a folder (for visual QA).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [, , out, ids, frames, scale = "0.5"] = process.argv;
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const id of ids.split(",")) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const f of frames.split(",").map(Number)) {
    await renderStill({ serveUrl, composition, frame: f, output: `${out}/${id}-${f}.png`, scale: Number(scale), browserExecutable });
  }
}
console.log("ok");
