import { withApprovedPhotos } from "./approvedPhotos";
import { CATEGORIES, ITEMS, type CategoryId, type Item } from "./catalog";
import { BRANCHES, type BranchId } from "./branches";

export type MenuDocument = { categories: { id: CategoryId; label: string; visible?: boolean }[]; items: (Item & { visible?: boolean; published?: boolean; featured?: boolean; image?: string })[] };
export type HotelSettings = { whatsapp: string; open: string; close: string; paused: boolean };
const fallbackMenu: MenuDocument = { categories: CATEGORIES.map(c => ({ ...c, visible: true })), items: ITEMS.map((i) => ({ ...i, visible: true, published: true, featured: false })) };
function requirePhotos() { return { "yam-egg-sauce": 1, "rice-stew": 1, "akara-pap": 1, "plantain-fried": 1, "efo-riro": 1, "egusi": 1, "poundo-efo": 1, "okra-fufu": 1, "yam-fish": 1, "rice-beans-egg": 1, "akara-custard": 1, "fufu-ogbono": 1, "efo-beef": 1, "okra-seafood": 1, "plantain-boiled": 1, "rice-beans-plantain": 1 }; }
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
export async function getMenu(publishedOnly = true, branchId: BranchId = "tranquila"): Promise<MenuDocument> {
  if (!cmsConfigured()) return { ...fallbackMenu, items: fallbackMenu.items.map(item => ({ ...item, available: true })) };
  let source = fallbackMenu;
  try {
    const rows = await db(`tranquila_branch_cms?branch_id=eq.${encodeURIComponent(branchId)}&select=menu,published_menu,draft_initialized,published_initialized`);
    const row = Array.isArray(rows) ? rows[0] : null;
    const menu = publishedOnly ? row?.published_menu : row?.menu;
    const initialized = publishedOnly ? row?.published_initialized : row?.draft_initialized;
    source = initialized && menu && Array.isArray(menu.items) ? menu as MenuDocument : fallbackMenu;
  } catch {
    return { ...fallbackMenu, items: fallbackMenu.items.map(item => ({ ...item, available: false })) };
  }
  source = { ...source, items: source.items.map(withApprovedPhotos) };
  // Keep the stable category ID while showing the updated label, including on previously saved CMS menus.
  source = { ...source, categories: source.categories.map(category => category.id === "spirits" ? { ...category, label: "Whiskey" } : category) };
  try {
    const availability = await getItemAvailability(branchId);
    return { ...source, items: source.items.map(item => ({ ...item, available: availability[item.id] !== false })) };
  } catch {
    return { ...source, items: source.items.map(item => ({ ...item, available: false })) };
  }
}
export async function saveMenu(menu: MenuDocument, published: boolean, staffId?: string, branchId: BranchId = "tranquila") {
  if (!staffId) throw new Error("STAFF_AUTHORIZATION_REQUIRED");
  const cleanMenu = { ...menu, items: menu.items.map(({ available: _available, ...item }) => item) };
  // One RPC means backup, menu save and audit always commit together.
  const result = await db("rpc/tranquila_admin_save_menu", {
    method: "POST",
    body: JSON.stringify({
      p_branch: branchId,
      p_actor: staffId,
      p_menu: cleanMenu,
      p_publish: published,
      p_fallback_menu: fallbackMenu
    })
  });
  if (result?.ok !== true || result.branch !== branchId || result.action !== (published ? "menu_published" : "menu_draft_saved")) {
    throw new Error("MENU_SAVE_NOT_CONFIRMED");
  }
}
export async function getSettings(branchId: BranchId = "tranquila"): Promise<HotelSettings> {
  const defaults = { whatsapp: BRANCHES.find(branch => branch.id === branchId)?.whatsapp ?? "2348101702422", open: process.env.ORDERING_OPEN ?? "08:00", close: process.env.ORDERING_CLOSE ?? "08:00", paused: process.env.ORDERING_PAUSED === "1" };
  if (!cmsConfigured()) return defaults;
  try { const rows = await db(`tranquila_branch_settings?branch_id=eq.${encodeURIComponent(branchId)}&select=whatsapp,open,close,paused`); return Array.isArray(rows) && rows[0] ? { ...defaults, ...rows[0] } : defaults; } catch { return defaults; }
}
export async function saveSettings(settings: HotelSettings, branchId: BranchId = "tranquila") {
  const rows = await db(`tranquila_branch_settings?branch_id=eq.${encodeURIComponent(branchId)}&select=branch_id`);
  if (Array.isArray(rows) && rows.length) await db(`tranquila_branch_settings?branch_id=eq.${encodeURIComponent(branchId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(settings) });
  else await db("tranquila_branch_settings", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ branch_id: branchId, ...settings }) });
}
export async function getItemAvailability(branchId: BranchId): Promise<Record<string, boolean>> {
  if (!cmsConfigured()) return {};
  const rows = await db(`tranquila_item_availability?branch_id=eq.${encodeURIComponent(branchId)}&select=item_id,available`);
  return Object.fromEntries((Array.isArray(rows) ? rows : []).map((row: { item_id: string; available: boolean }) => [row.item_id, row.available]));
}
export async function setItemAvailability(branchId: BranchId, itemId: string, available: boolean, staffId: string) {
  // Availability and its audit record must commit together. A failed audit
  // must never leave the switch changed while telling staff it failed.
  const result = await db("rpc/tranquila_admin_action", {
    method: "POST",
    body: JSON.stringify({
      p_action: "set_availability",
      p_branch: branchId,
      p_actor: staffId,
      p_item_id: itemId,
      p_available: available,
      p_fallback_menu: fallbackMenu
    })
  });
  if (result?.ok !== true || result.action !== "set_availability" || result.item_id !== itemId) {
    throw new Error("STOCK_CHANGE_NOT_CONFIRMED");
  }
}
export async function requireAdmin(request: Request, minimum: "staff" | "admin" = "staff") {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !cmsConfigured()) return null;
  const response = await fetch(`${url()}/auth/v1/user`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json() as { id: string };
  const rows = await db(`tranquila_staff?id=eq.${encodeURIComponent(user.id)}&select=role,active`);
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile?.active || (minimum === "admin" && profile.role !== "admin")) return null;
  return { id: user.id, role: profile.role as "admin" | "staff" };
}
export { fallbackMenu };
