import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Entrance, WordReveal } from "../components/Motion";
import { Bubbles, DeepWater, Finish, GodRays, Plankton, Surface } from "../components/Ocean";
import { Shrimp } from "../components/Shrimp";
import type { AdProduct } from "../products";
import { PI, rand, TAU, theme } from "../theme";
import { PondSection } from "../components/Pond";

export const AD_SECONDS = 17;
// Four beats (seconds): hook → product reveal → three benefits → brand close.
// Classic cut (first three ads): 17 s. π cut (newer ads): beats on multiples of π/2, 6π ≈ 18.85 s in all.
type Beats = { hook: number; reveal: number; benefits: number; close: number; end: number };
const CLASSIC: Beats = { hook: 0, reveal: 3.2, benefits: 7.6, close: 13.6, end: AD_SECONDS };
const PI_CUT: Beats = { hook: 0, reveal: PI, benefits: 2.5 * PI, close: 4.5 * PI, end: 6 * PI };
export const beatsFor = (p: AdProduct): Beats => (p.piCut ? PI_CUT : CLASSIC);
const BeatCtx = React.createContext<Beats>(CLASSIC);

const C = theme.colors;
const serif: React.CSSProperties = { fontFamily: theme.fonts.serif, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.06, color: C.text };
const sans: React.CSSProperties = { fontFamily: theme.fonts.body, color: C.text };
const kickerStyle = (accent: string, size: number): React.CSSProperties => ({
  fontFamily: theme.fonts.body, fontWeight: 600, fontSize: size, letterSpacing: "0.24em", textTransform: "uppercase", color: accent,
});

// Layout helpers: vertical (9:16) vs landscape (16:9).
const useLayout = () => {
  const { width: W, height: H, fps } = useVideoConfig();
  const v = H > W;
  const pick = <T,>(vert: T, land: T) => (v ? vert : land);
  return { W, H, fps, v, pick, sec: (s: number) => Math.round(s * fps) };
};

// Fast exit used at the end of each beat (faster than the entrances).
const Exit: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = interpolate(frame, [dur - Math.round(fps * 0.35), dur - 1], [0, 1], { ...theme.clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ opacity: 1 - k, transform: `translateY(${-30 * k}px) scale(${1 + 0.025 * k})`, filter: k > 0.01 ? `blur(${k * 8}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// Accent glow pools tinted to the product family, over the shared deep-water base.
const AccentWater: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v } = useLayout();
  const t = frame / (fps * 8);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <div style={{
        position: "absolute", width: W * (v ? 1.4 : 0.9), height: W * (v ? 1.4 : 0.9), borderRadius: "50%",
        left: W * (v ? -0.2 : 0.05) + Math.sin(TAU * t) * 40, top: H * (v ? 0.18 : -0.1) + Math.cos(TAU * t) * 30,
        background: `radial-gradient(circle, ${p.accentSoft}, transparent 62%)`, filter: "blur(40px)", opacity: 0.85,
      }} />
    </AbsoluteFill>
  );
};

// A bright beam that crosses the frame: the cut between hook and reveal.
const LightSweep: React.FC<{ p: AdProduct; at: number; len: number }> = ({ p, at, len }) => {
  const frame = useCurrentFrame();
  const { W, H } = useLayout();
  const k = interpolate(frame, [at, at + len], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  if (k <= 0 || k >= 1) return null;
  const x = -W * 0.5 + k * W * 2;
  const o = Math.sin(Math.PI * k);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: x - W * 0.25, top: -H * 0.2, width: W * 0.5, height: H * 1.4, transform: "skewX(-14deg)", opacity: o,
        background: `linear-gradient(90deg, transparent, ${p.accentSoft} 30%, rgba(255,255,255,0.55) 50%, ${p.accentSoft} 70%, transparent)`, filter: "blur(18px)",
      }} />
    </AbsoluteFill>
  );
};

// ---------- Beat 1: the pond problem ----------
const Hook: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useLayout();
  const draw = interpolate(frame, [0, fps * 1.6], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const sc = pick(2.1, 2.0);
  const sx = pick(W * 0.36, W * 0.58);
  const sy = pick(H * 0.27, H * 0.24) + Math.sin(frame / (fps * 0.8)) * 5;
  const rot = -6;
  // Marker on the affected organ: pulsing ring + crosshair, drawn in the accent.
  const a = (rot * Math.PI) / 180;
  const mx = sx + sc * (p.hookAt[0] * Math.cos(a) - p.hookAt[1] * Math.sin(a));
  const my = sy + sc * (p.hookAt[0] * Math.sin(a) + p.hookAt[1] * Math.cos(a));
  const mk = spring({ frame: frame - Math.round(fps * 0.9), fps, config: theme.spring.bouncy });
  const pulse = (frame / (fps * 1.1)) % 1;
  const textW = pick(900, 1500);
  if (p.hookArt === "pond") return <PondHook p={p} />;
  return (
    <AbsoluteFill>
      <Shrimp x={sx} y={sy} scale={sc} rotate={rot} swim={(frame / (fps * 1.8)) % 1} draw={draw} color={C.textDim} glow={false} strokeWidth={2.2} opacity={0.55} />
      <div style={{ position: "absolute", left: mx, top: my, transform: `translate(-50%,-50%) scale(${mk})` }}>
        {[0, 0.5].map((ph) => {
          const q = (pulse + ph) % 1;
          return <div key={ph} style={{ position: "absolute", left: -90, top: -90, width: 180, height: 180, borderRadius: "50%", border: `2px solid ${p.accent}`, opacity: (1 - q) * 0.8, transform: `scale(${0.35 + q * 0.9})` }} />;
        })}
        <div style={{ position: "absolute", left: -16, top: -16, width: 32, height: 32, borderRadius: "50%", background: p.accent, boxShadow: `0 0 40px ${p.accent}, 0 0 90px ${p.accent}` }} />
      </div>
      <div style={{ position: "absolute", left: (W - textW) / 2, top: pick(H * 0.47, H * 0.5), width: textW, textAlign: v ? "left" : "center" }}>
        <Entrance delay={4} y={20}><div style={kickerStyle(C.textDim, pick(30, 28))}>{p.hookKicker}</div></Entrance>
        <WordReveal delay={10} per={4} text={p.hook} style={{ ...serif, fontSize: pick(118, 116), marginTop: 26, justifyContent: v ? "flex-start" : "center", columnGap: 26 }} />
        <Entrance delay={Math.round(fps * 1.25)} y={22}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(44, 40), color: C.textDim, marginTop: 30, textWrap: "balance" } as React.CSSProperties}>{p.hookSub}</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// Hook variant for water/bottom products: a line-art pond section with sludge and rising gas.
const PondHook: React.FC<{ p: AdProduct }> = ({ p }) => {
  const { W, H, fps, v, pick } = useLayout();
  const textW = pick(900, 1500);
  return (
    <AbsoluteFill>
      <PondSection x={pick(W * 0.06, W * 0.2)} y={pick(H * 0.08, H * 0.05)} w={pick(W * 0.88, W * 0.6)} h={pick(H * 0.36, H * 0.42)} accent={p.accent} />
      <div style={{ position: "absolute", left: (W - textW) / 2, top: pick(H * 0.5, H * 0.53), width: textW, textAlign: v ? "left" : "center" }}>
        <Entrance delay={4} y={20}><div style={kickerStyle(C.textDim, pick(30, 28))}>{p.hookKicker}</div></Entrance>
        <WordReveal delay={10} per={4} text={p.hook} style={{ ...serif, fontSize: pick(118, 116), marginTop: 26, justifyContent: v ? "flex-start" : "center", columnGap: 26 }} />
        <Entrance delay={Math.round(fps * 1.25)} y={22}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(44, 40), color: C.textDim, marginTop: 30, textWrap: "balance" } as React.CSSProperties}>{p.hookSub}</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Persistent product layer (moves across beats 2–3) ----------
type Pose = { x: number; y: number; h: number };
const Product: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, pick, sec } = useLayout();
  const S = React.useContext(BeatCtx);
  const reveal: Pose = pick({ x: W / 2, y: H * 0.43, h: 930 }, { x: W * 0.33, y: H * 0.5, h: 780 });
  const bene: Pose = pick({ x: W / 2, y: H * 0.255, h: 600 }, { x: W * 0.25, y: H * 0.49, h: 700 });

  const enter = spring({ frame: frame - sec(S.reveal) - 4, fps, config: { damping: 18, stiffness: 70, mass: 1.1 } });
  const move = spring({ frame: frame - sec(S.benefits), fps, config: theme.spring.smooth });
  const out = interpolate(frame, [sec(S.close) - 2, sec(S.close) + 10], [0, 1], { ...theme.clamp, easing: theme.ease.in });
  if (enter <= 0.001 || out >= 1) return null;

  const lerp = (a: number, b: number) => a + (b - a) * move;
  const x = lerp(reveal.x, bene.x);
  // Wide packs (jars) are capped by width so every product reads at the same visual weight.
  const h = lerp(Math.min(reveal.h, pick(640, 500) / p.aspect), Math.min(bene.h, pick(420, 460) / p.aspect));
  const t = frame / fps;
  const y = lerp(reveal.y, bene.y) + interpolate(enter, [0, 1], [H * 0.3, 0]) + Math.sin(t * 1.6) * 8 - out * 40;
  const w = h * p.aspect;
  const rotY = interpolate(enter, [0, 1], [-38, 0]) + Math.sin(t * 0.9) * 7;
  const rotZ = interpolate(enter, [0, 1], [5, 0]) + Math.sin(t * 0.7 + 1) * 0.8;
  const scale = interpolate(enter, [0, 1], [0.82, 1]) * (1 - out * 0.15);
  const opacity = Math.min(1, enter * 1.4) * (1 - out);
  const blur = interpolate(enter, [0, 0.6], [14, 0], theme.clamp) + out * 10;

  // Specular sheen: a band of light masked by the product's own alpha, crossing on entry then every 3 s.
  const since = frame - sec(S.reveal) - Math.round(fps * 0.7);
  const cyc = Math.round(fps * 3);
  const sweep = since < 0 ? -1 : interpolate(since % cyc, [0, fps * 1.1], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const img = staticFile(p.image);
  const mask: React.CSSProperties = { WebkitMaskImage: `url(${img})`, WebkitMaskSize: "100% 100%", maskImage: `url(${img})`, maskSize: "100% 100%" };

  // Halo behind the pack.
  const haloR = h * 0.62;
  const ticks = 72;
  return (
    <AbsoluteFill style={{ opacity }}>
      {/* back glow + halo ring */}
      <div style={{ position: "absolute", left: x - haloR * 1.3, top: y - haloR * 1.3, width: haloR * 2.6, height: haloR * 2.6, borderRadius: "50%", background: `radial-gradient(circle, ${p.accentSoft} 0%, ${p.accentSoft} 22%, transparent 64%)`, filter: "blur(30px)" }} />
      <svg width={haloR * 2.2} height={haloR * 2.2} style={{ position: "absolute", left: x - haloR * 1.1, top: y - haloR * 1.1, transform: `rotate(${t * 6}deg) scale(${interpolate(enter, [0, 1], [0.7, 1])})`, overflow: "visible" }}>
        <circle cx={haloR * 1.1} cy={haloR * 1.1} r={haloR} fill="none" stroke={p.accent} strokeOpacity={0.35} strokeWidth={1.5} />
        {Array.from({ length: ticks }).map((_, i) => {
          const ang = (TAU * i) / ticks;
          const len = i % 6 === 0 ? 18 : 7;
          const r0 = haloR * 1.04;
          return <line key={i} x1={haloR * 1.1 + Math.cos(ang) * r0} y1={haloR * 1.1 + Math.sin(ang) * r0} x2={haloR * 1.1 + Math.cos(ang) * (r0 + len)} y2={haloR * 1.1 + Math.sin(ang) * (r0 + len)} stroke={C.text} strokeOpacity={i % 6 === 0 ? 0.35 : 0.14} strokeWidth={1.4} />;
        })}
      </svg>
      {/* ripples on the "water table" under the pack */}
      {[0, 1, 2].map((i) => {
        const q = ((t / 2.4) + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", left: x - w * (0.4 + q * 0.9), top: y + h * 0.5 - h * 0.04 * (0.4 + q * 0.9), width: w * (0.8 + q * 1.8), height: h * 0.08 * (0.8 + q * 1.8), borderRadius: "50%", border: `1.5px solid ${p.accent}`, opacity: (1 - q) * 0.45 * enter }} />;
      })}
      <div style={{ position: "absolute", left: x - w * 0.6, top: y + h * 0.47, width: w * 1.2, height: h * 0.07, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)", filter: "blur(10px)" }} />
      {/* pack + reflection, in 3D */}
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 1800 }}>
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`, transformStyle: "preserve-3d", filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
          {/* reflection */}
          <div style={{ position: "absolute", left: 0, top: h * 0.995, width: w, height: h, transform: "scaleY(-1)", opacity: 0.22, WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 32%)", maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), transparent 32%)" }}>
            <Img src={img} style={{ width: w, height: h }} />
          </div>
          <Img src={img} style={{ position: "absolute", inset: 0, width: w, height: h, filter: `drop-shadow(0 30px 50px rgba(0,0,0,0.55)) drop-shadow(0 0 30px ${p.accentSoft})` }} />
          {/* rim light on the edges */}
          <div style={{ position: "absolute", inset: 0, ...mask, background: `linear-gradient(90deg, ${p.accentSoft}, transparent 18%, transparent 82%, rgba(255,255,255,0.18))`, mixBlendMode: "screen" }} />
          {sweep >= 0 && sweep < 1 && (
            <div style={{ position: "absolute", inset: 0, ...mask, mixBlendMode: "screen", background: `linear-gradient(105deg, transparent ${sweep * 160 - 40}%, rgba(255,255,255,0.65) ${sweep * 160 - 25}%, transparent ${sweep * 160 - 10}%)` }} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Accent sparks rising around the pack.
const Sparks: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, pick, sec } = useLayout();
  const S = React.useContext(BeatCtx);
  const on = interpolate(frame, [sec(S.reveal) + 6, sec(S.reveal) + fps], [0, 1], { ...theme.clamp, easing: theme.ease.out })
    * interpolate(frame, [sec(S.close) - 4, sec(S.close) + 8], [1, 0], theme.clamp);
  if (on <= 0) return null;
  const cx = pick(W / 2, W * 0.3);
  const spread = pick(W * 0.46, W * 0.24);
  const t = frame / (fps * 6);
  return (
    <AbsoluteFill style={{ opacity: on, mixBlendMode: "screen" }}>
      {Array.from({ length: 46 }).map((_, i) => {
        const sp = 1 + Math.floor(rand(i + 61) * 3);
        const q = (rand(i + 63) + t * sp) % 1;
        const x = cx + (rand(i + 65) - 0.5) * 2 * spread + Math.sin(TAU * (q * 2 + rand(i))) * 14;
        const y = H * (0.82 - q * 0.75);
        const s = 2 + rand(i + 67) * 5;
        const tw = 0.5 + 0.5 * Math.sin(TAU * (q * 4 + rand(i + 2)));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: i % 4 === 0 ? C.text : p.accent, boxShadow: `0 0 ${s * 3}px ${p.accent}`, opacity: Math.min(1, q * 5, (1 - q) * 5) * (0.35 + tw * 0.65) }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- Beat 2: name card next to / under the pack ----------
const fitSize = (name: string, max: number, room: number) => Math.min(max, room / (name.length * 0.7));

const Reveal: React.FC<{ p: AdProduct }> = ({ p }) => {
  const { W, H, fps, v, pick } = useLayout();
  const d = Math.round(fps * 0.9);
  const nameSize = fitSize(p.name, pick(176, 170), pick(900, 800));
  const box: React.CSSProperties = v
    ? { position: "absolute", left: 90, width: W - 180, top: H * 0.7, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }
    : { position: "absolute", left: W * 0.55, width: W * 0.4, top: H * 0.31 };
  return (
    <AbsoluteFill>
      <div style={box}>
        <Entrance delay={d} y={18}><div style={kickerStyle(p.accent, pick(30, 28))}>{p.kicker}</div></Entrance>
        <WordReveal delay={d + 5} per={5} text={p.name} style={{ ...serif, fontWeight: 800, fontSize: nameSize, marginTop: 18, justifyContent: v ? "center" : "flex-start", textShadow: `0 0 60px ${p.accentSoft}` }} />
        <Entrance delay={d + 14} y={14}>
          <div style={{ height: 2, width: 120, margin: "26px 0 26px", background: `linear-gradient(90deg, ${p.accent}, transparent)`, marginLeft: v ? "auto" : 0, marginRight: v ? "auto" : 0 }} />
        </Entrance>
        <Entrance delay={d + 18} y={18}>
          <div style={{ ...sans, fontWeight: 500, fontSize: pick(40, 38), lineHeight: 1.4, color: C.textDim, maxWidth: pick(860, 680), textWrap: "balance" } as React.CSSProperties}>{p.tagline}</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Beat 3: three benefits, big type, one at a time ----------
const Benefits: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useLayout();
  const starts = [0.45, 1.75, 3.05].map((s) => Math.round(s * fps));
  const active = starts.filter((s) => frame >= s).length - 1;
  const left = pick(90, W * 0.47);
  const width = pick(W - 180, W * 0.46);
  const rowGap = pick(46, 40);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left, width, top: pick(H * 0.47, H * 0.2) }}>
        <Entrance delay={4} y={16}><div style={kickerStyle(C.textDim, pick(28, 26))}>{`${p.name} · 3 công dụng chính`}</div></Entrance>
        <div style={{ display: "flex", flexDirection: "column", gap: rowGap, marginTop: pick(44, 40) }}>
          {p.benefits.map(([title, detail], i) => {
            const s = spring({ frame: frame - starts[i], fps, config: theme.spring.snappy });
            const isOn = i === active;
            const dim = interpolate(frame, [starts[i + 1] ?? 1e9, (starts[i + 1] ?? 1e9) + 8], [1, 0.55], { ...theme.clamp, easing: theme.ease.out });
            const bar = interpolate(frame, [starts[i] + 3, starts[i] + 18], [0, 1], { ...theme.clamp, easing: theme.ease.out });
            return (
              <div key={i} style={{ display: "flex", gap: pick(30, 28), alignItems: "flex-start", opacity: s * dim, transform: `translateX(${interpolate(s, [0, 1], [70, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`, transformOrigin: "left center" }}>
                <div style={{ ...serif, fontStyle: "italic", fontSize: pick(76, 64), lineHeight: 1, width: pick(96, 84), flexShrink: 0, color: isOn ? p.accent : C.textDim, textShadow: isOn ? `0 0 40px ${p.accent}` : "none" }}>{`0${i + 1}`}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...sans, fontWeight: 700, fontSize: pick(62, 54), lineHeight: 1.12, letterSpacing: "-0.01em" }}>{title}</div>
                  <div style={{ height: 3, width: `${bar * 100}%`, maxWidth: 160, background: p.accent, opacity: isOn ? 0.9 : 0.35, margin: "16px 0 14px", borderRadius: 2 }} />
                  <div style={{ ...sans, fontWeight: 400, fontSize: pick(36, 32), lineHeight: 1.35, color: C.textDim }}>{detail}</div>
                </div>
              </div>
            );
          })}
        </div>
        <Entrance delay={Math.round(fps * 4.3)} y={20} style={{ marginTop: pick(54, 48) }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: pick("18px 30px", "16px 28px"), borderRadius: 999, border: `1.5px solid ${p.accentSoft.replace(/0\.2\d?\)/, "0.6)")}`, background: "rgba(4,20,46,0.55)" }}>
            <span style={kickerStyle(p.accent, pick(24, 22))}>Liều dùng</span>
            <span style={{ ...sans, fontWeight: 500, fontSize: pick(32, 30) }}>{p.dose}</span>
          </div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Beat 4: brand close ----------
const Close: React.FC<{ p: AdProduct }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps, pick } = useLayout();
  const pop = spring({ frame: frame - 2, fps, config: theme.spring.bouncy });
  const turn = spring({ frame: frame - 2, fps, config: theme.spring.smooth });
  const size = pick(300, 230);
  const glint = interpolate(frame, [fps * 0.6, fps * 1.5], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const breathe = 1 + Math.sin(frame / (fps * 0.9)) * 0.012;
  const logo = staticFile("brand/logo-noben.svg");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: pick(-40, -10) }}>
        <div style={{ position: "relative", width: size, height: size, transform: `scale(${pop * breathe}) rotate(${interpolate(turn, [0, 1], [-90, 0])}deg)`, filter: `drop-shadow(0 0 ${size * 0.18}px ${C.glow})` }}>
          <Img src={logo} style={{ width: size, height: size }} />
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${logo})`, WebkitMaskSize: "100% 100%", maskImage: `url(${logo})`, maskSize: "100% 100%", mixBlendMode: "screen", background: `linear-gradient(115deg, transparent ${glint * 160 - 40}%, rgba(255,255,255,0.75) ${glint * 160 - 25}%, transparent ${glint * 160 - 10}%)` }} />
        </div>
        <Entrance delay={Math.round(fps * 0.45)} y={22}>
          <div style={{ ...kickerStyle(C.textDim, pick(28, 24)), marginTop: pick(46, 34), textAlign: "center" }}>{`${p.name} · ${p.kicker}`}</div>
        </Entrance>
        <Entrance delay={Math.round(fps * 0.65)} y={22}>
          <div style={{ ...sans, fontWeight: 600, fontSize: pick(38, 34), marginTop: 18, textAlign: "center" }}>Nhà máy ISO 9001:2015 · 22+ năm</div>
        </Entrance>
        <Entrance delay={Math.round(fps * 0.9)} y={26}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: pick(54, 38) }}>
            <div style={kickerStyle(C.textDim, pick(26, 22))}>Hotline tư vấn kỹ thuật</div>
            <div style={{ ...serif, fontWeight: 800, fontSize: pick(110, 96), color: C.primary, marginTop: 10, fontVariantNumeric: "lining-nums", textShadow: `0 0 50px ${C.glow}` }}>0934 246 420</div>
          </div>
        </Entrance>
        <Entrance delay={Math.round(fps * 1.15)} y={18}>
          <div style={{ ...sans, fontWeight: 600, fontSize: pick(34, 30), letterSpacing: "0.32em", marginTop: pick(34, 24), marginRight: "-0.32em" }}>THUYSANNOBEN.COM</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

export const ProductAd: React.FC<{ product: AdProduct; audio?: boolean }> = ({ product: p, audio = true }) => {
  const { sec, fps } = useLayout();
  const S = beatsFor(p);
  const L = sec(S.end);
  const beat = (a: number, b: number, el: React.ReactNode) => (
    <Sequence from={sec(a)} durationInFrames={sec(b) - sec(a)}>
      <Exit dur={sec(b) - sec(a)}>{el}</Exit>
    </Sequence>
  );
  return (
    <BeatCtx.Provider value={S}>
    <AbsoluteFill style={{ background: C.abyss, overflow: "hidden" }}>
      {/* 1 background */}
      <DeepWater loop={L} />
      <AccentWater p={p} />
      <GodRays loop={L} count={8} />
      <Surface loop={L} />
      <Plankton loop={L} count={90} />
      {/* 2 assets */}
      <Sparks p={p} />
      <Product p={p} />
      {/* 3 type */}
      {beat(S.hook, S.reveal, <Hook p={p} />)}
      {beat(S.reveal, S.benefits, <Reveal p={p} />)}
      {beat(S.benefits, S.close, <Benefits p={p} />)}
      <Sequence from={sec(S.close)}><Close p={p} /></Sequence>
      <LightSweep p={p} at={sec(S.reveal) - Math.round(fps * 0.35)} len={Math.round(fps * 0.8)} />
      <Bubbles loop={L} count={22} region={[0.02, 0.98]} />
      {/* 4 + 5 grade, grain, vignette */}
      <Finish />
      {audio && <Audio src={staticFile(p.piCut ? `sfx/${p.slug}.wav` : "sfx/ad-bed.wav")} />}
    </AbsoluteFill>
    </BeatCtx.Provider>
  );
};
