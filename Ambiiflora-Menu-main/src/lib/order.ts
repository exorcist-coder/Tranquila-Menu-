import { findItem, type Item } from "./catalog";
import { describeSelection, isValidSelection, naira, unitPrice, vatBreakdown, type Selection } from "./pricing";
import { orderingStatus, type Hours } from "./hours";

export type OrderInput = {
  lines: { itemId: string; sel: Selection; qty: number; note?: string }[];
  fulfilment: "room" | "collect";
  room?: string;
  guestName?: string;
  contact?: string;
  payment: "cash" | "pos";
  note?: string;
};
export type OrderResult =
  | { ok: true; ref: string; total: number; message: string; waUrl: string; lines: { name: string; summary: string; qty: number; lineTotal: number }[] }
  | { ok: false; errors: string[] };

const clean = (s: unknown, max: number): string => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "");

/** The server is the source of truth for price, availability and hours. Nothing from the client is trusted. */
export function prepareOrder(input: unknown, cfg: { whatsapp: string; hotelName?: string; hours: Hours }, now: Date = new Date(), ref = `TRQ-${globalThis.crypto.randomUUID().slice(0, 6).toUpperCase()}`, catalogItems?: Item[]): OrderResult {
  const errors: string[] = [];
  const body = (input ?? {}) as Partial<OrderInput>;
  const status = orderingStatus(cfg.hours, now);
  if (!status.open) errors.push(status.reason);

  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (rawLines.length === 0) errors.push("Your basket is empty.");
  if (rawLines.length > 30) errors.push("Too many items in one order.");

  const lines: Extract<OrderResult, { ok: true }>["lines"] = [];
  const notes: (string | undefined)[] = [];
  for (const l of rawLines.slice(0, 30)) {
    const item = typeof l?.itemId === "string" ? (catalogItems ? catalogItems.find(candidate => candidate.id === l.itemId) : findItem(l.itemId)) : undefined;
    const qty = Number(l?.qty);
    if (!item) { errors.push("An item is no longer on the menu."); continue; }
    if (item.available === false) { errors.push(`${item.name} is sold out at this hotel. Remove it from your basket to continue.`); continue; }
    const sel = l.sel && typeof l.sel === "object" ? (l.sel as Selection) : {};
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) { errors.push(`Check the quantity for ${item.name}.`); continue; }
    if (!isValidSelection(item, sel)) { errors.push(`Finish choosing options for ${item.name}.`); continue; }
    lines.push({ name: item.name, summary: describeSelection(item, sel), qty, lineTotal: unitPrice(item, sel) * qty });
    notes.push(clean(l.note, 120) || undefined);
  }

  const room = clean(body.room, 12);
  if (body.fulfilment !== "room" && body.fulfilment !== "collect") errors.push("Choose delivery or collection.");
  if (body.fulfilment === "room" && !room) errors.push("Enter your room number.");
  const guestName = clean(body.guestName, 80);
  if (body.fulfilment === "collect" && !guestName) errors.push("Enter a name for collection.");
  const contact = clean(body.contact, 32);
  const contactDigits = contact.replace(/\D/g, "").length;
  if (body.fulfilment === "collect" && (contactDigits < 10 || contactDigits > 15)) errors.push("Enter a valid phone number for pickup updates.");
  if (body.payment !== "cash" && body.payment !== "pos") errors.push("Choose how you will pay.");
  if (errors.length) return { ok: false, errors };

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  const vb = vatBreakdown(total);
  const msg = [
    `*${cfg.hotelName ?? "Tranquila Hotels and Suites"}*`, `Order ${ref}`, "",
    body.fulfilment === "room" ? `Room delivery · Room ${room}` : "Collection",
    ...(body.fulfilment === "collect" ? [`Collection for: ${guestName}`, `Pickup contact: ${contact}`] : []),
    `Payment: ${body.payment === "cash" ? "Cash" : "POS"} (in person)`, "",
    ...lines.flatMap((l, i) => [`${l.qty} × ${l.name}${l.summary ? ` (${l.summary})` : ""} — ${naira(l.lineTotal)}`, ...(notes[i] ? [`   Note: ${notes[i]}`] : [])]),
    "", `Subtotal (excl. VAT): ${naira(vb.net)}`, `7.5% VAT inclusive: ${naira(vb.vat)}`, `*Total: ${naira(total)}*`, ...(clean(body.note, 200) ? ["", `Guest note: ${clean(body.note, 200)}`] : []),
  ].join("\n");
  return { ok: true, ref, total, message: msg, waUrl: `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`, lines };
}
