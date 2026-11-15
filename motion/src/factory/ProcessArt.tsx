// Line-art for ProcessFilm (generic drawings of the process, not pictures of the real plant):
// sealing + labelling, final inspection gate, delivery to the pond, safety glyphs.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PACK_ORDER, PackIcon } from "./Vector";
import { Shrimp } from "../components/Shrimp";
import { rand, TAU, theme } from "../theme";
import { Draw } from "./LineArt";

const C = theme.colors;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });

// ---------- Closed packing: film roll → forming tube → heat-sealing jaws → sealed bag ----------
export const SealArt: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const draw = ramp(f, 0, fps * 1.3);
  const period = 1.6;
  const ph = (t % period) / period;
  const jaw = interpolate(ph, [0.2, 0.38, 0.55], [0, 1, 0], theme.clamp);
  const heat = interpolate(ph, [0.3, 0.42, 0.6], [0, 1, 0], theme.clamp);
  const drop = interpolate(ph, [0.55, 0.8], [0, 1], { ...theme.clamp, easing: theme.ease.in });
  const VBW = 700, VBH = 760;
  return (
    <svg width={width} height={(width / VBW) * VBH} viewBox={`0 0 ${VBW} ${VBH}`} style={{ overflow: "visible" }}>
      {/* closed housing */}
      <Draw d="M150 40 H550 Q570 40 570 60 V520 Q570 540 550 540 H150 Q130 540 130 520 V60 Q130 40 150 40 Z" p={draw} w={3} />
      <rect x={130} y={40} width={440} height={500} rx={20} fill="rgba(29,90,143,0.12)" opacity={draw} />
      {/* film roll */}
      <g transform={`translate(350,130) rotate(${t * 120})`} opacity={draw}>
        <circle r={58} fill="none" stroke={C.text} strokeWidth={3} />
        <circle r={20} fill="none" stroke={C.textDim} strokeWidth={2} />
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={0} y1={-24} x2={0} y2={-54} stroke={C.line} strokeWidth={2} transform={`rotate(${i * 60})`} />)}
      </g>
      <Draw d="M408 130 Q440 200 390 250 L380 270" p={ramp(f, fps * 0.4, fps * 1.2)} w={2} color={C.textDim} />
      {/* forming tube */}
      <Draw d="M320 250 H380 V380 H320 Z" p={ramp(f, fps * 0.3, fps * 1.2)} w={3} />
      {/* granules falling inside the tube */}
      {Array.from({ length: 10 }).map((_, i) => {
        const k = (t * 1.4 + rand(i)) % 1;
        return <circle key={i} cx={334 + rand(i + 2) * 32} cy={262 + k * 150} r={3.5} fill={C.primary} opacity={draw * (1 - k) * 0.9} />;
      })}
      {/* sealing jaws with heat glow */}
      <g opacity={draw}>
        <rect x={250 + jaw * 52} y={400} width={46} height={22} rx={4} fill={C.textDim} />
        <rect x={404 - jaw * 52} y={400} width={46} height={22} rx={4} fill={C.textDim} />
        <rect x={300} y={404} width={100} height={14} rx={7} fill={C.primary} opacity={heat} style={{ filter: `drop-shadow(0 0 ${14 * heat}px ${C.primary})` }} />
      </g>
      {/* bag being formed, then dropping out sealed */}
      <g transform={`translate(350,${430 + drop * 210})`} opacity={draw * (1 - interpolate(ph, [0.92, 1], [0, 1], theme.clamp))}>
        <path d="M-50 0 H50 L54 120 Q54 126 48 126 H-48 Q-54 126 -54 120 Z" fill="rgba(4,20,46,0.85)" stroke={C.text} strokeWidth={3} />
        <line x1={-50} y1={8} x2={50} y2={8} stroke={C.primary} strokeWidth={3} strokeDasharray="6 5" opacity={heat > 0.1 || drop > 0 ? 1 : 0.3} />
        <rect x={-30} y={40} width={60} height={46} rx={6} fill="none" stroke={C.accent} strokeWidth={2} />
        <line x1={-22} y1={54} x2={22} y2={54} stroke={C.accent} strokeWidth={2} />
        <line x1={-22} y1={66} x2={12} y2={66} stroke={C.accent} strokeWidth={2} opacity={0.7} />
      </g>
      {/* outlet + floor line */}
      <Draw d="M300 540 V560 M400 540 V560" p={draw} w={3} />
      <Draw d="M60 740 H640" p={draw} w={3} opacity={0.6} />
      {/* "closed" lock badge on the housing */}
      <g transform="translate(520,90)" opacity={ramp(f, fps * 1, fps * 1.6)}>
        <circle r={30} fill={C.bg} stroke={C.accent} strokeWidth={2} />
        <path d="M-11 -2 V-9 Q-11 -20 0 -20 Q11 -20 11 -9 V-2" fill="none" stroke={C.accent} strokeWidth={3} />
        <rect x={-15} y={-3} width={30} height={22} rx={4} fill={C.accent} />
      </g>
    </svg>
  );
};

// ---------- Final inspection: real products ride through a scanning gate, each gets a check ----------
export const OutQCArt: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const VBW = 1400, VBH = 520;
  const s = width / VBW;
  const draw = ramp(f, 0, fps * 1.2);
  const gateX = 700, beltY = 430;
  const scan = 0.5 + 0.5 * Math.sin(t * TAU * 0.9);
  const n = 6, speed = 0.11; // fraction of the belt per second
  return (
    <div style={{ position: "relative", width, height: VBH * s }}>
      <svg width={width} height={VBH * s} viewBox={`0 0 ${VBW} ${VBH}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Draw d={`M40 ${beltY} H1360`} p={draw} w={3} />
        <Draw d={`M40 ${beltY + 30} H1360`} p={draw} w={3} opacity={0.55} />
        <line x1={40} y1={beltY + 15} x2={1360} y2={beltY + 15} stroke={C.line} strokeWidth={14} strokeDasharray="5 28" strokeDashoffset={-t * 120} opacity={draw} />
        {/* gate */}
        <Draw d={`M${gateX - 120} ${beltY} V110 Q${gateX - 120} 80 ${gateX - 90} 80 H${gateX + 90} Q${gateX + 120} 80 ${gateX + 120} 110 V${beltY}`} p={ramp(f, fps * 0.2, fps * 1.3)} w={4} color={C.accent} />
        <rect x={gateX - 104} y={100 + scan * 300} width={208} height={4} fill={C.accent} opacity={draw} style={{ filter: `drop-shadow(0 0 12px ${C.accent})` }} />
        <rect x={gateX - 104} y={96} width={208} height={beltY - 96} fill="rgba(63,208,216,0.06)" opacity={draw} />
        <text x={gateX} y={62} textAnchor="middle" fill={C.accent} opacity={draw} style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 26, letterSpacing: "0.2em" }}>KIỂM TRA</text>
      </svg>
      {Array.from({ length: n }).map((_, i) => {
        const k = (t * speed + i / n) % 1;
        const x = 60 + k * 1280;
        const passed = x > gateX + 60;
        const o = Math.min(1, k * 10, (1 - k) * 10) * ramp(f, fps * 0.6, fps * 1.4);
        const pop = passed ? spring({ frame: Math.round((x - gateX - 60) / (1280 * speed) * fps), fps, config: theme.spring.bouncy }) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x * s, top: (beltY - 190) * s, height: 190 * s, transform: "translateX(-50%)", opacity: o }}>
            <PackIcon kind={PACK_ORDER[i % PACK_ORDER.length]} h={190 * s} tone={i} />
            {passed && (
              <div style={{ position: "absolute", right: -18 * s, top: -14 * s, width: 56 * s, height: 56 * s, borderRadius: "50%", background: C.accent, transform: `scale(${pop})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${C.accentSoft}` }}>
                <svg width={34 * s} height={34 * s} viewBox="0 0 34 34"><path d="M8 17 L14 23 L26 11" fill="none" stroke={C.abyss} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------- Delivery: factory → truck along a route → the pond (aerator + shrimp) ----------
export const DeliverArt: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const t = f / fps;
  const VBW = 1400, VBH = 560;
  const route = ramp(f, fps * 0.3, fps * 1.8);
  const truck = interpolate(f, [fps * 0.6, fps * 3.2], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  // route curve: quadratic from (300,330) via (700,120) to (1000,330)
  const qx = (u: number) => (1 - u) ** 2 * 300 + 2 * (1 - u) * u * 700 + u * u * 940;
  const qy = (u: number) => (1 - u) ** 2 * 330 + 2 * (1 - u) * u * 140 + u * u * 330;
  const ang = (Math.atan2(qy(Math.min(1, truck + 0.01)) - qy(truck), qx(Math.min(1, truck + 0.01)) - qx(truck)) * 180) / Math.PI;
  return (
    <svg width={width} height={(width / VBW) * VBH} viewBox={`0 0 ${VBW} ${VBH}`} style={{ overflow: "visible" }}>
      {/* factory */}
      <Draw d="M60 420 V260 L130 210 V260 L200 210 V260 L270 210 V420 Z" p={ramp(f, 0, fps)} w={3} />
      <Draw d="M90 210 V140 H120 V230" p={ramp(f, 0, fps)} w={3} />
      <rect x={140} y={340} width={60} height={80} fill="none" stroke={C.textDim} strokeWidth={2} opacity={ramp(f, 0, fps)} />
      {[0, 1, 2].map((i) => {
        const k = ((t * 0.4 + i / 3) % 1);
        return <circle key={i} cx={105 + Math.sin(k * TAU) * 6} cy={130 - k * 90} r={8 + k * 14} fill="none" stroke={C.textDim} strokeWidth={1.5} opacity={(1 - k) * 0.5} />;
      })}
      {/* route */}
      <path d="M300 330 Q700 140 940 330" fill="none" stroke={C.accent} strokeWidth={3} strokeDasharray="10 12" pathLength={1} opacity={0.9} style={{ strokeDasharray: `${route} 1` }} />
      <path d="M300 330 Q700 140 940 330" fill="none" stroke={C.accent} strokeWidth={3} strokeDasharray="12 14" strokeDashoffset={-t * 40} opacity={route * 0.6} />
      {/* truck */}
      <g transform={`translate(${qx(truck)},${qy(truck) - 30}) rotate(${ang})`} opacity={interpolate(f, [fps * 0.5, fps * 0.8], [0, 1], theme.clamp)}>
        <rect x={-50} y={-30} width={64} height={44} rx={4} fill={C.bg} stroke={C.text} strokeWidth={3} />
        <path d="M14 -18 H34 L46 -4 V14 H14 Z" fill={C.bg} stroke={C.text} strokeWidth={3} />
        <circle cx={-30} cy={20} r={9} fill={C.bg} stroke={C.text} strokeWidth={3} />
        <circle cx={30} cy={20} r={9} fill={C.bg} stroke={C.text} strokeWidth={3} />
        <rect x={-38} y={-20} width={36} height={22} rx={3} fill={C.primary} opacity={0.9} />
      </g>
      {/* pond */}
      <g opacity={ramp(f, fps * 0.8, fps * 1.8)}>
        <ellipse cx={1180} cy={420} rx={200} ry={80} fill="rgba(63,208,216,0.10)" stroke={C.accent} strokeWidth={3} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${1040 + i * 30} ${405 + i * 18} q 30 ${-8 * Math.sin(t * 2 + i)} 60 0 t 60 0 t 60 0`} fill="none" stroke={C.accent} strokeWidth={2} opacity={0.5} />
        ))}
        {/* aerator paddle wheel */}
        <g transform={`translate(1290,392) rotate(${t * 200})`}>
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-3} y={-30} width={6} height={22} fill={C.text} transform={`rotate(${i * 60})`} />)}
          <circle r={8} fill={C.text} />
        </g>
        {Array.from({ length: 6 }).map((_, i) => {
          const k = (t * 1.2 + rand(i)) % 1;
          return <circle key={i} cx={1250 + rand(i + 3) * 80} cy={410 - k * 30} r={3} fill="none" stroke={C.text} strokeWidth={1.5} opacity={1 - k} />;
        })}
        {/* technician at the pond edge */}
        <g transform="translate(1400,330)">
          <circle cx={0} cy={-62} r={14} fill="none" stroke={C.text} strokeWidth={3} />
          <path d="M0 -48 V0 M0 -36 L-18 -14 M0 -36 L22 -50 M0 0 L-14 34 M0 0 L14 34" fill="none" stroke={C.text} strokeWidth={3} strokeLinecap="round" />
          <path d="M-20 -72 Q0 -92 20 -72 Z" fill={C.primary} />
        </g>
      </g>
      <Shrimp x={1150} y={430} scale={0.55} rotate={-10} swim={(t / 1.6) % 1} draw={ramp(f, fps * 1.2, fps * 2.4)} strokeWidth={4} />
    </svg>
  );
};

// ---------- Safety glyphs ----------
export const SafetyGlyph: React.FC<{ kind: "helmet" | "spark" | "iso"; size: number; p: number; color?: string }> = ({ kind, size, p, color = C.accent }) => {
  const d: Record<string, string[]> = {
    helmet: ["M10 46 Q10 18 35 16 Q60 18 60 46 Z", "M4 46 H66", "M35 16 V10 M24 20 V34 M46 20 V34"],
    spark: ["M35 8 L40 28 L60 33 L40 38 L35 58 L30 38 L10 33 L30 28 Z", "M56 8 L58 14 L64 16 L58 18 L56 24 L54 18 L48 16 L54 14 Z"],
    iso: ["M35 6 L60 14 V32 C60 48 48 58 35 63 C22 58 10 48 10 32 V14 Z", "M23 34 L32 43 L48 25"],
  };
  return <svg width={size} height={size} viewBox="0 0 70 70">{d[kind].map((x, i) => <Draw key={i} d={x} p={p} color={color} w={3} />)}</svg>;
};
