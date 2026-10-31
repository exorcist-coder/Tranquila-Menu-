export type Hours = { open: string; close: string; paused: boolean };
const toMin = (hhmm: string): number => { const [h = "0", m = "0"] = hhmm.split(":"); return Number(h) * 60 + Number(m); };

/** Evaluated in Africa/Lagos (WAT, no DST). Supports overnight windows (close < open). */
export function lagosMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}

export function orderingStatus(h: Hours, now: Date = new Date()): { open: boolean; reason: string } {
  if (h.paused) return { open: false, reason: "Ordering is paused right now." };
  const m = lagosMinutes(now), o = toMin(h.open), c = toMin(h.close);
  const open = o === c ? true : o < c ? m >= o && m < c : m >= o || m < c;
  return { open, reason: open ? (o === c ? "Taking orders 24 hours" : `Taking orders until ${h.close}`) : `Kitchen opens at ${h.open}` };
}
