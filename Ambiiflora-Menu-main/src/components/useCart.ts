"use client";
import { useSyncExternalStore } from "react";
import { findItem } from "@/lib/catalog";
import { isValidSelection } from "@/lib/pricing";
import type { Selection } from "@/lib/pricing";
import type { BranchId } from "@/lib/branches";

export type Line = { id: string; itemId: string; sel: Selection; qty: number; note: string };
const EMPTY: Line[] = [];
type Store = { lines: Line[]; loaded: boolean; subs: Set<() => void> };
const stores = new Map<BranchId, Store>();

function storeFor(branchId: BranchId): Store {
  let store = stores.get(branchId);
  if (!store) { store = { lines: [], loaded: false, subs: new Set() }; stores.set(branchId, store); }
  return store;
}
const storageKey = (branchId: BranchId) => branchId === "tranquila" ? "tranquila.cart.v1" : `tranquila.cart.v1.${branchId}`;

const isLine = (x: unknown): x is Line => {
  const l = x as Line;
  return !!l && typeof l.id === "string" && typeof l.itemId === "string" && l.itemId.length > 0 && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 20 && l.sel !== null && typeof l.sel === "object" && !Array.isArray(l.sel) && Object.values(l.sel).every(v => typeof v === "string") && (l.note === undefined || typeof l.note === "string");
};
function persist(branchId: BranchId) {
  const store = storeFor(branchId);
  try { localStorage.setItem(storageKey(branchId), JSON.stringify(store.lines)); } catch { /* storage unavailable */ }
  store.subs.forEach((f) => f());
}
function load(branchId: BranchId) {
  const store = storeFor(branchId);
  store.loaded = true;
  try { const p = JSON.parse(localStorage.getItem(storageKey(branchId)) ?? "[]"); if (Array.isArray(p)) store.lines = p.filter(isLine); } catch { /* ignore */ }
}
const sig = (l: Pick<Line, "itemId" | "sel" | "note">) => JSON.stringify([l.itemId, Object.entries(l.sel).sort(), l.note]);

export const cart = {
  add(branchId: BranchId, line: Omit<Line, "id">) {
    const store = storeFor(branchId);
    const hit = store.lines.find((x) => sig(x) === sig(line));
    store.lines = hit ? store.lines.map((x) => (x === hit ? { ...x, qty: Math.min(20, x.qty + line.qty) } : x)) : [...store.lines, { ...line, id: crypto.randomUUID() }];
    persist(branchId);
  },
  pruneInvalid(branchId: BranchId) { const store = storeFor(branchId); store.lines = store.lines.filter(l => { const item = findItem(l.itemId); return !!item && isValidSelection(item, l.sel); }); persist(branchId); },
  setQty(branchId: BranchId, id: string, qty: number) { const store = storeFor(branchId); store.lines = store.lines.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)); persist(branchId); },
  remove(branchId: BranchId, id: string) { const store = storeFor(branchId); store.lines = store.lines.filter((x) => x.id !== id); persist(branchId); },
  /** Empties the basket and returns what was in it, so the caller can offer Undo. */
  clear(branchId: BranchId = "tranquila"): Line[] { const store = storeFor(branchId); const prev = store.lines; store.lines = []; persist(branchId); return prev; },
  restore(prev: Line[], branchId: BranchId = "tranquila") { const store = storeFor(branchId); store.lines = prev.filter(isLine); persist(branchId); },
};

export function useCart(branchId: BranchId = "tranquila"): Line[] {
  const store = storeFor(branchId);
  return useSyncExternalStore(
    (cb) => { store.subs.add(cb); if (!store.loaded) { load(branchId); queueMicrotask(cb); } return () => { store.subs.delete(cb); }; },
    () => store.lines,
    () => EMPTY,
  );
}
