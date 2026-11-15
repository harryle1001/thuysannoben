import React from "react";
import { AbsoluteFill, Composition, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { rand, TAU, theme } from "../theme";

// LogoSunrise: the golden Noben mark rises over the sea like the morning sun.
// - Beats are multiples of π seconds; the rise lasts 4π s ≈ 12.6 s (378 frames at 30 fps).
// - LogoSunriseLoop (2π s ≈ 6.3 s, 189 frames) is the risen state. Every motion is periodic over
//   LOOP frames with integer cycles, and the rise film is exactly 2 × LOOP frames, so its last
//   frame flows straight into frame 0 of the loop and the loop repeats with no seam.
// - No text: the website's HTML headline sits on top (left ~60% on wide, overlay on phones).

const PHI = (1 + Math.sqrt(5)) / 2;
const FPS = 30;
export const LOOP = Math.round(2 * Math.PI * FPS); // 189
export const RISE = 2 * LOOP; // 378

const sun = {
  deep: "#0b2347",
  night: "#06152f",
  violet: "#2a2a66",
  plum: "#6a3f86",
  rose: "#d8708a",
  orange: "#f39a3c",
  gold: theme.colors.primary,
  cream: "#ffe9b0",
  seaDeep: "#030c1f",
  seaMid: "#0a2246",
  foam: "rgba(169, 205, 255, 0.22)",
};

const ease = theme.ease;
const c = theme.clamp;
const piS = (k: number) => k * Math.PI * FPS; // k·π seconds → frames

type Props = { mode: "rise" | "loop" };

const Sunrise: React.FC<Props> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const t = (frame % LOOP) / LOOP; // periodic phase, identical in both films at the seam
  const f = mode === "rise" ? frame : RISE; // story progress (loop = fully risen)

  // ---------- story curves (all eased, clamped) ----------
  const warm = interpolate(f, [piS(0.3), piS(3.5)], [0, 1], { ...c, easing: ease.sine });
  const rise = interpolate(f, [piS(1), piS(3.2)], [0, 1], { ...c, easing: Easing.bezier(0.33, 0, 0.18, 1) });
  const halo = interpolate(f, [piS(1.4), piS(3.5)], [0, 1], { ...c, easing: ease.out });
  const rays = interpolate(f, [piS(2), piS(3.6)], [0, 1], { ...c, easing: ease.sine });
  const glint = interpolate(rise, [0.2, 1], [0, 1], { ...c, easing: ease.sine });

  // ---------- geometry (golden section) ----------
  const horizon = H - H / PHI; // horizon sits H/φ above the bottom edge
  const S = wide ? H * 0.236 : W * 0.3; // logo size
  const sx = wide ? W * (1 - 1 / PHI ** 3) : W / 2; // wide: centre of the free right band (≈0.764 W)
  const yEnd = horizon - S * 0.618;
  const yStart = horizon + S * 0.62;
  const sy = interpolate(rise, [0, 1], [yStart, yEnd]);
  const breath = 1 + 0.018 * Math.sin(TAU * t);
  const bright = interpolate(rise, [0, 1], [0.55, 1]);

  // ---------- sky ----------
  const skyTop = interpolateColors(warm, [0, 0.6, 1], [sun.night, sun.deep, "#132d5c"]);
  const sky1 = interpolateColors(warm, [0, 0.5, 1], [sun.deep, sun.violet, "#3b3577"]);
  const sky2 = interpolateColors(warm, [0, 0.45, 1], ["#10305c", sun.plum, "#a0507f"]);
  const sky3 = interpolateColors(warm, [0, 0.45, 1], ["#173b69", sun.rose, sun.orange]);
  const sky4 = interpolateColors(warm, [0, 0.5, 1], ["#1d4777", sun.orange, "#ffcf4a"]);
  const seaTop = interpolateColors(warm, [0, 1], ["#0d2a52", "#3a2f5c"]);

  // ---------- waves: perspective lines, denser near the horizon ----------
  const N = wide ? 26 : 34;
  const waves = Array.from({ length: N }).map((_, j) => {
    const d = ((j + 1) / N) ** 1.8; // 0 near horizon → 1 at bottom
    const y0 = horizon + d * (H - horizon);
    const amp = 0.6 + d * (wide ? 7 : 9);
    const k = (TAU / W) * (wide ? 3 + rand(j) * 3 : 2 + rand(j) * 2) / (0.35 + d);
    const cyc = 1 + (j % 2); // integer cycles per loop → seamless
    const ph = TAU * cyc * t * (j % 3 === 0 ? -1 : 1) + rand(j + 40) * TAU;
    let p = "";
    const step = W / 64;
    for (let x = -step; x <= W + step; x += step) {
      const y = y0 + amp * Math.sin(k * x + ph) + amp * 0.35 * Math.sin(k * 2.3 * x - ph * 2);
      p += `${p ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(2)}`;
    }
    return { p, w: 0.6 + d * 1.6, o: 0.35 + d * 0.5 };
  });

  // ---------- reflection: shimmering dashes under the sun ----------
  const R = wide ? 44 : 56;
  const dashes = Array.from({ length: R }).map((_, r) => {
    const d = ((r + 0.5) / R) ** 1.5;
    const y = horizon + 2 + d * (H - horizon) * 0.96;
    const base = S * (0.18 + d * 0.9);
    const cyc = 1 + (r % 3);
    const s = 0.5 + 0.5 * Math.sin(TAU * (cyc * t) + r * 1.9);
    const w = base * (0.35 + 0.65 * s);
    const off = Math.sin(TAU * t + r * 0.7) * S * 0.05 * (0.4 + d);
    const h = 1 + d * (wide ? 3.2 : 4.2);
    return { x: sx + off - w / 2, y, w, h, o: (0.25 + 0.75 * s) * (1 - d * 0.55) };
  });

  // ---------- sparkles on the water ----------
  const sparks = Array.from({ length: wide ? 46 : 54 }).map((_, i) => {
    const near = i % 3 !== 0; // two-thirds sit in the glitter path
    const dy = rand(i + 7) ** 1.6;
    const y = horizon + 4 + dy * (H - horizon) * 0.9;
    const spread = near ? S * (0.3 + dy * 1.3) : W * 0.5;
    const x = near ? sx + (rand(i + 3) - 0.5) * 2 * spread : rand(i + 3) * W;
    const n = 1 + Math.floor(rand(i + 11) * 3);
    const tw = Math.max(0, Math.sin(TAU * (n * t + rand(i + 19)))) ** 8;
    const size = (near ? 1.4 : 1) * (1.2 + dy * 2.6);
    return { x, y, tw: tw * (near ? 0.35 + 0.65 * glint : 0.5 + 0.2 * glint), size, near };
  });

  // ---------- stars (fade out with the dawn) ----------
  const stars = Array.from({ length: 34 }).map((_, i) => {
    const x = rand(i + 101) * W;
    const y = rand(i + 203) ** 1.4 * horizon * 0.8;
    const tw = 0.55 + 0.45 * Math.sin(TAU * ((1 + (i % 2)) * t + rand(i + 5)));
    return { x, y, r: 0.6 + rand(i + 9) * 1.1, o: tw * (1 - warm) * 0.8 };
  });

  // ---------- rays: 21 thin wedges, pattern rotates one step per loop ----------
  const RAYS = 21;
  const rot = (360 / RAYS) * t; // one ray-step per loop: seamless
  const rayLen = (a: number) => S * (1.5 + 0.9 * Math.cos((a * Math.PI) / 180) ** 2 + 0.25 * Math.sin(TAU * t + a / 30));
  const rayPaths = Array.from({ length: RAYS }).map((_, i) => {
    const a = ((i * 360) / RAYS + rot) % 360; // 0° = straight up
    const L = rayLen(a) * breath;
    const r0 = S * 0.42;
    const hw = 0.9; // half-width in degrees
    const pt = (deg: number, r: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${(sx + r * Math.cos(rad)).toFixed(1)} ${(sy + r * Math.sin(rad)).toFixed(1)}`;
    };
    return `M${pt(a - hw, r0)} L${pt(a, r0 + L)} L${pt(a + hw, r0)} Z`;
  });

  // ---------- halo radii grow by φ ----------
  const h0 = S * 0.5;
  const haloR = [h0 * PHI, h0 * PHI ** 2, h0 * PHI ** 3, h0 * PHI ** 4].map((r, k) => {
    const p = interpolate(halo, [k * 0.15, 0.55 + k * 0.15], [0, 1], { ...c, easing: ease.out });
    return { r: r * (0.7 + 0.3 * p) * breath, o: p };
  });

  const logo = staticFile("brand/noben-mark-golden.svg");
  const clipSky = `M0 0 H${W} V${horizon} H0 Z`;

  return (
    <AbsoluteFill style={{ background: sun.seaDeep }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2={horizon} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="0.38" stopColor={sky1} />
            <stop offset="0.68" stopColor={sky2} />
            <stop offset="0.88" stopColor={sky3} />
            <stop offset="1" stopColor={sky4} />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1={horizon} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={seaTop} />
            <stop offset="0.3" stopColor={sun.seaMid} />
            <stop offset="1" stopColor={sun.seaDeep} />
          </linearGradient>
          <radialGradient id="dawn" cx={sx} cy={horizon} r={wide ? W * 0.62 : H * 0.42} gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(${sx} ${horizon}) scale(1 ${wide ? 0.55 : 0.75}) translate(${-sx} ${-horizon})`}>
            <stop offset="0" stopColor={sun.gold} stopOpacity={0.6} />
            <stop offset="0.25" stopColor={sun.orange} stopOpacity={0.38} />
            <stop offset="0.6" stopColor={sun.rose} stopOpacity={0.12} />
            <stop offset="1" stopColor={sun.rose} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="halo">
            <stop offset="0" stopColor={sun.cream} stopOpacity={0.55} />
            <stop offset="0.4" stopColor={sun.gold} stopOpacity={0.3} />
            <stop offset="1" stopColor={sun.orange} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ray" gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={sx} y2={sy - S * 2.4}>
            <stop offset="0" stopColor={sun.cream} stopOpacity={0.55} />
            <stop offset="1" stopColor={sun.gold} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="rayFade" cx={sx} cy={sy} r={S * 2.6} gradientUnits="userSpaceOnUse">
            <stop offset="0.15" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="rayMask"><rect width={W} height={H} fill="url(#rayFade)" /></mask>
          <linearGradient id="foam" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a9cdff" stopOpacity={0.16} />
            <stop offset={Math.max(0, sx / W - 0.22)} stopColor="#a9cdff" stopOpacity={0.2} />
            <stop offset={sx / W} stopColor={interpolateColors(glint, [0, 1], ["#a9cdff", sun.cream])} stopOpacity={0.22 + 0.4 * glint} />
            <stop offset={Math.min(1, sx / W + 0.22)} stopColor="#a9cdff" stopOpacity={0.2} />
            <stop offset="1" stopColor="#a9cdff" stopOpacity={0.16} />
          </linearGradient>
          <linearGradient id="horizonLine" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={sun.cream} stopOpacity={0.08} />
            <stop offset={sx / W} stopColor={sun.cream} stopOpacity={0.35 + 0.55 * warm} />
            <stop offset="1" stopColor={sun.cream} stopOpacity={0.08} />
          </linearGradient>
          <radialGradient id="seaWarm">
            <stop offset="0" stopColor={sun.orange} stopOpacity={0.32} />
            <stop offset="0.5" stopColor={sun.rose} stopOpacity={0.1} />
            <stop offset="1" stopColor={sun.rose} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="column">
            <stop offset="0" stopColor={sun.gold} stopOpacity={0.16} />
            <stop offset="1" stopColor={sun.gold} stopOpacity={0} />
          </radialGradient>
          <clipPath id="skyClip"><path d={clipSky} /></clipPath>
          <clipPath id="seaClip"><rect x="0" y={horizon} width={W} height={H - horizon} /></clipPath>
          <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={wide ? 1.1 : 1.3} /></filter>
          <filter id="blurBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={S * 0.12} /></filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={S * 0.06} /></filter>
          <filter id="refl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${S * 0.04} ${S * 0.1}`} /></filter>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* 1. sky + dawn glow */}
        <rect width={W} height={horizon + 1} fill="url(#sky)" />
        <rect width={W} height={horizon + 1} fill="url(#dawn)" opacity={0.15 + 0.85 * warm} />
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dfe9ff" opacity={s.o} />)}

        {/* 2. sun: halo rings (φ radii), rays, mark — all clipped to the sky */}
        <g clipPath="url(#skyClip)">
          {haloR.map((h, k) => (
            <circle key={k} cx={sx} cy={sy} r={h.r} fill="url(#halo)" opacity={h.o * (0.62 - k * 0.12)} />
          ))}
          <g mask="url(#rayMask)" opacity={rays * 0.75} style={{ mixBlendMode: "screen" }}>
            {rayPaths.map((d, i) => <path key={i} d={d} fill="url(#ray)" />)}
          </g>
          <circle cx={sx} cy={sy} r={S * 0.62} fill="#fff4d6" opacity={0.1 + 0.18 * rise} filter="url(#blurBig)" />
          <image href={logo} x={sx - S / 2} y={sy - S / 2} width={S} height={S}
            style={{ filter: `brightness(${bright}) saturate(${0.7 + 0.3 * rise}) drop-shadow(0 0 ${S * 0.035}px rgba(120, 50, 0, ${0.15 + 0.35 * rise}))` }} />
        </g>

        {/* 3. sea */}
        <rect y={horizon} width={W} height={H - horizon} fill="url(#sea)" />
        <g clipPath="url(#seaClip)">
          {/* warm sky light on the water near the horizon */}
          <ellipse cx={sx} cy={horizon} rx={wide ? W * 0.5 : W * 0.75} ry={(H - horizon) * 0.4} fill="url(#seaWarm)" opacity={0.25 + 0.75 * warm} />
          {/* mirrored mark, squashed and blurred */}
          <g opacity={0.2 * glint} filter="url(#refl)">
            <g transform={`translate(0 ${horizon}) scale(1 -0.8) translate(0 ${-horizon})`}>
              <image href={logo} x={sx - S / 2} y={sy - S / 2} width={S} height={S} />
            </g>
          </g>
          <ellipse cx={sx} cy={horizon + (H - horizon) * 0.32} rx={S * 0.55} ry={(H - horizon) * 0.42} fill="url(#column)" opacity={glint} />
          {waves.map((w, i) => <path key={i} d={w.p} fill="none" stroke="url(#foam)" strokeWidth={w.w} opacity={w.o} />)}
          <g filter="url(#soft)" style={{ mixBlendMode: "screen" }}>
            {dashes.map((d, i) => (
              <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} rx={d.h / 2}
                fill={i % 4 === 0 ? sun.cream : sun.gold} opacity={d.o * glint * 0.85} />
            ))}
          </g>
          {sparks.map((s, i) => (
            <g key={i} opacity={s.tw} style={{ mixBlendMode: "screen" }}>
              <circle cx={s.x} cy={s.y} r={s.size} fill={s.near ? sun.cream : "#cfe3ff"} />
              {s.near && s.size > 2.4 ? (
                <path d={`M${s.x - s.size * 3} ${s.y} H${s.x + s.size * 3} M${s.x} ${s.y - s.size * 2} V${s.y + s.size * 2}`} stroke={sun.cream} strokeWidth={0.8} />
              ) : null}
            </g>
          ))}
        </g>

        {/* 4. horizon: one hairline */}
        <rect x="0" y={horizon - 0.5} width={W} height={1} fill="url(#horizonLine)" />

        {/* 5. vignette + grain (grain breaks up gradient banding before H.264) */}
        <rect width={W} height={H} fill="url(#vig)" />
        <defs>
          <radialGradient id="vig" cx="0.5" cy="0.45" r="0.8">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.38} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.055} style={{ mixBlendMode: "overlay" }} />
      </svg>
    </AbsoluteFill>
  );
};

const Rise: React.FC = () => <Sunrise mode="rise" />;
const Loop: React.FC = () => <Sunrise mode="loop" />;

export const SunriseCompositions: React.FC = () => (
  <>
    <Composition id="LogoSunrise" component={Rise} durationInFrames={RISE} fps={FPS} width={1280} height={720} />
    <Composition id="LogoSunriseLoop" component={Loop} durationInFrames={LOOP} fps={FPS} width={1280} height={720} />
    <Composition id="LogoSunriseVertical" component={Rise} durationInFrames={RISE} fps={FPS} width={720} height={1280} />
    <Composition id="LogoSunriseLoopVertical" component={Loop} durationInFrames={LOOP} fps={FPS} width={720} height={1280} />
  </>
);
