import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// Entrance: fade + rise + scale together, spring-driven.
export const Entrance: React.FC<{ delay?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, y = 40, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`, ...style }}>
      {children}
    </div>
  );
};

// Word-by-word reveal; `hero` marks words drawn in the hero color.
export const WordReveal: React.FC<{ text: string; delay?: number; per?: number; style?: React.CSSProperties; hero?: string[] }> = ({ text, delay = 0, per = 3, style, hero = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: 22, ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        return (
          <span key={i} style={{
            display: "inline-block", opacity: p, color: hero.includes(word) ? theme.colors.primary : undefined,
            transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`,
          }}>{word}</span>
        );
      })}
    </div>
  );
};

// Scene wrapper: faster exit than entrance (rise + fade + slight blur) over the last frames.
export const SceneExit: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(fps * 0.4);
  const k = interpolate(frame, [duration - len, duration - 1], [0, 1], { ...theme.clamp, easing: theme.ease.in });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - k, transform: `translateY(${-36 * k}px) scale(${1 + 0.03 * k})`, filter: k > 0 ? `blur(${k * 6}px)` : undefined }}>
      {children}
    </div>
  );
};

// Animated counter with tabular digits.
export const Counter: React.FC<{ to: number; delay?: number; suffix?: string; style?: React.CSSProperties }> = ({ to, delay = 0, suffix = "", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(spring({ frame: frame - delay, fps, config: theme.spring.count }), [0, 1], [0, to]);
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{Math.round(v)}{suffix}</span>;
};

// Idle breathing helpers.
export const useBreath = (period = 3, amount = 0.015) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return 1 + Math.sin((frame / (fps * period)) * Math.PI * 2) * amount;
};
