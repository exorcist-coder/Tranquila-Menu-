"use client";
import type { MenuSearchHit } from "@/lib/menuSearch";
import { searchPhotoIndex } from "@/lib/searchPhoto";
import { isDrink } from "@/lib/catalog";
import { missingGroups, naira, priceRange, unitPrice } from "@/lib/pricing";
import Media, { Bottle } from "./Media";
import { IconPlus } from "./icons";

export default function SearchResult({ hit, onOpen }: { hit: MenuSearchHit; onOpen: () => void }) {
  const { item } = hit;
  const soldOut = item.available === false;
  const selectionComplete = hit.option && missingGroups(item, hit.selection).length === 0;
  const [minimum] = priceRange(item);
  const price = selectionComplete ? unitPrice(item, hit.selection) : minimum;
  const photoIndex = searchPhotoIndex(item, hit.option, hit.label);
  return (
    <li className="search-result-li">
      <button type="button" className="search-result" onClick={onOpen} disabled={soldOut} aria-label={`${hit.label}, ${naira(price)}${soldOut ? ", sold out" : ""}`}>
        <span className="search-result-photo">
          {isDrink(item.category) ? <Bottle item={item} /> : <Media key={`${item.id}-${photoIndex}`} item={item} index={photoIndex} alt={hit.label} radius={14} />}
        </span>
        <span className="search-result-copy">
          <strong className="search-result-name">{hit.label}</strong>
          <span className="search-result-sub">{hit.subtitle}</span>
          <span className="search-result-price">{!selectionComplete && minimum !== priceRange(item)[1] ? "from " : ""}{naira(price)}</span>
        </span>
        <span className="search-result-action" aria-hidden>{soldOut ? "Sold out" : <IconPlus width={18} height={18}/>}</span>
      </button>
    </li>
  );
}
