// FactoryFilm — the factory and team film (≈54 s, plus a 20 s cut), 16:9 for the web and 9:16 for social.
// Timing follows the site's phi/pi system: every scene lasts a multiple of pi seconds (timing.json),
// layouts split the frame at 1/phi. Real pictures come only from FACTORY_MEDIA (src/factory/media.ts);
// everything else is drawn line art or abstract water.
import React from "react";
import { AbsoluteFill, Audio, Composition, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Counter, Entrance, SceneExit, WordReveal } from "../components/Motion";
import { Bubbles, DeepWater, Finish, GodRays, Plankton, Surface } from "../components/Ocean";
import { Draw, IntakeArt, LineArt } from "../factory/LineArt";
import { Badge, LabArt, PACK_ORDER, PackIcon, VietnamMap } from "../factory/Vector";
import { FactoryMedia, slot } from "../factory/media";
import timing from "../factory/timing.json";
import { rand, TAU, theme } from "../theme";

const C = theme.colors;
const PHI = (1 + Math.sqrt(5)) / 2;
type Cut = "full" | "short";
type SceneKey = "intro" | "raw" | "formula" | "line" | "qc" | "reach" | "close";

export const factoryScenes = (cut: Cut, fps: number) => {
  let from = 0;
  return (timing[cut] as Array<[SceneKey, number]>).map(([key, units]) => {
    const dur = Math.round(units * Math.PI * fps);
    const s = { key, from, dur };
    from += dur;
    return s;
  });
};
const totalFrames = (cut: Cut, fps: number) => factoryScenes(cut, fps).reduce((a, s) => a + s.dur, 0);

// ---------- layout + type ----------
export const useL = () => {
  const { width: W, height: H, fps } = useVideoConfig();
  const v = H > W;
  return { W, H, fps, v, pick: <T,>(vert: T, land: T) => (v ? vert : land), sec: (s: number) => Math.round(s * fps) };
};
export const display: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 800, fontStretch: "88%", letterSpacing: "-0.02em", lineHeight: 1.04, color: C.text };
export const bodyStyle: React.CSSProperties = { fontFamily: theme.fonts.body, fontWeight: 400, color: C.textDim, lineHeight: 1.45 };
export const kickerStyle: React.CSSProperties = { fontFamily: theme.fonts.body, fontWeight: 600, letterSpacing: "0.26em", textTransform: "uppercase", color: C.accent };

// Text column: kicker (step number) → headline → body.
export const Copy: React.FC<{ n?: string; kicker: string; title: string; hero?: string[]; body?: string; width: number; size: number; style?: React.CSSProperties }> = ({ n, kicker, title, hero, body, width, size, style }) => {
  const { fps, v } = useL();
  return (
    <div style={{ position: "absolute", width, ...style }}>
      <Entrance delay={4} y={20}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, ...kickerStyle, fontSize: v ? 28 : 24 }}>
          {n && <span style={{ ...display, fontSize: v ? 34 : 30, letterSpacing: 0, color: C.accent }}>{n}</span>}
          {n && <span style={{ width: 54, height: 2, background: C.accent, opacity: 0.7 }} />}
          <span>{kicker}</span>
        </div>
      </Entrance>
      <WordReveal delay={10} per={3} text={title} hero={hero} style={{ ...display, fontSize: size, marginTop: v ? 26 : 22, columnGap: size * 0.24 }} />
      {body && (
        <Entrance delay={Math.round(fps * 0.9)} y={20}>
          <p style={{ ...bodyStyle, fontSize: v ? 36 : 30, marginTop: v ? 30 : 28, marginBottom: 0 }}>{body}</p>
        </Entrance>
      )}
    </div>
  );
};

// Ken Burns for photos, OffthreadVideo for clips — both crop to fill their box.
export const Media: React.FC<{ m: FactoryMedia; dur: number; seed?: number; zoom?: number }> = ({ m, dur, seed = 0, zoom = 0.08 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = interpolate(frame, [0, dur], [0, 1], { ...theme.clamp, easing: theme.ease.sine });
  const dir = rand(seed) > 0.5 ? 1 : -1;
  const [fx, fy] = m.focus ?? [0.5, 0.5];
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`,
    transform: `scale(${1.03 + zoom * k}) translate(${dir * (k - 0.5) * 2.2}%, ${(0.5 - k) * 1.2}%)`,
  };
  if (m.type === "video") return <OffthreadVideo src={staticFile(m.src)} muted startFrom={Math.round((m.startFrom ?? 0) * fps)} style={style} />;
  return <Img src={staticFile(m.src)} style={style} />;
};

// Glass frame: rounded, hairline border, brand tint, inner light — makes small photos look deliberate.
export const Glass: React.FC<{ x: number; y: number; w: number; h: number; delay?: number; rotate?: number; children: React.ReactNode; caption?: string; tint?: number }> = ({ x, y, w, h, delay = 0, rotate = 0, children, caption, tint = 0.18 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const bob = Math.sin((frame / fps) * (TAU / (PHI * 3)) + x) * 5;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [70, 0]) + bob}px) rotate(${rotate * p}deg) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
    }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, overflow: "hidden", background: C.bg, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(169,205,255,0.22)", clipPath: `inset(${(1 - p) * 40}% 0 0 0 round 28px)` }}>
        {children}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, rgba(63,208,216,${tint * 0.5}), transparent 40%, rgba(2,10,26,${tint * 2.2}))`, mixBlendMode: "normal" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 28, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)" }} />
      </div>
      {caption && (
        <div style={{ position: "absolute", left: 22, bottom: 20, padding: "9px 18px", borderRadius: 999, background: "rgba(2,10,26,0.62)", border: `1px solid ${C.line}`, backdropFilter: "blur(8px)", fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 21, color: C.text, opacity: interpolate(frame - delay, [fps * 0.6, fps * 1], [0, 1], theme.clamp) }}>{caption}</div>
      )}
    </div>
  );
};

// Faint engineering grid (golden spacing) for the factory feel.
export const Blueprint: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const step = Math.round(W / (PHI * PHI * PHI * 4));
  const shift = ((frame / fps) * 8) % step;
  return (
    <AbsoluteFill style={{ opacity: 0.55 * opacity, maskImage: "radial-gradient(ellipse at 60% 55%, black 20%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 60% 55%, black 20%, transparent 75%)" }}>
      <svg width={W} height={H}>
        {Array.from({ length: Math.ceil(W / step) + 2 }).map((_, i) => <line key={`v${i}`} x1={i * step - shift} y1={0} x2={i * step - shift} y2={H} stroke={C.line} strokeWidth={1} />)}
        {Array.from({ length: Math.ceil(H / step) + 2 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * step - shift * 0.6} x2={W} y2={i * step - shift * 0.6} stroke={C.line} strokeWidth={1} />)}
      </svg>
    </AbsoluteFill>
  );
};

// Diagonal light sweep: the cut between scenes.
export const Sweep: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const len = Math.round(fps * (Math.PI / 4));
  const k = interpolate(frame, [at - len / 2, at + len / 2], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  if (k <= 0 || k >= 1) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: -W * 0.6 + k * W * 2.2 - W * 0.2, top: -H * 0.2, width: W * 0.4, height: H * 1.4, transform: "skewX(-18deg)", opacity: Math.sin(Math.PI * k) * 0.9,
        background: `linear-gradient(90deg, transparent, ${C.accentSoft} 30%, rgba(255,255,255,0.4) 50%, ${C.accentSoft} 70%, transparent)`, filter: "blur(20px)",
      }} />
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: theme.spring.bouncy });
  const turn = spring({ frame, fps, config: theme.spring.smooth });
  const breathe = 1 + Math.sin((frame / fps) * (TAU / PHI / 2)) * 0.012;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {[0, 1, 2].map((i) => {
        const r = ((frame / fps) * 0.45 + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: size * (1 + r * 1.6), height: size * (1 + r * 1.6), marginLeft: -size * (1 + r * 1.6) / 2, marginTop: -size * (1 + r * 1.6) / 2, borderRadius: "50%", border: `2px solid ${C.accent}`, opacity: (1 - r) * 0.35 * pop }} />;
      })}
      <Img src={staticFile("brand/logo-noben.svg")} style={{ position: "absolute", inset: 0, width: size, height: size, transform: `scale(${pop * breathe}) rotate(${interpolate(turn, [0, 1], [-90, 0])}deg)`, filter: `drop-shadow(0 0 ${size * 0.22}px ${C.glow})` }} />
    </div>
  );
};

// ================= Scenes =================

const Intro: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, v } = useL();
  const bg = slot("intro")[0]; // optional real clip/photo behind the logo (e.g. the factory gate)
  const lineP = interpolate(frame, [fps * 0.9, fps * 1.8], [0, 1], { ...theme.clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {bg && <AbsoluteFill style={{ opacity: 0.32 }}><Media m={bg} dur={dur} /></AbsoluteFill>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: v ? -80 : -30 }}>
        <Logo size={v ? 250 : 200} />
        <WordReveal delay={Math.round(fps * 0.4)} per={4} text="NOBEN" style={{ ...display, fontSize: v ? 190 : 170, letterSpacing: "0.1em", marginTop: v ? 70 : 46, marginRight: "-0.1em" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: v ? 22 : 12 }}>
          <span style={{ width: 120 * lineP, height: 2, background: C.accent }} />
          <Entrance delay={Math.round(fps * 0.85)} y={16}><span style={{ ...kickerStyle, fontSize: v ? 36 : 32, letterSpacing: "0.32em", color: C.text }}>Từ năm 2002</span></Entrance>
          <span style={{ width: 120 * lineP, height: 2, background: C.accent }} />
        </div>
        <Entrance delay={Math.round(fps * 1.15)} y={18}>
          <div style={{ ...bodyStyle, fontSize: v ? 34 : 30, marginTop: v ? 30 : 24, textAlign: "center", maxWidth: v ? 860 : 1100 }}>{v ? "Nhà máy thuốc thủy sản · Củ Chi, TP.HCM" : "Nhà máy thuốc và chế phẩm thủy sản · Củ Chi, TP.HCM"}</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

export const Checklist: React.FC<{ items: string[]; delay: number; width: number; x: number; y: number }> = ({ items, delay, width, x, y }) => {
  const frame = useCurrentFrame();
  const { fps, v } = useL();
  return (
    <Entrance delay={delay} y={40} style={{ position: "absolute", left: x, top: y, width }}>
      <div style={{ padding: v ? "30px 34px" : "26px 30px", borderRadius: 26, background: "linear-gradient(160deg, rgba(29,90,143,0.42), rgba(4,20,46,0.7))", border: `1px solid ${C.line}`, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
        {items.map((it, i) => {
          const at = delay + Math.round(fps * 0.5) + i * Math.round(fps * 0.45);
          const p = interpolate(frame, [at, at + fps * 0.4], [0, 1], { ...theme.clamp, easing: theme.ease.out });
          return (
            <div key={it} style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <svg width={40} height={40} viewBox="0 0 40 40">
                <circle cx={20} cy={20} r={17} fill={p > 0.95 ? C.accent : "none"} stroke={C.accent} strokeWidth={2} />
                <Draw d="M12 20 L18 26 L29 14" p={p} color={p > 0.95 ? C.abyss : C.accent} w={3.5} />
              </svg>
              <span style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: v ? 32 : 27, color: p > 0.5 ? C.text : C.textDim }}>{it}</span>
            </div>
          );
        })}
      </div>
    </Entrance>
  );
};

const Raw: React.FC<{ dur: number }> = ({ dur }) => {
  const { W, H, fps, v, pick } = useL();
  const media = slot("raw");
  const artW = pick(W * 0.86, W * 0.5);
  return (
    <AbsoluteFill>
      <Copy n="01" kicker="Nguyên liệu đầu vào" title="Kiểm tra kỹ trước khi nhập kho" hero={["kỹ"]} width={pick(W * 0.84, W * 0.34)} size={pick(96, 84)}
        body="Chọn nhà cung cấp uy tín, kiểm tra nguyên liệu trước khi nhập kho sản xuất." style={{ left: pick(W * 0.08, W * 0.09), top: pick(H * 0.13, H * 0.2) }} />
      {media[0] && <Glass x={pick(W * 0.08, W * 0.47)} y={pick(H * 0.47, H * 0.12)} w={pick(W * 0.84, W * 0.46)} h={pick(W * 0.84 / 1.6, H * 0.5)} delay={8}><Media m={media[0]} dur={dur} /></Glass>}
      <div style={{ position: "absolute", left: pick(W * 0.07, W * 0.45), top: pick(H * 0.47, media[0] ? H * 0.5 : H * 0.3), opacity: media[0] ? 0.85 : 1 }}>
        <IntakeArt width={artW} delay={6} />
      </div>
      <Checklist items={["Nhà cung cấp uy tín", "Kiểm tra nguyên liệu", "Đạt chuẩn mới nhập kho"]} delay={Math.round(fps * 1.1)} width={pick(W * 0.7, W * 0.27)} x={pick(W * 0.15, W * 0.09)} y={pick(H * 0.72, H * 0.6)} />
    </AbsoluteFill>
  );
};

const Formula: React.FC<{ dur: number }> = ({ dur }) => {
  const { W, H, pick } = useL();
  const m = slot("formula")[0];
  return (
    <AbsoluteFill>
      <Copy n="02" kicker="Kỹ thuật và kiểm nghiệm" title="Công thức từ thực tế ao nuôi" hero={["ao", "nuôi"]} width={pick(W * 0.84, W * 0.34)} size={pick(96, 84)}
        body="Công thức được xây dựng và điều chỉnh từ thực tế ao nuôi của bà con." style={{ left: pick(W * 0.08, W * 0.09), top: pick(H * 0.12, H * 0.2) }} />
      {m && <Glass x={pick(W * 0.08, W * 0.46)} y={pick(H * 0.44, H * 0.1)} w={pick(W * 0.84, W * 0.46)} h={pick(W * 0.84 * 0.5625, W * 0.46 * 0.5625)} delay={8} caption={m.caption}><Media m={m} dur={dur} /></Glass>}
      <div style={{ position: "absolute", left: pick(W * 0.04, W * 0.42), top: pick(H * 0.5, m ? H * 0.5 : H * 0.28), opacity: m ? 0.85 : 1 }}>
        <LabArt width={pick(W * 0.92, W * 0.54)} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

const Line: React.FC<{ dur: number }> = ({ dur }) => {
  const { W, H, fps, v, pick } = useL();
  const media = slot("line");
  const lw = pick(W * 1.0, W * 0.88);
  return (
    <AbsoluteFill>
      <Copy n="03" kicker="Dây chuyền tự động hóa" title={v ? "Cân, trộn, đóng gói tự động" : "Cân, trộn, đóng gói trên dây chuyền tự động"} hero={["tự", "động"]}
        width={pick(W * 0.84, W * 0.62)} size={pick(96, 76)} style={{ left: pick(W * 0.08, W * 0.06), top: pick(H * 0.12, H * 0.09) }} />
      <Entrance delay={Math.round(fps * 0.9)} y={20} style={{ position: "absolute", left: pick(W * 0.08, W * 0.7), top: pick(H * 0.68, H * 0.115), width: pick(W * 0.84, W * 0.25) }}>
        <p style={{ ...bodyStyle, fontSize: pick(36, 27), margin: 0 }}>Hạn chế sai số định lượng, đồng đều từng mẻ, từng gói.</p>
      </Entrance>
      {media.slice(0, v ? 2 : 3).map((m, i) => (
        <Glass key={m.src} x={pick(W * 0.08 + i * W * 0.43, W * 0.06 + i * W * 0.3)} y={pick(H * 0.42, H * 0.36)} w={pick(W * 0.41, W * 0.28)} h={pick(W * 0.41 * 0.62, W * 0.28 * 0.56)} delay={10 + i * 5} caption={m.caption}><Media m={m} dur={dur} seed={i} /></Glass>
      ))}
      <div style={{ position: "absolute", left: (W - lw) / 2, top: pick(media.length ? H * 0.62 : H * 0.42, media.length ? H * 0.62 : H * 0.4) }}>
        <LineArt width={lw} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

const Qc: React.FC<{ dur: number }> = () => {
  const { W, H, fps, v, pick } = useL();
  const bs = pick(400, 400);
  return (
    <AbsoluteFill>
      <Copy n="04" kicker="Kiểm tra xuất xưởng" title="Đạt chuẩn mới được rời nhà máy" hero={["Đạt", "chuẩn"]} width={pick(W * 0.84, W * 0.355)} size={pick(96, 76)}
        body="Kiểm tra chất lượng theo hệ thống quản lý ISO 9001:2015. Thức ăn bổ sung được chứng nhận hợp quy VinaCert." style={{ left: pick(W * 0.08, W * 0.09), top: pick(H * 0.1, H * 0.17) }} />
      <div style={{ position: "absolute", left: pick(W * 0.08, W * 0.47), top: pick(H * 0.46, H * 0.24), display: "flex", flexDirection: "row", gap: v ? 40 : 70 }}>
        <Badge size={v ? 440 : bs} top="QUẢN LÝ CHẤT LƯỢNG · NHÀ MÁY NOBEN ·" big="ISO" sub="9001:2015" delay={Math.round(fps * 0.4)} />
        {!v && <Badge size={bs} top="CHỨNG NHẬN · THỨC ĂN BỔ SUNG ·" big="HỢP QUY" sub="VinaCert" delay={Math.round(fps * 0.75)} color={C.primary} />}
      </div>
      {v && <div style={{ position: "absolute", left: W * 0.42, top: H * 0.7 }}><Badge size={400} top="CHỨNG NHẬN · THỨC ĂN BỔ SUNG ·" big="HỢP QUY" sub="VinaCert" delay={Math.round(fps * 0.75)} color={C.primary} /></div>}
    </AbsoluteFill>
  );
};


const Reach: React.FC<{ dur: number }> = () => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: pick(W * 0.08, W * 0.09), top: pick(H * 0.08, H * 0.16), width: pick(W * 0.84, W * 0.42) }}>
        <Entrance delay={4} y={20}><div style={{ ...kickerStyle, fontSize: v ? 28 : 24 }}><span style={{ ...display, fontSize: v ? 34 : 30, letterSpacing: 0, color: C.accent, marginRight: 18 }}>05</span>Giao hàng toàn quốc</div></Entrance>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 10 }}>
          <span style={{ ...display, fontSize: v ? 220 : 210, color: C.primary, textShadow: `0 0 70px ${C.glow}`, lineHeight: 1 }}><Counter to={94} delay={8} /></span>
          <Entrance delay={14} y={20}><span style={{ ...display, fontSize: v ? 60 : 54 }}>sản phẩm</span></Entrance>
        </div>
        <Entrance delay={Math.round(fps * 0.6)} y={18}><p style={{ ...bodyStyle, fontSize: v ? 32 : 28, margin: "8px 0 0" }}>Từ nhà máy Củ Chi đến các vùng nuôi tôm, cá trên cả nước.</p></Entrance>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginTop: v ? 28 : 36 }}>
          {PACK_ORDER.slice(0, 5).map((k, i) => {
            const p = spring({ frame: frame - Math.round(fps * 0.8) - i * 4, fps, config: theme.spring.smooth });
            return <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}><PackIcon kind={k} h={v ? 120 : 130} tone={i} /></div>;
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: pick(W * 0.14, W * 0.5), top: pick(H * 0.42, H * 0.08) }}><VietnamMap height={pick(H * 0.5, H * 0.84)} delay={6} /></div>
    </AbsoluteFill>
  );
};


export const Close: React.FC<{ dur: number }> = () => {
  const { fps, v } = useL();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: v ? -40 : -20, width: v ? 940 : 1680 }}>
        <Logo size={v ? 170 : 130} />
        <WordReveal delay={Math.round(fps * 0.3)} per={3} text="Noben – Đồng hành cùng người nuôi tôm Việt" style={{ ...display, fontSize: v ? 84 : 72, marginTop: v ? 54 : 40, justifyContent: "center", textAlign: "center", columnGap: 20 }} />
        <Entrance delay={Math.round(fps * 0.9)} y={20}>
          <div style={{ display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", gap: v ? 10 : 36, marginTop: v ? 46 : 38 }}>
            <span style={{ ...kickerStyle, fontSize: v ? 28 : 24 }}>Hotline</span>
            <span style={{ ...display, fontSize: v ? 96 : 76, color: C.primary, letterSpacing: "0.01em", textShadow: `0 0 50px ${C.glow}` }}>0934 246 420</span>
          </div>
        </Entrance>
        <Entrance delay={Math.round(fps * 1.15)} y={18}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: v ? 40 : 32 }}>
            {["Đặt hàng", "Làm đại lý", "Gia công OEM"].map((t) => (
              <span key={t} style={{ padding: v ? "16px 30px" : "13px 26px", borderRadius: 999, border: `1.5px solid ${C.accent}`, background: "rgba(63,208,216,0.08)", fontFamily: theme.fonts.body, fontWeight: 600, fontSize: v ? 32 : 26, color: C.text }}>{t}</span>
            ))}
          </div>
        </Entrance>
        <Entrance delay={Math.round(fps * 1.45)} y={14}>
          <div style={{ ...kickerStyle, fontSize: v ? 34 : 28, letterSpacing: "0.3em", color: C.text, marginTop: v ? 50 : 40 }}>THUYSANNOBEN.COM</div>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

const SCENES: Record<SceneKey, React.FC<{ dur: number }>> = { intro: Intro, raw: Raw, formula: Formula, line: Line, qc: Qc, reach: Reach, close: Close };

export const FactoryFilm: React.FC<{ cut: Cut }> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const scenes = factoryScenes(cut, fps);
  const loop = D;
  // blueprint grid only while the factory scenes run
  const gridO = interpolate(frame, [scenes[1].from - 10, scenes[1].from + 20, scenes[scenes.length - 1].from - 10, scenes[scenes.length - 1].from + 10], [0, 1, 1, 0], theme.clamp);
  return (
    <AbsoluteFill style={{ background: C.abyss, overflow: "hidden" }}>
      <DeepWater loop={loop} />
      <Blueprint opacity={gridO} />
      <GodRays loop={loop} count={7} />
      <Surface loop={loop} />
      <Plankton loop={loop} count={70} />
      {scenes.map((s) => {
        const S = SCENES[s.key];
        return (
          <Sequence key={s.key} from={s.from} durationInFrames={s.dur} name={s.key}>
            <SceneExit duration={s.dur}><S dur={s.dur} /></SceneExit>
          </Sequence>
        );
      })}
      {scenes.slice(1).map((s) => <Sweep key={s.key} at={s.from} />)}
      <Bubbles loop={loop} count={14} region={[0.02, 0.98]} />
      <Audio src={staticFile(`sfx/factory-${cut}.wav`)} />
      <Finish />
    </AbsoluteFill>
  );
};

const withFonts = (cut: Cut) => () => (<><Fonts /><FactoryFilm cut={cut} /></>);

// Registered from Root.tsx with a single line.
export const FactoryCompositions: React.FC = () => (
  <>
    {/* ≈46 s factory film (16:9 web/YouTube, 9:16 Reels/TikTok) and a 20 s cut */}
    <Composition id="FactoryFilm" component={withFonts("full")} durationInFrames={totalFrames("full", 30)} fps={30} width={1920} height={1080} />
    <Composition id="FactoryFilmVertical" component={withFonts("full")} durationInFrames={totalFrames("full", 30)} fps={30} width={1080} height={1920} />
    <Composition id="FactoryFilm20" component={withFonts("short")} durationInFrames={totalFrames("short", 30)} fps={30} width={1920} height={1080} />
    <Composition id="FactoryFilm20Vertical" component={withFonts("short")} durationInFrames={totalFrames("short", 30)} fps={30} width={1080} height={1920} />
  </>
);
