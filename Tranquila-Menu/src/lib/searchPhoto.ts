import type { Item } from "./catalog";
import { PHOTOS } from "./photos";

/** Search previews use photos already assigned to the parent item's gallery. */
const aliases: Record<string, Record<string, string>> = {
  rice: { jollof: "jollof-rice", white: "white-rice", fried: "fried-rice", basmati: "white-rice", "curry-fried": "fried-rice", "special-fried": "special-rice", "steamed-chicken-fried": "fried-rice", jambalaya: "jambalaya-rice" },
  spaghetti: { jollof: "tomato-spaghetti", "white-sauce": "cream-spaghetti", vegetable: "tomato-spaghetti", white: "cream-spaghetti", "stir-fried": "stir-fried-spaghetti", bolognese: "bolognese-spaghetti", alfredo: "cream-spaghetti" },
  pasta: { "creamy-chicken": "creamy-pasta", alfredo: "alfredo-pasta", seafood: "seafood-pasta" },
  indomie: { indomie: "indomie-noodles", "indomie-eggs": "indomie-eggs-photo" },
  eggs: { "boiled-egg": "fried-egg", "fried-egg": "fried-egg", "scrambled-egg": "scrambled-eggs", "sunny-side-up": "fried-egg", omelette: "omelette", "spanish-omelette": "spanish-omelette", "vegetable-omelette": "omelette" },
  sides: { "french-fries": "fries", "fried-plantain": "plantain-fried", "boiled-plantain": "plantain-boiled", "fried-yam": "yam-side", "boiled-yam": "yam-side", "mashed-potatoes": "mashed-potatoes" },
  "swallow-soup": { egusi: "egusi", okro: "okra-fufu", "seafood-okro": "okra-seafood", "fisherman-soup": "okra-seafood", ogbono: "fufu-ogbono", vegetable: "efo-riro", "white-soup": "white-soup", beef: "efo-beef" },
  peppered: { beef: "peppered-beef", chicken: "peppered-chicken", catfish: "peppered-fish", "croaker-fish": "peppered-fish-red" },
  "chef-sauces": { "chicken-curry": "chicken-curry", "shredded-beef": "shredded-beef", "shredded-chicken": "chicken-curry", "shrimps-provenc-al": "prawns" },
  "porridge-local": { "porridge-beans": "porridge-beans", "porridge-potatoes": "porridge-potatoes", "porridge-yam": "porridge-yam" },
};

function tokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(w => w.length > 2 && !["the", "and", "only", "with", "soup", "rice", "style", "small", "big"].includes(w));
}

/** Exact manual matches first; otherwise find the closest named photo already in the carousel. */
export function searchPhotoIndex(item: Item, option?: { groupId: string; optionId: string }, label?: string): number {
  const photos = item.photos ?? [];
  if (!option || photos.length < 2) return 0;
  const alias = aliases[item.id]?.[option.optionId];
  const exact = alias ? photos.indexOf(alias) : -1;
  if (exact >= 0 && PHOTOS[photos[exact]!]) return exact;
  const terms = tokens(label ?? option.optionId);
  if (!terms.length) return 0;
  let bestIndex = 0;
  let bestScore = 0;
  photos.forEach((key, index) => {
    const photoWords = tokens(key);
    const score = terms.filter(t => photoWords.some(p => p === t || p.startsWith(t) || t.startsWith(p))).length;
    if (score > bestScore && PHOTOS[key]) { bestScore = score; bestIndex = index; }
  });
  return bestIndex;
}
