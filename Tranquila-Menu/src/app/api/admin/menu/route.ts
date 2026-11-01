import { NextResponse } from "next/server";
import { getMenu, requireAdmin, saveMenu, type MenuDocument } from "@/lib/cms";
import { isBranchId } from "@/lib/branches";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branchId = new URL(req.url).searchParams.get("branch");
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  return NextResponse.json({ menu: await getMenu(false, branchId) }, { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branchId = new URL(req.url).searchParams.get("branch");
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  let body: { menu?: MenuDocument; publish?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const menu = body.menu;
  if (!menu || !Array.isArray(menu.items) || !Array.isArray(menu.categories) || menu.items.length > 500 || menu.categories.length > 50) return NextResponse.json({ error: "Invalid menu data." }, { status: 400 });
  const ids = new Set<string>();
  const categoryIds = new Set<string>();
  for (const category of menu.categories) {
    if (!category.id || !category.label?.trim() || categoryIds.has(category.id)) return NextResponse.json({ error: "Every category needs a unique ID and a name." }, { status: 400 });
    categoryIds.add(category.id);
  }
  for (const item of menu.items) {
    if (!item.id || ids.has(item.id) || !item.name?.trim() || !categoryIds.has(item.category) || !Number.isFinite(item.basePrice) || item.basePrice < 0 || item.basePrice > 100_000_000 || !Array.isArray(item.groups)) return NextResponse.json({ error: `Invalid menu item: ${item.name || item.id || "unknown"}. Check its category, ID and price.` }, { status: 400 });
    ids.add(item.id);
    for (const group of item.groups) for (const option of group.options ?? []) if (!option.id || !Number.isFinite(option.price) || option.price < 0) return NextResponse.json({ error: `Invalid option in ${item.name}.` }, { status: 400 });
  }
  try { await saveMenu(menu, !!body.publish, admin.id, branchId); return NextResponse.json({ ok: true, published: !!body.publish }); }
  catch (error) { console.error("Admin menu save failed:", error); return NextResponse.json({ error: "CMS database is not ready. Check the Supabase setup and migrations." }, { status: 503 }); }
}
