// Pure motion-graphic vector pieces in the film's line-art style (no photographs):
// generic packs, the lab, stylised people, quality badges, a stylised map of Viet Nam.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { rand, TAU, theme } from "../theme";
import { Draw } from "./LineArt";

const C = theme.colors;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });

// ---------- generic Noben-style packs (not copies of real labels) ----------
export type PackKind = "bottle" | "bag" | "bucket" | "jar";
export const PACK_ORDER: PackKind[] = ["bottle", "bag", "bucket", "jar", "bottle", "bag"];
// `line`: pure outline version (same line-art as the machines) for packs riding the conveyor.
export const PackIcon: React.FC<{ kind: PackKind; h: number; tone?: number; line?: boolean }> = ({ kind, h, tone = 0, line }) => {
  const band = line ? "transparent" : tone % 2 ? C.accent : C.primary;
  const body = line ? "rgba(4,20,46,0.55)" : "rgba(11,35,71,0.92)";
  const st = { stroke: C.text, strokeWidth: 3, strokeLinejoin: "round" as const };
  const mark = (x: number, y: number, s: number) => <path d={`M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`} fill={C.primary} stroke={C.bg} strokeWidth={1.5} />;
  const shapes: Record<PackKind, { vb: [number, number]; el: React.ReactNode }> = {
    bottle: { vb: [80, 160], el: (<g>
      <rect x={30} y={4} width={20} height={16} rx={3} fill={band} {...st} />
      <path d="M28 20 H52 V34 Q72 42 72 62 V148 Q72 156 64 156 H16 Q8 156 8 148 V62 Q8 42 28 34 Z" fill={body} {...st} />
      <rect x={8} y={74} width={64} height={52} fill={band} stroke={line ? C.textDim : "none"} strokeWidth={2} opacity={0.9} />
      {mark(40, 92, 9)}<rect x={20} y={108} width={40} height={5} rx={2.5} fill={C.bg} opacity={0.6} />
      <path d="M16 64 V140" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeLinecap="round" />
    </g>) },
    bag: { vb: [110, 150], el: (<g>
      <path d="M8 14 H102 L98 142 Q98 146 94 146 H16 Q12 146 12 142 Z" fill={body} {...st} />
      <path d="M8 14 H102" stroke={C.text} strokeWidth={3} strokeDasharray="6 4" />
      <rect x={20} y={40} width={70} height={64} rx={6} fill={band} stroke={line ? C.textDim : "none"} strokeWidth={2} opacity={0.92} />
      {mark(55, 64, 11)}<rect x={32} y={84} width={46} height={6} rx={3} fill={C.bg} opacity={0.6} />
    </g>) },
    bucket: { vb: [130, 140], el: (<g>
      <path d="M20 34 Q65 4 110 34" fill="none" stroke={C.textDim} strokeWidth={3} />
      <rect x={10} y={30} width={110} height={14} rx={4} fill={C.text} />
      <path d="M14 44 H116 L108 134 Q108 138 104 138 H26 Q22 138 22 134 Z" fill={body} {...st} />
      <rect x={20} y={62} width={90} height={48} fill={band} stroke={line ? C.textDim : "none"} strokeWidth={2} opacity={0.9} />
      {mark(65, 80, 10)}<rect x={42} y={96} width={46} height={5} rx={2.5} fill={C.bg} opacity={0.6} />
    </g>) },
    jar: { vb: [110, 130], el: (<g>
      <rect x={12} y={6} width={86} height={22} rx={5} fill={band} {...st} />
      <rect x={8} y={28} width={94} height={98} rx={12} fill={body} {...st} />
      <rect x={8} y={50} width={94} height={50} fill={band} stroke={line ? C.textDim : "none"} strokeWidth={2} opacity={0.9} />
      {mark(55, 68, 10)}<rect x={30} y={86} width={50} height={5} rx={2.5} fill={C.bg} opacity={0.6} />
    </g>) },
  };
  const s = shapes[kind];
  return <svg width={(h * s.vb[0]) / s.vb[1]} height={h} viewBox={`0 0 ${s.vb[0]} ${s.vb[1]}`} style={{ overflow: "visible", filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.5))" }}>{s.el}</svg>;
};

// ---------- a stylised line-art person ----------
export const LinePerson: React.FC<{ x: number; y: number; s?: number; p: number; coat?: boolean; cap?: string; wave?: number; skirt?: boolean }> = ({ x, y, s = 1, p, coat, cap, wave = 0, skirt }) => {
  const arm = -40 - wave * 110;
  const r = (arm * Math.PI) / 180;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle cx={0} cy={-150} r={22} fill={C.bg} stroke={C.text} strokeWidth={3} opacity={Math.min(1, p * 2)} />
      {cap && <path d="M-22 -156 Q0 -184 22 -156 Z M14 -160 H36" fill={cap} stroke={cap} strokeWidth={4} strokeLinecap="round" opacity={p} />}
      <Draw d={skirt ? "M-34 0 L-26 -96 Q0 -116 26 -96 L34 0" : "M-34 0 V-90 Q-34 -118 0 -120 Q34 -118 34 -90 V0"} p={p} w={3} fill={coat ? "rgba(243,247,253,0.10)" : "rgba(29,90,143,0.35)"} />
      {coat && <Draw d="M0 -120 V0 M-12 -112 L0 -84 L12 -112" p={p} w={2.5} color={C.textDim} />}
      <Draw d="M-34 -96 L-46 -40" p={p} w={3} />
      <path d={`M34 -96 L${34 + Math.sin(r + Math.PI) * -56} ${-96 + Math.cos(r + Math.PI) * -56}`} stroke={C.text} strokeWidth={3} strokeLinecap="round" opacity={p} />
      <circle cx={-8} cy={-80} r={4} fill={C.accent} opacity={p} />
    </g>
  );
};

// ---------- the lab: flasks, a rack of test tubes, a microscope ----------
export const LabArt: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const d = (i: number) => ramp(f, i * fps * 0.25, i * fps * 0.25 + fps * 1.1);
  const VBW = 1100, VBH = 560;
  const fill = ramp(f, fps * 0.8, fps * 2.4);
  return (
    <svg width={width} height={(width / VBW) * VBH} viewBox={`0 0 ${VBW} ${VBH}`} style={{ overflow: "visible" }}>
      {/* bench */}
      <Draw d="M20 470 H1080" p={d(0)} w={4} />
      <Draw d="M60 470 V550 M1040 470 V550" p={d(0)} w={3} opacity={0.6} />
      {/* erlenmeyer flask */}
      <defs><clipPath id="lab-flask"><path d="M120 300 V350 L60 460 Q56 470 68 470 H232 Q244 470 240 460 L180 350 V300 Z" /></clipPath></defs>
      <g clipPath="url(#lab-flask)"><rect x={50} y={470 - 90 * fill} width={200} height={100} fill={C.accentSoft} />
        {Array.from({ length: 5 }).map((_, i) => { const k = (t * 0.6 + rand(i)) % 1; return <circle key={i} cx={100 + rand(i + 4) * 100} cy={465 - k * 80 * fill} r={4} fill="none" stroke={C.text} strokeWidth={1.5} opacity={1 - k} />; })}
      </g>
      <Draw d="M120 300 V350 L60 460 Q56 470 68 470 H232 Q244 470 240 460 L180 350 V300 M110 300 H190" p={d(1)} w={3} />
      {/* test tube rack */}
      <Draw d="M300 400 H560 M300 440 H560 M310 400 V470 M550 400 V470" p={d(2)} w={3} />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 330 + i * 48;
        const lvl = 40 + rand(i + 9) * 50;
        const col = i % 2 ? C.primary : C.accent;
        return (
          <g key={i}>
            <rect x={x - 12} y={448 - lvl * fill} width={24} height={lvl * fill} rx={10} fill={col} opacity={0.65} />
            <Draw d={`M${x - 13} 300 V440 Q${x - 13} 458 ${x} 458 Q${x + 13} 458 ${x + 13} 440 V300`} p={d(2 + i * 0.2)} w={2.5} />
          </g>
        );
      })}
      {/* pipette dropping into tube 3 */}
      {(() => {
        const k = (t * 0.9) % 1;
        return (
          <g opacity={d(3)}>
            <Draw d="M426 140 V250 L430 268 L434 250 V140 Z" p={d(3)} w={2.5} />
            <rect x={420} y={120} width={20} height={22} rx={5} fill={C.textDim} />
            <circle cx={430} cy={280 + k * 120} r={5} fill={C.accent} opacity={1 - k} />
          </g>
        );
      })()}
      {/* microscope */}
      <g transform="translate(700,0)">
        <Draw d="M40 470 H220 M120 470 V430 M80 430 H200" p={d(4)} w={4} />
        <Draw d="M180 430 Q220 360 160 280" p={d(4)} w={8} />
        <Draw d="M100 220 L170 160 M110 240 L190 172 L176 154 L96 222 Z" p={d(5)} w={3} />
        <Draw d="M168 156 L200 120" p={d(5)} w={6} />
        <Draw d="M110 270 L118 300 M80 330 H170" p={d(5)} w={3} />
        <circle cx={140} cy={330} r={6} fill={C.accent} opacity={0.5 + 0.5 * Math.sin(t * 3)} />
        {/* light cone from the stage */}
        <path d="M120 330 L100 380 H180 L160 330 Z" fill={C.accentSoft} opacity={d(5)} />
      </g>
      {/* rising molecule */}
      {[0, 1, 2].map((i) => {
        const k = (t * 0.25 + i / 3) % 1;
        return (
          <g key={i} transform={`translate(${250 + i * 40},${280 - k * 200})`} opacity={(1 - k) * d(1)}>
            <circle r={6} fill={C.accent} /><circle cx={16} cy={-10} r={4} fill={C.primary} /><line x1={0} y1={0} x2={16} y2={-10} stroke={C.textDim} strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------- the team: a row of stylised people ----------
export const TeamArt: React.FC<{ width: number; delay?: number; count?: number }> = ({ width, delay = 0, count = 9 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const VBW = 1200, VBH = 460;
  return (
    <svg width={width} height={(width / VBW) * VBH} viewBox={`0 0 ${VBW} ${VBH}`} style={{ overflow: "visible" }}>
      <Draw d="M0 440 H1200" p={ramp(f, 0, fps)} w={3} opacity={0.5} />
      {Array.from({ length: count }).map((_, i) => {
        const back = i % 2 === 1;
        const x = 80 + i * (1040 / (count - 1));
        const p = spring({ frame: f - 6 - Math.abs(i - (count - 1) / 2) * 4, fps, config: theme.spring.smooth });
        const wave = i === 2 || i === 6 ? Math.max(0, Math.sin(t * 3 + i)) * ramp(f, fps * 1.4, fps * 2) : 0;
        const roles = [{ coat: true }, { cap: C.primary }, { skirt: true }, { coat: true }, { cap: C.primary }, { skirt: true }, {}, { coat: true }, { cap: C.accent }];
        return <LinePerson key={i} x={x} y={back ? 400 : 440} s={(back ? 0.92 : 1.04) * (0.95 + rand(i) * 0.1)} p={p} wave={wave} {...roles[i % roles.length]} />;
      })}
    </svg>
  );
};

// ---------- quality badge (an emblem, not a copy of the certificate) ----------
export const Badge: React.FC<{ size: number; top: string; big: string; sub: string; delay?: number; color?: string }> = ({ size, top, big, sub, delay = 0, color = C.accent }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: theme.spring.bouncy });
  const ring = ramp(f, 4, fps * 1.2);
  const id = `ring-${top.length}-${big.length}`;
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" style={{ overflow: "visible", transform: `scale(${p})`, filter: `drop-shadow(0 0 30px ${C.accentSoft})` }}>
      <defs><path id={id} d="M150 150 m-112 0 a112 112 0 1 1 224 0 a112 112 0 1 1 -224 0" /></defs>
      <circle cx={150} cy={150} r={140} fill={C.bg} stroke={color} strokeWidth={4} />
      <Draw d="M150 22 a128 128 0 1 1 -0.1 0" p={ring} color={color} w={2} />
      {Array.from({ length: 24 }).map((_, i) => <circle key={i} cx={150 + Math.cos((i / 24) * TAU) * 134} cy={150 + Math.sin((i / 24) * TAU) * 134} r={2.4} fill={color} opacity={ring} />)}
      <text fill={C.textDim} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 18, letterSpacing: "0.22em" }}>
        <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">{top}</textPath>
      </text>
      <text x={150} y={150} textAnchor="middle" fill={C.text} style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontStretch: "85%", fontSize: big.length > 6 ? 46 : 58 }}>{big}</text>
      <text x={150} y={190} textAnchor="middle" fill={color} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 22 }}>{sub}</text>
      <path d="M126 212 L144 230 L176 198" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={ramp(f, fps * 0.9, fps * 1.4)} />
    </svg>
  );
};

// ---------- stylised map of Viet Nam with delivery routes from Củ Chi ----------
const VN: Array<[number, number]> = [[102.1, 22.4], [103.0, 22.6], [104.0, 22.8], [105.3, 23.3], [106.5, 22.9], [107.4, 21.7], [106.7, 20.7], [106.0, 19.9], [105.7, 18.9], [106.5, 17.6], [107.2, 16.6], [108.2, 16.0], [108.8, 15.2], [109.2, 13.8], [109.3, 12.6], [109.1, 11.6], [108.0, 10.7], [107.0, 10.4], [106.7, 9.9], [105.8, 9.0], [105.1, 8.6], [104.8, 8.8], [104.9, 9.9], [104.5, 10.4], [105.1, 10.9], [106.2, 11.0], [106.5, 11.9], [107.5, 12.3], [107.6, 13.4], [107.4, 14.6], [107.6, 15.4], [106.8, 16.4], [106.1, 17.4], [105.2, 18.6], [104.2, 19.2], [104.0, 20.2], [103.2, 20.8], [102.6, 21.3], [102.2, 22.0]];
const K = 40;
const px = (lon: number, lat: number): [number, number] => [(lon - 102) * K, (23.6 - lat) * K];
export const VietnamMap: React.FC<{ height: number; delay?: number }> = ({ height, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const outline = "M" + VN.map(([a, b]) => px(a, b).map((n) => n.toFixed(1)).join(" ")).join(" L") + " Z";
  const hub = px(106.5, 11.0);
  const dests: Array<[number, number]> = [[105.85, 21.0], [106.7, 20.9], [108.2, 16.05], [109.2, 13.8], [108.4, 11.9], [105.8, 10.0], [105.1, 9.2], [106.3, 9.6], [105.4, 10.4]];
  const VBW = 520, VBH = 620;
  const islands = (lon: number, lat: number, n: number, seed: number) => Array.from({ length: n }).map((_, i) => { const [x, y] = px(lon + (rand(seed + i) - 0.5) * 1.4, lat + (rand(seed + i + 9) - 0.5) * 1.2); return <circle key={i} cx={x} cy={y} r={2.6} fill={C.textDim} opacity={ramp(f, fps * 0.8, fps * 1.6)} />; });
  return (
    <svg height={height} width={(height * VBW) / VBH} viewBox={`-20 -10 ${VBW} ${VBH}`} style={{ overflow: "visible" }}>
      <path d={outline} fill="rgba(29,90,143,0.28)" stroke="none" opacity={ramp(f, fps * 0.6, fps * 1.4)} />
      <Draw d={outline} p={ramp(f, 0, fps * 1.6)} w={2.5} color={C.text} />
      {islands(111.6, 16.4, 7, 3)}
      {islands(114.0, 9.8, 10, 21)}
      <text x={px(111.6, 17.5)[0]} y={px(111.6, 17.5)[1]} fill={C.textDim} textAnchor="middle" opacity={ramp(f, fps, fps * 1.6)} style={{ fontFamily: theme.fonts.body, fontSize: 15 }}>Hoàng Sa</text>
      <text x={px(114.0, 11.2)[0]} y={px(114.0, 11.2)[1]} fill={C.textDim} textAnchor="middle" opacity={ramp(f, fps, fps * 1.6)} style={{ fontFamily: theme.fonts.body, fontSize: 15 }}>Trường Sa</text>
      {dests.map(([lo, la], i) => {
        const [x, y] = px(lo, la);
        const mx = (hub[0] + x) / 2 + (y < hub[1] ? 60 : -30), my = (hub[1] + y) / 2;
        const p = ramp(f, fps * (1 + i * 0.12), fps * (1.8 + i * 0.12));
        const k = (t * 0.5 + i / dests.length) % 1;
        const q = (u: number) => [(1 - u) ** 2 * hub[0] + 2 * (1 - u) * u * mx + u * u * x, (1 - u) ** 2 * hub[1] + 2 * (1 - u) * u * my + u * u * y];
        const [dx, dy] = q(k);
        return (
          <g key={i}>
            <Draw d={`M${hub[0]} ${hub[1]} Q${mx} ${my} ${x} ${y}`} p={p} w={1.8} color={C.accent} opacity={0.75} />
            <circle cx={x} cy={y} r={5} fill={C.accent} opacity={p} />
            {p >= 1 && <circle cx={dx} cy={dy} r={3.5} fill={C.text} opacity={Math.sin(k * Math.PI)} />}
          </g>
        );
      })}
      <circle cx={hub[0]} cy={hub[1]} r={10 + Math.sin(t * 3) * 2} fill={C.primary} opacity={ramp(f, fps * 0.8, fps * 1.2)} style={{ filter: `drop-shadow(0 0 12px ${C.glow})` }} />
      <text x={hub[0] + 18} y={hub[1] + 30} fill={C.text} opacity={ramp(f, fps, fps * 1.5)} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 20 }}>Củ Chi, TP.HCM</text>
    </svg>
  );
};
