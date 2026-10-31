import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return NextResponse.json({ error: "Password recovery is not configured. Add the Supabase environment variables first." }, { status: 503 });

  let email = "";
  try { email = String((await req.json()).email ?? "").trim().toLowerCase(); }
  catch { return NextResponse.json({ error: "Enter the email address for your staff account." }, { status: 400 }); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const redirectTo = `${origin}/admin/reset-password`;
  const response = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Supabase password recovery request failed:", response.status);
    return NextResponse.json({ error: "We could not send the reset email. Check the Supabase Auth email and redirect settings, then try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, message: "If a staff account exists for that address, a password reset link will arrive shortly." }, { headers: { "Cache-Control": "no-store" } });
}
