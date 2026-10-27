import { NextResponse } from "next/server";
import { getSettings, requireAdmin, saveSettings, type HotelSettings } from "@/lib/cms";
import { isBranchId } from "@/lib/branches";
export const dynamic = "force-dynamic";
export async function GET(req: Request) { if (!await requireAdmin(req, "admin")) return NextResponse.json({ error: "Administrator access required." }, { status: 403 }); const branchId = new URL(req.url).searchParams.get("branch"); if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 }); return NextResponse.json({ settings: await getSettings(branchId) }); }
export async function PUT(req: Request) {
  if (!await requireAdmin(req, "admin")) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const branchId = new URL(req.url).searchParams.get("branch");
  if (!isBranchId(branchId)) return NextResponse.json({ error: "Choose a valid hotel." }, { status: 400 });
  let s: HotelSettings; try { s = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const whatsapp = String(s.whatsapp ?? "").replace(/\D/g, "");
  const time = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  if (whatsapp.length < 10 || whatsapp.length > 15 || !time(s.open) || !time(s.close) || typeof s.paused !== "boolean") return NextResponse.json({ error: "Enter a valid international WhatsApp number and valid opening hours." }, { status: 400 });
  try { await saveSettings({ ...s, whatsapp }, branchId); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Could not save settings. Check database setup." }, { status: 503 }); }
}
