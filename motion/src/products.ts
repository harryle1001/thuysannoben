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
  piCut?: boolean; // beats on multiples of π (6π ≈ 18.85 s)
  hookArt?: "shrimp" | "pond";
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
  {
    id: "Sorbest",
    slug: "sorbest",
    image: "products/sorbest.webp",
    aspect: 605 / 900,
    name: "SORBEST",
    accent: "#ff8a73",
    accentSoft: "rgba(255, 138, 115, 0.22)",
    kicker: "Thảo dược và acid amin",
    tagline: "Phòng và trị bệnh gan: teo gan, sưng gan, chết sớm",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Gan teo, sưng, trắng gan?",
    hookSub: "Tôm chết sớm, chết rải rác, chết tấp mé",
    hookAt: [34, 2],
    benefits: [
      ["Phòng và trị bệnh gan", "Teo gan, sưng gan, trắng gan, gan ứ nước"],
      ["Bổ gan, giải độc gan", "Phục hồi chức năng gan, ngừa bệnh tái phát"],
      ["Tăng sức đề kháng", "Khống chế vi khuẩn, virus gây bệnh gan tụy"],
    ],
    dose: "Trộn 10 g/kg thức ăn · 2–3 lần/ngày",
    piCut: true,
  },
  {
    id: "Proticbest",
    slug: "proticbest",
    image: "products/proticbest.webp",
    aspect: 362 / 900,
    name: "PROTICBEST",
    accent: "#4fe3a0",
    accentSoft: "rgba(79, 227, 160, 0.2)",
    kicker: "Vi sinh gốc · EM gốc",
    tagline: "Làm sạch đáy ao, sạch bạt, sạch nước",
    hookKicker: "Đáy ao có vấn đề?",
    hook: "Đáy dơ, bạt nhớt?",
    hookSub: "Thức ăn dư, xác tảo tàn sinh khí độc ở đáy ao",
    hookAt: [0, 0],
    hookArt: "pond",
    benefits: [
      ["Sạch đáy, sạch bạt", "Chuyên gia làm sạch đáy, nước, nhớt bạt"],
      ["Phân hủy chất thải", "Thức ăn dư, xác tảo tàn, khí độc đáy ao"],
      ["Ổn định môi trường", "Tăng oxy, ổn định màu nước và pH"],
    ],
    dose: "Tạt 1 lít/3.000 m³ nước · 3–5 ngày/lần",
    piCut: true,
  },
  {
    id: "SuperYucca",
    slug: "super-yucca",
    image: "products/super-yucca.webp",
    aspect: 393 / 900,
    name: "SUPER YUCCA",
    accent: "#c3e85a",
    accentSoft: "rgba(195, 232, 90, 0.2)",
    kicker: "Hấp thụ khí độc",
    tagline: "Hấp thụ khí độc, cấp cứu khi tôm nổi đầu",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Tôm nổi đầu, khí độc cao?",
    hookSub: "Môi trường ao ô nhiễm, tôm yếu, nổi đầu",
    hookAt: [26, 22],
    benefits: [
      ["Cấp cứu tôm nổi đầu", "Hấp thụ nhanh các loại khí độc"],
      ["Đào thải khí độc", "Phân hủy, đào thải khí độc khỏi ao nuôi"],
      ["Cải thiện môi trường", "Nhanh chóng giảm ô nhiễm ao nuôi"],
    ],
    dose: "1 lít/5.000 m³ nước · định kỳ 7 ngày/lần",
    piCut: true,
  },
  {
    id: "TopWeigh",
    slug: "top-weigh",
    image: "products/top-weigh.webp",
    aspect: 741 / 900,
    name: "TOP WEIGH",
    accent: "#ff9d4d",
    accentSoft: "rgba(255, 157, 77, 0.2)",
    kicker: "Thức ăn bổ sung tăng trọng",
    tagline: "Tăng trọng nhanh, giảm lượng thức ăn hằng ngày",
    hookKicker: "Ao tôm có dấu hiệu lạ?",
    hook: "Tôm chậm lớn, tốn thức ăn?",
    hookSub: "Ốp thân, mềm vỏ, lột xác không đều",
    hookAt: [140, -14],
    benefits: [
      ["Tăng trọng nhanh", "Đủ acid amin, vitamin, khoáng chất"],
      ["Lột xác đúng chu kỳ", "Khắc phục ốp thân, mềm vỏ"],
      ["Giảm 10–15% thức ăn", "Giảm chi phí đầu tư, tăng lợi nhuận"],
    ],
    dose: "Trộn 5–10 g/kg thức ăn · theo tuổi tôm",
    piCut: true,
  },
];
