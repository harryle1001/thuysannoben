import React from "react";
import { TAU, theme } from "../theme";

type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const norm = (a: P): P => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const bez = (p0: P, p1: P, p2: P, p3: P, s: number): P => {
  const u = 1 - s;
  return [
    u * u * u * p0[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * p3[0],
    u * u * u * p0[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * p3[1],
  ];
};
const f = (p: P) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

// Elegant line-art shrimp, built from a curved spine. Facing left, head at the origin.
// `swim` (0..1, periodic) drives the body undulation, legs and antennae; `draw` (0..1) reveals the strokes.
export const Shrimp: React.FC<{
  x: number; y: number; scale?: number; rotate?: number; swim: number; draw?: number;
  color?: string; glow?: boolean; strokeWidth?: number; opacity?: number; blur?: number;
}> = ({ x, y, scale = 1, rotate = 0, swim, draw = 1, color = theme.colors.primary, glow = true, strokeWidth = 2.4, opacity = 1, blur = 0 }) => {
  const w1 = Math.sin(TAU * swim);
  const w2 = Math.sin(TAU * swim + 1.2);
  const P0: P = [0, 0];
  const P1: P = [120, -34 + w1 * 6];
  const P2: P = [238, 4 + w2 * 10];
  const P3: P = [262 + w2 * 6, 112 + w1 * 10];
  const at = (s: number) => bez(P0, P1, P2, P3, s);
  const tan = (s: number) => norm(add(at(Math.min(1, s + 0.01)), mul(at(Math.max(0, s - 0.01)), -1)));
  const nrm = (s: number): P => { const t = tan(s); return [t[1], -t[0]]; }; // points "up" (dorsal)
  const width = (s: number) => 36 * Math.pow(1 - s, 0.55) + 7;
  const top = (s: number) => add(at(s), mul(nrm(s), width(s)));
  const bot = (s: number) => add(at(s), mul(nrm(s), -width(s) * 0.9));

  const N = 40;
  const outline = (() => {
    const tops = Array.from({ length: N + 1 }, (_, i) => top(i / N));
    const bots = Array.from({ length: N + 1 }, (_, i) => bot(i / N)).reverse();
    // Pointed, rounded head instead of a flat front edge.
    const snout = add(at(0), add(mul(tan(0), -46), mul(nrm(0), 4)));
    const cTop = add(top(0), mul(tan(0), -30));
    const cBot = add(bot(0), mul(tan(0), -22));
    return `M ${f(snout)} Q ${f(cTop)} ${f(tops[0])} ` + tops.slice(1).map((p) => `L ${f(p)}`).join(" ") + " " + bots.map((p) => `L ${f(p)}`).join(" ") + ` Q ${f(cBot)} ${f(snout)} Z`;
  })();

  // Abdominal segment rings, bulging toward the tail.
  const rings = Array.from({ length: 6 }, (_, k) => {
    const s = 0.36 + k * 0.1;
    const c = add(at(s), mul(tan(s), width(s) * 0.55));
    return `M ${f(top(s))} Q ${f(c)} ${f(bot(s))}`;
  });
  // Dorsal highlight running along the back.
  const dorsal = (() => {
    const pts = Array.from({ length: 24 }, (_, i) => { const s2 = 0.02 + (i / 23) * 0.9; return add(at(s2), mul(nrm(s2), width(s2) * 0.72)); });
    return `M ${f(pts[0])} ` + pts.slice(1).map((p) => `L ${f(p)}`).join(" ");
  })();
  // Carapace groove.
  const groove = (() => {
    const pts = Array.from({ length: 9 }, (_, i) => { const s = 0.04 + (i / 8) * 0.28; return add(at(s), mul(nrm(s), width(s) * 0.35)); });
    return `M ${f(pts[0])} ` + pts.slice(1).map((p) => `L ${f(p)}`).join(" ");
  })();
  // Rostrum (the spiked "nose").
  const rTop = top(0.03);
  const rostrum = `M ${f(rTop)} C -34 -30, -70 -30, -112 -40 C -78 -20, -52 -10, -30 -4`;
  // Long antennae sweeping back over the body, and short antennules.
  const sw1 = Math.sin(TAU * swim + 0.6) * 14;
  const sw2 = Math.sin(TAU * swim + 2.1) * 18;
  const antennae = [
    `M -6 4 C -150 18, -70 -150, ${300 + sw1} ${-120 + sw1 * 0.5}`,
    `M -2 8 C -130 40, -40 -110, ${330 + sw2} ${-60 + sw2 * 0.4}`,
    `M -10 0 C -40 -6, -60 -2, ${-92 + sw1 * 0.3} ${12}`,
    `M -10 4 C -36 8, -54 16, ${-84 + sw2 * 0.3} ${30}`,
  ];
  // Walking legs under the head.
  const legs = Array.from({ length: 5 }, (_, k) => {
    const s = 0.07 + k * 0.05;
    const b = bot(s);
    const kick = Math.sin(TAU * swim * 2 + k * 0.9) * 5;
    return `M ${f(b)} L ${f(add(b, [-8 + kick, 26]))} L ${f(add(b, [-20 + kick, 40]))}`;
  });
  // Swimmerets paddling under the tail.
  const swimmerets = Array.from({ length: 5 }, (_, k) => {
    const s = 0.4 + k * 0.1;
    const b = bot(s);
    const n = mul(nrm(s), -1);
    const paddle = Math.sin(TAU * swim * 3 + k * 0.8) * 0.35;
    const d = norm(add(n, mul(tan(s), paddle - 0.25)));
    return `M ${f(b)} L ${f(add(b, mul(d, 22)))}`;
  });
  // Tail fan: telson + two uropods.
  const end = at(1);
  const d = tan(1);
  const petal = (ang: number, len: number, wid: number) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    const dir: P = [d[0] * c - d[1] * s, d[0] * s + d[1] * c];
    const side: P = [-dir[1], dir[0]];
    const tip = add(end, mul(dir, len));
    return `M ${f(end)} Q ${f(add(add(end, mul(dir, len * 0.55)), mul(side, wid)))} ${f(tip)} Q ${f(add(add(end, mul(dir, len * 0.55)), mul(side, -wid)))} ${f(end)}`;
  };
  const fanOpen = 0.42 + Math.sin(TAU * swim) * 0.06;
  const tail = [petal(0, 50, 9), petal(fanOpen, 56, 15), petal(-fanOpen, 56, 15)];
  const eye = add(top(0.05), [6, 10]);

  const paths = [outline, dorsal, groove, rostrum, ...rings, ...legs, ...swimmerets, ...tail, ...antennae];
  const stroke = {
    fill: "none", stroke: color, strokeWidth: strokeWidth / scale, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  return (
    <svg
      style={{
        position: "absolute", left: 0, top: 0, overflow: "visible", opacity,
        filter: [glow ? `drop-shadow(0 0 3px ${theme.colors.glow}) drop-shadow(0 0 18px ${theme.colors.glow})` : "", blur ? `blur(${blur}px)` : ""].join(" ").trim() || undefined,
      }}
      width={1} height={1}
    >
      <defs>
        <linearGradient id={`sf${Math.round(x)}${Math.round(y)}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="60%" stopColor={color} stopOpacity={0.07} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
        <path d={outline} fill={`url(#sf${Math.round(x)}${Math.round(y)})`} stroke="none" opacity={Math.min(1, draw * 1.2)} />
        {paths.map((dPath, i) => {
          // Stagger the draw-on: body first, then details.
          const k = Math.min(1, Math.max(0, draw * 1.6 - (i / paths.length) * 0.6));
          return <path key={i} d={dPath} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} {...stroke} />;
        })}
        <circle cx={eye[0]} cy={eye[1]} r={5.5 * Math.min(1, draw * 1.4)} fill={color} />
      </g>
    </svg>
  );
};
