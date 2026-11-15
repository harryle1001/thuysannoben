import React from "react";
import { Composition } from "remotion";
import { Fonts } from "./components/Fonts";
import { BrandFilm, FILM_SECONDS } from "./scenes/BrandFilm";
import { HeroLoop } from "./scenes/HeroLoop";
import { AD_SECONDS, ProductAd } from "./scenes/ProductAd";
import { PRODUCTS } from "./products";

const FPS = 30;
const withFonts = (C: React.FC) => () => (<><Fonts /><C /></>);

const withProduct = (p: (typeof PRODUCTS)[number]) => () => (<><Fonts /><ProductAd product={p} /></>);

export const Root: React.FC = () => (
  <>
    {/* 12 s seamless loop behind the home page headline */}
    <Composition id="HeroLoop" component={withFonts(HeroLoop)} durationInFrames={12 * FPS} fps={FPS} width={1920} height={1080} />
    {/* 18 s brand film: process, certifications, sign-off */}
    <Composition id="BrandFilm" component={withFonts(BrandFilm)} durationInFrames={FILM_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    {/* 17 s product ads: 9:16 for Reels/TikTok/Zalo, 16:9 for the website */}
    {PRODUCTS.flatMap((p) => [
      <Composition key={`${p.id}V`} id={`Ad${p.id}Vertical`} component={withProduct(p)} durationInFrames={AD_SECONDS * FPS} fps={FPS} width={1080} height={1920} />,
      <Composition key={`${p.id}H`} id={`Ad${p.id}Wide`} component={withProduct(p)} durationInFrames={AD_SECONDS * FPS} fps={FPS} width={1920} height={1080} />,
    ])}
  </>
);
