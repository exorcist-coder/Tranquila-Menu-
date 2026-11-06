/** Convert non-JSON upload errors (Cloudflare, Vercel, proxies) into actionable messages. */
export async function readUploadResult(response: Response): Promise<{url: string}> {
  const type = response.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    if (response.status === 413) throw new Error("Image is too large for the upload gateway. Choose a smaller image.");
    if (response.status === 429) throw new Error("Too many uploads. Please try again shortly.");
    if (response.status === 401 || response.status === 403) throw new Error("Upload was blocked or your session expired. Sign in again and retry.");
    if (response.status === 502 || response.status === 503 || response.status === 504) throw new Error("The upload service is temporarily unavailable. Try again shortly.");
    throw new Error("Image upload did not return a valid response (HTTP " + response.status + "). Please retry.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object") throw new Error("Image upload returned an invalid response.");
  const result = data as {url?: unknown; error?: unknown};
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Upload failed (HTTP " + response.status + ").");
  if (typeof result.url !== "string" || !/^https:\/\//.test(result.url)) throw new Error("Upload succeeded but the image URL is missing.");
  return {url:result.url};
}
