// FACTORY_MEDIA — every real picture or clip used by FactoryFilm, by slot.
// Only Noben's own pictures belong here (no stock footage presented as "the Noben factory").
//
// To swap a photo for a clip shot at the factory: drop the file into motion/public/factory/clips/
// and change the entry, e.g.
//   { slot: "line", type: "video", src: "factory/clips/04-tron.mp4", caption: "Trộn nguyên liệu", startFrom: 2 }
// Videos play muted from `startFrom` (seconds) and are cropped to fill their frame (object-fit: cover),
// so shoot landscape 4K and keep the subject centred. See motion/README.md for the shot list.
//
// Slots (scene order): intro, raw, formula, line, qc, team, reach.
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

// Pure motion graphics for now: no photographs (photos next to vector art look out of place).
// Add real clips shot at the factory here; the scene shows them in a glass frame beside its line art, e.g.
//   { slot: "raw", type: "video", src: "factory/clips/02-nguyen-lieu.mp4", caption: "Kiểm tra nguyên liệu", startFrom: 1 },
//   { slot: "line", type: "video", src: "factory/clips/06-tron.mp4", caption: "Trộn nguyên liệu" },
export const FACTORY_MEDIA: FactoryMedia[] = [];

export const slot = (s: FactorySlot) => FACTORY_MEDIA.filter((m) => m.slot === s);
