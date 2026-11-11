import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Bubbles, DeepWater, Finish, GodRays, Lattice, Plankton, Surface } from "../components/Ocean";
import { Shrimp } from "../components/Shrimp";
import { TAU, theme } from "../theme";

// Seamless ambient loop for the home page hero. No text: the page sets its own headline on top,
// so the hero subject (the gold shrimp) lives in the right half.
export const HeroLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames: L } = useVideoConfig();
  const t = (frame % L) / L;
  // Figure-eight drift, a slight bank into each turn, six tail beats per loop.
  const sx = W * 0.6 + Math.sin(TAU * t) * W * 0.05;
  const sy = H * 0.42 + Math.sin(TAU * 2 * t) * H * 0.045;
  const bank = Math.cos(TAU * t) * 4 - 6;
  const swim = (t * 6) % 1;
  const far = (phase: number) => (t + phase) % 1;
  return (
    <AbsoluteFill style={{ background: theme.colors.abyss, overflow: "hidden" }}>
      {/* 1 background */}
      <DeepWater />
      <GodRays count={8} />
      <Surface />
      <Lattice x={W * 0.02} y={H * 0.52} cols={8} rows={4} size={42} opacity={0.75} />
      {/* 2 far layer: two shrimp silhouettes crossing in the distance (parallax) */}
      <Shrimp x={W * (1.25 - far(0.15) * 1.55)} y={H * 0.72} scale={0.42} rotate={-4} swim={(t * 9) % 1} color={theme.colors.accent} glow={false} opacity={0.32} blur={1.6} strokeWidth={2} />
      <Shrimp x={W * (1.25 - far(0.62) * 1.55)} y={H * 0.26} scale={0.3} rotate={3} swim={(t * 10 + 0.3) % 1} color={theme.colors.accent} glow={false} opacity={0.22} blur={2.4} strokeWidth={2} />
      <Plankton count={110} />
      {/* 3 hero subject */}
      <Shrimp x={sx} y={sy} scale={W / 1100} rotate={bank} swim={swim} strokeWidth={2.6} />
      <Bubbles count={30} region={[0.5, 0.98]} />
      {/* 4 + 5 grade, grain, vignette */}
      <Finish />
    </AbsoluteFill>
  );
};
