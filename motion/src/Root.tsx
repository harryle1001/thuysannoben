import React from "react";
import { Composition } from "remotion";
import { Fonts } from "./components/Fonts";
import { BrandFilm, FILM_SECONDS } from "./scenes/BrandFilm";
import { HeroLoop } from "./scenes/HeroLoop";
import { beatsFor, ProductAd } from "./scenes/ProductAd";
import { StoryAd } from "./scenes/StoryAd";
import { STORIES } from "./stories";
import { PRODUCTS } from "./products";
import { FactoryCompositions } from "./scenes/FactoryFilm";
import { ProcessCompositions } from "./scenes/ProcessFilm";

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
    <FactoryCompositions />
    <ProcessCompositions />
    {PRODUCTS.flatMap((p) => [
      <Composition key={`${p.id}V`} id={`Ad${p.id}Vertical`} component={withProduct(p)} durationInFrames={Math.round(beatsFor(p).end * FPS)} fps={FPS} width={1080} height={1920} />,
      <Composition key={`${p.id}H`} id={`Ad${p.id}Wide`} component={withProduct(p)} durationInFrames={Math.round(beatsFor(p).end * FPS)} fps={FPS} width={1920} height={1080} />,
    ])}
    {/* Protocol + dealer films (7π ≈ 22 s, 6.5π ≈ 20.4 s), several products per frame */}
    {STORIES.flatMap((st) => [
      <Composition key={`${st.id}V`} id={`Story${st.id}Vertical`} component={() => (<><Fonts /><StoryAd story={st} /></>)} durationInFrames={Math.round(st.seconds * FPS)} fps={FPS} width={1080} height={1920} />,
      <Composition key={`${st.id}H`} id={`Story${st.id}Wide`} component={() => (<><Fonts /><StoryAd story={st} /></>)} durationInFrames={Math.round(st.seconds * FPS)} fps={FPS} width={1920} height={1080} />,
    ])}
  </>
);
