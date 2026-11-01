import { NextResponse } from "next/server";
import { getMenu, getSettings } from "@/lib/cms";
import { getBranch, isBranchId } from "@/lib/branches";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get("branch");
  const branchId = requested ?? "tranquila";
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  const [menu, settings] = await Promise.all([getMenu(true, branchId), getSettings(branchId)]);
  const categories = menu.categories.filter(c => c.visible !== false);
  const categoryIds = new Set(categories.map(c => c.id));
  return NextResponse.json({ ok: true, branch: getBranch(branchId), menu: { ...menu, items: menu.items.filter(i => i.visible !== false && i.published !== false && categoryIds.has(i.category)), categories }, settings }, { headers: { "Cache-Control": "no-store" } });
}
