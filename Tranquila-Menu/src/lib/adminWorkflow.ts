import { CATEGORIES, ITEMS, type Item } from "./catalog";
import type { BranchId } from "./branches";
import { getItemAvailability, type MenuDocument } from "./cms";

export type SavedDraft = { id: number; branch_id: BranchId; item_id: string; item: Item; updated_at: string; created_at: string };
export type ArchivedItem = { id: number; item_id: string; item: Item; archived_at: string };
export type HistoryEvent = { id: number; action: string; details: Record<string, unknown>; created_at: string };
export type Revision = { id: number; reason: string; created_at: string; menu: MenuDocument };

const defaultMenu = (): MenuDocument => ({
  categories: CATEGORIES.map(c => ({ ...c, visible: true })),
  items: ITEMS.map(i => ({ ...i, visible: true, published: true }))
});
const baseUrl = () => (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const adminStorageConfigured = () => Boolean(baseUrl() && key());

async function query(path: string, init: RequestInit = {}) {
  if (!adminStorageConfigured()) throw new Error("Server database credentials are not configured. Add SUPABASE_SERVICE_ROLE_KEY to this Vercel project.");
  const r = await fetch(baseUrl() + "/rest/v1/" + path, {
    ...init, cache: "no-store", headers: {
      apikey: key(), Authorization: "Bearer " + key(), "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  if (!r.ok) {
    const detail = await r.text();
    console.error("Tranquila admin database error", r.status, detail.slice(0, 400));
    throw new Error("Database operation failed (" + r.status + "). Your changes were not saved.");
  }
  if (r.status === 204) return null;
  const value = await r.text();
  return value ? JSON.parse(value) : null;
}
const json = (value: unknown) => JSON.stringify(value);
const headers = { Prefer: "return=minimal" };
const branchQuery = (branch: BranchId) => "branch_id=eq." + encodeURIComponent(branch);
const selectRow = async (branch: BranchId) => {
  const rows = await query("tranquila_branch_cms?" + branchQuery(branch) + "&select=menu,published_menu,draft_initialized,published_initialized");
  return (Array.isArray(rows) && rows[0]) || null;
};
const savedMenu = (row: any, published: boolean): MenuDocument => {
  const candidate = published ? row?.published_menu : row?.menu;
  const initialized = published ? row?.published_initialized : row?.draft_initialized;
  return initialized && Array.isArray(candidate?.items) && Array.isArray(candidate?.categories) ? candidate : defaultMenu();
};
function cleanItem(item: Item): Item {
  const { available: _available, ...clean } = item;
  return clean;
}
function replace(menu: MenuDocument, item: Item): MenuDocument {
  return { ...menu, items: menu.items.some(i => i.id === item.id)
    ? menu.items.map(i => i.id === item.id ? cleanItem(item) : i)
    : [...menu.items, cleanItem(item)] };
}
function omit(menu: MenuDocument, itemId: string): MenuDocument {
  return { ...menu, items: menu.items.filter(i => i.id !== itemId) };
}
async function history(branch: BranchId, actor: string, action: string, details: Record<string, unknown>) {
  await query("tranquila_audit_log", { method: "POST", headers, body: json({ staff_id: actor, action, details: { ...details, branch_id: branch } }) });
}
async function backup(branch: BranchId, actor: string, reason: string, menu: MenuDocument) {
  await query("tranquila_menu_backups", { method: "POST", headers, body: json({ branch_id: branch, created_by: actor, reason, menu }) });
}
async function writePublished(branch: BranchId, actor: string, operation: string, updated: MenuDocument, draftUpdated: MenuDocument, itemId: string) {
  const row = await selectRow(branch);
  const previous = savedMenu(row, true);
  await backup(branch, actor, "Before " + operation + ": " + itemId, previous);
  await query("tranquila_branch_cms?" + branchQuery(branch), {
    method: "PATCH", headers, body: json({
      published_menu: updated, published_initialized: true, published_at: new Date().toISOString(),
      menu: draftUpdated, draft_initialized: true, updated_at: new Date().toISOString()
    })
  });
  await history(branch, actor, operation, { item_id: itemId, count: updated.items.length });
}
export async function getPublished(branch: BranchId) {
  const menu = savedMenu(await selectRow(branch), true);
  // Availability is intentionally held outside the menu JSON so stock changes
  // can go live immediately without republishing the dish or changing a draft.
  const availability = await getItemAvailability(branch);
  return {
    ...menu,
    items: menu.items.map(item => ({
      ...item,
      available: availability[item.id] !== false
    }))
  };
}
export async function getDrafts(branch: BranchId): Promise<SavedDraft[]> {
  const rows = await query("tranquila_item_drafts?" + branchQuery(branch) + "&select=id,branch_id,item_id,item,created_at,updated_at&order=updated_at.desc&limit=500");
  return Array.isArray(rows) ? rows : [];
}
export async function upsertDraft(branch: BranchId, actor: string, item: Item) {
  if (!item.id || !item.name?.trim() || !item.category || !Number.isFinite(item.basePrice) || item.basePrice < 0 || !Array.isArray(item.groups)) {
    throw new Error("Add a valid name, category, price and item options.");
  }
  if (item.groups.some(g => !g.id || !g.label || !Array.isArray(g.options) || g.options.some(o => !o.id || !o.label || !Number.isFinite(o.price) || o.price < 0))) {
    throw new Error("Check the option groups and their prices.");
  }
  const clean = cleanItem(item);
  await query("tranquila_item_drafts?on_conflict=branch_id,item_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: json({ branch_id: branch, item_id: clean.id, item: clean, updated_by: actor, updated_at: new Date().toISOString() })
  });
  await history(branch, actor, "item_draft_saved", { item_id: item.id, name: item.name });
}
export async function discardDraft(branch: BranchId, actor: string, itemId: string) {
  await query("tranquila_item_drafts?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId), { method: "DELETE", headers });
  await history(branch, actor, "item_draft_discarded", { item_id: itemId });
}
export async function publishDraft(branch: BranchId, actor: string, itemId: string) {
  const drafts = await query("tranquila_item_drafts?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId) + "&select=item");
  const item: Item | undefined = Array.isArray(drafts) ? drafts[0]?.item : undefined;
  if (!item) throw new Error("Draft not found. It may have been deleted.");
  const row = await selectRow(branch);
  const published = replace(savedMenu(row, true), item);
  const working = replace(savedMenu(row, false), item);
  await writePublished(branch, actor, "item_published", published, working, itemId);
  await query("tranquila_item_drafts?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId), { method: "DELETE", headers });
  return published;
}
export async function getArchived(branch: BranchId): Promise<ArchivedItem[]> {
  const rows = await query("tranquila_archived_items?" + branchQuery(branch) + "&select=id,item_id,item,archived_at&order=archived_at.desc&limit=500");
  return Array.isArray(rows) ? rows : [];
}
export async function archiveItem(branch: BranchId, actor: string, itemId: string) {
  const row = await selectRow(branch);
  const published = savedMenu(row, true);
  const working = savedMenu(row, false);
  const item = published.items.find(i => i.id === itemId);
  if (!item) throw new Error("Item is not currently published.");
  await query("tranquila_archived_items?on_conflict=branch_id,item_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: json({ branch_id: branch, item_id: itemId, item: cleanItem(item), archived_by: actor, archived_at: new Date().toISOString() })
  });
  await writePublished(branch, actor, "item_archived", omit(published, itemId), omit(working, itemId), itemId);
  await query("tranquila_item_drafts?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId), { method: "DELETE", headers });
}
export async function restoreArchive(branch: BranchId, actor: string, itemId: string) {
  const rows = await query("tranquila_archived_items?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId) + "&select=item");
  const item: Item | undefined = Array.isArray(rows) ? rows[0]?.item : undefined;
  if (!item) throw new Error("Archived item not found.");
  const row = await selectRow(branch);
  await writePublished(branch, actor, "item_restored", replace(savedMenu(row, true), item), replace(savedMenu(row, false), item), itemId);
  await query("tranquila_archived_items?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId), { method: "DELETE", headers });
}
export async function permanentlyDelete(branch: BranchId, actor: string, itemId: string) {
  const existing = await query("tranquila_archived_items?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId) + "&select=id");
  if (!Array.isArray(existing) || !existing.length) throw new Error("Archive the item before permanently deleting it.");
  await query("tranquila_archived_items?" + branchQuery(branch) + "&item_id=eq." + encodeURIComponent(itemId), { method: "DELETE", headers });
  await history(branch, actor, "item_permanently_deleted", { item_id: itemId });
}
export async function getHistory(branch: BranchId) {
  const [logs, backups] = await Promise.all([
    query("tranquila_audit_log?details->>branch_id=eq." + encodeURIComponent(branch) + "&select=id,action,details,created_at&order=created_at.desc&limit=150"),
    query("tranquila_menu_backups?" + branchQuery(branch) + "&select=id,reason,created_at&order=created_at.desc&limit=70")
  ]);
  return { events: (Array.isArray(logs) ? logs : []) as HistoryEvent[],
    revisions: (Array.isArray(backups) ? backups : []) as Omit<Revision, "menu">[] };
}
export async function previewRevision(branch: BranchId, revisionId: number): Promise<Revision> {
  const rows = await query("tranquila_menu_backups?" + branchQuery(branch) + "&id=eq." + revisionId + "&select=id,reason,created_at,menu");
  if (!Array.isArray(rows) || !rows[0]) throw new Error("History snapshot not found.");
  return rows[0];
}
export async function restoreRevision(branch: BranchId, actor: string, revisionId: number) {
  const snapshot = await previewRevision(branch, revisionId);
  if (!snapshot.menu || !Array.isArray(snapshot.menu.items)) throw new Error("Invalid history snapshot.");
  const row = await selectRow(branch);
  await backup(branch, actor, "Before restoring revision " + revisionId, savedMenu(row, true));
  await query("tranquila_branch_cms?" + branchQuery(branch), { method: "PATCH", headers,
    body: json({ published_menu: snapshot.menu, menu: snapshot.menu, published_initialized: true, draft_initialized: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
  await history(branch, actor, "menu_revision_restored", { revision_id: revisionId });
}
