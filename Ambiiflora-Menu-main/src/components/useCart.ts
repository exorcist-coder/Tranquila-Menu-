"use client";
import { useSyncExternalStore } from "react";
import { findItem } from "@/lib/catalog";
import { isValidSelection } from "@/lib/pricing";
import type { Selection } from "@/lib/pricing";

export type Line = { id: string; itemId: string; sel: Selection; qty: number; note: string };
const KEY = "tranquila.cart.v1";
const EMPTY: Line[] = [];
let lines: Line[] = [];
let loaded = false;
const subs = new Set<() => void>();

const isLine = (x: unknown): x is Line => {
  const l = x as Line;
  return !!l && typeof l.id === "string" && typeof l.itemId === "string" && l.itemId.length > 0 && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 20 && l.sel !== null && typeof l.sel === "object" && !Array.isArray(l.sel) && Object.values(l.sel).every(v => typeof v === "string") && (l.note === undefined || typeof l.note === "string");
};
function persist() { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ } subs.forEach((f) => f()); }
function load() {
  loaded = true;
  try { const p = JSON.parse(localStorage.getItem(KEY) ?? "[]"); if (Array.isArray(p)) lines = p.filter(isLine); } catch { /* ignore */ }
}
const sig = (l: Pick<Line, "itemId" | "sel" | "note">) => JSON.stringify([l.itemId, Object.entries(l.sel).sort(), l.note]);

export const cart = {
  add(l: Omit<Line, "id">) {
    const hit = lines.find((x) => sig(x) === sig(l));
    lines = hit ? lines.map((x) => (x === hit ? { ...x, qty: Math.min(20, x.qty + l.qty) } : x)) : [...lines, { ...l, id: crypto.randomUUID() }];
    persist();
  },
  pruneInvalid() { lines = lines.filter(l => { const item = findItem(l.itemId); return !!item && isValidSelection(item, l.sel); }); persist(); },
  setQty(id: string, qty: number) { lines = lines.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)); persist(); },
  remove(id: string) { lines = lines.filter((x) => x.id !== id); persist(); },
  /** Empties the basket and returns what was in it, so the caller can offer Undo. */
  clear(): Line[] { const prev = lines; lines = []; persist(); return prev; },
  restore(prev: Line[]) { lines = prev.filter(isLine); persist(); },
};

export function useCart(): Line[] {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); if (!loaded) { load(); queueMicrotask(cb); } return () => { subs.delete(cb); }; },
    () => lines,
    () => EMPTY,
  );
}
