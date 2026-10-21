"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { isDrink, type Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { CatIcon } from "./icons";

const TONE = "#E4E8D8";
const FALLBACK = "/menu/rice-stew.webp";
export const photoOf = (item: Item, i = 0) => { const k = item.photos?.[i]; return k ? PHOTOS[k] : undefined; };
/** First release: the supplied bottle photo is used for every drink. */
export const bottleOf = (item: Item) => (isDrink(item.category) ? "/menu/bouchon.png" : undefined);

/** Dish photo, or a quiet icon tile when a dish has no photo yet. */
export default function Media({ item, index = 0, layoutId, radius = 20, eager = false, alt = "" }: { item: Item; index?: number; layoutId?: string; radius?: number; eager?: boolean; alt?: string }) {
  const p = photoOf(item, index); const [failed, setFailed] = useState(false);
  const src = index === 0 && item.imageUrl ? item.imageUrl : p?.src;
  return <motion.div layoutId={layoutId} className="media" style={{ borderRadius: radius, background: p?.tone ?? TONE }}>
    {src
      ? <img src={failed ? FALLBACK : src} width={p?.w ?? 720} height={p?.h ?? 720} alt={alt || item.name} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => setFailed(true)} />
      : <img src={FALLBACK} width={720} height={720} alt={alt || item.name} decoding="async" draggable={false} />}
  </motion.div>;
}

/** Bottle photo for wines, a framed category icon for everything else. */
export function Bottle({ item, className = "" }: { item: Item; className?: string }) {
  const b = bottleOf(item);
  return b
    ? <img className={`bottle ${className}`} src={b} alt={item.name} width={260} height={450} draggable={false} />
    : <span className={`bottle-ph ${className}`}><CatIcon id={item.category} width={40} height={40} strokeWidth={1.3} /></span>;
}

export function Thumb({ item }: { item: Item }) {
  const p = photoOf(item); const b = bottleOf(item); const src = item.imageUrl ?? p?.src;
  return <span className="thumb" style={{ background: p?.tone ?? TONE }}>
    {b ? <img src={b} alt="" width={64} height={64} className="thumb-bottle" draggable={false} /> : src ? <img src={src} alt="" width={64} height={64} draggable={false} /> : <CatIcon id={item.category} width={24} height={24} />}
  </span>;
}
