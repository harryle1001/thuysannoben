// Dealer-recruitment film (9:16 and 16:9). Light, label-like look: paper white, navy type, one colour spine per scene.
// Layout numbers follow φ: margins and gaps step by 1.618, the photo card is 1.618 : 1.
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Counter, Entrance, SceneExit, WordReveal } from "../components/Motion";
import { PHI, theme } from "../theme";

const L = theme.light;
const FPS = 30;
// seconds per scene
export const DEALER_SCENES = [3.4, 3.8, 4.0, 4.0, 4.0, 3.8, 4.4];
export const DEALER_SECONDS = DEALER_SCENES.reduce((a, b) => a + b, 0);
const starts = DEALER_SCENES.map((_, i) => DEALER_SCENES.slice(0, i).reduce((a, b) => a + b, 0));

const useDims = () => {
  const { width, height } = useVideoConfig();
  const wide = width > height;
  const u = (wide ? height : width) / 1080; // design unit
  return { width, height, wide, u, M: (wide ? 120 : 96) * u, spine: 34 * u };
};

const body: React.CSSProperties = { fontFamily: theme.fonts.body, color: L.ink };

// 1 · background: paper + two slow washes
const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: L.paper }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at ${68 + Math.sin(t / 3) * 6}% ${22 + Math.cos(t / 4) * 4}%, ${L.wash}, transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at ${24 + Math.cos(t / 3.5) * 6}% ${82 + Math.sin(t / 4.5) * 4}%, ${L.wash}, transparent 72%)` }} />
    </AbsoluteFill>
  );
};
// 5 · grain + soft vignette on top
const Finish: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ opacity: 0.05, mixBlendMode: "multiply" }}>
      <filter id="dg"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#dg)" />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 62%, rgba(12,42,99,0.10))" }} />
  </AbsoluteFill>
);

// Persistent frame: colour spine (changes per scene), logo, web address
const Shell: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { height, M, spine, u } = useDims();
  const t = f / fps;
  let i = starts.findIndex((s, k) => t >= s && t < s + DEALER_SCENES[k]);
  if (i < 0) i = DEALER_SCENES.length - 1;
  const p = spring({ frame: f - starts[i] * fps, fps, config: theme.spring.smooth });
  const prev = L.spines[Math.max(0, i - 1)];
  const logoIn = spring({ frame: f - 4, fps, config: theme.spring.snappy });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: spine, height, background: prev }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: spine, height: height * p, background: L.spines[i] }} />
      <Img src={staticFile("brand/logo-noben.svg")} style={{ position: "absolute", left: spine + M * 0.618, top: M * 1.1, width: 132 * u, height: 132 * u, opacity: logoIn, transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])}) translateY(${interpolate(logoIn, [0, 1], [-20, 0])}px)` }} />
      <div style={{ ...body, position: "absolute", right: M * 0.618, top: M * 1.1 + 44 * u, fontSize: 30 * u, fontWeight: 600, color: L.dim, opacity: logoIn }}>thuysannoben.com</div>
    </AbsoluteFill>
  );
};

const Rule: React.FC<{ delay?: number; style?: React.CSSProperties }> = ({ delay = 0, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: theme.spring.smooth });
  return <div style={{ height: 3, background: L.ink, transformOrigin: "left", transform: `scaleX(${p})`, opacity: p, ...style }} />;
};

const Title: React.FC<{ text: string; size?: number; delay?: number }> = ({ text, size = 84, delay = 0 }) => {
  const { u } = useDims();
  return <WordReveal text={text} delay={delay} per={3} style={{ ...body, fontWeight: 700, fontSize: size * u, lineHeight: 1.08, letterSpacing: "-0.02em", columnGap: size * u * 0.26 }} />;
};

// Scene frame: content column to the right of the spine
const Col: React.FC<{ dur: number; children: React.ReactNode; top?: number; center?: boolean }> = ({ dur, children, top, center }) => {
  const { M, spine, height, wide, u } = useDims();
  return (
    <SceneExit duration={dur}>
      <div style={{ position: "absolute", left: spine + M * 0.618, right: M * 0.618, top: top ?? (wide ? 250 * u : height * 0.236), bottom: center ? M * 1.618 : M, display: "flex", flexDirection: "column", justifyContent: center ? "center" : "flex-start" }}>{children}</div>
    </SceneExit>
  );
};

const Icon: React.FC<{ name: string; size: number; color?: string }> = ({ name, size, color = L.ink }) => {
  const p: Record<string, React.ReactNode> = {
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    web: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 9h18M7 6.8h.01M10 6.8h.01" /></>,
    pen: <><path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5 4 20z" /><path d="M14 6.5l3 3" /></>,
    box: <><path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16V8z" /><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8" /></>,
    factory: <><path d="M3 20V10l6 3.5V10l6 3.5V5h5v15H3z" /><path d="M7 16.5h2M12 16.5h2" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
};

// ---------- scenes ----------
const PRODUCTS = ["caphote", "aqualac-fs", "sorbest", "super-yucca", "hepaliver-fs"];
const S1: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, wide } = useDims();
  return (
    <Col dur={dur}>
      <Entrance delay={6}><div style={{ ...body, fontSize: 40 * u, fontWeight: 600, color: L.blue }}>Noben tuyển đại lý toàn quốc</div></Entrance>
      <div style={{ height: 34 * u }} />
      <Title text="Tìm nhà phân phối" size={wide ? 104 : 96} delay={10} />
      <Title text="thuốc thủy sản" size={wide ? 104 : 96} delay={19} />
      <Rule delay={26} style={{ marginTop: 55 * u }} />
      <Entrance delay={30}><div style={{ ...body, fontSize: 42 * u, lineHeight: 1.45, marginTop: 34 * u, color: L.dim }}>Nhập hàng trực tiếp từ nhà máy</div></Entrance>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 520 * u }}>
        {PRODUCTS.map((p, i) => {
          const k = spring({ frame: f - 30 - i * 5, fps, config: theme.spring.smooth });
          const b = Math.sin((f / fps) * 1.4 + i) * 6 * u;
          return <Img key={p} src={staticFile(`products/${p}.webp`)} style={{ height: (i === 2 ? 500 : i % 2 ? 440 : 400) * u, width: "19%", objectFit: "contain", objectPosition: "bottom", opacity: k, transform: `translateY(${interpolate(k, [0, 1], [90, 0]) + b}px) scale(${interpolate(k, [0, 1], [0.9, 1])})`, filter: "drop-shadow(0 18px 22px rgba(12,42,99,.18))" }} />;
        })}
      </div>
    </Col>
  );
};

const S2: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const { u, M, spine, wide } = useDims();
  const w = wide ? width * 0.5 : width - spine - M * 1.236;
  const k = spring({ frame: f - 4, fps, config: theme.spring.smooth });
  const kb = interpolate(f, [0, dur], [1.02, 1.1], { ...theme.clamp, easing: theme.ease.sine });
  return (
    <Col dur={dur}>
      <div style={{ width: w, height: w / PHI, overflow: "hidden", borderRadius: 10 * u, opacity: k, transform: `translateY(${interpolate(k, [0, 1], [50, 0])}px) scale(${interpolate(k, [0, 1], [0.96, 1])})`, boxShadow: "0 30px 60px rgba(12,42,99,.18)" }}>
        <Img src={staticFile("brand/nha-may.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb}) translateX(${interpolate(f, [0, dur], [-1.2, 1.2])}%)` }} />
      </div>
      <div style={{ height: 55 * u }} />
      <Title text="Nhà máy tại Củ Chi, TP.HCM" size={78} delay={12} />
      <Entrance delay={24}><div style={{ ...body, fontSize: 42 * u, color: L.dim, marginTop: 21 * u }}>Sản xuất thuốc thủy sản từ năm 2002</div></Entrance>
      <Rule delay={28} style={{ marginTop: 34 * u }} />
      <div style={{ display: "flex", gap: 21 * u, marginTop: 34 * u, flexWrap: "wrap" }}>
        {["ISO 9001:2015", "Chứng nhận hợp quy VinaCert"].map((t, i) => (
          <Entrance key={t} delay={34 + i * 5}><div style={{ ...body, fontSize: 34 * u, fontWeight: 600, border: `3px solid ${L.ink}`, padding: `${13 * u}px ${21 * u}px`, borderRadius: 6 * u }}>{t}</div></Entrance>
        ))}
      </div>
    </Col>
  );
};

const GROUPS: Array<[string, number, string]> = [
  ["Sinh học và xử lý môi trường", 31, "#1f6f78"],
  ["Thức ăn bổ sung", 29, "#b07d2b"],
  ["Khoáng chất", 10, "#4a6fa5"],
  ["Hỗ trợ xử lý bệnh, gây màu nước, diệt ốc", 2, "#7d2e3c"],
];
const S3: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useDims();
  return (
    <Col dur={dur} center top={useDims().M * 2.618}>
      <Entrance delay={4}>
        <div style={{ ...body, display: "flex", alignItems: "baseline", gap: 26 * u }}>
          <Counter to={72} delay={6} style={{ fontSize: 300 * u, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.9 }} />
          <span style={{ fontSize: 68 * u, fontWeight: 700 }}>sản phẩm</span>
        </div>
      </Entrance>
      <Entrance delay={14}><div style={{ ...body, fontSize: 42 * u, color: L.dim, marginTop: 21 * u }}>Đủ hàng cho ao tôm, ao cá trong 4 nhóm</div></Entrance>
      <Rule delay={18} style={{ marginTop: 42 * u }} />
      {GROUPS.map(([name, n, c], i) => {
        const k = spring({ frame: f - 24 - i * 5, fps, config: theme.spring.smooth });
        return (
          <div key={name} style={{ ...body, display: "flex", alignItems: "center", gap: 26 * u, padding: `${30 * u}px 0`, borderBottom: `2px solid ${L.line}`, opacity: k, transform: `translateX(${interpolate(k, [0, 1], [60, 0])}px)` }}>
            <div style={{ width: 13 * u, height: 68 * u, background: c, transformOrigin: "bottom", transform: `scaleY(${k})` }} />
            <div style={{ flex: 1, fontSize: 42 * u, fontWeight: 600, lineHeight: 1.25 }}>{name}</div>
            <div style={{ fontSize: 60 * u, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{n}</div>
          </div>
        );
      })}
    </Col>
  );
};

const Rows: React.FC<{ items: Array<[string, string]>; icon?: string[]; start?: number }> = ({ items, icon, start = 20 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useDims();
  return (
    <>
      {items.map(([t, s], i) => {
        const k = spring({ frame: f - start - i * 6, fps, config: theme.spring.smooth });
        return (
          <div key={t} style={{ ...body, display: "flex", alignItems: "center", gap: 34 * u, padding: `${30 * u}px 0`, borderBottom: `2px solid ${L.line}`, opacity: k, transform: `translateY(${interpolate(k, [0, 1], [40, 0])}px) scale(${interpolate(k, [0, 1], [0.97, 1])})`, transformOrigin: "left" }}>
            <div style={{ width: 89 * u, height: 89 * u, borderRadius: 8 * u, background: L.ink, display: "grid", placeItems: "center", flexShrink: 0, transform: `scale(${interpolate(k, [0, 1], [0.5, 1])})` }}>
              <Icon name={icon ? icon[i] : "check"} size={52 * u} color={L.white} />
            </div>
            <div>
              <div style={{ fontSize: 48 * u, fontWeight: 700, lineHeight: 1.2 }}>{t}</div>
              <div style={{ fontSize: 34 * u, color: L.dim, marginTop: 8 * u, lineHeight: 1.35 }}>{s}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const S4: React.FC<{ dur: number }> = ({ dur }) => {
  const { u } = useDims();
  return (
    <Col dur={dur} center top={useDims().M * 2.618}>
      <Title text="Quyền lợi đại lý Noben" delay={4} />
      <Rule delay={14} style={{ marginTop: 42 * u, marginBottom: 13 * u }} />
      <Rows items={[
        ["Nhập hàng giá nhà máy", "Không qua trung gian"],
        ["Chiết khấu theo sản lượng", "Có thưởng doanh số"],
        ["Giao hàng toàn quốc", "Xuất thẳng từ nhà máy Củ Chi"],
        ["Kỹ thuật viên đồng hành", "Hướng dẫn sản phẩm, hỗ trợ ca khó"],
      ]} />
    </Col>
  );
};

const S5: React.FC<{ dur: number }> = ({ dur }) => {
  const { u } = useDims();
  return (
    <Col dur={dur} center top={useDims().M * 2.618}>
      <Title text="Noben hỗ trợ thêm cho đối tác" delay={4} />
      <Rule delay={14} style={{ marginTop: 42 * u, marginBottom: 13 * u }} />
      <Rows icon={["web", "pen", "box", "factory"]} items={[
        ["Quản trị website", "Cho cửa hàng bán trên mạng"],
        ["Thiết kế", "Nhãn, bao bì, ấn phẩm bán hàng"],
        ["Đóng gói", "Theo quy cách của bạn"],
        ["Gia công nhãn riêng", "Sản xuất theo thương hiệu của bạn"],
      ]} />
    </Col>
  );
};

const STEPS: Array<[string, string]> = [
  ["Để lại số điện thoại", "Trên web hoặc gọi hotline"],
  ["Nhận bảng giá đại lý", "Tư vấn danh mục theo vùng nuôi"],
  ["Nhập hàng, mở bán", "Có tên trên bản đồ đại lý Noben"],
];
const S6: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useDims();
  const line = spring({ frame: f - 18, fps, config: theme.spring.count });
  return (
    <Col dur={dur} center top={useDims().M * 2.618}>
      <Title text="Đăng ký trong 3 bước" delay={4} />
      <Rule delay={14} style={{ marginTop: 42 * u, marginBottom: 55 * u }} />
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 54 * u, top: 55 * u, bottom: 89 * u, width: 3, background: L.line }} />
        <div style={{ position: "absolute", left: 54 * u, top: 55 * u, bottom: 89 * u, width: 3, background: L.ink, transformOrigin: "top", transform: `scaleY(${line})` }} />
        {STEPS.map(([t, s], i) => {
          const k = spring({ frame: f - 20 - i * 9, fps, config: theme.spring.snappy });
          return (
            <div key={t} style={{ ...body, display: "flex", alignItems: "center", gap: 42 * u, marginBottom: 68 * u, opacity: k, transform: `translateY(${interpolate(k, [0, 1], [44, 0])}px)` }}>
              <div style={{ width: 110 * u, height: 110 * u, borderRadius: "50%", background: L.ink, color: L.white, display: "grid", placeItems: "center", fontSize: 55 * u, fontWeight: 700, flexShrink: 0, transform: `scale(${interpolate(k, [0, 1], [0.4, 1])})`, position: "relative" }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 52 * u, fontWeight: 700, lineHeight: 1.2 }}>{t}</div>
                <div style={{ fontSize: 36 * u, color: L.dim, marginTop: 8 * u }}>{s}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Col>
  );
};

const S7: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useDims();
  const k = spring({ frame: f - 22, fps, config: theme.spring.bouncy });
  const breath = 1 + Math.sin((f / fps) * 2.2) * 0.012;
  return (
    <Col dur={dur + 999}>
      <Entrance delay={4}><div style={{ ...body, fontSize: 40 * u, fontWeight: 600, color: L.blue }}>Công ty TNHH Noben</div></Entrance>
      <div style={{ height: 34 * u }} />
      <Title text="Đăng ký làm đại lý" size={100} delay={8} />
      <Title text="ngay hôm nay" size={100} delay={17} />
      <Rule delay={22} style={{ marginTop: 55 * u }} />
      <Entrance delay={26}><div style={{ ...body, fontSize: 38 * u, color: L.dim, marginTop: 55 * u }}>Hotline, Zalo</div></Entrance>
      <div style={{ ...body, fontSize: 124 * u, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap", opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.86, 1]) * breath})`, transformOrigin: "left", fontVariantNumeric: "tabular-nums" }}>0934 246 420</div>
      <Entrance delay={34}>
        <div style={{ ...body, display: "inline-block", marginTop: 42 * u, background: L.ink, color: L.white, fontSize: 40 * u, fontWeight: 600, padding: `${21 * u}px ${34 * u}px`, borderRadius: 8 * u }}>thuysannoben.com/tuyen-dai-ly</div>
      </Entrance>
      <Entrance delay={40}><div style={{ ...body, fontSize: 32 * u, color: L.dim, marginTop: 34 * u, lineHeight: 1.45 }}>228/9 Nguyễn Thị Lắng, Xã Củ Chi, TP.HCM</div></Entrance>
    </Col>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7];
export const DealerFilm: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Bg />
      <Shell />
      {SCENES.map((S, i) => {
        const dur = Math.round(DEALER_SCENES[i] * fps);
        return <Sequence key={i} from={Math.round(starts[i] * fps)} durationInFrames={dur}><S dur={dur} /></Sequence>;
      })}
      <Finish />
    </AbsoluteFill>
  );
};

const wrap = () => (<><Fonts /><DealerFilm /></>);
export const DealerCompositions: React.FC = () => (
  <>
    <Composition id="DealerRecruitVertical" component={wrap} durationInFrames={Math.round(DEALER_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="DealerRecruitWide" component={wrap} durationInFrames={Math.round(DEALER_SECONDS * FPS)} fps={FPS} width={1920} height={1080} />
  </>
);
