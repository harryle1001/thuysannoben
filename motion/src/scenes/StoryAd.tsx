import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Counter, Entrance, WordReveal } from "../components/Motion";
import { Bubbles, DeepWater, Finish, GodRays, Plankton, Surface } from "../components/Ocean";
import type { Item, Stage, Story } from "../stories";
import { PHI_INV, PI, rand, TAU, theme } from "../theme";

const C = theme.colors;
const serif: React.CSSProperties = { fontFamily: theme.fonts.serif, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.08, color: C.text };
const sans: React.CSSProperties = { fontFamily: theme.fonts.body, color: C.text };
const kick = (color: string, size: number): React.CSSProperties => ({ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: size, letterSpacing: "0.22em", textTransform: "uppercase", color });

const useL = () => {
  const { width: W, height: H, fps } = useVideoConfig();
  const v = H > W;
  return { W, H, fps, v, pick: <T,>(a: T, b: T) => (v ? a : b), sec: (s: number) => Math.round(s * fps) };
};

// Scene wrapper: content leaves faster than it came (rise + fade + blur over ~0.35 s).
const Exit: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = interpolate(frame, [dur - Math.round(fps * 0.35), dur - 1], [0, 1], { ...theme.clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ opacity: 1 - k, transform: `translateY(${-28 * k}px) scale(${1 + 0.02 * k})`, filter: k > 0.01 ? `blur(${k * 8}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// ---------- shared layers ----------
const Glow: React.FC<{ s: Story; x: number; y: number; r: number }> = ({ s, x, y, r }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / (fps * 8);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", left: x - r + Math.sin(TAU * t) * 40, top: y - r + Math.cos(TAU * t) * 30, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${s.accentSoft}, transparent 62%)`, filter: "blur(40px)" }} />
    </AbsoluteFill>
  );
};

const LightSweep: React.FC<{ s: Story; at: number; len: number }> = ({ s, at, len }) => {
  const frame = useCurrentFrame();
  const { W, H } = useL();
  const k = interpolate(frame, [at, at + len], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  if (k <= 0 || k >= 1) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: -W * 0.75 + k * W * 2, top: -H * 0.2, width: W * 0.5, height: H * 1.4, transform: "skewX(-14deg)", opacity: Math.sin(Math.PI * k),
        background: `linear-gradient(90deg, transparent, ${s.accentSoft} 30%, rgba(255,255,255,0.5) 50%, ${s.accentSoft} 70%, transparent)`, filter: "blur(18px)",
      }} />
    </AbsoluteFill>
  );
};

// Accent sparks drifting up through the whole film.
const Sparks: React.FC<{ s: Story; n?: number }> = ({ s, n = 40 }) => {
  const frame = useCurrentFrame();
  const { W, H, fps } = useL();
  const t = frame / (fps * 6);
  const on = interpolate(frame, [fps * 0.3, fps * 1.2], [0, 1], { ...theme.clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: on }}>
      {Array.from({ length: n }).map((_, i) => {
        const q = (rand(i + 63) + t * (1 + Math.floor(rand(i + 61) * 3))) % 1;
        const x = W * rand(i + 65) + Math.sin(TAU * (q * 2 + rand(i))) * 14;
        const y = H * (1.02 - q * 1.05);
        const sz = 2 + rand(i + 67) * 4;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: "50%", background: i % 4 === 0 ? C.text : s.accent, boxShadow: `0 0 ${sz * 3}px ${s.accent}`, opacity: Math.min(1, q * 5, (1 - q) * 5) * 0.6 }} />;
      })}
    </AbsoluteFill>
  );
};

// A product pack that flies in on a spring (3D turn + blur), then floats; specular sheen crosses it once.
const Pack: React.FC<{
  s: Story; item: Item; cx: number; cy: number; h: number; maxW?: number; delay: number; from?: -1 | 1 | 0;
  label?: boolean; labelSize?: number; phase?: number; halo?: boolean;
}> = ({ s, item, cx, cy, h: h0, maxW = 9999, delay, from = 1, label = true, labelSize = 34, phase = 0, halo = true }) => {
  const frame = useCurrentFrame();
  const { W, H, fps } = useL();
  const k = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 95, mass: 0.9 } });
  if (k <= 0.001) return null;
  const h = Math.min(h0, maxW / item.aspect);
  const w = h * item.aspect;
  const t = frame / fps;
  const x = cx + (1 - k) * from * W * 0.32;
  const y = cy + (1 - k) * (from === 0 ? H * 0.3 : H * 0.06) + Math.sin(t * 1.6 + phase) * 6;
  const rotY = (1 - k) * -from * 42 + Math.sin(t * 0.9 + phase) * 6;
  const blur = interpolate(k, [0, 0.6], [12, 0], theme.clamp);
  const img = staticFile(`products/${item.slug}.webp`);
  const mask: React.CSSProperties = { WebkitMaskImage: `url(${img})`, WebkitMaskSize: "100% 100%", maskImage: `url(${img})`, maskSize: "100% 100%" };
  const sw = interpolate(frame - delay, [fps * 0.5, fps * 1.5], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const ls = spring({ frame: frame - delay - 8, fps, config: theme.spring.smooth });
  return (
    <>
      {halo && <div style={{ position: "absolute", left: cx - h * 0.7, top: cy - h * 0.7, width: h * 1.4, height: h * 1.4, borderRadius: "50%", opacity: k, background: `radial-gradient(circle, ${s.accentSoft}, transparent 64%)`, filter: "blur(24px)" }} />}
      <div style={{ position: "absolute", left: x - w * 0.6, top: cy + h * 0.47, width: w * 1.2, height: h * 0.07, borderRadius: "50%", opacity: k, background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)", filter: "blur(10px)" }} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 1600, opacity: Math.min(1, k * 1.5) }}>
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${rotY}deg) scale(${0.8 + 0.2 * k})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
          <div style={{ position: "absolute", left: 0, top: h * 0.995, width: w, height: h, transform: "scaleY(-1)", opacity: 0.18, WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 30%)", maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 30%)" }}>
            <Img src={img} style={{ width: w, height: h }} />
          </div>
          <Img src={img} style={{ position: "absolute", inset: 0, width: w, height: h, filter: `drop-shadow(0 24px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 24px ${s.accentSoft})` }} />
          <div style={{ position: "absolute", inset: 0, ...mask, mixBlendMode: "screen", background: `linear-gradient(90deg, ${s.accentSoft}, transparent 18%, transparent 82%, rgba(255,255,255,0.16))` }} />
          {sw > 0 && sw < 1 && <div style={{ position: "absolute", inset: 0, ...mask, mixBlendMode: "screen", background: `linear-gradient(105deg, transparent ${sw * 160 - 40}%, rgba(255,255,255,0.6) ${sw * 160 - 25}%, transparent ${sw * 160 - 10}%)` }} />}
        </div>
      </div>
      {label && (
        <div style={{ position: "absolute", left: cx - 230, width: 460, top: cy + h / 2 + labelSize * 1.1, textAlign: "center", opacity: ls, transform: `translateY(${(1 - ls) * 20}px)` }}>
          <div style={{ ...sans, fontWeight: 700, fontSize: labelSize, letterSpacing: "0.04em" }}>{item.name}</div>
          {item.role && <div style={{ ...sans, fontWeight: 500, fontSize: labelSize * 0.78, color: C.textDim, marginTop: 8, lineHeight: 1.3 }}>{item.role}</div>}
        </div>
      )}
    </>
  );
};

// Brand sign-off: logo, one line, hotline in gold, website.
const Brand: React.FC<{ s: Story; delay?: number; size?: number; top?: number; compact?: boolean }> = ({ s, delay = 0, size, top, compact }) => {
  const frame = useCurrentFrame();
  const { fps, pick } = useL();
  const pop = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  const turn = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const sz = size ?? pick(260, 200);
  const glint = interpolate(frame - delay, [fps * 0.6, fps * 1.5], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const breathe = 1 + Math.sin(frame / (fps * 0.9)) * 0.012;
  const logo = staticFile("brand/logo-noben.svg");
  const d = (x: number) => delay + Math.round(fps * x);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: top === undefined ? "center" : "flex-start", paddingTop: top }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: sz, height: sz, transform: `scale(${pop * breathe}) rotate(${interpolate(turn, [0, 1], [-90, 0])}deg)`, filter: `drop-shadow(0 0 ${sz * 0.18}px ${C.glow})` }}>
          <Img src={logo} style={{ width: sz, height: sz }} />
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${logo})`, WebkitMaskSize: "100% 100%", maskImage: `url(${logo})`, maskSize: "100% 100%", mixBlendMode: "screen", background: `linear-gradient(115deg, transparent ${glint * 160 - 40}%, rgba(255,255,255,0.75) ${glint * 160 - 25}%, transparent ${glint * 160 - 10}%)` }} />
        </div>
        {!compact && (
          <Entrance delay={d(0.45)} y={22}>
            <div style={{ ...sans, fontWeight: 600, fontSize: pick(38, 34), marginTop: pick(40, 30), textAlign: "center" }}>{s.close.line}</div>
          </Entrance>
        )}
        <Entrance delay={d(0.7)} y={26}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: pick(44, 30) }}>
            <div style={kick(C.textDim, pick(26, 22))}>{s.close.cta}</div>
            <div style={{ ...serif, fontWeight: 800, fontSize: pick(110, 96), color: C.primary, marginTop: 10, textShadow: `0 0 50px ${C.glow}` }}>0934 246 420</div>
          </div>
        </Entrance>
        <Entrance delay={d(0.95)} y={18}>
          <div style={{ ...sans, fontWeight: 600, fontSize: pick(34, 30), letterSpacing: "0.32em", marginTop: pick(30, 22), marginRight: "-0.32em" }}>THUYSANNOBEN.COM</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// Title card used by every film's opening.
const Title: React.FC<{ s: Story; top: number; align?: "center" | "left"; left?: number; width?: number; size?: number }> = ({ s, top, align = "center", left, width, size }) => {
  const { W, fps, pick } = useL();
  const w = width ?? W - pick(140, 300);
  const x = left ?? (W - w) / 2;
  const jc = align === "center" ? "center" : "flex-start";
  return (
    <div style={{ position: "absolute", left: x, width: w, top, textAlign: align }}>
      <Entrance delay={4} y={18}><div style={kick(s.accent, pick(30, 28))}>{s.kicker}</div></Entrance>
      <WordReveal delay={10} per={4} text={s.title} style={{ ...serif, fontWeight: 800, fontSize: size ?? pick(124, 128), marginTop: 26, justifyContent: jc, columnGap: 26, textShadow: `0 0 60px ${s.accentSoft}` }} />
      <Entrance delay={Math.round(fps * 1.1)} y={16}>
        <div style={{ height: 2, width: 140, margin: "30px 0", background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`, marginLeft: align === "center" ? "auto" : 0, marginRight: "auto" }} />
      </Entrance>
      <Entrance delay={Math.round(fps * 1.3)} y={20}>
        <div style={{ ...sans, fontWeight: 500, fontSize: pick(46, 42), lineHeight: 1.35, color: C.textDim, textWrap: "balance" } as React.CSSProperties}>{s.sub}</div>
      </Entrance>
    </div>
  );
};

// Rotating halo ring with ticks (the "season wheel"), drawn on at the start.
const Ring: React.FC<{ s: Story; cx: number; cy: number; r: number; segs?: number }> = ({ s, cx, cy, r, segs = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useL();
  const t = frame / fps;
  const ticks = 96;
  const circ = TAU * r;
  return (
    <svg width={r * 2.4} height={r * 2.4} style={{ position: "absolute", left: cx - r * 1.2, top: cy - r * 1.2, overflow: "visible", transform: `rotate(${t * 5}deg)` }}>
      {Array.from({ length: segs }).map((_, i) => {
        const d = interpolate(frame, [i * 6 + 4, i * 6 + fps * 1.2], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
        const seg = circ / segs - 18;
        return <circle key={i} cx={r * 1.2} cy={r * 1.2} r={r} fill="none" stroke={s.accent} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`${seg * d} ${circ}`} transform={`rotate(${(360 / segs) * i - 90} ${r * 1.2} ${r * 1.2})`} />;
      })}
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (TAU * i) / ticks;
        const r0 = r * 1.06;
        const len = i % 8 === 0 ? 20 : 8;
        const o = interpolate(frame, [i * 0.4, i * 0.4 + 10], [0, 1], theme.clamp);
        return <line key={i} x1={r * 1.2 + Math.cos(a) * r0} y1={r * 1.2 + Math.sin(a) * r0} x2={r * 1.2 + Math.cos(a) * (r0 + len)} y2={r * 1.2 + Math.sin(a) * (r0 + len)} stroke={C.text} strokeOpacity={(i % 8 === 0 ? 0.35 : 0.12) * o} strokeWidth={1.4} />;
      })}
    </svg>
  );
};

// ---------- stage timeline (persists across the stage beats) ----------
const Timeline: React.FC<{ s: Story; stages: Stage[]; start: number; each: number }> = ({ s, stages, start, each }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, pick } = useL();
  const n = stages.length;
  const f = frame - start;
  const on = interpolate(f, [-8, 10], [0, 1], { ...theme.clamp, easing: theme.ease.out }) * interpolate(f, [each * n - 10, each * n + 4], [1, 0], theme.clamp);
  if (on <= 0) return null;
  const x0 = pick(110, W * 0.1);
  const x1 = pick(W - 110, W * 0.9);
  const y = pick(H * 0.085, H * 0.865);
  const prog = interpolate(f, [0, each * n - 12], [0, 1], theme.clamp);
  const active = Math.min(n - 1, Math.max(0, Math.floor(f / each)));
  const nx = (i: number) => x0 + ((x1 - x0) * i) / (n - 1);
  return (
    <AbsoluteFill style={{ opacity: on }}>
      <div style={{ position: "absolute", left: x0, top: y - 1.5, width: x1 - x0, height: 3, background: C.line, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: x0, top: y - 1.5, width: (x1 - x0) * prog, height: 3, background: `linear-gradient(90deg, ${s.accentSoft}, ${s.accent})`, borderRadius: 2, boxShadow: `0 0 18px ${s.accent}` }} />
      {stages.map((st, i) => {
        const reached = f >= i * each;
        const pop = spring({ frame: f - i * each, fps, config: theme.spring.bouncy });
        const isOn = i === active;
        const size = isOn ? 30 : 18;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: nx(i) - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: reached ? s.accent : C.bg, border: `2px solid ${reached ? s.accent : C.textDim}`, transform: `scale(${reached ? 0.8 + 0.2 * pop : 1})`, boxShadow: isOn ? `0 0 30px ${s.accent}` : "none" }} />
            <div style={{ position: "absolute", left: nx(i) - 140, width: 280, top: y + pick(30, 28), textAlign: "center", ...sans, fontWeight: isOn ? 700 : 500, fontSize: pick(28, 26), color: isOn ? C.text : C.textDim, whiteSpace: "nowrap" }}>{st.short}</div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// One stage: when + what, and 1–2 products flying in.
const StageBeat: React.FC<{ s: Story; st: Stage; i: number; n: number }> = ({ s, st, i, n }) => {
  const { W, H, fps, v, pick } = useL();
  const textBox: React.CSSProperties = v
    ? { position: "absolute", left: 80, width: W - 160, top: H * 0.17, textAlign: "center" }
    : { position: "absolute", left: W * 0.07, width: W * 0.382 - W * 0.02, top: H * 0.25 };
  const items = st.items;
  const zoneC = pick(W / 2, W * (0.382 + 0.618 / 2));
  const gap = pick(W * 0.42, W * 0.22);
  const cy = pick(H * 0.56, H * 0.4);
  const hh = pick(700, 440);
  return (
    <AbsoluteFill>
      <div style={textBox}>
        <Entrance delay={2} y={16}><div style={kick(s.accent, pick(28, 26))}>{`Giai đoạn ${i + 1}/${n}`}</div></Entrance>
        <WordReveal delay={6} per={3} text={st.when} style={{ ...serif, fontSize: pick(92, 88), marginTop: 20, justifyContent: v ? "center" : "flex-start", columnGap: 20 }} />
        <Entrance delay={Math.round(fps * 0.55)} y={16}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(42, 38), lineHeight: 1.35, color: C.textDim, marginTop: 22, textWrap: "balance" } as React.CSSProperties}>{st.name}</div>
        </Entrance>
      </div>
      {items.map((item, k) => (
        <Pack key={item.slug} s={s} item={item} cx={zoneC + (items.length === 1 ? 0 : (k - 0.5) * gap)} cy={cy} h={hh} maxW={pick(400, 300)}
          delay={Math.round(fps * 0.3) + k * 6} from={k === 0 ? -1 : 1} labelSize={pick(38, 32)} phase={k * 1.7} />
      ))}
    </AbsoluteFill>
  );
};

// Final line-up of the whole bundle, then the brand sign-off underneath.
const Lineup: React.FC<{ s: Story; items: Item[] }> = ({ s, items }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const lift = spring({ frame: frame - Math.round(fps * 1.4), fps, config: theme.spring.smooth });
  const rows = v ? [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))] : [items];
  const h = pick(320, 250);
  const rowY = (r: number) => pick(H * 0.27 + r * 390, H * 0.4) - lift * pick(60, H * 0.14);
  const sc = 1 - lift * pick(0.12, 0.3);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, width: W, top: pick(H * 0.075, H * 0.1) - lift * pick(30, 70), textAlign: "center", opacity: 1 - lift * 0.15 }}>
        <Entrance delay={2} y={16}><div style={kick(s.accent, pick(28, 26))}>{s.kicker}</div></Entrance>
        <WordReveal delay={6} per={3} text={s.lineupTitle ?? ""} style={{ ...serif, fontSize: pick(72, 72) * (1 - lift * 0.2), marginTop: 16, justifyContent: "center", columnGap: 18, padding: "0 60px" }} />
      </div>
      {rows.map((row, r) => {
        const span = pick(W * 0.84, W * 0.86);
        const step = span / row.length;
        return row.map((item, k) => {
          const cx = W / 2 + (k - (row.length - 1) / 2) * step * sc;
          const arc = v ? 0 : Math.abs(k - (row.length - 1) / 2) ** 2 * 6;
          return (
            <Pack key={item.slug + r} s={s} item={item} cx={cx} cy={rowY(r) + arc + 40} h={h * sc} maxW={step * 0.86 * sc} delay={8 + (r * row.length + k) * 3}
              from={0} label={false} phase={k + r} halo={false} />
          );
        });
      })}
      <Sequence from={Math.round(fps * 1.4)}>
        <Brand s={s} size={pick(150, 110)} top={pick(H * 0.6, H * 0.5)} compact={!v} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- rain film ----------
const Rain: React.FC<{ s: Story; until: number; fade: number }> = ({ s, until, fade }) => {
  const frame = useCurrentFrame();
  const { W, H, fps } = useL();
  const amt = interpolate(frame, [0, 8, until, until + fade], [0.4, 1, 1, 0.25], theme.clamp) * interpolate(frame, [until + fade * 3, until + fade * 4], [1, 0], theme.clamp);
  if (amt <= 0) return null;
  const n = Math.round(160 * amt);
  const t = frame / fps;
  const surf = H * 0.14;
  // One soft lightning glow near the start (no hard strobe).
  const flash = interpolate(frame, [fps * 0.55, fps * 0.62, fps * 1.4], [0, 0.32, 0], { ...theme.clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const sp = 1.6 + rand(i + 3) * 1.2;
        const q = (rand(i + 7) + t * sp) % 1;
        const x = rand(i + 11) * W * 1.2 - W * 0.1 + q * 120;
        const y = -200 + q * (H + 400);
        const len = 60 + rand(i + 13) * 90;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 2, height: len, transform: "rotate(8deg)", background: `linear-gradient(180deg, transparent, rgba(200,230,255,${0.25 + rand(i) * 0.35}))`, borderRadius: 2 }} />;
      })}
      {/* rings where drops hit the pond surface */}
      {Array.from({ length: Math.round(22 * amt) }).map((_, i) => {
        const q = (rand(i + 50) + t * (0.9 + rand(i + 51))) % 1;
        const x = rand(i + 52 + Math.floor(rand(i + 50) + t * (0.9 + rand(i + 51))) * 7) * W;
        const w = 30 + q * 160;
        return <div key={`r${i}`} style={{ position: "absolute", left: x - w / 2, top: surf + rand(i + 53) * H * 0.05 - w * 0.08, width: w, height: w * 0.16, borderRadius: "50%", border: `1.5px solid ${s.accent}`, opacity: (1 - q) * 0.5 * amt }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(210,230,255,1), transparent 70%)", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

// Downward / upward chevrons streaming: an animated arrow that reads at a glance.
const Arrows: React.FC<{ dir: 1 | -1; color: string; size: number }> = ({ dir, color, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useL();
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" style={{ overflow: "visible" }}>
      {[0, 1, 2].map((i) => {
        const q = ((frame / (fps * 1.2)) + i / 3) % 1;
        const y = dir === 1 ? 10 + q * 90 : 120 - q * 90;
        const pts = dir === 1 ? `15,${y} 50,${y + 30} 85,${y}` : `15,${y} 50,${y - 30} 85,${y}`;
        return <polyline key={i} points={pts} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(Math.PI * q)} />;
      })}
    </svg>
  );
};

const Warning: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const warn = "#ffb547";
  const tiles: Array<[string, string, 1 | -1]> = [["pH", "Tụt, dao động mạnh", 1], ["Độ kiềm", "Giảm, tôm mềm vỏ", 1], ["Khí độc đáy", "Tảo tàn, chìm đáy", -1]];
  const tw = pick(W - 160, W * 0.25);
  const th = pick(300, 420);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, width: W, top: pick(H * 0.16, H * 0.1), textAlign: "center" }}>
        <Entrance delay={2} y={16}><div style={kick(warn, pick(30, 28))}>Cảnh báo sau cơn mưa</div></Entrance>
        <WordReveal delay={6} per={4} text="Sốc pH, tụt kiềm" style={{ ...serif, fontSize: pick(110, 108), marginTop: 20, justifyContent: "center", columnGap: 24 }} />
      </div>
      {tiles.map(([label, note, dir], i) => {
        const k = spring({ frame: frame - Math.round(fps * 0.5) - i * 7, fps, config: theme.spring.snappy });
        const x = v ? 80 : W / 2 + (i - 1) * (tw + 40) - tw / 2;
        const y = v ? H * 0.37 + i * (th + 34) : H * 0.42;
        const pulse = 0.5 + 0.5 * Math.sin(frame / (fps * 0.35) + i);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: tw, height: th, borderRadius: 28, opacity: k,
            transform: `translateY(${(1 - k) * 60}px) scale(${0.94 + 0.06 * k})`,
            background: "linear-gradient(160deg, rgba(29,90,143,0.35), rgba(4,20,46,0.6))", border: `1.5px solid rgba(255,181,71,${0.25 + 0.35 * pulse})`,
            boxShadow: `0 30px 60px -30px rgba(0,0,0,0.7), inset 0 0 40px rgba(255,181,71,${0.06 * pulse})`,
            display: "flex", flexDirection: v ? "row" : "column", alignItems: "center", justifyContent: v ? "flex-start" : "center", gap: v ? 40 : 18, padding: v ? "0 50px" : 0,
          }}>
            <Arrows dir={dir} color={warn} size={pick(110, 120)} />
            <div style={{ textAlign: v ? "left" : "center" }}>
              <div style={{ ...serif, fontSize: pick(76, 72) }}>{label}</div>
              <div style={{ ...sans, fontWeight: 500, fontSize: pick(38, 34), color: C.textDim, marginTop: 10 }}>{note}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- OEM film ----------
const Blueprint: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps } = useL();
  const g = 60;
  const off = (frame * 0.6) % g;
  const on = interpolate(frame, [0, fps], [0, 1], { ...theme.clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ opacity: 0.55 * on }}>
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: `${g}px ${g}px`, backgroundPosition: `${off}px ${off * PHI_INV}px`,
        WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)", maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
      }} />
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,194,14,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,194,14,0.07) 1px, transparent 1px)`,
        backgroundSize: `${g * 5}px ${g * 5}px`, backgroundPosition: `${off}px ${off * PHI_INV}px`,
        WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)", maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
      }} />
      <div style={{ position: "absolute", left: 0, top: H * 0.5, width: W, height: 1, background: s.accentSoft }} />
    </AbsoluteFill>
  );
};

// A neutral bottle drawn in SVG: the customer's own product. `label` 0..1 prints the label band.
const Bottle: React.FC<{ x: number; y: number; h: number; label?: number; text?: boolean; sweep?: number; tint?: string }> = ({ x, y, h, label = 1, text = false, sweep = -1, tint = "#ffc20e" }) => {
  const w = h * 0.46;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 46 100" style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.5))" }}>
        <defs>
          <linearGradient id="btl" x1="0" x2="1">
            <stop offset="0" stopColor="#c9d6e6" /><stop offset="0.22" stopColor="#ffffff" /><stop offset="0.6" stopColor="#e4ebf4" /><stop offset="1" stopColor="#9fb0c6" />
          </linearGradient>
          <linearGradient id="cap" x1="0" x2="1">
            <stop offset="0" stopColor="#0d3a7a" /><stop offset="0.4" stopColor="#2a6fd0" /><stop offset="1" stopColor="#0b2a5a" />
          </linearGradient>
          <clipPath id="body"><path d="M6 26 Q6 20 14 18 L32 18 Q40 20 40 26 L40 94 Q40 99 35 99 L11 99 Q6 99 6 94 Z" /></clipPath>
        </defs>
        <rect x="15" y="2" width="16" height="11" rx="2" fill="url(#cap)" />
        <rect x="17" y="12" width="12" height="7" fill="#d6e0ec" />
        <path d="M6 26 Q6 20 14 18 L32 18 Q40 20 40 26 L40 94 Q40 99 35 99 L11 99 Q6 99 6 94 Z" fill="url(#btl)" />
        <g clipPath="url(#body)">
          <rect x="6" y="40" width={34 * label} height="40" fill={tint} />
          <rect x="6" y="40" width={34 * label} height="3" fill="#0b2347" opacity="0.8" />
          <rect x="6" y="77" width={34 * label} height="3" fill="#0b2347" opacity="0.8" />
          {sweep >= 0 && sweep <= 1 && <rect x={-20 + sweep * 80} y="18" width="10" height="82" fill="white" opacity="0.55" transform="skewX(-12)" />}
        </g>
      </svg>
      {text && label > 0.98 && (
        <div style={{ position: "absolute", left: w * 0.13, width: w * 0.74, top: h * 0.43, height: h * 0.34, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: h * 0.05, color: "#0b2347", letterSpacing: "0.04em", lineHeight: 1.05 }}>THƯƠNG HIỆU</div>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: h * 0.05, color: "#0b2347", letterSpacing: "0.04em", lineHeight: 1.05 }}>CỦA BẠN</div>
          <div style={{ width: "60%", height: 2, background: "#0b2347", opacity: 0.5, margin: `${h * 0.012}px 0` }} />
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: h * 0.026, color: "#0b2347" }}>Logo · Nhãn · Quy cách</div>
        </div>
      )}
    </div>
  );
};

// Conveyor belt with bottles travelling through a QC light gate.
const Conveyor: React.FC<{ s: Story; y: number }> = ({ s, y }) => {
  const frame = useCurrentFrame();
  const { W, fps, pick } = useL();
  const speed = pick(110, 150); // px per second
  const t = frame / fps;
  const bh = pick(190, 250);
  const gap = bh * 0.9;
  const n = Math.ceil(W / gap) + 2;
  const off = (t * speed) % gap;
  const gateX = W * 0.618;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: bh + 80 }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = -gap + i * gap + off;
        const printed = x > gateX ? 1 : 0.0;
        return <Bottle key={i} x={x} y={bh / 2} h={bh} label={printed} />;
      })}
      <div style={{ position: "absolute", left: 0, top: bh - 2, width: W, height: 16, borderRadius: 8, background: "linear-gradient(180deg, #2b4a73, #0f2340)", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", left: 0, top: bh + 3, width: W, height: 4, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 18px, transparent 18px 36px)", backgroundPosition: `${(t * speed) % 36}px 0` }} />
      {Array.from({ length: Math.ceil(W / 120) + 1 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: i * 120 - 14, top: bh + 16, width: 28, height: 28, borderRadius: "50%", border: "3px solid #3b5f8f", background: "#0b1d36", transform: `rotate(${t * 240}deg)` }}>
          <div style={{ position: "absolute", left: 11, top: 0, width: 3, height: 22, background: "#5c80b0" }} />
        </div>
      ))}
      {/* QC gate */}
      <div style={{ position: "absolute", left: gateX - 8, top: -40, width: 16, height: bh + 50, borderRadius: 8, background: `linear-gradient(180deg, ${s.accent}, transparent)`, opacity: 0.85, boxShadow: `0 0 40px ${s.accent}` }} />
      <div style={{ position: "absolute", left: gateX - 60, top: -88, width: 120, textAlign: "center", ...kick(s.accent, 22) }}>QC</div>
    </div>
  );
};

const Creds: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const cols: Array<[React.ReactNode, string]> = [
    ["ISO 9001:2015", "Nhà máy đạt chuẩn quản lý chất lượng"],
    [<><Counter to={22} delay={Math.round(fps * 0.5)} />+ năm</>, "Kinh nghiệm sản xuất thuốc thủy sản"],
    ["Củ Chi", "Dây chuyền tự động hóa · TP.HCM"],
  ];
  const cw = pick(W - 160, W * 0.27);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, width: W, top: pick(H * 0.1, H * 0.1), textAlign: "center" }}>
        <Entrance delay={2} y={16}><div style={kick(s.accent, pick(28, 26))}>Năng lực nhà máy Noben</div></Entrance>
      </div>
      {cols.map(([big, note], i) => {
        const k = spring({ frame: frame - 8 - i * 8, fps, config: theme.spring.snappy });
        const x = v ? 80 : W / 2 + (i - 1) * (cw + 40) - cw / 2;
        const y = v ? H * 0.17 + i * H * 0.15 : H * 0.24;
        const line = interpolate(frame - 14 - i * 8, [0, 18], [0, 1], { ...theme.clamp, easing: theme.ease.out });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: cw, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * 50}px) scale(${0.95 + 0.05 * k})` }}>
            <div style={{ ...serif, fontWeight: 800, fontSize: pick(i === 0 ? 96 : 120, i === 0 ? 76 : 96), color: i === 1 ? C.primary : C.text, textShadow: i === 1 ? `0 0 40px ${C.glow}` : "none", whiteSpace: "nowrap" }}>{big}</div>
            <div style={{ width: 120 * line, height: 2, background: s.accent, margin: "18px auto" }} />
            <div style={{ ...sans, fontWeight: 500, fontSize: pick(38, 32), color: C.textDim, lineHeight: 1.35 }}>{note}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const YourBrand: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const rise = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 70, mass: 1.1 } });
  const label = interpolate(frame, [fps * 0.6, fps * 1.4], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const sweep = interpolate(frame, [fps * 1.5, fps * 2.4], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const bh = pick(820, 760);
  const bx = pick(W / 2, W * 0.69);
  const by = pick(H * 0.36, H * 0.52) + (1 - rise) * H * 0.3 + Math.sin(frame / fps * 1.5) * 6;
  const lines = ["Vi sinh xử lý đáy ao", "Đặc trị, cải thiện môi trường", "Men xử lý nước đậm đặc"];
  const box: React.CSSProperties = v
    ? { position: "absolute", left: 80, width: W - 160, top: H * 0.62, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }
    : { position: "absolute", left: W * 0.07, width: W * 0.4, top: H * 0.2 };
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: bx - bh * 0.6, top: by - bh * 0.6, width: bh * 1.2, height: bh * 1.2, borderRadius: "50%", background: `radial-gradient(circle, ${s.accentSoft}, transparent 62%)`, filter: "blur(30px)", opacity: rise }} />
      <Ring s={s} cx={bx} cy={by} r={bh * 0.48} segs={3} />
      <div style={{ opacity: Math.min(1, rise * 1.5) }}><Bottle x={bx} y={by} h={bh} label={label} text sweep={sweep} /></div>
      <div style={box}>
        <Entrance delay={Math.round(fps * 0.3)} y={16}><div style={kick(s.accent, pick(28, 26))}>Gia công theo nhãn riêng</div></Entrance>
        <WordReveal delay={Math.round(fps * 0.4)} per={4} text="Thương hiệu của bạn" style={{ ...serif, fontWeight: 800, fontSize: pick(96, 112), marginTop: 20, justifyContent: v ? "center" : "flex-start", columnGap: 24, textShadow: `0 0 60px ${s.accentSoft}` }} />
        <Entrance delay={Math.round(fps * 0.9)} y={16}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(40, 38), color: C.textDim, marginTop: 22, lineHeight: 1.35 }}>Thành phẩm, bán thành phẩm, đóng gói theo quy cách riêng</div>
        </Entrance>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: pick(30, 34), alignItems: v ? "center" : "flex-start" }}>
          {lines.map((l, i) => (
            <Entrance key={l} delay={Math.round(fps * 1.2) + i * 5} y={14}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, border: "1.5px solid rgba(255,194,14,0.45)", background: "rgba(4,20,46,0.55)", ...sans, fontWeight: 600, fontSize: pick(32, 30) }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.accent, boxShadow: `0 0 12px ${s.accent}` }} />{l}
              </div>
            </Entrance>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Steps: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const steps = ["Trao đổi nhu cầu", "Báo giá, mẫu thử", "Hoàn thiện hồ sơ", "Sản xuất, giao hàng"];
  const each = Math.round(fps * 0.55);
  const draw = interpolate(frame, [6, 6 + each * 3.4], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const x0 = W * 0.14, x1 = W * 0.86;
  const y0 = pick(H * 0.32, H * 0.27), y1 = pick(H * 0.78, H * 0.63);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, width: W, top: pick(H * 0.14, H * 0.12), textAlign: "center" }}>
        <Entrance delay={2} y={16}><div style={kick(s.accent, pick(28, 26))}>Quy trình làm việc</div></Entrance>
        <WordReveal delay={6} per={4} text="4 bước, rõ ràng" style={{ ...serif, fontSize: pick(100, 96), marginTop: 18, justifyContent: "center", columnGap: 22 }} />
      </div>
      {v
        ? <div style={{ position: "absolute", left: 160, top: y0, width: 3, height: (y1 - y0) * draw, background: `linear-gradient(180deg, ${s.accent}, ${s.accentSoft})` }} />
        : <div style={{ position: "absolute", left: x0, top: H * 0.5 - 1.5, width: (x1 - x0) * draw, height: 3, background: `linear-gradient(90deg, ${s.accent}, ${s.accentSoft})` }} />}
      {steps.map((st, i) => {
        const k = spring({ frame: frame - 6 - i * each, fps, config: theme.spring.bouncy });
        const cx = v ? 160 : x0 + ((x1 - x0) * i) / 3;
        const cy = v ? y0 + ((y1 - y0) * i) / 3 : H * 0.5;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: cx - 50, top: cy - 50, width: 100, height: 100, borderRadius: "50%", background: C.bg, border: `3px solid ${s.accent}`, transform: `scale(${k})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${s.accentSoft}` }}>
              <span style={{ ...serif, fontStyle: "italic", fontSize: 52, color: s.accent }}>{i + 1}</span>
            </div>
            <div style={{
              position: "absolute", opacity: k, transform: `translateY(${(1 - k) * 20}px)`, ...sans, fontWeight: 700, fontSize: pick(46, 36),
              ...(v ? { left: cx + 90, top: cy - 30, width: W - cx - 160 } : { left: cx - 170, width: 340, top: cy + 80, textAlign: "center" as const }),
            }}>{st}</div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- dealer film ----------
const Fan: React.FC<{ s: Story; cy: number; h: number }> = ({ s, cy, h }) => {
  const { W, pick } = useL();
  const items = s.lineup ?? [];
  const step = pick(190, 230);
  return (
    <>
      {items.map((item, k) => {
        const mid = (items.length - 1) / 2;
        const d = Math.abs(k - mid);
        return <Pack key={item.slug} s={s} item={item} cx={W / 2 + (k - mid) * step} cy={cy + d * d * 14} h={h * (1 - d * 0.1)} maxW={step * 1.1} delay={6 + Math.round(d) * 5} from={0} label={false} phase={k} halo={k === Math.round(mid)} />;
      })}
    </>
  );
};

// Stroke icons drawn on (factory, boxes, technician).
const Icon: React.FC<{ kind: "factory" | "boxes" | "tech"; size: number; color: string }> = ({ kind, size, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useL();
  const d = interpolate(frame, [4, fps * 1.1], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const paths: Record<string, string[]> = {
    factory: ["M8 88 L8 44 L30 56 L30 44 L52 56 L52 44 L74 56 L74 20 L88 20 L88 88 Z", "M18 72 L26 72 M40 72 L48 72 M62 72 L70 72", "M74 12 Q80 4 88 10"],
    boxes: ["M10 50 L46 50 L46 88 L10 88 Z", "M54 50 L90 50 L90 88 L54 88 Z", "M32 12 L68 12 L68 50 L32 50 Z", "M28 50 L28 62 M72 50 L72 62 M50 12 L50 24"],
    tech: ["M50 44 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0", "M18 92 Q18 64 50 64 Q82 64 82 92", "M30 40 Q30 18 50 18 Q70 18 70 40", "M70 40 L70 50 Q70 56 62 56"],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: `drop-shadow(0 0 18px ${color})` }}>
      {paths[kind].map((p, i) => <path key={i} d={p} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, d * 1.3 - i * 0.1)} />)}
    </svg>
  );
};

const Perk: React.FC<{ s: Story; kind: "factory" | "boxes" | "tech"; big: React.ReactNode; note: string; idx: number }> = ({ s, kind, big, note, idx }) => {
  const { W, H, fps, v, pick } = useL();
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: pick(H * 0.08, H * 0.1), width: W, textAlign: "center" }}>
        <Entrance delay={0} y={14}><div style={kick(s.accent, pick(28, 26))}>{`Quyền lợi đại lý · ${idx}/3`}</div></Entrance>
      </div>
      <div style={{ position: "absolute", top: pick(H * 0.27, H * 0.2), display: "flex", flexDirection: "column", alignItems: "center", width: W - 160, textAlign: "center" }}>
        <Icon kind={kind} size={pick(280, 200)} color={s.accent} />
        <Entrance delay={Math.round(fps * 0.25)} y={30}>
          <div style={{ ...serif, fontWeight: 800, fontSize: pick(124, 120), marginTop: pick(50, 36), lineHeight: 1.05 }}>{big}</div>
        </Entrance>
        <Entrance delay={Math.round(fps * 0.5)} y={20}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(44, 42), color: C.textDim, marginTop: 26, maxWidth: v ? 900 : 1100, textWrap: "balance" } as React.CSSProperties}>{note}</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// Stylised map UI (not a geographic map): the dealer's pin drops, info card slides up.
const MapCard: React.FC<{ s: Story }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const cw = pick(760, 620), ch = pick(900, 820);
  const cx = pick((W - cw) / 2, W * 0.58);
  const cy = pick(H * 0.36, (H - ch) / 2);
  const k = spring({ frame: frame - 2, fps, config: theme.spring.smooth });
  const drop = spring({ frame: frame - Math.round(fps * 0.8), fps, config: theme.spring.bouncy });
  const card = spring({ frame: frame - Math.round(fps * 1.5), fps, config: theme.spring.snappy });
  const roads = interpolate(frame, [4, fps * 1.2], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const pulse = (frame / (fps * 1.3)) % 1;
  const px = cw * 0.55, py = ch * 0.4;
  const road = (d: string, w: number, i: number) => <path key={i} d={d} fill="none" stroke="rgba(169,205,255,0.22)" strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - roads} />;
  const box: React.CSSProperties = v
    ? { position: "absolute", left: 80, width: W - 160, top: H * 0.07, textAlign: "center" }
    : { position: "absolute", left: W * 0.07, width: W * 0.42, top: H * 0.27 };
  return (
    <AbsoluteFill>
      <div style={box}>
        <Entrance delay={2} y={16}><div style={kick(s.accent, pick(28, 26))}>Bản đồ đại lý Noben</div></Entrance>
        <WordReveal delay={6} per={4} text="Bà con trong vùng tìm đến bạn" style={{ ...serif, fontSize: pick(92, 92), marginTop: 20, justifyContent: v ? "center" : "flex-start", columnGap: 20 }} />
        <Entrance delay={Math.round(fps * 0.6)} y={16}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(40, 38), color: C.textDim, marginTop: 24, lineHeight: 1.35 }}>Có tên trên hệ thống đại lý của thuysannoben.com: địa chỉ, số điện thoại, nút chỉ đường</div>
        </Entrance>
      </div>
      <div style={{ position: "absolute", left: cx, top: cy, width: cw, height: ch, borderRadius: 40, overflow: "hidden", opacity: k, transform: `translateY(${(1 - k) * 80}px) scale(${0.94 + 0.06 * k})`, background: "#0a2244", border: "1.5px solid rgba(169,205,255,0.25)", boxShadow: "0 50px 100px -40px rgba(0,0,0,0.85)" }}>
        <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} style={{ position: "absolute", inset: 0 }}>
          <path d={`M-20 ${ch * 0.7} C ${cw * 0.3} ${ch * 0.55}, ${cw * 0.5} ${ch * 0.9}, ${cw + 20} ${ch * 0.62}`} fill="none" stroke="rgba(95,180,255,0.35)" strokeWidth={34} strokeLinecap="round" />
          {[
            `M0 ${ch * 0.2} L${cw} ${ch * 0.28}`, `M${cw * 0.2} 0 L${cw * 0.3} ${ch}`, `M${cw * 0.75} 0 L${cw * 0.62} ${ch}`, `M0 ${ch * 0.48} L${cw} ${ch * 0.42}`,
            `M${cw * 0.45} 0 L${cw * 0.48} ${ch * 0.5}`, `M0 ${ch * 0.85} L${cw} ${ch * 0.9}`,
          ].map((d, i) => road(d, i < 4 ? 10 : 6, i))}
          {Array.from({ length: 7 }).map((_, i) => (
            <circle key={i} cx={cw * (0.1 + rand(i + 3) * 0.8)} cy={ch * (0.08 + rand(i + 9) * 0.7)} r={8} fill={C.textDim} opacity={0.35 * roads} />
          ))}
        </svg>
        {/* pin */}
        <div style={{ position: "absolute", left: px, top: py - (1 - drop) * 300, opacity: Math.min(1, drop * 2) }}>
          {[0, 0.5].map((ph) => { const q = (pulse + ph) % 1; return <div key={ph} style={{ position: "absolute", left: -70, top: -24, width: 140, height: 48, borderRadius: "50%", border: `2px solid ${s.accent}`, opacity: (1 - q) * 0.8 * drop, transform: `scale(${0.3 + q})` }} />; })}
          <svg width={70} height={92} viewBox="0 0 70 92" style={{ position: "absolute", left: -35, top: -92, filter: `drop-shadow(0 0 18px ${s.accent})` }}>
            <path d="M35 90 C 35 90 4 52 4 32 A31 31 0 0 1 66 32 C 66 52 35 90 35 90 Z" fill={s.accent} />
            <circle cx={35} cy={32} r={12} fill="#0b2347" />
          </svg>
        </div>
        {/* info card */}
        <div style={{ position: "absolute", left: 28, right: 28, bottom: 28, padding: "28px 32px", borderRadius: 26, background: "rgba(243,247,253,0.97)", transform: `translateY(${(1 - card) * 360}px)`, opacity: card }}>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 700, fontSize: pick(38, 32), color: "#0b2347" }}>Cửa hàng của bạn</div>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: pick(28, 24), color: "#4a5b78", marginTop: 8 }}>Đại lý thuốc thủy sản Noben</div>
          <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
            {["Gọi", "Chỉ đường"].map((b, i) => (
              <div key={b} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRadius: 999, fontFamily: theme.fonts.body, fontWeight: 700, fontSize: pick(28, 24), background: i ? "#0b2347" : C.primary, color: i ? "#fff" : "#2b2000" }}>{b}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- film assembly ----------
export const StoryAd: React.FC<{ story: Story; audio?: boolean }> = ({ story: s, audio = true }) => {
  const { W, H, fps, v, pick, sec } = useL();
  const L = sec(s.seconds);
  const beat = (a: number, b: number, el: React.ReactNode, key: string) => (
    <Sequence key={key} from={sec(a)} durationInFrames={sec(b) - sec(a)}>
      <Exit dur={sec(b) - sec(a)}>{el}</Exit>
    </Sequence>
  );
  const sweeps: number[] = [];
  const scenes: React.ReactNode[] = [];
  let extra: React.ReactNode = null;

  if (s.kind === "protocol" || s.kind === "rain") {
    const st = s.stages ?? [];
    const rain = s.kind === "rain";
    const t0 = rain ? 2.5 * PI : PI; // stages start
    const each = PI;
    const tEnd = t0 + st.length * each;
    scenes.push(beat(0, rain ? PI : t0, (
      <AbsoluteFill>
        {!rain && <Ring s={s} cx={W / 2} cy={pick(H * 0.42, H * 0.5)} r={pick(420, 430)} />}
        <Title s={s} top={pick(H * 0.3, H * 0.27)} size={rain ? pick(170, 180) : undefined} />
      </AbsoluteFill>
    ), "intro"));
    if (rain) { scenes.push(beat(PI, t0, <Warning s={s} />, "warn")); sweeps.push(PI); }
    st.forEach((stage, i) => { scenes.push(beat(t0 + i * each, t0 + (i + 1) * each, <StageBeat s={s} st={stage} i={i} n={st.length} />, `st${i}`)); sweeps.push(t0 + i * each); });
    scenes.push(<Sequence key="fin" from={sec(tEnd)}><Lineup s={s} items={s.lineup ?? []} /></Sequence>);
    sweeps.push(tEnd);
    extra = (
      <>
        <Timeline s={s} stages={st} start={sec(t0)} each={sec(each)} />
        {rain && <Rain s={s} until={sec(2.5 * PI)} fade={sec(0.5 * PI)} />}
      </>
    );
  } else if (s.kind === "oem") {
    const a = 1.25 * PI, b = 2.5 * PI, c = 4 * PI, d = 5.25 * PI;
    scenes.push(beat(0, a, <AbsoluteFill><Title s={s} top={pick(H * 0.2, H * 0.14)} size={pick(112, 112)} /><Conveyor s={s} y={pick(H * 0.66, H * 0.6)} /></AbsoluteFill>, "intro"));
    scenes.push(beat(a, b, <AbsoluteFill><Creds s={s} /><Conveyor s={s} y={pick(H * 0.72, H * 0.62)} /></AbsoluteFill>, "creds"));
    scenes.push(beat(b, c, <YourBrand s={s} />, "brand"));
    scenes.push(beat(c, d, <Steps s={s} />, "steps"));
    scenes.push(<Sequence key="cta" from={sec(d)}>
      <AbsoluteFill>
        <div style={{ position: "absolute", top: pick(H * 0.2, H * 0.12), width: W, textAlign: "center" }}>
          <WordReveal delay={4} per={4} text="Đặt gia công ngay" style={{ ...serif, fontWeight: 800, fontSize: pick(112, 100), justifyContent: "center", columnGap: 24, textShadow: `0 0 60px ${s.accentSoft}` }} />
        </div>
        <Brand s={s} delay={Math.round(fps * 0.4)} size={pick(260, 170)} top={pick(H * 0.33, H * 0.29)} />
      </AbsoluteFill>
    </Sequence>);
    sweeps.push(a, b, c, d);
    extra = <Blueprint s={s} />;
  } else {
    const a = PI, perk = (2.5 * PI) / 3, m = 3.5 * PI, z = 5 * PI;
    scenes.push(beat(0, a, (
      <AbsoluteFill>
        <Fan s={s} cy={pick(H * 0.3, H * 0.3)} h={pick(420, 360)} />
        <Title s={s} top={pick(H * 0.5, H * 0.56)} size={pick(110, 104)} />
      </AbsoluteFill>
    ), "intro"));
    const perks: Array<["factory" | "boxes" | "tech", React.ReactNode, string]> = [
      ["factory", "Giá gốc nhà máy", "Noben trực tiếp sản xuất tại Củ Chi, không qua trung gian"],
      ["boxes", <><Counter to={94} delay={Math.round(fps * 0.3)} style={{ color: C.primary }} /> sản phẩm</>, "Vi sinh, khoáng, thức ăn bổ sung, gan ruột: một nguồn hàng cho cả vụ nuôi"],
      ["tech", "Kỹ thuật viên đồng hành", "Hỗ trợ tư vấn cho khách của đại lý tại ao, hướng dẫn phác đồ từng giai đoạn"],
    ];
    perks.forEach(([k2, big, note], i) => { scenes.push(beat(a + i * perk, a + (i + 1) * perk, <Perk s={s} kind={k2} big={big} note={note} idx={i + 1} />, `p${i}`)); sweeps.push(a + i * perk); });
    scenes.push(beat(m, z, <MapCard s={s} />, "map"));
    scenes.push(<Sequence key="cta" from={sec(z)}>
      <AbsoluteFill>
        <div style={{ position: "absolute", top: pick(H * 0.2, H * 0.12), width: W, textAlign: "center" }}>
          <WordReveal delay={4} per={4} text="Đăng ký làm đại lý" style={{ ...serif, fontWeight: 800, fontSize: pick(112, 100), justifyContent: "center", columnGap: 24, textShadow: `0 0 60px ${s.accentSoft}` }} />
        </div>
        <Brand s={s} delay={Math.round(fps * 0.4)} size={pick(260, 170)} top={pick(H * 0.33, H * 0.29)} />
      </AbsoluteFill>
    </Sequence>);
    sweeps.push(m, z);
  }

  return (
    <AbsoluteFill style={{ background: C.abyss, overflow: "hidden" }}>
      {/* 1 background */}
      <DeepWater loop={L} />
      <Glow s={s} x={pick(W / 2, W * PHI_INV)} y={pick(H * 0.5, H * 0.45)} r={pick(W * 0.8, W * 0.45)} />
      <GodRays loop={L} count={8} />
      <Surface loop={L} />
      <Plankton loop={L} count={80} />
      {/* 2 assets + 3 type */}
      <Sparks s={s} />
      {extra}
      {scenes}
      {sweeps.map((t, i) => <LightSweep key={i} s={s} at={sec(t) - Math.round(fps * 0.35)} len={Math.round(fps * 0.8)} />)}
      <Bubbles loop={L} count={v ? 22 : 18} region={[0.02, 0.98]} />
      {/* 4 + 5 grade, grain, vignette */}
      <Finish />
      {audio && <Audio src={staticFile(`sfx/${s.slug}.wav`)} />}
    </AbsoluteFill>
  );
};

// Cue times (seconds) for the synthesized sound bed, shared with make-sfx.mjs via `npm run cues`.
export const storyCues = (s: Story): number[] => {
  if (s.kind === "protocol" || s.kind === "rain") {
    const t0 = s.kind === "rain" ? 2.5 * PI : PI;
    const n = s.stages?.length ?? 0;
    return [...(s.kind === "rain" ? [PI] : []), ...Array.from({ length: n }, (_, i) => t0 + i * PI), t0 + n * PI];
  }
  if (s.kind === "oem") return [1.25 * PI, 2.5 * PI, 4 * PI, 5.25 * PI];
  return [PI, PI + (2.5 * PI) / 3, PI + (5 * PI) / 3, 3.5 * PI, 5 * PI];
};
