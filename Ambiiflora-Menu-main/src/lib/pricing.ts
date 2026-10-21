import { RECEIPT_VAT_RATE } from "./catalog";
import type { Group, Item, Option, When } from "./catalog";

/** groupId -> optionId (every group is single-choice) */
export type Selection = Record<string, string>;

export const isVisible = (when: When | undefined, sel: Selection): boolean =>
  !when || (sel[when.group] !== undefined && when.in.includes(sel[when.group] as string));

export const visibleOptions = (g: Group, sel: Selection): Option[] => g.options.filter((o) => isVisible(o.when, sel));

/** Drops picks whose group/option is hidden or unknown. Groups resolve in declared order. */
export function normalize(item: Item, sel: Selection): Selection {
  const clean: Selection = {};
  for (const g of item.groups) {
    if (!isVisible(g.when, clean)) continue;
    const pick = sel[g.id];
    if (pick !== undefined && visibleOptions(g, clean).some((o) => o.id === pick)) clean[g.id] = pick;
  }
  return clean;
}

export const visibleGroups = (item: Item, sel: Selection): Group[] => {
  const clean = normalize(item, sel);
  return item.groups.filter((g) => isVisible(g.when, clean));
};

/** Required visible groups that have no valid pick yet. */
export function missingGroups(item: Item, sel: Selection): Group[] {
  const clean = normalize(item, sel);
  return item.groups.filter((g) => g.required && isVisible(g.when, clean) && clean[g.id] === undefined);
}

/** True only if the selection is complete AND contains no hidden/unknown picks (used server-side). */
export function isValidSelection(item: Item, sel: Selection): boolean {
  const clean = normalize(item, sel);
  const same = Object.keys(sel).length === Object.keys(clean).length && Object.entries(sel).every(([k, v]) => clean[k] === v);
  return same && missingGroups(item, sel).length === 0;
}

export function unitPrice(item: Item, sel: Selection): number {
  const clean = normalize(item, sel);
  let total = item.basePrice;
  for (const g of item.groups) {
    const o = g.options.find((x) => x.id === clean[g.id]);
    if (o) total += o.price;
  }
  return total;
}

/** Lowest/highest price across unconditional required groups, for "from ₦X" on menu rows. */
export function priceRange(item: Item): [number, number] {
  let lo = item.basePrice, hi = item.basePrice;
  for (const g of item.groups) {
    if (!g.required || g.when) continue;
    const prices = g.options.filter((o) => !o.when).map((o) => o.price);
    if (prices.length) { lo += Math.min(...prices); hi += Math.max(...prices); }
  }
  return [lo, hi];
}

export function describeSelection(item: Item, sel: Selection): string {
  const clean = normalize(item, sel);
  return item.groups.map((g) => g.options.find((o) => o.id === clean[g.id])?.label).filter(Boolean).join(" · ");
}

export const naira = (n: number): string => `₦${Math.round(n).toLocaleString("en-US")}`;

/** Should an option's price be displayed? Absolute groups only when prices differ; add-on groups when non-zero. */
export function showsPrice(g: Group, o: Option): boolean {
  if (g.mode === "addon") return o.price > 0;
  return new Set(g.options.map((x) => x.price)).size > 1;
}

/** Splits a VAT-inclusive total into net and 7.5% VAT for the receipt. The total itself never changes. */
export function vatBreakdown(total: number): { net: number; vat: number; total: number } {
  const net = Math.round(total / (1 + RECEIPT_VAT_RATE));
  return { net, vat: total - net, total };
}
