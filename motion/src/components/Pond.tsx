import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { rand, TAU, theme } from "../theme";

// Line-art cross-section of a lined pond: rippling surface, sloped liner, a sludge layer on the bottom
// and toxic-gas bubbles (NH₃, NO₂) rising from it. Strokes draw in, the sludge marker pulses in `accent`.
export const PondSection: React.FC<{ x: number; y: number; w: number; h: number; accent: string; clean?: number }> = ({ x, y, w, h, accent, clean = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const C = theme.colors;
  const draw = interpolate(frame, [0, fps * 1.4], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const t = frame / fps;
  const surfY = h * 0.16;
  const bottomY = h * 0.9;
  const slope = w * 0.12;
  const wave = Array.from({ length: 41 }, (_, i) => {
    const px = (w * i) / 40;
    return `${i ? "L" : "M"}${px.toFixed(1)} ${(surfY + Math.sin(TAU * (i / 13) + t * 1.8) * 5).toFixed(1)}`;
  }).join(" ");
  const liner = `M0 ${surfY - 20} L${slope} ${bottomY} L${w - slope} ${bottomY} L${w} ${surfY - 20}`;
  const sludgeTop = (i: number) => bottomY - 22 - Math.sin(i * 1.7 + t * 0.6) * 6 - rand(i + 5) * 16;
  const sludge = `M${slope + 6} ${bottomY} ` + Array.from({ length: 25 }, (_, i) => `L${(slope + 6 + ((w - 2 * slope - 12) * i) / 24).toFixed(1)} ${sludgeTop(i).toFixed(1)}`).join(" ") + ` L${w - slope - 6} ${bottomY} Z`;
  const len = 2 * w + 2 * h;
  const mk = interpolate(frame, [fps * 0.8, fps * 1.3], [0, 1], { ...theme.clamp, easing: theme.ease.out });
  const pulse = (frame / (fps * 1.1)) % 1;
  const gas = ["NH₃", "NO₂", "NH₃", "NO₂"];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="pondWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.accent} stopOpacity="0.08" />
            <stop offset="1" stopColor={C.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`${liner} Z`} fill="url(#pondWater)" opacity={draw} />
        <path d={liner} fill="none" stroke={C.textDim} strokeOpacity={0.6} strokeWidth={2.4} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} strokeLinejoin="round" />
        <path d={wave} fill="none" stroke={C.accent} strokeOpacity={0.55} strokeWidth={2} strokeDasharray={w * 1.1} strokeDashoffset={w * 1.1 * (1 - draw)} />
        <path d={sludge} fill="#3a2c18" fillOpacity={0.75 * draw * (1 - clean)} stroke="#8a6a3a" strokeOpacity={0.7 * draw * (1 - clean)} strokeWidth={1.6} />
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={slope + 20 + rand(i + 9) * (w - 2 * slope - 40)} cy={bottomY - 8 - rand(i + 3) * 18} r={2 + rand(i + 1) * 3} fill="#b08a4a" opacity={0.5 * draw * (1 - clean)} />
        ))}
      </svg>
      {/* rising gas */}
      {Array.from({ length: 14 }).map((_, i) => {
        const q = (rand(i + 21) + t / (2.2 + rand(i) * 1.4)) % 1;
        const bx = slope + 40 + rand(i + 31) * (w - 2 * slope - 80) + Math.sin(TAU * (q * 1.5 + rand(i))) * 12;
        const by = bottomY - 30 - q * (bottomY - surfY - 40);
        const s = 10 + rand(i + 41) * 16;
        const o = Math.min(1, q * 6, (1 - q) * 4) * draw * (1 - clean);
        return (
          <div key={i} style={{ position: "absolute", left: bx - s / 2, top: by - s / 2, width: s, height: s, borderRadius: "50%", border: `1.5px solid ${i % 3 === 0 ? accent : "rgba(220,200,150,0.7)"}`, opacity: o }}>
            {i % 4 === 0 && (
              <span style={{ position: "absolute", left: s + 8, top: -6, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 34, color: C.textDim, whiteSpace: "nowrap" }}>{gas[(i / 4) % gas.length]}</span>
            )}
          </div>
        );
      })}
      {/* marker on the sludge */}
      <div style={{ position: "absolute", left: w * 0.5, top: bottomY - 24, transform: `translate(-50%,-50%) scale(${mk})` }}>
        {[0, 0.5].map((ph) => {
          const q = (pulse + ph) % 1;
          return <div key={ph} style={{ position: "absolute", left: -90, top: -90, width: 180, height: 180, borderRadius: "50%", border: `2px solid ${accent}`, opacity: (1 - q) * 0.8 * (1 - clean), transform: `scale(${0.35 + q * 0.9})` }} />;
        })}
        <div style={{ position: "absolute", left: -14, top: -14, width: 28, height: 28, borderRadius: "50%", background: accent, opacity: 1 - clean, boxShadow: `0 0 40px ${accent}, 0 0 90px ${accent}` }} />
      </div>
    </div>
  );
};
