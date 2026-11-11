import React from "react";
import { Composition } from "remotion";
import { Fonts } from "./components/Fonts";
import { BrandFilm, FILM_SECONDS } from "./scenes/BrandFilm";
import { HeroLoop } from "./scenes/HeroLoop";

const FPS = 30;
const withFonts = (C: React.FC) => () => (<><Fonts /><C /></>);

export const Root: React.FC = () => (
  <>
    {/* 12 s seamless loop behind the home page headline */}
    <Composition id="HeroLoop" component={withFonts(HeroLoop)} durationInFrames={12 * FPS} fps={FPS} width={1920} height={1080} />
    {/* 18 s brand film: process, certifications, sign-off */}
    <Composition id="BrandFilm" component={withFonts(BrandFilm)} durationInFrames={FILM_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
  </>
);
