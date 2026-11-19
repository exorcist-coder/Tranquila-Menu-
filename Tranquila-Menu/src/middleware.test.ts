import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
afterEach(() => vi.unstubAllEnvs());
describe("Cloudflare migration isolation", () => {
  it.each([
    ["/api/admin/menu", "PUT"], ["/api/admin/workspace", "POST"],
    ["/api/admin/settings", "PUT"], ["/api/admin/availability", "POST"],
    ["/api/admin/upload", "POST"], ["/api/admin/recover", "POST"],
    ["/api/admin/reset-password", "POST"],
  ])("blocks test-site writes: %s %s", (path, method) => {
    vi.stubEnv("CLOUDFLARE_TEST_READ_ONLY", "1");
    const response = middleware(new NextRequest(`https://test.invalid${path}`, { method }));
    expect(response.status).toBe(403);
  });
  it.each([["/api/menu", "GET"], ["/api/admin/workspace", "GET"], ["/api/admin/login", "POST"], ["/api/order", "POST"]])("permits preview reads, sign-in and order validation: %s", (path, method) => {
    vi.stubEnv("CLOUDFLARE_TEST_READ_ONLY", "1");
    const response = middleware(new NextRequest(`https://test.invalid${path}`, { method }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
  it("leaves existing deployments unchanged when the test flag is absent", () => {
    vi.stubEnv("CLOUDFLARE_TEST_READ_ONLY", "");
    const response = middleware(new NextRequest("https://live.invalid/api/admin/menu", { method: "PUT" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });
});
