import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return NextResponse.json({ error: "Password reset is not configured." }, { status: 503 });

  let body: { accessToken?: string; password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const accessToken = String(body.accessToken ?? "");
  const password = String(body.password ?? "");
  if (!accessToken || accessToken.length > 8192) return NextResponse.json({ error: "The reset link is missing or expired. Request a new one." }, { status: 401 });
  if (password.length < 10 || password.length > 200) return NextResponse.json({ error: "Use a password between 10 and 200 characters." }, { status: 400 });

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Supabase password update failed:", response.status);
    return NextResponse.json({ error: "This reset link has expired or is invalid. Request a new password reset email." }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
