import { NextResponse } from "next/server";
import { getMenu, getSettings } from "@/lib/cms";
import { prepareOrder } from "@/lib/order";
import { getBranch, isBranchId } from "@/lib/branches";
export const dynamic = "force-dynamic";
const hits = new Map<string, { count: number; start: number }>();
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now(); const hit = hits.get(ip);
  if (hit && now - hit.start < 60_000 && hit.count >= 20) return NextResponse.json({ ok: false, errors: ["Too many attempts. Please wait a minute and try again."] }, { status: 429 });
  hits.set(ip, !hit || now - hit.start >= 60_000 ? { count: 1, start: now } : { ...hit, count: hit.count + 1 });
  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ ok: false, errors: ["Request too large."] }, { status: 413 });
  let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, errors: ["Invalid request."] }, { status: 400 }); }
  const requestedBranch = body && typeof body === "object" ? (body as { branchId?: unknown }).branchId : null;
  if (!isBranchId(typeof requestedBranch === "string" ? requestedBranch : null)) return NextResponse.json({ ok: false, errors: ["Choose a valid hotel before ordering."] }, { status: 400 });
  const branchId = requestedBranch;
  const [menu, settings] = await Promise.all([getMenu(true, branchId), getSettings(branchId)]);
  const categoryIds = new Set(menu.categories.filter(c => c.visible !== false).map(c => c.id));
  const orderable = menu.items.filter(i => i.visible !== false && i.published !== false && categoryIds.has(i.category));
  const result = prepareOrder(body, { whatsapp: settings.whatsapp, hotelName: getBranch(branchId)!.name, hours: { open: settings.open, close: settings.close, paused: settings.paused } }, new Date(), undefined, orderable);
  return NextResponse.json(result, { status: result.ok ? 200 : 422, headers: { "Cache-Control": "no-store" } });
}
