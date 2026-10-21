import { NextResponse } from "next/server";
import { getMenu, getSettings } from "@/lib/cms";
export const dynamic = "force-dynamic";
export async function GET() {
  const [menu, settings] = await Promise.all([getMenu(true), getSettings()]);
  const categories = menu.categories.filter(c => c.visible !== false);
  const categoryIds = new Set(categories.map(c => c.id));
  return NextResponse.json({ ok: true, menu: { ...menu, items: menu.items.filter(i => i.visible !== false && i.published !== false && categoryIds.has(i.category)), categories }, settings }, { headers: { "Cache-Control": "no-store" } });
}
