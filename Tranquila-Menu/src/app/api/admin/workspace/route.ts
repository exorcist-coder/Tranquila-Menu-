import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms";
import { isBranchId } from "@/lib/branches";
import {
  adminStorageConfigured, getPublished, getDrafts, upsertDraft, discardDraft,
  publishDraft, getArchived, archiveItem, restoreArchive, permanentlyDelete,
  getHistory, previewRevision, restoreRevision
} from "@/lib/adminWorkflow";
import type { Item } from "@/lib/catalog";

export const dynamic = "force-dynamic";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
const message = (e: unknown) => e instanceof Error ? e.message : "Operation failed.";
const context = async (request: Request) => {
  const admin = await requireAdmin(request);
  const branch = new URL(request.url).searchParams.get("branch");
  return { admin, branch };
};
export async function GET(req: Request) {
  const { admin, branch } = await context(req);
  if (!admin) return fail(adminStorageConfigured() ? "Unauthorized" : "Admin database is not connected. Configure the server's Supabase service-role key.", 401);
  if (!isBranchId(branch)) return fail("Invalid hotel.", 400);
  try {
    const section = new URL(req.url).searchParams.get("section") ?? "workspace";
    if (section === "workspace") {
      const [published, drafts, archived, history] = await Promise.all([getPublished(branch), getDrafts(branch), getArchived(branch), getHistory(branch)]);
      return NextResponse.json({ published, drafts, archived, history }, { headers: { "Cache-Control": "no-store" } });
    }
    if (section === "revision") {
      const id = Number(new URL(req.url).searchParams.get("id"));
      if (!Number.isSafeInteger(id) || id < 1) return fail("Invalid version.");
      return NextResponse.json({ revision: await previewRevision(branch, id) });
    }
    return fail("Unknown section.");
  } catch (e) { return fail(message(e), 503); }
}
type Operation =
  | { action: "save_draft"; item: Item }
  | { action: "discard_draft" | "publish_draft" | "archive" | "restore" | "delete_permanently"; itemId: string }
  | { action: "restore_revision"; revisionId: number };
export async function POST(req: Request) {
  const { admin, branch } = await context(req);
  if (!admin) return fail("Administrator access required.", 401);
  if (!isBranchId(branch)) return fail("Invalid hotel.");
  let body: Operation;
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  if (!body || !("action" in body)) return fail("Missing action.");
  try {
    switch (body.action) {
      case "save_draft":
        if (!body.item || typeof body.item !== "object") return fail("Missing item.");
        await upsertDraft(branch, admin.id, body.item);
        break;
      case "discard_draft":
      case "publish_draft":
      case "archive":
      case "restore":
      case "delete_permanently": {
        if (typeof body.itemId !== "string" || !body.itemId.trim()) return fail("Choose an item.");
        if (body.action === "discard_draft") await discardDraft(branch, admin.id, body.itemId);
        if (body.action === "publish_draft") await publishDraft(branch, admin.id, body.itemId);
        if (body.action === "archive") await archiveItem(branch, admin.id, body.itemId);
        if (body.action === "restore") await restoreArchive(branch, admin.id, body.itemId);
        if (body.action === "delete_permanently") {
          if (admin.role !== "admin") return fail("Only an administrator can permanently delete items.", 403);
          await permanentlyDelete(branch, admin.id, body.itemId);
        }
        break;
      }
      case "restore_revision":
        if (admin.role !== "admin") return fail("Only an administrator can restore history.", 403);
        if (!Number.isSafeInteger(body.revisionId) || body.revisionId < 1) return fail("Invalid revision.");
        await restoreRevision(branch, admin.id, body.revisionId);
        break;
      default: return fail("Unknown action.");
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return fail(message(e), 503); }
}
