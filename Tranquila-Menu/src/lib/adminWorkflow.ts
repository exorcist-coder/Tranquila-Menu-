import { CATEGORIES, ITEMS, type Item } from "./catalog";
import { withApprovedPhotos } from "./approvedPhotos";
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
  if (!adminStorageConfigured()) throw new Error("The hotel database is not configured. Ask an administrator to check the service credentials.");
  const response = await fetch(baseUrl() + "/rest/v1/" + path, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key(), Authorization: "Bearer " + key(),
      "Content-Type": "application/json", ...(init.headers ?? {})
    }
  });
  if (!response.ok) {
    // Log the status, not the full upstream body: database details could include user data.
    console.error("Tranquila admin database request failed", response.status, path.split("?")[0]);
    if (response.status === 401 || response.status === 403) throw new Error("Database access denied. Please contact the administrator.");
    if (response.status === 404) throw new Error("Database operation unavailable. Check that the migration was applied.");
    throw new Error("The requested change could not be completed (" + response.status + "). No partial changes were saved.");
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const branchQuery = (branch: BranchId) => "branch_id=eq." + encodeURIComponent(branch);
const selectedMenu = (row: any, published: boolean): MenuDocument => {
  const candidate = published ? row?.published_menu : row?.menu;
  const initialized = published ? row?.published_initialized : row?.draft_initialized;
  return initialized && Array.isArray(candidate?.items) && Array.isArray(candidate?.categories) ? candidate : defaultMenu();
};

/**
 * One Postgres function call per state change. PostgreSQL commits menu, draft,
 * archive, stock and audit changes together, or rolls them all back on failure.
 *
 * This call runs on the server with a service-role credential, never in the browser.
 * The database independently checks active staff and branch permissions.
 */
async function atomic(
  branch: BranchId,
  actor: string,
  action: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const result = await query("rpc/tranquila_admin_action", {
    method: "POST",
    body: JSON.stringify({
      p_action: action,
      p_branch: branch,
      p_actor: actor,
      p_fallback_menu: defaultMenu(),
      ...extra
    })
  });
  if (!result || result.ok !== true || result.branch !== branch || result.action !== action) {
    throw new Error("The database did not confirm the change. Refresh before trying again.");
  }
}

export async function getPublished(branch: BranchId): Promise<MenuDocument> {
  const rows = await query("tranquila_branch_cms?" + branchQuery(branch) +
    "&select=menu,published_menu,draft_initialized,published_initialized");
  const row = Array.isArray(rows) ? rows[0] : null;
  const menu = selectedMenu(row, true);
  const availability = await getItemAvailability(branch);
  return { ...menu, items: menu.items.map(item => ({
    ...withApprovedPhotos(item), available: availability[item.id] !== false
  })) };
}

export async function getDrafts(branch: BranchId): Promise<SavedDraft[]> {
  const rows = await query("tranquila_item_drafts?" + branchQuery(branch) +
    "&select=id,branch_id,item_id,item,created_at,updated_at&order=updated_at.desc&limit=500");
  return Array.isArray(rows) ? rows.map(row => ({ ...row, item: withApprovedPhotos(row.item) })) : [];
}

export async function upsertDraft(branch: BranchId, actor: string, item: Item) {
  if (!item.id || !item.name?.trim() || !item.category || !Number.isFinite(item.basePrice)
    || item.basePrice < 0 || !Array.isArray(item.groups)) {
    throw new Error("Add a valid name, category, price and item options.");
  }
  if (item.groups.some(g => !g.id || !g.label || !Array.isArray(g.options) ||
    g.options.some(o => !o.id || !o.label || !Number.isFinite(o.price) || o.price < 0))) {
    throw new Error("Check the option groups and their prices.");
  }
  const { available: _available, ...clean } = item;
  await atomic(branch, actor, "save_draft", { p_item: clean });
}

export async function discardDraft(branch: BranchId, actor: string, itemId: string) {
  await atomic(branch, actor, "discard_draft", { p_item_id: itemId });
}

export async function publishDraft(branch: BranchId, actor: string, itemId: string) {
  // Do not issue a post-commit read here: a failed read after a successful
  // publish would incorrectly tell staff that publishing itself had failed.
  await atomic(branch, actor, "publish_draft", { p_item_id: itemId });
}

export async function getArchived(branch: BranchId): Promise<ArchivedItem[]> {
  const rows = await query("tranquila_archived_items?" + branchQuery(branch) +
    "&select=id,item_id,item,archived_at&order=archived_at.desc&limit=500");
  return Array.isArray(rows) ? rows : [];
}

export async function archiveItem(branch: BranchId, actor: string, itemId: string) {
  await atomic(branch, actor, "archive", { p_item_id: itemId });
}
export async function restoreArchive(branch: BranchId, actor: string, itemId: string) {
  await atomic(branch, actor, "restore", { p_item_id: itemId });
}
export async function permanentlyDelete(branch: BranchId, actor: string, itemId: string) {
  await atomic(branch, actor, "delete_permanently", { p_item_id: itemId });
}

export async function getHistory(branch: BranchId) {
  const [logs, backups] = await Promise.all([
    query("tranquila_audit_log?details->>branch_id=eq." + encodeURIComponent(branch) +
      "&select=id,action,details,created_at&order=created_at.desc&limit=150"),
    query("tranquila_menu_backups?" + branchQuery(branch) +
      "&select=id,reason,created_at&order=created_at.desc&limit=70")
  ]);
  return {
    events: (Array.isArray(logs) ? logs : []) as HistoryEvent[],
    revisions: (Array.isArray(backups) ? backups : []) as Omit<Revision, "menu">[]
  };
}

export async function previewRevision(branch: BranchId, revisionId: number): Promise<Revision> {
  const rows = await query("tranquila_menu_backups?" + branchQuery(branch) +
    "&id=eq." + revisionId + "&select=id,reason,created_at,menu");
  if (!Array.isArray(rows) || !rows[0]) throw new Error("History snapshot not found.");
  return rows[0];
}

export async function restoreRevision(branch: BranchId, actor: string, revisionId: number) {
  await atomic(branch, actor, "restore_revision", { p_revision_id: revisionId });
}
