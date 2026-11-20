import { NextResponse, type NextRequest } from "next/server";

// Shared live data may be read during migration, but test sites must never edit it.
export function middleware(request: NextRequest) {
  const testing = process.env.CLOUDFLARE_TEST_READ_ONLY === "1";
  if (!testing) return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/admin/") && !["GET", "HEAD", "OPTIONS"].includes(request.method) && path !== "/api/admin/login") {
    return NextResponse.json({ error: "This Cloudflare test site is read-only. Use the live site to manage the hotel." }, { status: 403, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"] };
