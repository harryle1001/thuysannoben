// FACTORY_MEDIA — every real picture or clip used by FactoryFilm, by slot.
// Only Noben's own pictures belong here (no stock footage presented as "the Noben factory").
//
// To swap a photo for a clip shot at the factory: drop the file into motion/public/factory/clips/
// and change the entry, e.g.
//   { slot: "line", type: "video", src: "factory/clips/04-tron.mp4", caption: "Trộn nguyên liệu", startFrom: 2 }
// Videos play muted from `startFrom` (seconds) and are cropped to fill their frame (object-fit: cover),
// so shoot landscape 4K and keep the subject centred. See motion/README.md for the shot list.
//
// Slots (scene order): intro, raw, formula, line, qc, team, reach, close.
// - "line" and "raw" are empty for now (line-art only): adding clips there makes them appear
//   as glass panels beside the line art automatically.
export type FactorySlot = "intro" | "raw" | "formula" | "line" | "qc" | "team" | "reach";

export type FactoryMedia = {
  slot: FactorySlot;
  type: "image" | "video";
  src: string; // path inside motion/public
  caption?: string;
  /** Focal point for cropping, 0..1 (x, y). Default centre. */
  focus?: [number, number];
  /** Video only: seconds to skip at the start of the clip. */
  startFrom?: number;
};

export const FACTORY_MEDIA: FactoryMedia[] = [
  // 02 · Công thức từ đội kỹ thuật — technical seminars with farmers (real Noben photos)
  { slot: "formula", type: "image", src: "factory/photos/noben-4.webp", caption: "Hội thảo kỹ thuật cùng bà con", focus: [0.5, 0.45] },
  { slot: "formula", type: "image", src: "factory/photos/noben-3.webp", caption: "Sản phẩm Noben tại hội thảo", focus: [0.55, 0.6] },

  // 04 · Kiểm tra chất lượng — the real certificates (from /chung-nhan)
  { slot: "qc", type: "image", src: "factory/certs/vinacert-1.webp", caption: "Hợp quy VinaCert" },
  { slot: "qc", type: "image", src: "factory/certs/iso-9001-2015.webp", caption: "ISO 9001:2015" },
  { slot: "qc", type: "image", src: "factory/certs/vinacert-2.webp", caption: "Hợp quy VinaCert" },

  // 05 · Đội ngũ Noben — team photos taken at the company (no composited backdrops)
  { slot: "team", type: "image", src: "factory/photos/team-45.webp", focus: [0.5, 0.6] },
  { slot: "team", type: "image", src: "factory/photos/team-48.webp", focus: [0.5, 0.45] },
  { slot: "team", type: "image", src: "factory/photos/noben-2.webp", focus: [0.5, 0.5] },
  { slot: "team", type: "image", src: "factory/photos/team-52.webp", focus: [0.5, 0.55] },
  { slot: "team", type: "image", src: "factory/photos/team-36.webp", focus: [0.5, 0.55] },
  { slot: "team", type: "image", src: "factory/photos/team-35.webp", focus: [0.5, 0.5] },
  { slot: "team", type: "image", src: "factory/photos/team-20.webp", focus: [0.5, 0.65] },
  { slot: "team", type: "image", src: "factory/photos/team-47.webp", focus: [0.5, 0.5] },
  { slot: "team", type: "image", src: "factory/photos/team-51.webp", focus: [0.5, 0.6] },
  { slot: "team", type: "image", src: "factory/photos/team-43.webp", focus: [0.5, 0.45] },
  { slot: "team", type: "image", src: "factory/photos/team-46.webp", focus: [0.5, 0.55] },
  { slot: "team", type: "image", src: "factory/photos/noben-6.webp", focus: [0.55, 0.5] },
];

// Real product photos (background removed) that roll off the end of the line-art production line.
export const FACTORY_PRODUCTS = [
  "aqualac-fs", "caphote", "g7-phong-va-tri-benh-gan-chet-som", "bio-max", "super-gold", "oxy-99", "prolac", "hepaliver-fs",
  "super-yucca", "nb-biopond", "biozyme", "liver-max", "premix-9999", "aqua-c30", "de-zoo", "prozyme",
].map((s) => `factory/products/${s}.webp`);

export const slot = (s: FactorySlot) => FACTORY_MEDIA.filter((m) => m.slot === s);
