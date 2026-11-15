// Sound beds for the π-timed films (no samples, no licensed music): pad + whooshes on cuts + chimes + low hits.
// Cue times mirror ProductAd.tsx (piCut) and StoryAd.tsx. Output: public/sfx/<slug>.wav (16-bit stereo 44.1 kHz).
import fs from "node:fs";
const PI = Math.PI, SR = 44100;
const bed = (name, DUR, build, rain = 0) => {
  const N = Math.round(SR * DUR), L = new Float32Array(N), R = new Float32Array(N);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const env = (t, a, d) => (t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) / d));
  const pad = [110, 164.81, 220, 246.94, 329.63];
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 1.6) * 0.045, lfo = 0.75 + 0.25 * Math.sin(2 * PI * 0.15 * t);
    let l = 0, r = 0; pad.forEach((f, k) => { l += Math.sin(2 * PI * f * 0.998 * t + k); r += Math.sin(2 * PI * f * 1.002 * t + k * 2); });
    L[i] += l * g * lfo; R[i] += r * g * lfo;
  }
  if (rain) { // soft rain: low-passed noise, fades out with the rain on screen
    let a = 0, b = 0;
    for (let i = 0; i < N; i++) { const t = i / SR; const e = Math.min(1, t / 0.4) * (t < rain ? 1 : Math.max(0, 1 - (t - rain) / 3)) * 0.22;
      a += 0.35 * (rnd() - a); b += 0.35 * (rnd() - b); L[i] += a * e; R[i] += b * e; }
  }
  const whoosh = (at, len, amp) => { let lp = 0, lp2 = 0;
    for (let i = 0; i < len * SR; i++) { const t = i / SR, j = Math.floor((at - len * 0.6) * SR) + i; if (j < 0 || j >= N) continue;
      const e = Math.sin(PI * Math.min(1, t / len)) ** 2, a = 0.02 + 0.25 * e; lp += a * (rnd() - lp); lp2 += a * (lp - lp2);
      const pan = t / len; L[j] += lp2 * e * amp * (1.2 - pan); R[j] += lp2 * e * amp * (0.2 + pan); } };
  const chime = (at, f, amp) => { for (let i = 0; i < 2.2 * SR; i++) { const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
    const s = (Math.sin(2 * PI * f * t) + 0.4 * Math.sin(2 * PI * f * 2.01 * t) + 0.15 * Math.sin(2 * PI * f * 3.02 * t)) * env(t, 0.004, 0.5) * amp; L[j] += s; R[j] += s * 0.85; } };
  const thump = (at, amp) => { let ph = 0; for (let i = 0; i < 0.9 * SR; i++) { const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
    const f = 42 + 70 * Math.exp(-t * 14); ph += (2 * PI * f) / SR; const s = Math.sin(ph) * env(t, 0.003, 0.22) * amp; L[j] += s; R[j] += s; } };
  build({ whoosh, chime, thump });
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = 0.7 / peak, buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
  fs.mkdirSync("public/sfx", { recursive: true }); fs.writeFileSync(`public/sfx/${name}.wav`, buf);
};
const notes = [659.25, 739.99, 880, 987.77, 1174.66];
// Product ads, π cut: reveal π, benefits 2.5π, close 4.5π, end 6π.
for (const slug of ["sorbest", "proticbest", "super-yucca", "top-weigh"]) bed(slug, 6 * PI, ({ whoosh, chime, thump }) => {
  whoosh(PI, 1.2, 1.6); thump(PI + 0.1, 0.5); chime(PI + 0.7, 659.25, 0.07);
  whoosh(2.5 * PI, 0.9, 1.0); [0.45, 1.75, 3.05].forEach((d, k) => chime(2.5 * PI + d, [880, 987.77, 1174.66][k], 0.06));
  whoosh(4.5 * PI, 1.0, 1.2); thump(4.5 * PI + 0.1, 0.55); chime(4.5 * PI + 0.5, 659.25, 0.06); chime(4.5 * PI + 0.7, 987.77, 0.05);
});
// Story films: whoosh + chime on each cut, low hit on the sign-off.
const story = (slug, dur, cuts, rain = 0) => bed(slug, dur, ({ whoosh, chime, thump }) => {
  thump(0.3, 0.35);
  cuts.forEach((t, k) => { whoosh(t, 1.0, 1.2); chime(t + 0.35, notes[k % notes.length], 0.055); });
  const last = cuts[cuts.length - 1]; thump(last + 0.1, 0.55); chime(last + 1.5, 659.25, 0.05); chime(last + 1.7, 987.77, 0.045);
}, rain);
story("ao-bat-mat-do-cao", 7 * PI, [PI, 2 * PI, 3 * PI, 4 * PI, 5 * PI]);
story("mua-mua", 7 * PI, [PI, 2.5 * PI, 3.5 * PI, 4.5 * PI, 5.5 * PI], 3 * PI);
story("gia-cong-oem", 7 * PI, [1.25 * PI, 2.5 * PI, 4 * PI, 5.25 * PI]);
story("dai-ly", 6.5 * PI, [PI, PI + (2.5 * PI) / 3, PI + (5 * PI) / 3, 3.5 * PI, 5 * PI]);
console.log("wrote 8 beds");
