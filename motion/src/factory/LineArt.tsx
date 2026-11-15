// Hand-drawn line-art illustrations for FactoryFilm (generic process drawings, not pictures of a real plant).
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PACK_ORDER, PackIcon } from "./Vector";
import { rand, TAU, theme } from "../theme";

const C = theme.colors;

// A path that draws itself as p goes 0 → 1.
export const Draw: React.FC<{ d: string; p: number; color?: string; w?: number; opacity?: number; fill?: string }> = ({ d, p, color = C.text, w = 2.5, opacity = 1, fill = "none" }) => (
  <path d={d} fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, p))} opacity={opacity} />
);

const ramp = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });

// ---------------- Raw material intake: sacks on a belt pass a scanner gate, a checklist ticks ----------------
export const IntakeArt: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const draw = ramp(f, 0, fps * 1.4);
  const belt = (f / fps) * 60; // px per second, belt texture
  const H = 520;
  const sacks = [0, 1, 2, 3];
  return (
    <svg width={width} height={(width / 900) * H} viewBox={`0 0 900 ${H}`} style={{ overflow: "visible" }}>
      {/* belt */}
      <Draw d="M40 400 H860" p={draw} w={3} />
      <Draw d="M40 430 H860" p={draw} w={3} opacity={0.6} />
      <line x1={40} y1={415} x2={860} y2={415} stroke={C.line} strokeWidth={14} strokeDasharray="4 26" strokeDashoffset={-belt} opacity={draw} />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={70 + i * 98} cy={415} r={11} fill="none" stroke={C.textDim} strokeWidth={2} opacity={draw * 0.7} />
      ))}
      {/* scanner gate */}
      <Draw d="M420 400 V150 Q420 120 450 120 H560 Q590 120 590 150 V400" p={ramp(f, fps * 0.3, fps * 1.5)} w={3} color={C.accent} />
      {(() => {
        const sweep = 0.5 + 0.5 * Math.sin((f / fps) * TAU * 0.8);
        const y = 160 + sweep * 220;
        return <rect x={432} y={y} width={146} height={3} fill={C.accent} opacity={draw * 0.9} style={{ filter: `drop-shadow(0 0 10px ${C.accent})` }} />;
      })()}
      {/* sacks moving left → right, looping through the gate */}
      {sacks.map((i) => {
        const x = ((f / fps) * 70 + i * 220) % 880 - 60;
        const fade = Math.min(1, (x + 60) / 80, (860 - x) / 80);
        const passed = x > 500;
        return (
          <g key={i} transform={`translate(${x},${292})`} opacity={Math.max(0, fade) * draw}>
            <path d="M8 104 Q0 60 10 22 Q14 6 30 8 L88 8 Q104 6 108 22 Q118 60 110 104 Z" fill="rgba(4,20,46,0.6)" stroke={C.text} strokeWidth={2.5} />
            <path d="M30 8 Q59 22 88 8" fill="none" stroke={C.text} strokeWidth={2} />
            <rect x={34} y={46} width={50} height={26} rx={5} fill="none" stroke={C.textDim} strokeWidth={2} />
            {passed && <circle cx={100} cy={20} r={14} fill={C.accent} />}
            {passed && <path d="M93 20 L98 25 L107 15" fill="none" stroke={C.abyss} strokeWidth={3} strokeLinecap="round" />}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------- Formula: flask + molecule lattice ----------------
export const FormulaArt: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const p = ramp(f, 0, fps * 1.6);
  const level = interpolate(f, [fps * 0.8, fps * 2.4], [0, 1], { ...theme.clamp, easing: theme.ease.out });
  const atoms: Array<[number, number]> = [[250, 90], [310, 125], [310, 195], [250, 230], [190, 195], [190, 125], [370, 90], [130, 90]];
  const bonds: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [5, 7]];
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" style={{ overflow: "visible" }}>
      <g transform="translate(0,10)">
        {bonds.map(([a, b], i) => (
          <Draw key={i} d={`M${atoms[a][0]} ${atoms[a][1]} L${atoms[b][0]} ${atoms[b][1]}`} p={ramp(f, i * 3, i * 3 + fps * 0.6)} w={2} color={C.textDim} />
        ))}
        {atoms.map(([x, y], i) => {
          const s = ramp(f, 8 + i * 3, 8 + i * 3 + fps * 0.4);
          const pulse = 1 + 0.12 * Math.sin((f / fps) * TAU * 0.6 + i);
          return <circle key={i} cx={x} cy={y} r={9 * s * pulse} fill={i === 0 ? C.accent : C.bgAlt} stroke={C.accent} strokeWidth={2} />;
        })}
      </g>
      {/* flask */}
      <defs>
        <clipPath id="flask"><path d="M215 270 V330 L150 450 Q144 470 166 470 H334 Q356 470 350 450 L285 330 V270 Z" /></clipPath>
      </defs>
      <g clipPath="url(#flask)">
        <rect x={140} y={470 - 140 * level} width={220} height={150} fill={C.accentSoft} />
        <path d={`M140 ${470 - 140 * level} q 27 ${-8 * Math.sin((f / fps) * TAU)} 55 0 t 55 0 t 55 0 t 55 0`} fill="none" stroke={C.accent} strokeWidth={2} opacity={level} />
        {Array.from({ length: 6 }).map((_, i) => {
          const t = ((f / fps) * 0.5 + rand(i)) % 1;
          return <circle key={i} cx={180 + rand(i + 3) * 140} cy={465 - t * 130 * level} r={3 + rand(i + 5) * 4} fill="none" stroke={C.text} strokeWidth={1.5} opacity={level * (1 - t)} />;
        })}
      </g>
      <Draw d="M215 270 V330 L150 450 Q144 470 166 470 H334 Q356 470 350 450 L285 330 V270" p={p} w={3} />
      <Draw d="M205 270 H295" p={p} w={3} />
    </svg>
  );
};

// ---------------- Automated line: weigh → mix → pack, products roll off the end ----------------
export const LineArt: React.FC<{ width: number; delay?: number; labels?: boolean }> = ({ width, delay = 0, labels = true }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const VBW = 1600, VBH = 560;
  const t = f / fps;
  const draw = (i: number) => ramp(f, i * fps * 0.35, i * fps * 0.35 + fps * 1.2);
  const beltY = 430;
  const beltShift = t * 90;
  // ---- station 1: weigh (hopper drops granules into a bowl on a dial scale)
  const S1 = 230, S2 = 720, S3 = 1150;
  const needle = interpolate(Math.sin(t * TAU * 0.35), [-1, 1], [-60, 50]) * Math.min(1, draw(1) * 1.4);
  // ---- station 2: mixer drum
  const rot = t * 140;
  // ---- station 3: packer: a bag drops every period, then rides the belt
  const period = 1.1;
  const bagPhase = (t % period) / period;
  const label = (x: number, y: number, text: string, i: number) => labels ? (
    <g opacity={draw(i)} transform={`translate(0,${(1 - draw(i)) * 14})`}>
      <text x={x} y={y} textAnchor="middle" fill={C.text} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 30, letterSpacing: "0.04em" }}>{text}</text>
    </g>
  ) : null;
  return (
    <div style={{ position: "relative", width, height: (width / VBW) * VBH }}>
      <svg width={width} height={(width / VBW) * VBH} viewBox={`0 0 ${VBW} ${VBH}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* belt across the whole line */}
        <Draw d={`M40 ${beltY} H1560`} p={draw(0)} w={3} />
        <Draw d={`M40 ${beltY + 34} H1560`} p={draw(0)} w={3} opacity={0.55} />
        <line x1={40} y1={beltY + 17} x2={1560} y2={beltY + 17} stroke={C.line} strokeWidth={16} strokeDasharray="5 30" strokeDashoffset={-beltShift} opacity={draw(0)} />
        {Array.from({ length: 15 }).map((_, i) => (
          <g key={i} transform={`translate(${70 + i * 104},${beltY + 17}) rotate(${rot * 2})`} opacity={draw(0) * 0.8}>
            <circle r={12} fill="none" stroke={C.textDim} strokeWidth={2} />
            <line x1={-8} y1={0} x2={8} y2={0} stroke={C.textDim} strokeWidth={2} />
          </g>
        ))}
        {/* legs */}
        {[120, 560, 1000, 1440].map((x, i) => <Draw key={i} d={`M${x} ${beltY + 34} L${x - 20} 540 M${x} ${beltY + 34} L${x + 20} 540`} p={draw(0)} w={2} opacity={0.5} />)}

        {/* station 1 — weigh */}
        <Draw d={`M${S1 - 90} 40 H${S1 + 90} L${S1 + 30} 140 H${S1 - 30} Z`} p={draw(1)} w={3} />
        <Draw d={`M${S1 - 14} 140 V170 M${S1 + 14} 140 V170`} p={draw(1)} w={3} />
        {Array.from({ length: 14 }).map((_, i) => {
          const k = (t * 1.6 + rand(i)) % 1;
          return <circle key={i} cx={S1 - 8 + rand(i + 4) * 16} cy={175 + k * 120} r={3.2} fill={C.primary} opacity={draw(1) * (1 - k) * 0.9} />;
        })}
        <Draw d={`M${S1 - 80} 300 Q${S1} 360 ${S1 + 80} 300 Z`} p={draw(1)} w={3} />
        <Draw d={`M${S1 - 110} 360 H${S1 + 110} V${beltY - 4} H${S1 - 110} Z`} p={draw(1)} w={3} />
        <Draw d={`M${S1} 328 V360`} p={draw(1)} w={3} />
        {/* dial */}
        <g transform={`translate(${S1},${beltY - 36})`} opacity={draw(1)}>
          <path d="M-34 0 A34 34 0 0 1 34 0" fill="none" stroke={C.textDim} strokeWidth={2} />
          {Array.from({ length: 7 }).map((_, i) => {
            const a = Math.PI + (i / 6) * Math.PI;
            return <line key={i} x1={Math.cos(a) * 26} y1={Math.sin(a) * 26} x2={Math.cos(a) * 33} y2={Math.sin(a) * 33} stroke={C.textDim} strokeWidth={2} />;
          })}
          <line x1={0} y1={0} x2={0} y2={-28} stroke={C.accent} strokeWidth={3} strokeLinecap="round" transform={`rotate(${needle})`} />
        </g>
        {label(S1, 26 - 2, "", 1)}

        {/* station 2 — mixer drum with rotating paddles */}
        <Draw d={`M${S2 - 70} 60 H${S2 + 70} V110 H${S2 - 70} Z`} p={draw(2)} w={3} />
        <Draw d={`M${S2} 110 V150`} p={draw(2)} w={3} />
        <g transform={`translate(${S2},${270})`} opacity={draw(2)}>
          <circle r={120} fill="rgba(29,90,143,0.18)" stroke={C.text} strokeWidth={3} />
          <circle r={104} fill="none" stroke={C.line} strokeWidth={2} />
          <g transform={`rotate(${rot})`}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`rotate(${i * 90})`}>
                <line x1={0} y1={0} x2={0} y2={-92} stroke={C.accent} strokeWidth={4} strokeLinecap="round" />
                <path d="M-18 -92 H18" stroke={C.accent} strokeWidth={6} strokeLinecap="round" />
              </g>
            ))}
            <circle r={12} fill={C.accent} />
          </g>
          {Array.from({ length: 22 }).map((_, i) => {
            const a = (i / 22) * TAU + (rot * Math.PI) / 180 * (0.4 + rand(i) * 0.5);
            const r = 30 + rand(i + 9) * 70;
            return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={3} fill={i % 3 ? C.textDim : C.primary} opacity={0.8} />;
          })}
        </g>
        <Draw d={`M${S2 - 40} 390 L${S2 - 60} ${beltY - 4} M${S2 + 40} 390 L${S2 + 60} ${beltY - 4}`} p={draw(2)} w={3} />

        {/* station 3 — vertical packer */}
        <Draw d={`M${S3 - 100} 40 H${S3 + 100} V250 H${S3 - 100} Z`} p={draw(3)} w={3} />
        <Draw d={`M${S3 - 60} 250 V280 M${S3 + 60} 250 V280`} p={draw(3)} w={3} />
        <rect x={S3 - 70} y={86} width={140} height={58} rx={8} fill="none" stroke={C.textDim} strokeWidth={2} opacity={draw(3)} />
        {[0, 1, 2].map((i) => <circle key={i} cx={S3 - 40 + i * 40} cy={190} r={8} fill={i === Math.floor(bagPhase * 3) ? C.accent : "none"} stroke={C.accent} strokeWidth={2} opacity={draw(3)} />)}
        {(() => {
          // sealing jaws close at phase 0.25..0.4, bag drops to belt 0.4..0.6, then rides right
          const jaw = interpolate(bagPhase, [0.15, 0.3, 0.42], [0, 1, 0], theme.clamp);
          const drop = interpolate(bagPhase, [0.42, 0.62], [0, 1], { ...theme.clamp, easing: theme.ease.in });
          const ride = interpolate(bagPhase, [0.62, 1], [0, 1], theme.clamp);
          const by = 268 + drop * (beltY - 92 - 268);
          const bx = S3 + ride * 104 * period * 0.9;
          return (
            <g opacity={draw(3)}>
              <rect x={S3 - 78 + jaw * 12} y={262} width={20} height={10} fill={C.textDim} />
              <rect x={S3 + 58 - jaw * 12} y={262} width={20} height={10} fill={C.textDim} />
              <g transform={`translate(${bx},${by})`}>
                <path d="M-36 0 H36 L40 88 Q40 92 36 92 H-36 Q-40 92 -40 88 Z" fill="rgba(4,20,46,0.7)" stroke={C.text} strokeWidth={2.5} />
                <rect x={-20} y={30} width={40} height={30} rx={4} fill={C.primary} opacity={0.85} />
              </g>
              {/* bags already out, riding toward the exit */}
              {[1, 2].map((k) => (
                <g key={k} transform={`translate(${S3 + (ride + k) * 104 * period * 0.9},${beltY - 92})`} opacity={interpolate(ride + k, [2.2, 2.8], [1, 0], theme.clamp)}>
                  <path d="M-36 0 H36 L40 88 Q40 92 36 92 H-36 Q-40 92 -40 88 Z" fill="rgba(4,20,46,0.7)" stroke={C.text} strokeWidth={2.5} />
                  <rect x={-20} y={30} width={40} height={30} rx={4} fill={C.primary} opacity={0.85} />
                </g>
              ))}
            </g>
          );
        })()}
        {/* raw stream between stations (granules hopping along the belt) */}
        {Array.from({ length: 18 }).map((_, i) => {
          const k = (t * 0.45 + i / 18) % 1;
          const x = S1 + 120 + k * (S2 - S1 - 240);
          return <circle key={i} cx={x} cy={beltY - 6 - Math.abs(Math.sin(k * TAU * 3)) * 4} r={4} fill={C.primary} opacity={draw(1) * Math.min(1, k * 8, (1 - k) * 8) * 0.8} />;
        })}
        {Array.from({ length: 10 }).map((_, i) => {
          const k = (t * 0.45 + i / 10) % 1;
          const x = S2 + 130 + k * (S3 - S2 - 260);
          return <rect key={i} x={x - 5} y={beltY - 14} width={10} height={10} rx={2} fill={C.accent} opacity={draw(2) * Math.min(1, k * 8, (1 - k) * 8) * 0.7} />;
        })}
        {labels && (
          <g>
            {[["Cân định lượng", S1, 1], ["Trộn đồng nhất", S2, 2], ["Đóng gói", S3, 3]].map(([txt, x, i]) => (
              <g key={String(txt)} opacity={draw(Number(i))}>
                <circle cx={Number(x) - 118} cy={512} r={16} fill="none" stroke={C.accent} strokeWidth={2} />
                <text x={Number(x) - 118} y={522} textAnchor="middle" fill={C.accent} style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 22 }}>{i}</text>
                <text x={Number(x) - 90} y={523} fill={C.text} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 30 }}>{txt}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
      {/* finished packs roll off the end of the line */}
      {PACK_ORDER.slice(0, 3).map((kind, i) => {
        const slotT = (t * 0.3 + i / 3) % 1;
        const x = interpolate(slotT, [0, 1], [1300, 1620]);
        const o = Math.min(1, slotT * 6, (1 - slotT) * 5) * ramp(f, fps * 1.2, fps * 2);
        const s = width / VBW;
        return (
          <div key={i} style={{ position: "absolute", left: x * s, top: (beltY - 115) * s, opacity: o, transform: "translateX(-50%)" }}>
            <PackIcon kind={kind} h={115 * s} tone={i} line />
          </div>
        );
      })}
    </div>
  );
};

// ---------------- Small icons (truck, pond + technician, shield) ----------------
export const Glyph: React.FC<{ kind: "truck" | "pond" | "shield" | "box" | "phone"; size: number; p: number; color?: string }> = ({ kind, size, p, color = C.text }) => {
  const d: Record<string, string[]> = {
    truck: ["M6 20 H44 V50 H6 Z", "M44 30 H58 L66 41 V50 H44", "M18 56 a6 6 0 1 0 0.01 0 M54 56 a6 6 0 1 0 0.01 0"],
    pond: ["M4 52 Q18 44 34 52 T66 52", "M10 60 Q22 54 34 60 T60 60", "M44 18 a6 6 0 1 0 0.01 0", "M44 24 V40 M44 30 L36 36 M44 30 L52 26 M44 40 L38 50 M44 40 L50 50", "M52 26 L62 14"],
    shield: ["M35 6 L60 14 V32 C60 48 48 58 35 63 C22 58 10 48 10 32 V14 Z", "M23 34 L32 43 L48 25"],
    box: ["M10 22 L35 10 L60 22 V50 L35 62 L10 50 Z", "M10 22 L35 34 L60 22 M35 34 V62"],
    phone: ["M20 8 H50 Q54 8 54 12 V58 Q54 62 50 62 H20 Q16 62 16 58 V12 Q16 8 20 8 Z", "M30 54 H40"],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      {d[kind].map((x, i) => <Draw key={i} d={x} p={p} color={color} w={3} />)}
    </svg>
  );
};
