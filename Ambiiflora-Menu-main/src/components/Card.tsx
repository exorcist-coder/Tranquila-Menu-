"use client";
import { motion } from "framer-motion";
import { isDrink, type Item } from "@/lib/catalog";
import { naira, priceRange } from "@/lib/pricing";
import Media, { Bottle } from "./Media";
import { IconPlus } from "./icons";

/** Food: photo card with price and a quick-add button. Drinks: a wine-list row with the bottle standing out of the card. */
export default function Card({ item, onOpen }: { item: Item; onOpen: (i: Item) => void }) {
  const [lo, hi] = priceRange(item);
  const price = <>{lo !== hi && <small>from</small>}{naira(lo)}</>;
  if (isDrink(item.category)) {
    const sub = item.details?.find((d) => d.label === "Style")?.value ?? item.description;
    const origin = item.details?.find((d) => d.label === "Country")?.value;
    return (
      <li className="card-li wide">
        <motion.button type="button" className="wcard" whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} onClick={() => onOpen(item)}>
          <span className="wcard-t"><b>{item.name}</b><span>{origin ? `${sub} · ${origin}` : sub}</span><em className="wcard-p">{price}</em></span>
          <span className="wcard-art" aria-hidden><Bottle item={item} /></span>
        </motion.button>
      </li>
    );
  }
  const chips = item.groups.length === 1 && item.groups[0]!.options.length <= 4 ? item.groups[0]!.options.map((o) => o.label) : [];
  return (
    <li className="card-li">
      <motion.button type="button" className="card" whileTap={{ scale: 0.975 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} onClick={() => onOpen(item)}>
        <span className="card-media" data-reveal=""><Media item={item} layoutId={`media-${item.id}`} radius={20} /></span>
        <span className="card-name">{item.name}</span>
        {chips.length > 0 ? <span className="chips">{chips.slice(0, 3).map((c) => <i key={c}>{c}</i>)}</span> : <span className="card-desc">{item.description}</span>}
        <span className="card-foot"><span className="card-price">{price}</span><span className="add" aria-hidden><IconPlus width={18} height={18} /></span></span>
      </motion.button>
    </li>
  );
}
