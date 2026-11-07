"use client";
import { sileo, type SileoOptions } from "sileo";

type Kind = "success" | "error" | "warning" | "info" | "action";
type Action = { label: string; run: () => void };
let active: { id: string; token: number } | undefined;
let revision = 0;
const listeners = new Set<() => void>();

export function subscribeNotificationChanges(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const notificationToken = () => active?.token;
export function dismissNotification(expectedToken?: number) {
  if (!active || (expectedToken !== undefined && active.token !== expectedToken)) return;
  const id = active.id;
  active = undefined;
  sileo.dismiss(id);
}

/** Sileo replaces its single public toast slot; a revision protects newer feedback. */
export function showNotification(kind: Kind, options: SileoOptions, action?: Action) {
  const token = ++revision;
  let used = false;
  const duration = options.duration ?? (options.description || action ? 6000 : 2000);
  const id = sileo[kind]({
    ...options,
    position: options.position ?? (typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches ? "bottom-center" : "top-right"),
    duration,
    autopilot: options.description || action ? { expand: 180, collapse: Math.max(180, duration - 1200) } : false,
    ...(action ? { button: { title: action.label, onClick: () => {
      if (used || active?.token !== token) return;
      used = true;
      action.run();
      dismissNotification(token);
    } } } : {}),
  });
  active = { id, token };
  listeners.forEach(listener => listener());
  return id;
}
