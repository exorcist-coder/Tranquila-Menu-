"use client";
import { useSyncExternalStore } from "react";

export type ToastState = { id: number; message: string; action?: { label: string; run: () => void } } | null;
let state: ToastState = null, n = 0, timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const toast = {
  show(message: string, action?: { label: string; run: () => void }, ms = 7000) {
    clearTimeout(timer); state = { id: ++n, message, action }; emit();
    timer = setTimeout(() => toast.hide(), ms);
  },
  hide() { clearTimeout(timer); state = null; emit(); },
};
export const useToast = (): ToastState => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state, () => null);