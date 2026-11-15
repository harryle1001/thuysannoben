// Synthesized sound bed for FactoryFilm (no samples, no licensed music): warm pad, a soft pulse,
// whoosh + low hit on every scene cut (same pi-based timing as the film), light mechanical ticks
// during the production-line scene, a chime on the close. Writes public/sfx/factory-{full,short,process}.wav.
import fs from "node:fs";
const timing = JSON.parse(fs.readFileSync(new URL("./src/factory/timing.json", import.meta.url)));
const SR = 44100, FPS = 30;

function render(cut) {
  let from = 0;
  const scenes = timing[cut].map(([key, u]) => { const dur = Math.round(u * Math.PI * FPS) / FPS; const s = { key, at: from, dur }; from += dur; return s; });
  const DUR = from, N = Math.ceil(SR * DUR);
  const L = new Float32Array(N), R = new Float32Array(N);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const env = (t, a, d) => (t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) / d));
  // pad: D major add9 -> B minor 7 halfway, slow swells
  const chords = [[146.83, 220, 293.66, 329.63, 369.99], [123.47, 185, 246.94, 293.66, 369.99]];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 2) * 0.04;
    const mix = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / (Math.PI * 8));
    let l = 0, r = 0;
    chords.forEach((ch, c) => {
      const w = c === 0 ? mix : 1 - mix;
      ch.forEach((f, k) => { l += w * Math.sin(2 * Math.PI * f * 0.998 * t + k); r += w * Math.sin(2 * Math.PI * f * 1.002 * t + k * 2); });
    });
    const lfo = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.12 * t);
    L[i] += l * g * lfo; R[i] += r * g * lfo;
  }
  // soft heartbeat pulse every pi/2 seconds (felt more than heard)
  const thump = (at, amp, base = 44) => {
    let ph = 0;
    for (let i = 0; i < 0.8 * SR; i++) {
      const t = i / SR, j = Math.floor(at * SR) + i; if (j < 0 || j >= N) continue;
      const f = base + 60 * Math.exp(-t * 16); ph += (2 * Math.PI * f) / SR;
      const s = Math.sin(ph) * env(t, 0.003, 0.2) * amp; L[j] += s; R[j] += s;
    }
  };
  for (let t = Math.PI; t < DUR - 2.5; t += Math.PI / 2) thump(t, 0.12, 50);
  const whoosh = (at, len, amp) => {
    let lp = 0, lp2 = 0;
    for (let i = 0; i < len * SR; i++) {
      const t = i / SR, j = Math.floor((at - len * 0.55) * SR) + i; if (j < 0 || j >= N) continue;
      const e = Math.sin(Math.PI * Math.min(1, t / len)) ** 2;
      const a = 0.02 + 0.22 * e; lp += a * (rnd() - lp); lp2 += a * (lp - lp2);
      const pan = t / len; L[j] += lp2 * e * amp * (1.2 - pan); R[j] += lp2 * e * amp * (0.2 + pan);
    }
  };
  const chime = (at, f, amp, d = 0.6) => {
    for (let i = 0; i < 2.4 * SR; i++) {
      const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
      const s = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.01 * t) + 0.12 * Math.sin(2 * Math.PI * f * 3.02 * t)) * env(t, 0.004, d) * amp;
      L[j] += s; R[j] += s * 0.85;
    }
  };
  const tick = (at, amp) => {
    for (let i = 0; i < 0.05 * SR; i++) {
      const t = i / SR, j = Math.floor(at * SR) + i; if (j >= N) break;
      const s = (rnd() * 0.6 + Math.sin(2 * Math.PI * 2400 * t)) * env(t, 0.0008, 0.008) * amp; L[j] += s * 0.7; R[j] += s;
    }
  };
  const notes = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 880, 1318.5];
  scenes.forEach((s, k) => {
    if (k > 0) { whoosh(s.at, 0.9, 0.9); thump(s.at + 0.05, 0.4); }
    chime(s.at + 0.35, notes[k % notes.length], 0.045);
    if (s.key === "line" || s.key === "produce" || s.key === "pack") for (let t = s.at + 0.6; t < s.at + s.dur - 0.4; t += 1.1 / 2) tick(t, 0.06);
    if (s.key === "qc" || s.key === "outqc") chime(s.at + 1.65, 1318.5, 0.05, 0.9);
    if (s.key === "close") { chime(s.at + 0.2, 587.33, 0.06, 1.2); chime(s.at + 0.32, 880, 0.05, 1.2); chime(s.at + 0.44, 1174.66, 0.04, 1.4); }
  });
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = 0.6 / peak;
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
  fs.mkdirSync("public/sfx", { recursive: true }); fs.writeFileSync(`public/sfx/factory-${cut}.wav`, buf);
  console.log(`wrote public/sfx/factory-${cut}.wav ${DUR.toFixed(2)} s`);
}
render("full"); render("short"); render("process");
