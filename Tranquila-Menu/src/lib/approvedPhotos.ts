import type { Item } from "./catalog";

/** Shared by Main Hotel and Nest. Only upgrade unchanged shipped galleries. */
export const APPROVED_GALLERIES: Readonly<Record<string, readonly string[]>> = {
  "eggs": [
    "scrambled-eggs-fries-plantain",
    "fried-egg",
    "scrambled-eggs",
    "omelette",
    "spanish-omelette"
  ],
  "swallow-soup": [
    "approved-egusi-assorted",
    "approved-okra-seafood",
    "okra-fufu",
    "egusi",
    "poundo-efo",
    "efo-riro",
    "efo-beef",
    "fufu-ogbono",
    "okra-seafood",
    "white-soup"
  ],
  "pepper-soup": [
    "assorted-meat-pepper-soup",
    "assorted-meat-soup",
    "pepper-soup",
    "seafood-pepper-soup"
  ],
  "rice": [
    "approved-white-rice-stew",
    "approved-chicken-fried-rice",
    "jollof-rice",
    "white-rice",
    "fried-rice",
    "special-rice",
    "jambalaya-rice"
  ],
  "spaghetti": [
    "approved-jollof-spaghetti",
    "spaghetti-bolognese",
    "tomato-spaghetti",
    "cream-spaghetti",
    "stir-fried-spaghetti",
    "bolognese-spaghetti"
  ],
  "indomie": [
    "indomie-sausage-boiled-eggs",
    "indomie-special-fried-eggs",
    "indomie-omelette",
    "indomie-noodles",
    "indomie-eggs-photo"
  ],
  "sides": [
    "fried-yam-pepper-sauce",
    "approved-mixed-vegetable-salad",
    "fries",
    "plantain-fried",
    "plantain-boiled",
    "yam-side",
    "mashed-potatoes"
  ],
  "caesar": [
    "approved-chicken-caesar-salad",
    "approved-chicken-salad-grilled",
    "approved-chicken-egg-salad",
    "approved-chicken-sandwich-toasted",
    "chicken-caesar-salad"
  ],
  "special-salad": [
    "approved-mixed-salad-egg",
    "vegetable-salad"
  ],
  "veg-salad": [
    "approved-mixed-vegetable-salad",
    "vegetable-salad"
  ],
  "club": [
    "approved-stacked-club-sandwich",
    "approved-club-sandwich-toasted",
    "approved-chicken-club-grilled",
    "approved-chicken-sandwich-layered",
    "approved-chicken-sandwich-grilled",
    "club-sandwich",
    "sandwich"
  ],
  "hot-drinks": [
    "approved-latte-coffee",
    "approved-black-coffee",
    "approved-milk-coffee",
    "approved-milo-hot"
  ],
  "juice": [
    "approved-watermelon-juice"
  ],
  "smoothie": [
    "approved-assorted-juice"
  ]
};
const originals: Readonly<Record<string, readonly string[] | null>> = {
  "eggs": [
    "fried-egg",
    "scrambled-eggs",
    "omelette",
    "spanish-omelette"
  ],
  "swallow-soup": [
    "okra-fufu",
    "egusi",
    "poundo-efo",
    "efo-riro",
    "efo-beef",
    "fufu-ogbono",
    "okra-seafood",
    "white-soup"
  ],
  "pepper-soup": [
    "pepper-soup",
    "seafood-pepper-soup"
  ],
  "rice": [
    "jollof-rice",
    "white-rice",
    "fried-rice",
    "special-rice",
    "jambalaya-rice"
  ],
  "spaghetti": [
    "tomato-spaghetti",
    "cream-spaghetti",
    "stir-fried-spaghetti",
    "bolognese-spaghetti"
  ],
  "indomie": [
    "indomie-noodles",
    "indomie-eggs-photo"
  ],
  "sides": [
    "fries",
    "plantain-fried",
    "plantain-boiled",
    "yam-side",
    "mashed-potatoes"
  ],
  "caesar": [
    "chicken-caesar-salad"
  ],
  "special-salad": [
    "vegetable-salad"
  ],
  "veg-salad": [
    "vegetable-salad"
  ],
  "club": [
    "club-sandwich",
    "sandwich"
  ],
  "hot-drinks": null,
  "juice": null,
  "smoothie": null
};

export function withApprovedPhotos<T extends Item>(item: T): T {
  const approved = APPROVED_GALLERIES[item.id];
  const original = originals[item.id];
  if (!approved || item.imageUrl) return item;
  const unchanged = item.photos === undefined ? original == null : original != null && item.photos.length === original.length && item.photos.every((key, index) => key === original[index]);
  // Empty galleries and staff changes are deliberate and must remain editable.
  return unchanged ? { ...item, photos: [...approved] } : item;
}
