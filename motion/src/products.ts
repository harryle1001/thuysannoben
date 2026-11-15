// Product ad copy. Every claim below is taken from the product label (content/products.json);
// no invented efficacy figures, no testimonials.
export type AdProduct = {
  id: string; // composition id prefix
  slug: string;
  image: string; // inside motion/public
  aspect: number; // cutout width / height
  name: string;
  accent: string; // per-family accent (the hero color of the video)
  accentSoft: string;
  kicker: string; // product family line
  tagline: string;
  hookKicker: string;
  hook: string; // the pond problem, as a question
  hookSub: string;
  hookAt: [number, number]; // marker on the line-art shrimp (shrimp units)
  benefits: Array<[string, string]>; // [title, detail]
  dose: string;
};

export const PRODUCTS: AdProduct[] = [
  {
    id: "G7",
    slug: "g7-phong-va-tri-benh-gan-chet-som",
    image: "products/g7-phong-va-tri-benh-gan-chet-som.webp",
    aspect: 472 / 900,
    name: "G7",
    accent: "#6fdc8c",
    accentSoft: "rgba(111, 220, 140, 0.22)",
    kicker: "Thảo dược bổ gan",
    tagline: "Thảo dược tự nhiên phòng và trị bệnh gan cho tôm",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Gan sưng, teo, trắng gan?",
    hookSub: "Tôm chết rải rác, chết tấp mé",
    hookAt: [34, 2],
    benefits: [
      ["Phòng và trị bệnh gan", "Sưng gan, teo gan, trắng gan, gan ứ nước"],
      ["Bổ gan, giải độc gan", "Phục hồi chức năng gan, ngừa bệnh tái phát"],
      ["Tăng sức đề kháng", "Khống chế vi khuẩn, virus gây bệnh gan tụy"],
    ],
    dose: "Trộn 3–5 ml/kg thức ăn · 2 lần/ngày",
  },
  {
    id: "Caphote",
    slug: "caphote",
    image: "products/caphote.webp",
    aspect: 373 / 900,
    name: "CAPHOTE",
    accent: "#3fe0cf",
    accentSoft: "rgba(63, 224, 207, 0.2)",
    kicker: "Siêu khoáng cho tôm",
    tagline: "Cứng vỏ nhanh, vỏ dày, ngừa cong thân, đục cơ",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Tôm mềm vỏ, khó lột?",
    hookSub: "Cong thân, đục cơ, mềm vỏ kéo dài",
    hookAt: [128, -24],
    benefits: [
      ["Cứng vỏ siêu nhanh", "Vỏ dày, cứng vỏ nhanh để thu tôm"],
      ["Bổ sung khoáng đầy đủ", "Đa lượng, vi lượng, tôm hấp thụ trực tiếp"],
      ["Ngừa cong thân, đục cơ", "Trắng lưng, mềm vỏ, khó lột"],
    ],
    dose: "Định kỳ 1 lít / 2.000 m³ nước",
  },
  {
    id: "Aqualac",
    slug: "aqualac-fs",
    image: "products/aqualac-fs.webp",
    aspect: 657 / 900,
    name: "AQUALAC FS",
    accent: "#ffb042",
    accentSoft: "rgba(255, 176, 66, 0.2)",
    kicker: "Men tiêu hóa cho tôm",
    tagline: "Nong to đường ruột, ngừa phân trắng, tăng trọng",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Phân trắng, ruột trống?",
    hookSub: "Tôm tiêu hóa kém, hấp thu thức ăn chậm",
    hookAt: [200, 4],
    benefits: [
      ["Tiêu hóa, hấp thu nhanh", "Hỗ trợ tiêu hóa và hấp thu thức ăn"],
      ["Ngừa phân trắng", "Hỗ trợ ngừa bệnh đường ruột, trống ruột"],
      ["Nong to đường ruột", "Hỗ trợ tăng trọng nhanh"],
    ],
    dose: "Trộn 3 g/kg thức ăn · 2–3 lần/ngày",
  },
];
