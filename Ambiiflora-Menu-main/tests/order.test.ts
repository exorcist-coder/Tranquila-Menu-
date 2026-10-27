import { describe, expect, it } from "vitest";
import { findItem, isDrink, VAT_RATE } from "../src/lib/catalog";
import { vatBreakdown, isValidSelection, missingGroups, priceRange, unitPrice } from "../src/lib/pricing";
import { orderingStatus } from "../src/lib/hours";
import { prepareOrder } from "../src/lib/order";

const swallow = findItem("swallow-soup")!, rice = findItem("rice")!, lager = findItem("lager")!, wineItem = findItem("wine-nederburg-red")!;
const cfg = { whatsapp: "2348000000000", hours: { open: "08:00", close: "22:00", paused: false } };
const noon = new Date("2026-10-12T11:00:00Z"); // 12:00 Lagos
const vat = (n: number) => Math.round(n * (1 + VAT_RATE));

describe("pricing", () => {
  it("adds swallow, soup and optional protein, VAT-inclusive", () => {
    expect(unitPrice(swallow, { swallow: "garri", soup: "egusi" })).toBe(vat(1500) + vat(3000));
    expect(unitPrice(swallow, { swallow: "garri", soup: "egusi", protein: "goat-meat" })).toBe(vat(1500) + vat(3000) + vat(6000));
  });
  it("needs a swallow and a soup, but protein is optional", () => {
    expect(missingGroups(swallow, {}).map((g) => g.id)).toEqual(["swallow", "soup"]);
    expect(missingGroups(swallow, { swallow: "semo", soup: "okro" })).toHaveLength(0);
  });
  it("rice is priced by the style chosen", () => {
    expect(unitPrice(rice, { choice: "coconut" })).toBe(vat(5000));
    expect(isValidSelection(rice, { choice: "jollof" })).toBe(true);
    expect(isValidSelection(rice, { choice: "nope" })).toBe(false);
  });
  it("drinks are priced from the list and flagged as drinks", () => {
    expect(unitPrice(lager, { choice: "heineken" })).toBe(vat(3000));
    expect(unitPrice(wineItem, {})).toBe(vat(32000));
    expect(isDrink(wineItem.category)).toBe(true);
    expect(isDrink(swallow.category)).toBe(false);
  });
  it("shows a from-price range", () => { expect(priceRange(lager)).toEqual([vat(2500), vat(3000)]); });
});

describe("receipt VAT", () => {
  it("shelf price is the 10% column", () => { expect(unitPrice(findItem("wine-nederburg-red")!, {})).toBe(35200); });
  it("splits the total into net + 7.5% VAT without changing it", () => {
    const b = vatBreakdown(11000);
    expect(b.net + b.vat).toBe(11000);
    expect(b.vat).toBe(767);
  });
});

describe("hours", () => {
  it("opens and closes in Lagos time", () => {
    expect(orderingStatus(cfg.hours, noon).open).toBe(true);
    expect(orderingStatus(cfg.hours, new Date("2026-10-12T23:30:00Z")).open).toBe(false); // 00:30 Lagos
    expect(orderingStatus({ ...cfg.hours, paused: true }, noon).open).toBe(false);
  });
  it("supports overnight windows", () => {
    const h = { open: "18:00", close: "02:00", paused: false };
    expect(orderingStatus(h, new Date("2026-10-12T23:30:00Z")).open).toBe(true);
    expect(orderingStatus(h, new Date("2026-10-12T11:00:00Z")).open).toBe(false);
  });
});

describe("prepareOrder (server is the source of truth)", () => {
  const good = { lines: [{ itemId: "swallow-soup", sel: { swallow: "garri", soup: "egusi", protein: "goat-meat" }, qty: 2 }], fulfilment: "room", room: "204", payment: "cash" };
  it("builds a message and WhatsApp link with server-computed totals", () => {
    const r = prepareOrder(good, cfg, noon, "TRQ-TEST01");
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.total).toBe(2 * (Math.round(1500 * (1 + VAT_RATE)) + Math.round(3000 * (1 + VAT_RATE)) + Math.round(6000 * (1 + VAT_RATE)))); expect(r.message).toContain("Room 204"); expect(r.waUrl.startsWith("https://wa.me/2348000000000?text=")).toBe(true); }
  });
  it("requires a name and reachable contact for collection and includes both in the WhatsApp message", () => {
    const collect = { ...good, fulfilment: "collect", room: undefined };
    expect(prepareOrder(collect, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...collect, contact: "+234 801 234 5678" }, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...collect, guestName: "Amina Bello" }, cfg, noon).ok).toBe(false);
    const r = prepareOrder({ ...collect, guestName: "Amina Bello", contact: "+234 801 234 5678" }, cfg, noon, "TRQ-PICKUP1");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.message).toContain("Collection for: Amina Bello");
      expect(r.message).toContain("Pickup contact: +234 801 234 5678");
    }
  });
  it("ignores any client-supplied price", () => {
    const r = prepareOrder({ ...good, lines: [{ ...good.lines[0], price: 1 }] }, cfg, noon);
    expect(r.ok && r.total).toBe(24000);
  });
  it("rejects an item marked sold out by the branch", () => {
    const r = prepareOrder(good, cfg, noon, "TRQ-SOLD01", [{ ...swallow, available: false }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("Swallow & Soup is sold out at this hotel. Remove it from your basket to continue.");
  });
  it("rejects when closed, empty, tampered or incomplete", () => {
    expect(prepareOrder(good, cfg, new Date("2026-10-12T23:30:00Z")).ok).toBe(false);
    expect(prepareOrder({ ...good, lines: [] }, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...good, lines: [{ itemId: "nope", sel: {}, qty: 1 }] }, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...good, lines: [{ ...good.lines[0], qty: 99 }] }, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...good, lines: [{ ...good.lines[0], sel: { swallow: "eba" } }] }, cfg, noon).ok).toBe(false);
    expect(prepareOrder({ ...good, room: "" }, cfg, noon).ok).toBe(false);
    expect(prepareOrder(null, cfg, noon).ok).toBe(false);
  });
});
