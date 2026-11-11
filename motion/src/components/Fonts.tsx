import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// The site's own fonts (Archivo display, Be Vietnam Pro body), Latin + Vietnamese subsets.
const faces: Array<[string, string, string]> = [
  ["Archivo", "fonts/archivo-latin-wdth-normal.woff2", "100 900"],
  ["Archivo", "fonts/archivo-latin-ext-wdth-normal.woff2", "100 900"],
  ["Archivo", "fonts/archivo-vietnamese-wdth-normal.woff2", "100 900"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-latin-400-normal.woff2", "400"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-latin-ext-400-normal.woff2", "400"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-vietnamese-400-normal.woff2", "400"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-latin-600-normal.woff2", "600"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-latin-ext-600-normal.woff2", "600"],
  ["Be Vietnam Pro", "fonts/be-vietnam-pro-vietnamese-600-normal.woff2", "600"],
];

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      faces.map(([family, file, weight]) => {
        const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
          weight,
          stretch: family === "Archivo" ? "62% 125%" : "100%",
        });
        return f.load().then((loaded) => document.fonts.add(loaded));
      }),
    )
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
  return null;
};
