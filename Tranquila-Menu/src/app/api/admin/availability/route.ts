import { NextResponse } from "next/server";
import { getItemAvailability, getMenu, requireAdmin, setItemAvailability } from "@/lib/cms";
import { isBranchId } from "@/lib/branches";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branchId = new URL(req.url).searchParams.get("branch");
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  const menu = await getMenu(false, branchId);
  return NextResponse.json({ availability: Object.fromEntries(menu.items.map(item => [item.id, item.available !== false])) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branchId = new URL(req.url).searchParams.get("branch");
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  let body: { itemId?: string; available?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.itemId !== "string" || typeof body.available !== "boolean") return NextResponse.json({ error: "Choose an item and availability state." }, { status: 400 });
  const menu = await getMenu(false, branchId);
  if (!menu.items.some(item => item.id === body.itemId)) return NextResponse.json({ error: "That item is not in this branch menu." }, { status: 404 });
  try {
    await setItemAvailability(branchId, body.itemId, body.available, admin.id);
    return NextResponse.json({ ok: true, itemId: body.itemId, available: body.available });
  } catch {
    return NextResponse.json({ error: "Could not update stock status. Check the branch migration." }, { status: 503 });
  }
}