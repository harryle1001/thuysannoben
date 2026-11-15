// Protocol (phác đồ) and dealer films. Products, stages and notes come from content/landings.json;
// short roles paraphrase the label notes there. No invented efficacy figures, no testimonials.
import { PI } from "./theme";

export type Item = { slug: string; name: string; aspect: number; role: string };
const A: Record<string, number> = {
  "bio-edta": 708, "down-max-ha-phen": 682, "vita-c-tat": 640, "aqualac-fs": 657, "g7-phong-va-tri-benh-gan-chet-som": 472,
  "clear-12h": 602, proticbest: 362, "aqua-yucca": 637, "mix-79": 520, "hepaliver-fs": 345, caphote: 373, "super-oxy-02": 647,
  marimix: 603, "toxic-algae": 776, "nb-biopond": 849, sorbest: 605, "super-yucca": 393, "top-weigh": 741,
};
const it = (slug: string, name: string, role = ""): Item => ({ slug, name, aspect: (A[slug] ?? 600) / 900, role });

export type Stage = { short: string; when: string; name: string; items: Item[] };
export type Story = {
  id: string;
  slug: string;
  kind: "protocol" | "rain" | "oem" | "dealer";
  seconds: number;
  accent: string;
  accentSoft: string;
  kicker: string;
  title: string;
  sub: string;
  stages?: Stage[];
  lineupTitle?: string;
  lineup?: Item[];
  close: { line: string; cta: string };
};

const AO_BAT: Stage[] = [
  { short: "Trước thả", when: "Trước khi thả giống", name: "Chuẩn bị nước sạch, giảm sốc khi thả", items: [it("bio-edta", "BIO EDTA", "Giải độc phèn, kim loại nặng"), it("vita-c-tat", "VITA C TẠT", "Chống sốc, giảm stress")] },
  { short: "1–30 ngày", when: "1 đến 30 ngày", name: "Xây nền gan ruột, giữ bạt sạch từ đầu", items: [it("aqualac-fs", "AQUALAC FS", "Hỗ trợ tiêu hóa, đường ruột"), it("g7-phong-va-tri-benh-gan-chet-som", "G7", "Thảo dược bổ gan, giải độc gan")] },
  { short: "31–60 ngày", when: "31 đến 60 ngày", name: "Kiểm soát khí độc, giữ kiềm và khoáng", items: [it("proticbest", "PROTICBEST", "Sạch đáy, sạch nhớt bạt"), it("aqua-yucca", "AQUA YUCCA", "Hấp thụ nhanh khí độc")] },
  { short: "Trên 60 ngày", when: "Trên 60 ngày đến thu", name: "Tăng trọng, cứng vỏ, giữ oxy", items: [it("hepaliver-fs", "HEPALIVER FS", "Bổ gan, giải độc gan"), it("caphote", "CAPHOTE", "Siêu khoáng cứng vỏ")] },
];

const MUA: Stage[] = [
  { short: "Trước mưa", when: "Trước mưa", name: "Giữ kiềm, chuẩn bị oxy", items: [it("mix-79", "MIX 79", "Tăng kiềm nhanh, ổn định kiềm"), it("super-oxy-02", "SUPER OXY 02", "Cấp oxy nhanh khi nổi đầu")] },
  { short: "Trong mưa", when: "Trong và ngay sau mưa", name: "Chống sốc, hạ phèn", items: [it("vita-c-tat", "VITA C TẠT", "Chống sốc tức thời"), it("marimix", "MARIMIX", "Khử phèn, giải độc nguồn nước")] },
  { short: "Sau mưa", when: "1 đến 3 ngày sau mưa", name: "Xử lý tảo tàn, khí độc đáy", items: [it("toxic-algae", "TOXIC ALGAE", "Xử lý xác tảo tàn, váng bọt"), it("nb-biopond", "NB-BIOPOND", "Phân hủy chất thải đáy ao")] },
];

export const STORIES: Story[] = [
  {
    id: "AoBat", slug: "ao-bat-mat-do-cao", kind: "protocol", seconds: 7 * PI,
    accent: "#5fd4ff", accentSoft: "rgba(95, 212, 255, 0.2)",
    kicker: "Phác đồ trọn vụ · Ao lót bạt",
    title: "Ao bạt mật độ cao",
    sub: "Sạch bạt, sạch khí độc, tôm khỏe đến ngày thu",
    stages: AO_BAT,
    lineupTitle: "Trọn bộ phác đồ ao bạt",
    lineup: AO_BAT.flatMap((s) => s.items),
    close: { line: "Kỹ thuật viên tư vấn phác đồ miễn phí", cta: "Hotline tư vấn kỹ thuật" },
  },
  {
    id: "MuaMua", slug: "mua-mua", kind: "rain", seconds: 7 * PI,
    accent: "#7cc4ff", accentSoft: "rgba(124, 196, 255, 0.2)",
    kicker: "Phác đồ phòng bệnh mùa mưa",
    title: "Mùa mưa",
    sub: "Giữ pH, giữ kiềm, tôm không sốc",
    stages: MUA,
    lineupTitle: "Bộ sản phẩm phòng bệnh mùa mưa",
    lineup: [...MUA.flatMap((s) => s.items), it("aqua-yucca", "AQUA YUCCA"), it("aqualac-fs", "AQUALAC FS")],
    close: { line: "Liều theo nhãn · Kỹ thuật viên tư vấn miễn phí", cta: "Hotline tư vấn kỹ thuật" },
  },
  {
    id: "Oem", slug: "gia-cong-oem", kind: "oem", seconds: 7 * PI,
    accent: "#ffc20e", accentSoft: "rgba(255, 194, 14, 0.18)",
    kicker: "Dành cho doanh nghiệp, nhà phân phối",
    title: "Gia công thuốc thủy sản OEM",
    sub: "Từ công thức, mẫu thử, hồ sơ lưu hành đến sản xuất và giao hàng",
    close: { line: "Nhận báo giá và mẫu thử", cta: "Hotline phòng kinh doanh" },
  },
  {
    id: "DaiLy", slug: "dai-ly", kind: "dealer", seconds: 6.5 * PI,
    accent: "#ffc20e", accentSoft: "rgba(255, 194, 14, 0.18)",
    kicker: "Chương trình hợp tác đại lý",
    title: "Trở thành đại lý Noben",
    sub: "Nhập hàng trực tiếp từ nhà máy, có kỹ thuật viên đồng hành",
    lineup: [it("g7-phong-va-tri-benh-gan-chet-som", "G7"), it("proticbest", "PROTICBEST"), it("caphote", "CAPHOTE"), it("super-yucca", "SUPER YUCCA"), it("sorbest", "SORBEST")],
    close: { line: "Nhận bảng giá đại lý và chính sách chiết khấu", cta: "Hotline phòng kinh doanh" },
  },
];
