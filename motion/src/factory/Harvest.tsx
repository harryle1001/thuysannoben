// Harvest — illustrated (flat motion-graphic) ending: at sunset a Noben technician brings a carton to the pond,
// the farmer casts his net in slow motion and pulls up a net of clear-shelled shrimp while his family cheers.
// All characters are drawn illustrations, not people from the company.
// Stage is a 1920×1080 viewBox; portrait frames show the centre band (x 420–1500) with sky and water extended.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { rand, TAU, theme } from "../theme";

const C = theme.colors;
const K = {
  skyTop: "#0b2347", skyMid: "#5a3560", skyLow: "#e8743b", skyGlow: "#ffc94a",
  waterHi: "#f2a35a", waterMid: "#4a2f55", waterLow: "#0b1a33",
  bank: "#3a2418", bankRim: "#c9733a", silhouette: "#1a0f22",
  skin: "#c98a5e", shirtFarmer: "#3f6f8f", pants: "#2b2230", nonLa: "#e9cf8f",
  noben: "#1d5a8f", carton: "#c8955a", wife: "#d9a441", child: "#e35d4f",
} as const;

// time helpers (seconds inside the scene)
const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };
const seg = (t: number, a: number, b: number, ease = theme.ease.inOut) => interpolate(t, [a, b], [0, 1], { ...theme.clamp, easing: ease });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Timeline (s)
export const HARVEST = { walkIn: [0.3, 2.6], give: [2.6, 3.6], setDown: [3.6, 4.3], windup: [4.6, 5.4], fly: [5.4, 7.6], pull: [9.0, 11.6], cheer: 10.4 } as const;

// ---------- a flat, slightly stylised person ----------
type Arm = [number, number]; // shoulder angle, elbow angle (deg; 0 = hanging down, + = toward +x)
const hand = (sx: number, sy: number, [a, b]: Arm, u = 50, l = 46): [number, number] => {
  const r1 = (a * Math.PI) / 180, r2 = ((a + b) * Math.PI) / 180;
  const ex = sx + Math.sin(r1) * u, ey = sy + Math.cos(r1) * u;
  return [ex + Math.sin(r2) * l, ey + Math.cos(r2) * l];
};
const ArmPath: React.FC<{ sx: number; sy: number; arm: Arm; color: string; w?: number }> = ({ sx, sy, arm, color, w = 15 }) => {
  const r1 = (arm[0] * Math.PI) / 180;
  const ex = sx + Math.sin(r1) * 50, ey = sy + Math.cos(r1) * 50;
  const [hx, hy] = hand(sx, sy, arm);
  return (
    <g>
      <path d={`M${sx} ${sy} L${ex} ${ey}`} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} stroke={K.skin} strokeWidth={w - 3} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={w * 0.48} fill={K.skin} />
    </g>
  );
};
const Person: React.FC<{
  x: number; y: number; s?: number; shirt: string; pants?: string; hat?: "non" | "cap" | "none"; hatColor?: string;
  armL: Arm; armR: Arm; walk?: number; lift?: number; dress?: boolean; children?: React.ReactNode;
}> = ({ x, y, s = 1, shirt, pants = K.pants, hat = "non", hatColor = K.nonLa, armL, armR, walk = 0, lift = 0, dress, children }) => {
  const sw = Math.sin(walk * TAU) * 16;
  return (
    <g transform={`translate(${x},${y - lift}) scale(${s})`}>
      <ellipse cx={0} cy={4 + lift / s} rx={44} ry={8} fill="rgba(0,0,0,0.28)" />
      {/* legs */}
      <path d={`M-9 -92 L${-12 + sw} 0`} stroke={pants} strokeWidth={17} strokeLinecap="round" />
      <path d={`M9 -92 L${12 - sw} 0`} stroke={pants} strokeWidth={17} strokeLinecap="round" />
      {/* torso */}
      {dress
        ? <path d="M-24 -180 Q0 -188 24 -180 L30 -70 Q0 -62 -30 -70 Z" fill={shirt} />
        : <rect x={-25} y={-182} width={50} height={96} rx={18} fill={shirt} />}
      <path d="M-25 -150 Q0 -140 25 -150" stroke="rgba(255,255,255,0.12)" strokeWidth={3} fill="none" />
      <ArmPath sx={-20} sy={-170} arm={armL} color={shirt} />
      <ArmPath sx={20} sy={-170} arm={armR} color={shirt} />
      {/* head */}
      <rect x={-6} y={-196} width={12} height={16} fill={K.skin} />
      <circle cx={0} cy={-210} r={20} fill={K.skin} />
      {hat === "non" && <path d="M-46 -212 L0 -252 L46 -212 Q0 -204 -46 -212 Z" fill={hatColor} stroke="rgba(0,0,0,0.15)" strokeWidth={2} />}
      {hat === "cap" && <g><path d="M-21 -214 Q0 -240 21 -214 Z" fill={hatColor} /><path d="M10 -216 H36" stroke={hatColor} strokeWidth={6} strokeLinecap="round" /></g>}
      {hat === "none" && <path d="M-20 -214 Q0 -236 20 -214 Q10 -222 -20 -214 Z" fill="#1a1010" />}
      {/* warm rim light from the sunset on the right */}
      <path d="M25 -176 L25 -96" stroke="rgba(255,190,110,0.55)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={-210} r={20} fill="none" stroke="rgba(255,190,110,0.5)" strokeWidth={3} strokeDasharray="20 200" strokeDashoffset={-4} />
      {children}
    </g>
  );
};

// ---------- one clear-shelled shrimp (translucent, with highlights) ----------
const ClearShrimp: React.FC<{ x: number; y: number; s: number; r: number; flex: number }> = ({ x, y, s, r, flex }) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
    <path d={`M-40 -4 Q-10 -22 22 -12 Q40 -4 ${38 + flex * 6} ${14 + flex * 6} L${30 + flex * 4} ${18 + flex * 6} Q16 6 -10 10 Q-30 12 -40 -4 Z`} fill="rgba(255,236,214,0.42)" stroke="rgba(255,244,230,0.95)" strokeWidth={2.2} />
    {[-22, -10, 2, 14].map((sx, i) => <path key={i} d={`M${sx} -14 Q${sx + 4} -3 ${sx + 1} 9`} stroke="rgba(255,244,230,0.7)" strokeWidth={1.5} fill="none" />)}
    <path d="M-34 -6 Q-12 -18 18 -10" stroke="#fff" strokeWidth={2} fill="none" opacity={0.9} />
    <circle cx={-34} cy={-4} r={2.6} fill="#2a1a1a" />
    <path d={`M${36 + flex * 6} ${14 + flex * 6} l10 4 l-4 8 Z`} fill="rgba(255,150,110,0.7)" />
    <path d="M-40 -6 Q-70 -30 -96 -26 M-40 -4 Q-72 -14 -98 -4" stroke="rgba(255,236,214,0.7)" strokeWidth={1.2} fill="none" />
  </g>
);

// ---------- the stage ----------
export const HarvestStage: React.FC = () => {
  const t = useT();
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  const vb = portrait ? "420 -420 1080 1920" : "0 0 1920 1080";
  // camera: slow push-ins on the people, a wider frame while the net flies
  const KF: Array<[number, number, number, number]> = [[0, 740, 600, 1.42], [4.3, 790, 610, 1.5], [5.6, 960, 590, 1.22], [7.8, 1010, 620, 1.18], [9.2, 950, 620, 1.3], [11.8, 900, 600, 1.55], [15, 890, 600, 1.62]];
  let ki = 0; while (ki < KF.length - 2 && t > KF[ki + 1][0]) ki++;
  const kk = seg(t, KF[ki][0], KF[ki + 1][0], theme.ease.inOut);
  const camX = lerp(KF[ki][1], KF[ki + 1][1], kk), camY = lerp(KF[ki][2], KF[ki + 1][2], kk);
  const camZ0 = lerp(KF[ki][3], KF[ki + 1][3], kk);
  const camZ = portrait ? camZ0 * 1.08 : camZ0;
  const camYv = portrait ? camY + 40 : camY;
  const camXv = portrait ? camX * 0.55 + 700 * 0.45 : camX;

  // --- technician walks in, hands the carton over ---
  const walk = seg(t, HARVEST.walkIn[0], HARVEST.walkIn[1], theme.ease.out);
  const techX = lerp(280, 650, walk);
  const walking = t > HARVEST.walkIn[0] && t < HARVEST.walkIn[1] - 0.2;
  const give = seg(t, HARVEST.give[0], HARVEST.give[1]);
  const setDown = seg(t, HARVEST.setDown[0], HARVEST.setDown[1]);
  const techLeave = seg(t, 4.6, 8.5, theme.ease.inOut);
  const techXf = lerp(techX, 720, techLeave);
  // --- farmer pose keyframes ---
  const wind = seg(t, HARVEST.windup[0], HARVEST.windup[1]);
  const release = seg(t, HARVEST.windup[1], HARVEST.windup[1] + 0.5, theme.ease.out);
  const fly = seg(t, HARVEST.fly[0], HARVEST.fly[1], theme.ease.sine);
  const pull = seg(t, HARVEST.pull[0], HARVEST.pull[1], theme.ease.inOut);
  const cheer = seg(t, HARVEST.cheer, HARVEST.cheer + 0.6, theme.ease.out);
  // farmer arms: idle → receive → hold → set down → wind-up → release → hold rope → pull up high
  let armR: Arm = [lerp(8, -60, give) , lerp(0, -40, give)];
  let armL: Arm = [lerp(-8, -55, give), lerp(0, -30, give)];
  if (t > HARVEST.setDown[0]) { armR = [lerp(-60, 10, setDown), lerp(-40, 0, setDown)]; armL = [lerp(-55, -10, setDown), lerp(-30, 0, setDown)]; }
  if (t > HARVEST.windup[0]) {
    armR = [lerp(lerp(10, -150, wind), 120, release), lerp(lerp(0, -30, wind), -10, release)];
    armL = [lerp(-10, 40, wind), lerp(0, 30, wind)];
  }
  if (t > HARVEST.fly[1]) { armR = [lerp(100, 150, pull), lerp(-20, -40, pull)]; armL = [lerp(40, 140, pull), lerp(30, -30, pull)]; }
  const farmerX = 880, farmerY = 768;
  const farmerHand = hand(farmerX + 20, farmerY - 170, armR);
  // --- carton path ---
  const techHand: [number, number] = [techXf + 46, 600];
  const cartonOnGround: [number, number] = [800, 742];
  let cx = techHand[0], cy = techHand[1];
  if (t >= HARVEST.give[0]) { cx = lerp(techHand[0], farmerX - 34, give); cy = lerp(600, 610, give); }
  if (t >= HARVEST.setDown[0]) { cx = lerp(farmerX - 34, cartonOnGround[0], setDown); cy = lerp(610, cartonOnGround[1], setDown); }
  // --- net flight ---
  const land: [number, number] = [1250, 770];
  const nx = (1 - fly) ** 2 * farmerHand[0] + 2 * (1 - fly) * fly * 1100 + fly * fly * land[0];
  const ny = (1 - fly) ** 2 * (farmerY - 300) + 2 * (1 - fly) * fly * 360 + fly * fly * land[1];
  const nr = lerp(14, 160, seg(t, HARVEST.fly[0] + 0.1, HARVEST.fly[1] - 0.3, theme.ease.out));
  const landed = t >= HARVEST.fly[1];
  const sink = seg(t, HARVEST.fly[1], HARVEST.fly[1] + 1.2);
  // --- pulled bag ---
  const bagTop: [number, number] = [lerp(land[0] - 40, farmerHand[0], pull), lerp(land[1] - 10, farmerHand[1], pull)];
  const bagRise = pull;

  const sunY = 560;
  return (
    <svg width="100%" height="100%" viewBox={vb} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="hv-sky" x1="0" y1="-420" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={K.skyTop} /><stop offset="0.45" stopColor={K.skyMid} /><stop offset="0.8" stopColor={K.skyLow} /><stop offset="1" stopColor={K.skyGlow} />
        </linearGradient>
        <linearGradient id="hv-water" x1="0" y1="560" x2="0" y2="1500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={K.waterHi} /><stop offset="0.25" stopColor={K.waterMid} /><stop offset="1" stopColor={K.waterLow} />
        </linearGradient>
        <radialGradient id="hv-sun" cx="1300" cy={sunY} r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(255,226,140,0.95)" /><stop offset="0.25" stopColor="rgba(255,180,90,0.45)" /><stop offset="1" stopColor="rgba(255,150,80,0)" />
        </radialGradient>
        <linearGradient id="hv-bank" x1="0" y1="700" x2="0" y2="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6b3f24" /><stop offset="0.2" stopColor={K.bank} /><stop offset="1" stopColor="#140b08" />
        </linearGradient>
      </defs>
      <g transform={`translate(960 540) scale(${camZ}) translate(${-camXv} ${-camYv})`}>
        {/* sky + sun */}
        <rect x={-200} y={-600} width={2400} height={1200} fill="url(#hv-sky)" />
        <circle cx={1300} cy={sunY} r={520} fill="url(#hv-sun)" />
        <circle cx={1300} cy={sunY - 10} r={96} fill="#ffe3a0" />
        {/* far tree line + coconut palms */}
        <path d="M-200 572 Q60 540 220 566 T520 556 T860 568 T1200 552 T1560 566 T1900 552 T2200 568 V590 H-200 Z" fill={K.silhouette} />
        {[[180, 1], [330, 0.8], [1640, 1.1], [1790, 0.85], [980, 0.7]].map(([px, sc], i) => (
          <g key={i} transform={`translate(${px},568) scale(${sc})`}>
            <path d="M0 0 Q10 -90 -6 -190" stroke={K.silhouette} strokeWidth={9} fill="none" />
            {[-70, -30, 10, 50, 90, 140].map((a, k) => {
              const sway = Math.sin(t * 0.8 + k + i) * 4;
              return <path key={k} d={`M-6 -190 q${Math.cos(((a + sway) * Math.PI) / 180) * 60} ${-Math.sin(((a + sway) * Math.PI) / 180) * 30 + 10} ${Math.cos(((a + sway) * Math.PI) / 180) * 110} ${30}`} stroke={K.silhouette} strokeWidth={7} fill="none" strokeLinecap="round" />;
            })}
          </g>
        ))}
        {/* water */}
        <rect x={-200} y={578} width={2400} height={1100} fill="url(#hv-water)" />
        {/* sun reflection column */}
        {Array.from({ length: 22 }).map((_, i) => {
          const y = 590 + i * i * 1.35;
          const w = 160 - i * 5 + Math.sin(t * 2 + i * 1.7) * 30;
          return <rect key={i} x={1300 - w / 2 + Math.sin(t * 1.3 + i) * 14} y={y} width={Math.max(10, w)} height={3 + i * 0.25} rx={2} fill="#ffd27a" opacity={0.75 - i * 0.03} />;
        })}
        {/* aerator paddle wheel with spray */}
        <g transform="translate(1480,650)">
          <rect x={-44} y={-6} width={88} height={14} rx={7} fill={K.silhouette} />
          <g transform={`rotate(${t * 220})`}>{[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-4} y={-30} width={8} height={24} fill={K.silhouette} transform={`rotate(${k * 60})`} />)}</g>
          {Array.from({ length: 10 }).map((_, k) => {
            const p = (t * 1.6 + rand(k)) % 1;
            return <circle key={k} cx={30 + p * 60} cy={-10 - Math.sin(p * Math.PI) * 26} r={2.5} fill="#ffe7b8" opacity={1 - p} />;
          })}
        </g>
        {/* ripples where the net lands */}
        {landed && [0, 1, 2].map((k) => {
          const p = seg(t, HARVEST.fly[1] + k * 0.35, HARVEST.fly[1] + 2.4 + k * 0.35, theme.ease.out);
          return <ellipse key={k} cx={land[0]} cy={land[1]} rx={60 + p * 260} ry={(60 + p * 260) * 0.24} fill="none" stroke="#ffe3b0" strokeWidth={3} opacity={(1 - p) * 0.7 * (p > 0 ? 1 : 0)} />;
        })}

        {/* bank (foreground) with hut and family behind */}
        <path d="M-200 700 Q300 690 700 712 Q1000 728 1110 760 Q1180 900 1220 1700 H-200 Z" fill="url(#hv-bank)" />
        <path d="M-200 700 Q300 690 700 712 Q1000 728 1110 760" stroke={K.bankRim} strokeWidth={4} fill="none" opacity={0.8} />
        {/* hut (chòi canh ao) */}
        <g transform="translate(470,712) scale(0.8)" opacity={0.95}>
          {[-60, 60].map((x) => <rect key={x} x={x - 4} y={-90} width={8} height={90} fill={K.silhouette} />)}
          <rect x={-70} y={-100} width={140} height={12} fill={K.silhouette} />
          <path d="M-100 -96 L0 -170 L100 -96 Z" fill="#2a1a20" stroke="#d0874a" strokeWidth={2} />
        </g>
        {/* family: wife and child */}
        <Person x={530} y={722} s={0.62} shirt={K.wife} pants="#3a2a36" dress hat="non"
          armL={[lerp(-6, -150, cheer), lerp(0, -10, cheer)]} armR={[lerp(6, 160, cheer), lerp(0, 10, cheer)]} />
        <Person x={590} y={726} s={0.42} shirt={K.child} pants="#2a2a3a" hat="none"
          lift={cheer > 0 ? Math.abs(Math.sin((t - HARVEST.cheer) * 5)) * 26 * cheer : 0}
          armL={[lerp(-10, -165, cheer), 0]} armR={[lerp(10, 165, cheer), 0]} />

        {/* technician (Noben uniform) */}
        <Person x={techXf} y={752} s={0.92} shirt={K.noben} pants="#22283a" hat="cap" hatColor={C.primary}
          walk={walking ? (t * 1.4) % 1 : techLeave > 0 && techLeave < 1 ? (t * 1.2) % 1 : 0}
          armL={t < HARVEST.give[1] ? [-60, -40] : [lerp(-60, -10, seg(t, 3.6, 4.2)), lerp(-40, 0, seg(t, 3.6, 4.2))]}
          armR={t < HARVEST.give[1] ? [-70, -30] : [lerp(-70, 150, seg(t, 4.2, 4.8)) - Math.sin(t * 8) * 12 * seg(t, 4.4, 5) * (1 - seg(t, 6, 6.6)), lerp(-30, 10, seg(t, 4.2, 4.8))]} />
        {/* carton */}
        <g transform={`translate(${cx},${cy})`}>
          <rect x={-38} y={-30} width={76} height={56} rx={4} fill={K.carton} stroke="#8a5f33" strokeWidth={2} />
          <rect x={-38} y={-6} width={76} height={8} fill="#e2b97f" opacity={0.8} />
          <path d="M0 -20 L12 -8 L0 4 L-12 -8 Z" fill={C.primary} stroke={K.noben} strokeWidth={2} transform="translate(-16 10)" />
          <rect x={4} y={10} width={26} height={4} rx={2} fill={K.noben} opacity={0.8} />
        </g>

        {/* farmer */}
        <Person x={farmerX} y={farmerY} s={1} shirt={K.shirtFarmer} armL={armL} armR={armR} />

        {/* rope from hand to net */}
        {t > HARVEST.windup[1] && t < HARVEST.pull[1] + 0.2 && (
          <path d={`M${farmerHand[0]} ${farmerHand[1]} Q${(farmerHand[0] + (landed ? bagTop[0] : nx)) / 2} ${Math.max(farmerHand[1], landed ? bagTop[1] : ny) + 60} ${landed ? bagTop[0] : nx} ${landed ? bagTop[1] : ny}`} stroke="#f3dcb0" strokeWidth={2} fill="none" opacity={0.8} />
        )}
        {/* net in flight (opens like a disc, slow motion) */}
        {t >= HARVEST.fly[0] && t < HARVEST.pull[0] && (
          <g transform={`translate(${nx},${ny})`} opacity={landed ? 1 - sink * 0.6 : 1}>
            <ellipse rx={nr} ry={nr * (landed ? 0.22 : 0.34)} fill="rgba(255,240,210,0.08)" stroke="#f6e3bf" strokeWidth={2.5} />
            <ellipse rx={nr * 0.6} ry={nr * 0.6 * (landed ? 0.22 : 0.34)} fill="none" stroke="#f6e3bf" strokeWidth={1.5} opacity={0.8} />
            {Array.from({ length: 16 }).map((_, k) => {
              const a = (k / 16) * TAU;
              return <line key={k} x1={0} y1={0} x2={Math.cos(a) * nr} y2={Math.sin(a) * nr * (landed ? 0.22 : 0.34)} stroke="#f6e3bf" strokeWidth={1.2} opacity={0.7} />;
            })}
            {Array.from({ length: 20 }).map((_, k) => {
              const a = (k / 20) * TAU;
              return <circle key={k} cx={Math.cos(a) * nr} cy={Math.sin(a) * nr * (landed ? 0.22 : 0.34)} r={3.5} fill="#ffe7b8" />;
            })}
          </g>
        )}
        {/* the pulled net: a bag of clear shrimp, dripping */}
        {t >= HARVEST.pull[0] && (
          <g>
            <g transform={`translate(${bagTop[0]},${bagTop[1]})`}>
              <path d={`M-10 0 Q-${70 + bagRise * 10} ${120} -${50} ${190} Q0 ${226} 50 ${190} Q${70 + bagRise * 10} 120 10 0 Z`} fill="rgba(255,240,210,0.12)" stroke="#f6e3bf" strokeWidth={2.5} />
              {Array.from({ length: 7 }).map((_, k) => <path key={k} d={`M0 0 Q${-60 + k * 20} 120 ${-48 + k * 16} 196`} stroke="#f6e3bf" strokeWidth={1} opacity={0.6} fill="none" />)}
              {Array.from({ length: 4 }).map((_, k) => <path key={k} d={`M-${30 + k * 10} ${70 + k * 35} Q0 ${82 + k * 35} ${30 + k * 10} ${70 + k * 35}`} stroke="#f6e3bf" strokeWidth={1} opacity={0.6} fill="none" />)}
              {Array.from({ length: 13 }).map((_, k) => {
                const jx = Math.sin(t * 9 + k * 2) * 3, jy = Math.cos(t * 7 + k) * 2;
                const px = -40 + rand(k + 50) * 80, py = 110 + rand(k + 60) * 80;
                return <ClearShrimp key={k} x={px + jx} y={py + jy} s={0.5 + rand(k + 70) * 0.18} r={-30 + rand(k + 80) * 60 + Math.sin(t * 6 + k) * 8} flex={Math.sin(t * 10 + k)} />;
              })}
              {/* glints */}
              {Array.from({ length: 6 }).map((_, k) => {
                const p = (t * 1.3 + rand(k + 90)) % 1;
                return <path key={k} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fff" opacity={Math.sin(p * Math.PI) * bagRise} transform={`translate(${-40 + rand(k + 91) * 80},${100 + rand(k + 92) * 90}) scale(${0.8 + p})`} />;
              })}
              {/* drips, in slow motion */}
              {Array.from({ length: 14 }).map((_, k) => {
                const p = (t * 0.55 + rand(k + 30)) % 1;
                return <ellipse key={k} cx={-40 + rand(k + 31) * 80} cy={200 + p * 160} rx={2.4} ry={5} fill="#ffe7c4" opacity={(1 - p) * 0.9 * bagRise} />;
              })}
            </g>
            {/* two shrimp leap out and fall back, slow motion */}
            {[0, 1].map((k) => {
              const p = seg(t, HARVEST.pull[0] + 1.2 + k * 0.7, HARVEST.pull[0] + 3.2 + k * 0.7, theme.ease.sine);
              if (p <= 0 || p >= 1) return null;
              const x0 = bagTop[0] + (k ? 40 : -50), y0 = bagTop[1] + 150;
              return <ClearShrimp key={k} x={x0 + (k ? 90 : -80) * p} y={y0 - Math.sin(p * Math.PI) * 140 + p * 120} s={0.62} r={(k ? 1 : -1) * p * 260} flex={Math.sin(t * 12)} />;
            })}
          </g>
        )}
        {/* warm haze */}
        <rect x={-200} y={-600} width={2400} height={2400} fill="rgba(255,170,90,0.06)" />
      </g>
    </svg>
  );
};
