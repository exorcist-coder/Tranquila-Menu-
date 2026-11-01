"use client";
import type { ReactNode } from "react";

export type AdminIconName =
  | "overview" | "menu" | "draft" | "archive" | "history" | "categories" | "settings"
  | "search" | "plus" | "chevron" | "arrow" | "back" | "close" | "grid" | "list"
  | "filter" | "refresh" | "check" | "clock" | "eye" | "edit" | "trash"
  | "logout" | "store" | "bell" | "shield" | "more" | "image" | "upload" | "sparkle";

const drawings: Record<AdminIconName, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  menu: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
  draft: <><path d="m15 5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z"/><path d="M4 20h16"/></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></>,
  history: <><path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/><path d="M12 7v5l3 2"/></>,
  categories: <><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="11" cy="19" r="2" fill="currentColor" stroke="none"/></>,
  settings: <><path d="M9.6 2.8 8.8 5a8.5 8.5 0 0 0-2 1.1l-2.3-.4-2 3.5 1.5 1.8a8 8 0 0 0 0 2.3L2.5 15l2 3.5 2.3-.4a8.5 8.5 0 0 0 2 1.1l.8 2.2h4l.8-2.2a8.5 8.5 0 0 0 2-1.1l2.3.4 2-3.5-1.5-1.7a8 8 0 0 0 0-2.4l1.5-1.7-2-3.5-2.3.4a8.5 8.5 0 0 0-2-1.1l-.8-2.2z"/><circle cx="11.6" cy="12" r="3"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  plus: <path d="M12 4v16M4 12h16"/>,
  chevron: <path d="m9 6 6 6-6 6"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  back: <path d="M20 12H4m6 6-6-6 6-6"/>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></>,
  list: <><path d="M9 5h12M9 12h12M9 19h12"/><circle cx="4" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="19" r="1" fill="currentColor" stroke="none"/></>,
  filter: <><path d="M4 7h16M7 12h10M10 17h4"/><circle cx="8" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-5L3 9M3 3v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/></>,
  check: <path d="m4 12 5 5 11-11"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  edit: <><path d="m14 5 5 5M4 20l5-1 10-10a3 3 0 0 0-4-4L5 15l-1 5Z"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></>,
  logout: <><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M13 8l5 4-5 4M18 12H8"/></>,
  store: <><path d="M3 9 5 3h14l2 6v11H3V9Z"/><path d="M3 9c0 3 4 3 5 0 1 3 7 3 8 0 1 3 5 3 5 0M9 20v-7h6v7"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4"/></>,
  shield: <><path d="M12 2 4 6v6c0 6 4 9 8 10 4-1 8-4 8-10V6L12 2Z"/><path d="m8 12 3 3 5-6"/></>,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8" r="1.6"/><path d="m4 18 5-6 4 4 3-3 5 5"/></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 17v3h16v-3"/></>,
  sparkle: <><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"/></>
};

export function AdminIcon({ name, size = 19, className }: { name: AdminIconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{drawings[name]}</svg>;
}
