import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""); const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 503 });
  const form = await req.formData(); const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Upload a JPEG, PNG, WebP or AVIF image up to 5 MB." }, { status: 400 });
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[file.type];
  const path = `menu/${crypto.randomUUID()}.${ext}`;
  const response = await fetch(`${url}/storage/v1/object/ambiiflora-menu/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
  if (!response.ok) return NextResponse.json({ error: "Image upload failed. Create the ambiiflora-menu storage bucket and retry." }, { status: 502 });
  return NextResponse.json({ url: `${url}/storage/v1/object/public/ambiiflora-menu/${path}` });
}
