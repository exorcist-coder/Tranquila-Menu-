"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { isDrink, type Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { CatIcon } from "./icons";

const TONE = "#E4E8D8";
export const photoOf = (item: Item, i = 0) => { const k = item.photos?.[i]; return k ? (/^https:\/\//.test(k) || k.startsWith("/") ? {src:k,tone:TONE,w:720,h:720} : PHOTOS[k]) : undefined; };
/** Product-specific cutouts for non-alcoholic drinks; existing bottle for wines, spirits and beers. */
const DRINK_IMAGE: Record<string, string> = {
  "soft-drinks": "/images/drinks/soft-drinks.webp",
  malt: "/images/drinks/soft-drinks.webp",
  "hot-drinks": "/images/drinks/hot-drinks.webp",
  water: "/images/drinks/water.webp",
  juice: "/images/drinks/juice.webp",
  smoothie: "/images/drinks/juice.webp",
  chapman: "/images/drinks/juice.webp",
};
/** Full photos use a frame; product cutouts keep their bottle silhouette. */
export const isPhotoDrink = (item: Item) => ["hot-drinks", "juice", "smoothie"].includes(item.id) && !!(item.imageUrl || photoOf(item));
export const bottleOf = (item: Item, index = 0) => {
  if (!isDrink(item.category)) return undefined;
  if (item.imageUrl && index === 0) return item.imageUrl;
  return photoOf(item, index - (item.imageUrl ? 1 : 0))?.src ?? DRINK_IMAGE[item.id] ?? (item.category === "soft" ? DRINK_IMAGE["soft-drinks"] : item.category === "water" ? DRINK_IMAGE.water : "/images/bouchon.png");
};

/** Dish photo, or a quiet icon tile when a dish has no photo yet. */
export default function Media({ item, index = 0, layoutId, radius = 20, eager = false, alt = "" }: { item: Item; index?: number; layoutId?: string; radius?: number; eager?: boolean; alt?: string }) {
  const p = photoOf(item, item.imageUrl ? index - 1 : index); const [failed, setFailed] = useState(false);
  const src = index === 0 && item.imageUrl ? item.imageUrl : p?.src;
  return <motion.div layoutId={layoutId} className="media" style={{ borderRadius: radius, background: p?.tone ?? TONE }}>
    {src && !failed
      ? <img src={src} width={p?.w ?? 720} height={p?.h ?? 720} alt={alt || item.name} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => setFailed(true)} />
      : <CatIcon className="media-mark" id={item.category} width={64} height={64} strokeWidth={1.2} />}
  </motion.div>;
}

/** Bottle photo for wines, a framed category icon for everything else. */
export function Bottle({ item, className = "", index = 0 }: { item: Item; className?: string; index?: number }) {
  const b = bottleOf(item, index);
  return b
    ? <img className={`bottle${isPhotoDrink(item) ? " drink-photo" : ""} ${className}`} src={b} alt={item.name} width={isPhotoDrink(item) ? 400 : 260} height={isPhotoDrink(item) ? 400 : 450} loading="lazy" decoding="async" draggable={false} />
    : <span className={`bottle-ph ${className}`}><CatIcon id={item.category} width={40} height={40} strokeWidth={1.3} /></span>;
}

export function Thumb({ item }: { item: Item }) {
  const p = photoOf(item); const b = bottleOf(item); const src = item.imageUrl ?? p?.src;
  return <span className="thumb" style={{ background: p?.tone ?? TONE }}>
    {b ? <img src={b} alt="" width={64} height={64} className={`thumb-bottle${isPhotoDrink(item) ? " drink-photo" : ""}`} draggable={false} /> : src ? <img src={src} alt="" width={64} height={64} draggable={false} /> : <CatIcon id={item.category} width={24} height={24} />}
  </span>;
}
