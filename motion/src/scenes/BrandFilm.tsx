import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Counter, Entrance, SceneExit, useBreath, WordReveal } from "../components/Motion";
import { Bubbles, DeepWater, Finish, GodRays, Lattice, Plankton, Surface } from "../components/Ocean";
import { Shrimp } from "../components/Shrimp";
import { TAU, theme } from "../theme";

const display: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 800, fontStretch: "88%", letterSpacing: "-0.02em", lineHeight: 1.04, color: theme.colors.text };
const kicker: React.CSSProperties = { fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 26, letterSpacing: "0.28em", textTransform: "uppercase", color: theme.colors.accent };
const body: React.CSSProperties = { fontFamily: theme.fonts.body, fontWeight: 400, color: theme.colors.textDim };

// Scene timing (seconds) — converted with fps inside the component.
const S = { hook: [0, 4], process: [4, 9], proof: [9, 13.5], brand: [13.5, 18] } as const;

// ---- Scene A: the shrimp draws itself, headline lands ----
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const draw = interpolate(frame, [0, fps * 2.2], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  return (
    <AbsoluteFill>
      <Shrimp x={W * 0.6} y={H * 0.36 + Math.sin(frame / (fps * 0.9)) * 6} scale={1.75} rotate={-6} swim={(frame / (fps * 1.6)) % 1} draw={draw} strokeWidth={3} />
      <div style={{ position: "absolute", left: 140, top: H * 0.3, width: 860 }}>
        <Entrance delay={6}><div style={kicker}>Thủy sản Noben</div></Entrance>
        <WordReveal delay={12} per={4} text="Khoa học cho từng ao tôm" style={{ ...display, fontSize: 124, marginTop: 22 }} />
        <Entrance delay={34} y={24}><p style={{ ...body, fontSize: 34, marginTop: 30, lineHeight: 1.4 }}>Nhà sản xuất thuốc và chế phẩm thủy sản từ năm 2002 tại TP.HCM</p></Entrance>
      </div>
    </AbsoluteFill>
  );
};

// ---- Scene B: closed production process ----
const Icon: React.FC<{ kind: "leaf" | "gear" | "shield" | "truck"; p: number }> = ({ kind, p }) => {
  const s = { fill: "none", stroke: theme.colors.text, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p };
  const d: Record<string, string[]> = {
    leaf: ["M14 50 C14 22 34 10 56 10 C56 34 44 52 18 52 Z", "M14 52 L40 26"],
    gear: ["M34 18 a16 16 0 1 0 0.01 0", "M34 6 v8 M34 54 v8 M6 34 h8 M54 34 h8 M14 14 l6 6 M48 48 l6 6 M54 14 l-6 6 M20 48 l-6 6", "M34 28 a6 6 0 1 0 0.01 0"],
    shield: ["M34 6 L58 14 V32 C58 48 46 58 34 62 C22 58 10 48 10 32 V14 Z", "M22 34 L31 43 L47 25"],
    truck: ["M6 18 H40 V46 H6 Z", "M40 28 H52 L60 38 V46 H40", "M18 52 a6 6 0 1 0 0.01 0 M48 52 a6 6 0 1 0 0.01 0"],
  };
  return <svg width={68} height={68} viewBox="0 0 68 68">{d[kind].map((x, i) => <path key={i} d={x} {...s} />)}</svg>;
};

const Process: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W } = useVideoConfig();
  const steps: Array<[string, string, "leaf" | "gear" | "shield" | "truck"]> = [
    ["01", "Chọn lọc nguyên liệu đầu vào", "leaf"],
    ["02", "Sản xuất trên dây chuyền tự động", "gear"],
    ["03", "Kiểm soát chất lượng theo ISO 9001:2015", "shield"],
    ["04", "Giao hàng và hỗ trợ kỹ thuật tận ao", "truck"],
  ];
  const line = interpolate(frame, [fps * 0.6, fps * 2.6], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  const active = Math.min(3, Math.floor(interpolate(frame, [fps * 0.8, fps * 3.4], [0, 3.99], theme.clamp)));
  const cardW = 340, gap = 44, total = cardW * 4 + gap * 3, left = (W - total) / 2;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left, top: 170, width: total }}>
        <Entrance><div style={kicker}>Kiểm soát chất lượng</div></Entrance>
        <WordReveal delay={6} text="Quy trình sản xuất khép kín" hero={["khép", "kín"]} style={{ ...display, fontSize: 92, marginTop: 18 }} />
      </div>
      {/* connector line drawing across the cards */}
      <div style={{ position: "absolute", left: left + 47, top: 432, height: 2, width: 3 * (cardW + gap) * line, background: `linear-gradient(90deg, ${theme.colors.accent}, rgba(63,208,216,0.25))` }} />
      {steps.map((_, i) => {
        const on = interpolate(line, [i / 3 - 0.02, i / 3 + 0.02], [0, 1], theme.clamp);
        return <div key={`dot${i}`} style={{ position: "absolute", left: left + i * (cardW + gap) + 40, top: 425, width: 16, height: 16, borderRadius: 8, background: theme.colors.accent, opacity: on, transform: `scale(${0.4 + 0.6 * on})`, boxShadow: `0 0 18px ${theme.colors.accent}` }} />;
      })}
      {steps.map(([n, label, icon], i) => {
        const delay = Math.round(fps * 0.5) + i * 5;
        const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
        const iconP = interpolate(frame, [delay + 6, delay + fps], [0, 1], { ...theme.clamp, easing: theme.ease.out });
        const isActive = i === active;
        return (
          <div key={n} style={{
            position: "absolute", left: left + i * (cardW + gap), top: 470, width: cardW, height: 330, borderRadius: 26,
            background: "linear-gradient(160deg, rgba(29,90,143,0.38), rgba(4,20,46,0.55))", border: `1px solid ${theme.colors.line}`,
            boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)", padding: 34, boxSizing: "border-box",
            opacity: p, transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
          }}>
            <span style={{ ...display, fontSize: 30, color: isActive ? theme.colors.accent : theme.colors.textDim }}>{n}</span>
            <div style={{ marginTop: 34 }}><Icon kind={icon} p={iconP} /></div>
            <div style={{ ...display, fontSize: 36, lineHeight: 1.15, marginTop: 24, fontWeight: 700 }}>{label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- Scene C: proof — numbers and certifications ----
const Proof: React.FC = () => {
  const { fps, width: W } = useVideoConfig();
  const breathe = useBreath(3, 0.01);
  const items: Array<[React.ReactNode, string]> = [
    [<Counter key="y" to={22} suffix="+" delay={Math.round(fps * 0.4)} />, "năm sản xuất thuốc thủy sản"],
    [<Counter key="p" to={94} delay={Math.round(fps * 0.55)} />, "sản phẩm cho ao tôm, cá"],
    ["ISO", "nhà máy đạt chuẩn ISO 9001:2015"],
    ["Hợp quy", "thức ăn bổ sung chứng nhận VinaCert"],
  ];
  const colW = 380, total = colW * 4, left = (W - total) / 2;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left, top: 200, width: total }}>
        <Entrance><div style={kicker}>Chứng nhận đầy đủ</div></Entrance>
        <WordReveal delay={6} text="Bà con an tâm từ nhà máy đến ao nuôi" style={{ ...display, fontSize: 76, marginTop: 18, maxWidth: total }} />
      </div>
      {items.map(([big, small], i) => (
        <Entrance key={i} delay={Math.round(fps * 0.35) + i * 5} y={50} style={{ position: "absolute", left: left + i * colW, top: 560, width: colW - 40 }}>
          <div style={{ transform: `scale(${breathe})`, transformOrigin: "left center" }}>
            <div style={{ ...display, height: 128, display: "flex", alignItems: "flex-end", fontSize: typeof big === "string" ? 100 : 118, whiteSpace: "nowrap", color: i === 0 ? theme.colors.primary : theme.colors.text, textShadow: i === 0 ? `0 0 60px ${theme.colors.glow}` : "none" }}>{big}</div>
            <div style={{ height: 2, width: 90, background: theme.colors.accent, margin: "22px 0 20px", opacity: 0.8 }} />
            <div style={{ ...body, fontSize: 30, lineHeight: 1.35 }}>{small}</div>
          </div>
        </Entrance>
      ))}
    </AbsoluteFill>
  );
};

// ---- Scene D: brand sign-off ----
const Mark: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: theme.spring.bouncy });
  const turn = spring({ frame, fps, config: theme.spring.smooth });
  const rays = 12;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${pop}) rotate(${interpolate(turn, [0, 1], [-120, 0])}deg)`, filter: `drop-shadow(0 0 ${size * 0.25}px ${theme.colors.glow})` }}>
      {Array.from({ length: rays }).map((_, i) => {
        const p = spring({ frame: frame - 6 - i * 1.2, fps, config: theme.spring.snappy });
        return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: size * 0.03, height: size * 0.32 * p, background: theme.colors.accent, opacity: 0.7, borderRadius: size, transformOrigin: "50% 0%", transform: `translateX(-50%) rotate(${(360 / rays) * i}deg) translateY(${size * 0.36}px)` }} />;
      })}
      <div style={{ position: "absolute", inset: size * 0.24, background: theme.colors.primary, transform: "rotate(45deg)", borderRadius: size * 0.06 }} />
      <div style={{ position: "absolute", inset: size * 0.34, background: theme.colors.bgAlt, transform: "rotate(45deg)", borderRadius: size * 0.03 }} />
    </div>
  );
};

const Brand: React.FC = () => {
  const { fps, width: W, height: H } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -40 }}>
        <Mark size={190} />
        <WordReveal delay={Math.round(fps * 0.45)} per={4} text="NOBEN" style={{ ...display, fontSize: 168, letterSpacing: "0.08em", marginTop: 36 }} />
        <Entrance delay={Math.round(fps * 0.9)} y={26}><div style={{ ...body, fontSize: 40, color: theme.colors.text, marginTop: 14 }}>Đồng hành cùng người nuôi tôm Việt</div></Entrance>
        <Entrance delay={Math.round(fps * 1.2)} y={20}><div style={{ ...kicker, fontSize: 26, marginTop: 34, letterSpacing: "0.16em" }}>Hotline 0934 246 420 · thuysannoben.vn</div></Entrance>
      </div>
      <div style={{ position: "absolute", width: W, height: H, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const BrandFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const sec = (s: number) => Math.round(s * fps);
  const t = frame / fps;
  // After the hook, the shrimp keeps swimming in the background, dimmed (the hero color moves to the copy).
  const bgShrimpO = interpolate(frame, [sec(S.process[0]) - 6, sec(S.process[0]) + 10], [0, 0.22], theme.clamp);
  return (
    <AbsoluteFill style={{ background: theme.colors.abyss, overflow: "hidden" }}>
      <DeepWater loop={sec(18)} />
      <GodRays loop={sec(18)} count={9} />
      <Surface loop={sec(18)} />
      <Lattice loop={sec(18)} x={W * 0.62} y={H * 0.58} cols={9} rows={4} size={44} opacity={0.6} />
      <Plankton loop={sec(18)} count={120} />
      <Shrimp x={W * (1.1 - ((t / 18) % 1) * 0.5)} y={H * 0.22} scale={1.2} rotate={-8} swim={(t / 1.8) % 1} color={theme.colors.accent} glow={false} opacity={bgShrimpO} blur={1.2} />
      <Sequence from={sec(S.hook[0])} durationInFrames={sec(S.hook[1] - S.hook[0])}><SceneExit duration={sec(S.hook[1] - S.hook[0])}><Hook /></SceneExit></Sequence>
      <Sequence from={sec(S.process[0])} durationInFrames={sec(S.process[1] - S.process[0])}><SceneExit duration={sec(S.process[1] - S.process[0])}><Process /></SceneExit></Sequence>
      <Sequence from={sec(S.proof[0])} durationInFrames={sec(S.proof[1] - S.proof[0])}><SceneExit duration={sec(S.proof[1] - S.proof[0])}><Proof /></SceneExit></Sequence>
      <Sequence from={sec(S.brand[0])} durationInFrames={sec(S.brand[1] - S.brand[0])}><SceneExit duration={sec(S.brand[1] - S.brand[0])}><Brand /></SceneExit></Sequence>
      <Bubbles loop={sec(18)} count={34} region={[0.02, 0.98]} />
      <Finish />
    </AbsoluteFill>
  );
};

export const FILM_SECONDS = 18;
export const unused = TAU;
