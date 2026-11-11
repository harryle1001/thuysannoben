// theme.ts — single source of truth. Never inline colors, easings or springs in components.
import { Easing } from "remotion";

export const theme = {
  colors: {
    // Noben brand: deep pond navy + the gold of the Noben diamond.
    abyss: "#020a1a",
    bg: "#04142e",
    bgAlt: "#0b2347",
    surface: "#1d5a8f",
    primary: "#ffc20e", // THE hero color: max one element per frame (the shrimp / the key word)
    primarySoft: "rgba(255, 194, 14, 0.55)",
    accent: "#3fd0d8", // water light, rays, bubbles
    accentSoft: "rgba(63, 208, 216, 0.18)",
    text: "#f3f7fd",
    textDim: "#a9b9d6",
    line: "rgba(169, 205, 255, 0.16)",
    glow: "rgba(255, 194, 14, 0.45)",
  },
  fonts: {
    display: "Archivo",
    body: "Be Vietnam Pro",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
    sine: Easing.bezier(0.37, 0, 0.63, 1),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    count: { damping: 30, stiffness: 60, mass: 1 },
  },
  clamp: { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const,
} as const;

export const TAU = Math.PI * 2;

// Deterministic pseudo-random in [0,1) from an integer seed.
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
