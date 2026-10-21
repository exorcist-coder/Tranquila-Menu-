import { CATEGORIES, ITEMS, type CategoryId, type Item } from "./catalog";

export type MenuDocument = { categories: { id: CategoryId; label: string; visible?: boolean }[]; items: (Item & { visible?: boolean; published?: boolean; featured?: boolean; image?: string })[] };
export type HotelSettings = { whatsapp: string; open: string; close: string; paused: boolean };
const fallbackMenu: MenuDocument = { categories: CATEGORIES.map(c => ({ ...c, visible: true })), items: ITEMS.map((i) => ({ ...i, visible: true, published: true, featured: false })) };
function requirePhotos() { return { "yam-egg-sauce": 1, "rice-stew": 1, "amala-ewedu": 1, "akara-pap": 1, "plantain-fried": 1, "efo-riro": 1, "egusi": 1, "poundo-efo": 1, "okra-fufu": 1, "yam-fish": 1, "rice-beans-egg": 1, "akara-custard": 1, "fufu-ogbono": 1, "efo-beef": 1, "okra-seafood": 1, "plantain-boiled": 1, "rice-beans-plantain": 1 }; }
const url = () => (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export function cmsConfigured() { return !!(url() && serviceKey()); }
async function db(path: string, init: RequestInit = {}) {
  if (!cmsConfigured()) throw new Error("CMS_NOT_CONFIGURED");
  const response = await fetch(`${url()}/rest/v1/${path}`, { ...init, cache: "no-store", headers: { apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`CMS_REQUEST_FAILED_${response.status}`);
  if (response.status === 204) return null;
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
export async function getMenu(publishedOnly = true): Promise<MenuDocument> {
  if (!cmsConfigured()) return fallbackMenu;
  try {
    const rows = await db(`ambiiflora_cms?id=eq.1&select=menu,published_menu,draft_initialized,published_initialized`);
    const row = Array.isArray(rows) ? rows[0] : null;
    const menu = publishedOnly ? row?.published_menu : row?.menu;
    const initialized = publishedOnly ? row?.published_initialized : row?.draft_initialized;
    return initialized && menu && Array.isArray(menu.items) ? menu as MenuDocument : fallbackMenu;
  } catch { return fallbackMenu; }
}
export async function saveMenu(menu: MenuDocument, published: boolean, staffId?: string) {
  const current = await db(`ambiiflora_cms?id=eq.1&select=menu,published_menu`);
  const currentRow = Array.isArray(current) ? current[0] : null;
  if (currentRow?.menu) await db("ambiiflora_menu_backups", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ menu: currentRow.menu, created_by: staffId ?? null, reason: published ? "before publish" : "before draft save" }) });
  const existing = await db(`ambiiflora_cms?id=eq.1&select=id`);
  const row = { id: 1, menu, draft_initialized: true, ...(published ? { published_menu: menu, published_initialized: true, published_at: new Date().toISOString() } : {}) };
  if (Array.isArray(existing) && existing.length) await db("ambiiflora_cms?id=eq.1", { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
  else await db("ambiiflora_cms", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...row, published_menu: published ? menu : fallbackMenu, published_initialized: published }) });
  await db("ambiiflora_audit_log", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ staff_id: staffId ?? null, action: published ? "menu_published" : "menu_draft_saved", details: { item_count: menu.items.length, category_count: menu.categories.length } }) });
}
export async function getSettings(): Promise<HotelSettings> {
  const defaults = { whatsapp: (process.env.WHATSAPP_NUMBER ?? "2348160784818").replace(/\D/g, ""), open: process.env.ORDERING_OPEN ?? "08:00", close: process.env.ORDERING_CLOSE ?? "22:00", paused: process.env.ORDERING_PAUSED === "1" };
  if (!cmsConfigured()) return defaults;
  try { const rows = await db("ambiiflora_settings?id=eq.1&select=whatsapp,open,close,paused"); return Array.isArray(rows) && rows[0] ? { ...defaults, ...rows[0] } : defaults; } catch { return defaults; }
}
export async function saveSettings(settings: HotelSettings) {
  const rows = await db("ambiiflora_settings?id=eq.1&select=id");
  if (Array.isArray(rows) && rows.length) await db("ambiiflora_settings?id=eq.1", { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(settings) });
  else await db("ambiiflora_settings", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: 1, ...settings }) });
}
export async function requireAdmin(request: Request, minimum: "staff" | "admin" = "staff") {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !cmsConfigured()) return null;
  const response = await fetch(`${url()}/auth/v1/user`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json() as { id: string };
  const rows = await db(`ambiiflora_staff?id=eq.${encodeURIComponent(user.id)}&select=role,active`);
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile?.active || (minimum === "admin" && profile.role !== "admin")) return null;
  return { id: user.id, role: profile.role as "admin" | "staff" };
}
export { fallbackMenu };
