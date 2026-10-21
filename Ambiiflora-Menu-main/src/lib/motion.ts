"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

export { gsap, ScrollTrigger, SplitText };
export const reducedMotion = (): boolean => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Tells the page's failsafe that the motion layer started, so hidden-until-revealed content stays managed by GSAP. */
export const motionReady = () => { document.documentElement.dataset.motion = "1"; };
/** Resolves once webfonts are ready so text splits measure the real glyphs. */
export const fontsReady = (): Promise<unknown> => (typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve());
