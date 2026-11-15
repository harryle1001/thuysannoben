// Synthesizes the ad sound bed (no samples, no licensed music): soft pad + whooshes + chimes + a low hit.
// Cue times match ProductAd.tsx beats. Output: public/sfx/ad-bed.wav (16-bit stereo, 44.1 kHz).
import fs from "node:fs";
const SR = 44100, DUR = 17, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const env = (t, a, d) => (t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) / d));
// Pad: A minor add9, slow swell, fades at the end.
const pad = [110, 164.81, 220, 246.94, 329.63];
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 1.6) * 0.045;
  let l = 0, r = 0;
  pad.forEach((f, k) => { l += Math.sin(2 * Math.PI * f * 0.998 * t + k) ; r += Math.sin(2 * Math.PI * f * 1.002 * t + k * 2); });
  const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.15 * t);
  L[i] += l * g * lfo; R[i] += r * g * lfo;
}
// Whoosh: filtered noise with a rising-then-falling envelope.
const whoosh = (at, len, amp) => {
  let lp = 0, lp2 = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR, j = Math.floor((at - len * 0.6) * SR) + i; if (j < 0 || j >= N) continue;
    const e = Math.sin(Math.PI * Math.min(1, t / len)) ** 2;
    const a = 0.02 + 0.25 * e; lp += a * (rnd() - lp); lp2 += a * (lp - lp2);
    const pan = t / len;
    L[j] += lp2 * e * amp * (1.2 - pan); R[j] += lp2 * e * amp * (0.2 + pan);
  }
};
const chime = (at, f, amp) => {
  for (let i = 0; i < 2.2 * SR; i++) {
    const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
    const s = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.01 * t) + 0.15 * Math.sin(2 * Math.PI * f * 3.02 * t)) * env(t, 0.004, 0.5) * amp;
    L[j] += s; R[j] += s * 0.85;
  }
};
const thump = (at, amp) => {
  let ph = 0;
  for (let i = 0; i < 0.9 * SR; i++) {
    const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
    const f = 42 + 70 * Math.exp(-t * 14); ph += (2 * Math.PI * f) / SR;
    const s = Math.sin(ph) * env(t, 0.003, 0.22) * amp; L[j] += s; R[j] += s;
  }
};
whoosh(3.2, 1.2, 1.6); thump(3.3, 0.5); chime(3.9, 659.25, 0.07);
whoosh(7.6, 0.9, 1.0);
[[7.95, 880], [9.25, 987.77], [10.55, 1174.66]].forEach(([t, f]) => chime(t, f, 0.06));
whoosh(13.6, 1.0, 1.2); thump(13.7, 0.55); chime(14.1, 659.25, 0.06); chime(14.3, 987.77, 0.05);
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 0.7 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
fs.mkdirSync("public/sfx", { recursive: true }); fs.writeFileSync("public/sfx/ad-bed.wav", buf);
console.log("wrote public/sfx/ad-bed.wav", (buf.length / 1e6).toFixed(1), "MB");
