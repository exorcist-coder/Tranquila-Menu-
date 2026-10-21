import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return NextResponse.json({ error: "Admin login is not configured yet. Add the Supabase environment variables and run the database setup." }, { status: 503 });
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.email || !body.password || body.password.length > 200) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email: body.email, password: body.password }), cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.access_token) return NextResponse.json({ error: "Login failed. Check your credentials or contact the administrator." }, { status: 401 });
  return NextResponse.json({ access_token: data.access_token, expires_in: data.expires_in, user: { email: data.user?.email } }, { headers: { "Cache-Control": "no-store" } });
}
