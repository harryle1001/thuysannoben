import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { rand, TAU, theme } from "../theme";

// Every motion here is periodic over `loop` frames (integer cycles), so a render of exactly
// `loop` frames repeats seamlessly on a website.
const useCycle = (loop?: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = loop ?? durationInFrames;
  return { t: (frame % L) / L, frame };
};

// 1. Background: deep water gradient with two drifting light pools (never a flat fill).
export const DeepWater: React.FC<{ loop?: number }> = ({ loop }) => {
  const { t } = useCycle(loop);
  const { width, height } = useVideoConfig();
  const d1 = Math.sin(TAU * t) * width * 0.04;
  const d2 = Math.cos(TAU * t) * height * 0.05;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.bgAlt} 26%, ${theme.colors.bg} 62%, ${theme.colors.abyss} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute", width: width * 0.9, height: width * 0.9, borderRadius: "50%",
          left: width * 0.38 + d1, top: -width * 0.42, filter: "blur(60px)",
          background: `radial-gradient(circle, ${theme.colors.accentSoft}, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute", width: width * 0.7, height: width * 0.7, borderRadius: "50%",
          left: -width * 0.2 - d1 * 0.6, bottom: -width * 0.38 + d2, filter: "blur(80px)",
          background: "radial-gradient(circle, rgba(30, 90, 170, 0.35), transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

// 2. Sun rays through the surface, swaying slowly.
export const GodRays: React.FC<{ loop?: number; count?: number }> = ({ loop, count = 7 }) => {
  const { t } = useCycle(loop);
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", filter: "blur(14px)" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = width * (0.08 + (i / count) * 0.95);
        const sway = Math.sin(TAU * (t + i * 0.13)) * 3.2 + (i - count / 2) * 1.6;
        const breathe = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * (2 * t + rand(i) )));
        const w = width * (0.025 + rand(i + 7) * 0.05);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: -height * 0.1, width: w, height: height * 1.05,
              transformOrigin: "50% 0%", transform: `rotate(${sway}deg)`, opacity: 0.16 * breathe,
              background: `linear-gradient(180deg, rgba(190, 240, 255, 0.95), rgba(120, 210, 230, 0.25) 55%, transparent)`,
              clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 3. Water surface shimmer along the top edge.
export const Surface: React.FC<{ loop?: number }> = ({ loop }) => {
  const { t } = useCycle(loop);
  const { width, height } = useVideoConfig();
  const lines = [0, 1, 2];
  return (
    <svg width={width} height={height * 0.2} style={{ position: "absolute", top: 0, left: 0, mixBlendMode: "screen" }}>
      {lines.map((k) => {
        const pts: string[] = [];
        for (let x = 0; x <= width; x += 24) {
          const y = height * (0.03 + k * 0.025) + Math.sin((x / width) * TAU * (3 + k) + TAU * t * (k + 1)) * (6 + k * 3);
          pts.push(`${x},${y.toFixed(1)}`);
        }
        return <polyline key={k} points={pts.join(" ")} fill="none" stroke={theme.colors.accent} strokeOpacity={0.22 - k * 0.06} strokeWidth={2 - k * 0.4} />;
      })}
    </svg>
  );
};

// 4. Marine snow: tiny particles sinking and swaying (wrap seamlessly).
export const Plankton: React.FC<{ loop?: number; count?: number }> = ({ loop, count = 90 }) => {
  const { t } = useCycle(loop);
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }).map((_, i) => {
        const depth = rand(i + 3); // 0 far .. 1 near
        const speed = 1 + Math.floor(rand(i + 11) * 2); // integer cycles per loop
        const yN = (rand(i + 5) + t * speed) % 1;
        const x = rand(i + 9) * width + Math.sin(TAU * (t * speed + rand(i))) * 18;
        const size = 1.2 + depth * 3.2;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: yN * height * 1.1 - height * 0.05, width: size, height: size,
              borderRadius: "50%", background: theme.colors.text, opacity: 0.12 + depth * 0.35,
              filter: depth < 0.4 ? "blur(1.5px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 5. Bubbles rising with a highlight, wobbling side to side.
export const Bubbles: React.FC<{ loop?: number; count?: number; region?: [number, number] }> = ({ loop, count = 26, region = [0.45, 1] }) => {
  const { t } = useCycle(loop);
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }).map((_, i) => {
        const speed = 1 + Math.floor(rand(i + 21) * 3);
        const p = (rand(i + 23) + t * speed) % 1;
        const x = width * (region[0] + rand(i + 25) * (region[1] - region[0])) + Math.sin(TAU * (p * 3 + rand(i))) * 10;
        const y = height * (1.08 - p * 1.2);
        const r = 3 + rand(i + 27) * 11;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%",
              border: `1.5px solid rgba(190, 240, 255, ${0.25 + rand(i) * 0.3})`,
              background: "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.55) 0 14%, rgba(150,220,255,0.08) 40%, transparent 70%)",
              opacity: Math.min(1, p * 6, (1 - p) * 6),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 6. Science layer: a faint hexagonal lattice with pulsing nodes.
export const Lattice: React.FC<{ loop?: number; x?: number; y?: number; cols?: number; rows?: number; size?: number; opacity?: number }> = ({
  loop, x = 0, y = 0, cols = 7, rows = 5, size = 46, opacity = 1,
}) => {
  const { t } = useCycle(loop);
  const h = size * Math.sqrt(3);
  const nodes: Array<[number, number, number]> = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) nodes.push([c * size * 1.5, r * h + (c % 2 ? h / 2 : 0), r * cols + c]);
  const hex = (cx: number, cy: number) =>
    Array.from({ length: 6 }).map((_, k) => `${cx + size * Math.cos((TAU * k) / 6)},${cy + size * Math.sin((TAU * k) / 6)}`).join(" ");
  return (
    <svg style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity }} width={cols * size * 1.5 + size} height={rows * h + h}>
      <defs>
        <radialGradient id="fade" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="lm"><rect width="100%" height="100%" fill="url(#fade)" /></mask>
      </defs>
      <g mask="url(#lm)">
        {nodes.map(([cx, cy, k]) => (
          <polygon key={`h${k}`} points={hex(cx + size, cy + h / 2)} fill="none" stroke={theme.colors.line} strokeWidth={1.2} />
        ))}
        {nodes.filter((n) => rand(n[2] + 40) > 0.6).map(([cx, cy, k]) => {
          const pulse = 0.5 + 0.5 * Math.sin(TAU * (t * 2 + rand(k)));
          return <circle key={`n${k}`} cx={cx + size * 2} cy={cy + h / 2} r={2.2 + pulse * 2.2} fill={theme.colors.accent} opacity={0.25 + pulse * 0.45} />;
        })}
      </g>
    </svg>
  );
};

// 7. Grade, grain and vignette: the finishing stack (always on top).
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <>
      <AbsoluteFill style={{ background: theme.colors.bgAlt, mixBlendMode: "soft-light", opacity: 0.22, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), transparent 30%, transparent 70%, rgba(0,0,0,0.28))", pointerEvents: "none" }} />
      <AbsoluteFill
        style={{
          backgroundImage: noise, backgroundSize: "220px", pointerEvents: "none",
          backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.07, mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,4,14,0.55) 100%)", pointerEvents: "none" }} />
    </>
  );
};
