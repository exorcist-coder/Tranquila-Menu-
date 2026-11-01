import type { SVGProps } from "react";
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;
export const IconClose = (p: P) => <svg {...base} {...p}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>;
export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5.5v13M5.5 12h13" /></svg>;
export const IconMinus = (p: P) => <svg {...base} {...p}><path d="M5.5 12h13" /></svg>;
export const IconSearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
export const IconArrowRight = (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconCheck = (p: P) => <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IconTrash = (p: P) => <svg {...base} {...p}><path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.8 12.2h8.8L17.2 7M10 10.5v5.5M14 10.5v5.5" /></svg>;
export const IconBack = (p: P) => <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const IconBag = (p: P) => <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8zM9 8V6.5a3 3 0 0 1 6 0V8" /></svg>;
const CAT: Record<string, string> = {
  breakfast: "M5 11h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4zM16 12h1.5a2.5 2.5 0 0 1 0 5H16M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3",
  soups: "M3.5 12h17a8.5 8.5 0 0 1-17 0zM8 21.5h8M9 4c-1 1 1 2 0 3.5M13 4c-1 1 1 2 0 3.5M17 4c-1 1 1 2 0 3.5",
  rice: "M12 21V8M12 12c-3 0-4-2-4-4 3 0 4 2 4 4zM12 12c3 0 4-2 4-4-3 0-4 2-4 4zM12 17c-3 0-4-2-4-4 3 0 4 2 4 4zM12 17c3 0 4-2 4-4-3 0-4 2-4 4zM12 8c-1.5-1-1.5-3 0-5 1.5 2 1.5 4 0 5z",
  mains: "M3 18h18M5 18a7 7 0 0 1 14 0M12 11V8.5M10.5 8.5h3M3 21h18",
  light: "M4 10c0-3 3.5-5 8-5s8 2 8 5H4zM3.5 14h17M5 14l1 4.5h12L19 14",
  wines: "M8 3h8l.5 6a4.5 4.5 0 0 1-9 0L8 3zM12 13.5V21M8.5 21h7",
  spirits: "M6 4h12l-1.3 15.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6 4zM6.6 10h10.8",
  beers: "M5 7h11v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7zM16 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M5 7c0-2 2-3 3-3 1-1 3-1 4 0 2 0 4 1 4 3M9 11v6M12 11v6",
  soft: "M7 8h10l-1 12H8L7 8zM6 8h12M12 8V3l3-1",
  water: "M12 3c3.5 4.2 6 7.2 6 10.5a6 6 0 0 1-12 0C6 10.2 8.5 7.2 12 3z",
};
export const CatIcon = ({ id, ...p }: P & { id: string }) => <svg {...base} {...p}><path d={CAT[id] ?? CAT.mains} /></svg>;
