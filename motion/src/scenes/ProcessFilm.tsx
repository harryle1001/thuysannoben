// ProcessFilm — "Một gói thuốc Noben được làm ra như thế nào": the production process told to shrimp and fish farmers.
// Four control points: raw-material intake → safe production → closed packing → final inspection, then delivery.
// ≈49 s (15.5π s), 16:9 for the web/YouTube plus a 9:16 version. Real pictures: product photos and certificates only;
// the plant itself is line art until real factory clips are added to FACTORY_MEDIA.
import React from "react";
import { AbsoluteFill, Audio, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Entrance, SceneExit, WordReveal } from "../components/Motion";
import { Bubbles, DeepWater, Finish, GodRays, Plankton, Surface } from "../components/Ocean";
import { IntakeArt, LineArt } from "../factory/LineArt";
import { FACTORY_PRODUCTS, slot } from "../factory/media";
import { DeliverArt, OutQCArt, SafetyGlyph, SealArt } from "../factory/ProcessArt";
import { HarvestStage } from "../factory/Harvest";
import timing from "../factory/timing.json";
import { theme } from "../theme";
import { Blueprint, bodyStyle, Checklist, Close, Copy, display, Glass, kickerStyle, Logo, Media, Sweep, useL } from "./FactoryFilm";

const C = theme.colors;
type Key = "hook" | "intake" | "produce" | "pack" | "outqc" | "deliver" | "harvest" | "close";
type Cut = "process" | "harvest";

const scenesFor = (fps: number, cut: Cut = "process") => {
  let from = 0;
  return (timing[cut] as Array<[Key, number]>).map(([key, u]) => {
    const dur = Math.round(u * Math.PI * fps);
    const s = { key, from, dur };
    from += dur;
    return s;
  });
};
const total = (fps: number, cut: Cut = "process") => scenesFor(fps, cut).reduce((a, s) => a + s.dur, 0);

const STEPS = ["Nguyên liệu kiểm tra chặt chẽ", "Sản xuất chuyên nghiệp, an toàn", "Đóng gói khép kín", "Kiểm tra đầu ra nghiêm ngặt"];

// Chip row (icon + label) used for the safety and label points.
const Chips: React.FC<{ items: Array<[React.ReactNode, string]>; delay: number; style: React.CSSProperties; column?: boolean }> = ({ items, delay, style, column }) => {
  const { v } = useL();
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: column ? "column" : "row", flexWrap: "wrap", gap: 14, ...style }}>
      {items.map(([icon, label], i) => (
        <Entrance key={label} delay={delay + i * 5} y={22}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 22px 12px 14px", borderRadius: 18, background: "linear-gradient(160deg, rgba(29,90,143,0.42), rgba(4,20,46,0.75))", border: `1px solid ${C.line}` }}>
            {icon}
            <span style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: v ? 30 : 25, color: C.text }}>{label}</span>
          </div>
        </Entrance>
      ))}
    </div>
  );
};

// ---------- 0 · Hook: to the farmers, the four control points ----------
const Hook: React.FC<{ dur: number }> = () => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const line = interpolate(frame, [fps * 1.6, fps * 3], [0, 1], { ...theme.clamp, easing: theme.ease.inOut });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: pick(W * 0.08, W * 0.09), top: pick(H * 0.16, H * 0.17), width: pick(W * 0.84, W * 0.75) }}>
        <div style={{ display: "flex", alignItems: "center", gap: v ? 40 : 34 }}>
          <Logo size={v ? 96 : 80} />
          <Entrance delay={6} y={16}><span style={{ ...kickerStyle, fontSize: v ? 30 : 26 }}>Gửi bà con nuôi tôm, cá</span></Entrance>
        </div>
        <WordReveal delay={12} per={3} text="Một gói thuốc Noben được làm ra như thế nào?" hero={["Noben"]} style={{ ...display, fontSize: v ? 104 : 96, marginTop: v ? 44 : 36, columnGap: 24 }} />
      </div>
      {/* the four control points, joined by a line */}
      <div style={{ position: "absolute", left: pick(W * 0.08, W * 0.09), top: pick(H * 0.56, H * 0.62), width: pick(W * 0.84, W * 0.82), display: "flex", flexDirection: v ? "column" : "row", gap: v ? 22 : 18 }}>
        {!v && <div style={{ position: "absolute", left: 30, right: 30, top: 30, height: 2, background: C.accent, opacity: 0.5, transform: `scaleX(${line})`, transformOrigin: "0 50%" }} />}
        {STEPS.map((s, i) => {
          const p = spring({ frame: frame - Math.round(fps * 1.4) - i * 7, fps, config: theme.spring.smooth });
          return (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: v ? "row" : "column", alignItems: v ? "center" : "flex-start", gap: v ? 24 : 18, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
              <div style={{ width: 60, height: 60, flex: "none", borderRadius: 30, background: C.bg, border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", ...display, fontSize: 28, color: C.accent, position: "relative" }}>{i + 1}</div>
              <div style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: v ? 36 : 28, color: C.text, lineHeight: 1.3 }}>{s}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 1 · Intake ----------
const Intake: React.FC<{ dur: number }> = ({ dur }) => {
  const { W, H, fps, pick } = useL();
  const m = slot("raw")[0];
  return (
    <AbsoluteFill>
      <Copy n="01" kicker="Nguyên liệu đầu vào" title="Kiểm tra chặt chẽ trước khi nhập kho" hero={["chặt", "chẽ"]} width={pick(W * 0.84, W * 0.36)} size={pick(96, 82)}
        body="Chọn nhà cung cấp uy tín. Nguyên liệu được kiểm tra trước khi đưa vào kho sản xuất." style={{ left: pick(W * 0.08, W * 0.09), top: pick(H * 0.1, H * 0.15) }} />
      {m && <Glass x={pick(W * 0.08, W * 0.5)} y={pick(H * 0.45, H * 0.1)} w={pick(W * 0.84, W * 0.44)} h={pick(W * 0.84 * 0.5625, W * 0.44 * 0.5625)} delay={8} caption={m.caption}><Media m={m} dur={dur} /></Glass>}
      <div style={{ position: "absolute", left: pick(W * 0.06, W * 0.47), top: pick(H * 0.47, m ? H * 0.52 : H * 0.22) }}><IntakeArt width={pick(W * 0.88, W * 0.48)} delay={6} /></div>
      <Checklist items={["Nhà cung cấp uy tín", "Kiểm tra nguyên liệu", "Đạt mới nhập kho sản xuất"]} delay={Math.round(fps * 1)} width={pick(W * 0.72, W * 0.3)} x={pick(W * 0.14, W * 0.09)} y={pick(H * 0.72, H * 0.6)} />
    </AbsoluteFill>
  );
};

// ---------- 2 · Safe, professional production ----------
const Produce: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const media = slot("line");
  const g = (k: number) => interpolate(frame, [fps * (1.2 + k * 0.15), fps * (2 + k * 0.15)], [0, 1], theme.clamp);
  return (
    <AbsoluteFill>
      <Copy n="02" kicker="Sản xuất tại nhà máy" title="Chuyên nghiệp, an toàn, đúng quy trình" hero={["an", "toàn,"]} width={pick(W * 0.84, W * 0.62)} size={pick(92, 76)}
        style={{ left: pick(W * 0.08, W * 0.06), top: pick(H * 0.09, H * 0.08) }} />
      <Chips delay={Math.round(fps * 1.1)} column={v} style={{ left: pick(W * 0.08, W * 0.06), top: pick(H * 0.3, H * 0.3) }} items={[
        [<SafetyGlyph key="h" kind="helmet" size={46} p={g(0)} />, "Bảo hộ khi sản xuất"],
        [<SafetyGlyph key="s" kind="spark" size={46} p={g(1)} />, "Nhà xưởng sạch, gọn"],
        [<SafetyGlyph key="i" kind="iso" size={46} p={g(2)} />, "Theo ISO 9001:2015"],
      ]} />
      {media.slice(0, 2).map((m, i) => (
        <Glass key={m.src} x={pick(W * 0.08 + i * W * 0.43, W * 0.62 + i * 0)} y={pick(H * 0.5, H * 0.08 + i * H * 0.0)} w={pick(W * 0.41, W * 0.32)} h={pick(W * 0.41 * 0.5625, W * 0.32 * 0.5625)} delay={10 + i * 5} caption={m.caption}><Media m={m} dur={dur} seed={i} /></Glass>
      ))}
      <div style={{ position: "absolute", left: pick(0, W * 0.06), top: pick(H * 0.56, H * 0.44) }}>
        <LineArt width={pick(W, W * 0.88)} products={FACTORY_PRODUCTS} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3 · Closed packing + full label ----------
const LABEL = ["Thành phần", "Công dụng", "Liều dùng", "Ngày sản xuất", "Hạn sử dụng"];
const Pack: React.FC<{ dur: number }> = () => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const shown = FACTORY_PRODUCTS.slice(0, 3);
  return (
    <AbsoluteFill>
      <Copy n="03" kicker="Đóng gói" title="Đóng gói khép kín, nhãn ghi đầy đủ" hero={["khép", "kín,"]} width={pick(W * 0.84, W * 0.36)} size={pick(92, 80)}
        body="Sản phẩm được đóng gói kín trên dây chuyền. Bao bì ghi rõ thông tin để bà con dùng đúng." style={{ left: pick(W * 0.08, W * 0.09), top: pick(H * 0.08, H * 0.13) }} />
      <div style={{ position: "absolute", left: pick(W * 0.04, W * 0.42), top: pick(H * 0.42, H * 0.08) }}><SealArt width={pick(W * 0.5, W * 0.3)} delay={4} /></div>
      {/* label card: the fields printed on every Noben pack */}
      <Entrance delay={Math.round(fps * 0.8)} y={40} style={{ position: "absolute", left: pick(W * 0.52, W * 0.73), top: pick(H * 0.45, H * 0.26), width: pick(W * 0.44, W * 0.21) }}>
        <div style={{ padding: v ? "28px 28px" : "26px 28px", borderRadius: 22, background: "#f5f3ee", color: "#0b2347", boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8)" }}>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 700, fontSize: v ? 24 : 20, letterSpacing: "0.18em", textTransform: "uppercase", color: "#1d5a8f" }}>Nhãn sản phẩm</div>
          {LABEL.map((l, i) => {
            const at = Math.round(fps * 1.2) + i * Math.round(fps * 0.32);
            const p = interpolate(frame, [at, at + fps * 0.3], [0, 1], { ...theme.clamp, easing: theme.ease.out });
            return (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid rgba(11,35,71,0.14)", opacity: 0.35 + 0.65 * p }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, flex: "none", background: p > 0.9 ? "#1d5a8f" : "transparent", border: "2px solid #1d5a8f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={16} height={16} viewBox="0 0 16 16"><path d="M3 8 L7 12 L13 4" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={p > 0.9 ? 1 : 0} /></svg>
                </div>
                <span style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: v ? 30 : 23 }}>{l}</span>
                <span style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(11,35,71,0.12)", transform: `scaleX(${p})`, transformOrigin: "0 50%" }} />
              </div>
            );
          })}
        </div>
      </Entrance>
      {/* real packs land under the label */}
      <div style={{ position: "absolute", left: pick(W * 0.53, W * 0.09), top: pick(H * 0.79, H * 0.62), display: "flex", gap: 10, alignItems: "flex-end" }}>
        {shown.map((src, i) => {
          const p = spring({ frame: frame - Math.round(fps * 2.6) - i * 5, fps, config: theme.spring.smooth });
          return <Img key={src} src={staticFile(src)} style={{ height: pick(200, 190), opacity: p, transform: `translateY(${(1 - p) * 60}px)`, filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.55))" }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4 · Final inspection ----------
const OutQc: React.FC<{ dur: number }> = () => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const certs = slot("qc").slice(0, 2);
  return (
    <AbsoluteFill>
      <Copy n="04" kicker="Kiểm tra đầu ra" title="Đạt chuẩn mới được xuất xưởng" hero={["Đạt", "chuẩn"]} width={pick(W * 0.84, W * 0.5)} size={pick(92, 80)}
        body="Thành phẩm được kiểm tra chất lượng theo hệ thống quản lý ISO 9001:2015 trước khi giao đi." style={{ left: pick(W * 0.08, W * 0.06), top: pick(H * 0.08, H * 0.08) }} />
      {certs.map((m, i) => {
        const p = spring({ frame: frame - Math.round(fps * 0.6) - i * 6, fps, config: theme.spring.smooth });
        const w = pick(200, 190), h = w * 1.3;
        return (
          <div key={m.src} style={{ position: "absolute", left: pick(W * 0.56 + i * (w + 24), W * 0.66 + i * (w + 30)), top: pick(H * 0.3, H * 0.07), width: w, height: h, borderRadius: 10, overflow: "hidden", background: "#f5f3ee", opacity: p, transform: `translateY(${(1 - p) * 50}px) rotate(${(i ? 4 : -4) * p}deg)`, boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}>
            <Img src={staticFile(m.src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        );
      })}
      {!v && <Entrance delay={Math.round(fps * 1.2)} y={16} style={{ position: "absolute", left: W * 0.66, top: H * 0.07 + 190 * 1.3 + 24 }}><span style={{ ...bodyStyle, fontSize: 22 }}>ISO 9001:2015 · Hợp quy VinaCert</span></Entrance>}
      <div style={{ position: "absolute", left: pick(0, W * 0.05), top: pick(H * 0.55, H * 0.46) }}><OutQCArt width={pick(W, W * 0.9)} products={FACTORY_PRODUCTS} delay={8} /></div>
    </AbsoluteFill>
  );
};

// ---------- 5 · To the farmers' ponds ----------
const Deliver: React.FC<{ dur: number }> = () => {
  const { W, H, fps, v, pick } = useL();
  return (
    <AbsoluteFill>
      <Copy kicker="Đến tay bà con" title="Giao hàng toàn quốc, kỹ thuật viên theo sát ao nuôi" hero={["theo", "sát"]} width={pick(W * 0.84, W * 0.7)} size={pick(88, 76)}
        style={{ left: pick(W * 0.08, W * 0.06), top: pick(H * 0.1, H * 0.09) }} />
      <Entrance delay={Math.round(fps * 0.9)} y={18} style={{ position: "absolute", left: pick(W * 0.08, W * 0.06), top: pick(H * 0.36, H * 0.33), width: pick(W * 0.84, W * 0.6) }}>
        <p style={{ ...bodyStyle, fontSize: v ? 34 : 28, margin: 0 }}>Kỹ thuật viên Noben hỗ trợ miễn phí suốt vụ nuôi. Ao gặp ca khó, bà con gọi ngay.</p>
      </Entrance>
      <div style={{ position: "absolute", left: pick(W * 0.02, W * 0.08), top: pick(H * 0.52, H * 0.45) }}><DeliverArt width={pick(W * 0.96, W * 0.84)} delay={6} /></div>
    </AbsoluteFill>
  );
};


// ---------- 5 · Harvest: the illustrated, hopeful ending ----------
const Harvest: React.FC<{ dur: number }> = () => {
  const frame = useCurrentFrame();
  const { W, H, fps, v, pick } = useL();
  const sec = frame / fps;
  const shadow = "0 2px 24px rgba(20,8,30,0.55)";
  const a = interpolate(sec, [0.4, 1.0, 4.0, 4.5], [0, 1, 1, 0], theme.clamp);
  return (
    <AbsoluteFill>
      <HarvestStage />
      <div style={{ position: "absolute", left: pick(W * 0.08, W * 0.06), top: pick(H * 0.07, H * 0.08), width: pick(W * 0.84, W * 0.5), opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
        <div style={{ ...kickerStyle, color: "#ffe3a0", fontSize: v ? 28 : 24, textShadow: shadow }}>Đến tay bà con</div>
        <div style={{ ...display, fontSize: v ? 84 : 70, marginTop: 14, textShadow: shadow }}>Giao tận ao, đồng hành suốt vụ nuôi</div>
      </div>
      <Sequence from={Math.round(fps * 10.8)} layout="none">
        <div style={{ position: "absolute", left: 0, right: 0, top: pick(H * 0.08, H * 0.09), display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 60px" }}>
          <WordReveal per={4} text="Niềm vui ngày thu hoạch" hero={["thu", "hoạch"]} style={{ ...display, fontSize: v ? 104 : 96, justifyContent: "center", columnGap: 24, textShadow: shadow }} />
          <Entrance delay={Math.round(fps * 0.6)} y={16}><p style={{ ...bodyStyle, color: "#fff3dc", fontSize: v ? 34 : 30, margin: "18px 0 0", textShadow: shadow }}>Kỹ thuật viên Noben hỗ trợ miễn phí suốt vụ nuôi.</p></Entrance>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const SCENES: Record<Key, React.FC<{ dur: number }>> = { hook: Hook, intake: Intake, produce: Produce, pack: Pack, outqc: OutQc, deliver: Deliver, harvest: Harvest, close: Close };

export const ProcessFilm: React.FC<{ cut?: Cut }> = ({ cut = "process" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const scenes = scenesFor(fps, cut);
  const last = scenes[scenes.length - 1];
  const hv = scenes.find((s) => s.key === "harvest");
  const gridEnd = hv ? hv.from : last.from;
  const gridO = cut === "harvest" ? 0 : interpolate(frame, [scenes[1].from - 10, scenes[1].from + 20, gridEnd - 10, gridEnd + 10], [0, 1, 1, 0], theme.clamp);
  return (
    <AbsoluteFill style={{ background: C.abyss, overflow: "hidden" }}>
      <DeepWater loop={D} />
      <Blueprint opacity={gridO} />
      <GodRays loop={D} count={7} />
      <Surface loop={D} />
      <Plankton loop={D} count={70} />
      {scenes.map((s) => {
        const S = SCENES[s.key];
        return (
          <Sequence key={s.key} from={s.from} durationInFrames={s.dur} name={s.key}>
            <SceneExit duration={s.dur}><S dur={s.dur} /></SceneExit>
          </Sequence>
        );
      })}
      {scenes.slice(1).map((s) => <Sweep key={s.key} at={s.from} />)}
      <Bubbles loop={D} count={14} region={[0.02, 0.98]} />
      <Audio src={staticFile(`sfx/factory-${cut}.wav`)} />
      <Finish />
    </AbsoluteFill>
  );
};

const withFonts = () => (<><Fonts /><ProcessFilm /></>);
const withFontsHarvest = () => (<><Fonts /><ProcessFilm cut="harvest" /></>);

export const ProcessCompositions: React.FC = () => (
  <>
    {/* ≈55 s production-process film for farmers: 16:9 web/YouTube + 9:16 */}
    <Composition id="ProcessFilm" component={withFonts} durationInFrames={total(30)} fps={30} width={1920} height={1080} />
    <Composition id="ProcessFilmVertical" component={withFonts} durationInFrames={total(30)} fps={30} width={1080} height={1920} />
    {/* ≈19 s illustrated harvest ending as a stand-alone clip */}
    <Composition id="HarvestFilm" component={withFontsHarvest} durationInFrames={total(30, "harvest")} fps={30} width={1920} height={1080} />
    <Composition id="HarvestFilmVertical" component={withFontsHarvest} durationInFrames={total(30, "harvest")} fps={30} width={1080} height={1920} />
  </>
);
