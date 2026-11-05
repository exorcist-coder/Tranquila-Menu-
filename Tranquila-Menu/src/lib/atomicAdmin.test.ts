import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  upsertDraft, discardDraft, publishDraft, archiveItem,
  restoreArchive, permanentlyDelete, restoreRevision
} from "./adminWorkflow";
import { saveMenu, setItemAvailability } from "./cms";

const branch = "tranquila" as const;
const actor = "123e4567-e89b-12d3-a456-426614174000";
const item = {
  id: "qa-hidden-dish", category: "breakfast" as const, name: "QA hidden dish",
  description: "Not a real dish", basePrice: 100, groups: [], visible: false, photos: []
};
const mockSuccess = vi.fn(async (_url: unknown, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body ?? "{}"));
  return Response.json({
    ok: true,
    action: body.p_action ?? (body.p_publish ? "menu_published" : "menu_draft_saved"),
    branch: body.p_branch, item_id: body.p_item_id
  });
});

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://test-only.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-only");
  vi.stubGlobal("fetch", mockSuccess);
  mockSuccess.mockClear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("atomic hotel administration", () => {
  it("uses exactly one protected RPC per draft and archive mutation", async () => {
    const operations = [
      { action: "save_draft", call: () => upsertDraft(branch, actor, item) },
      { action: "discard_draft", call: () => discardDraft(branch, actor, item.id) },
      { action: "publish_draft", call: () => publishDraft(branch, actor, item.id) },
      { action: "archive", call: () => archiveItem(branch, actor, item.id) },
      { action: "restore", call: () => restoreArchive(branch, actor, item.id) },
      { action: "delete_permanently", call: () => permanentlyDelete(branch, actor, item.id) },
      { action: "restore_revision", call: () => restoreRevision(branch, actor, 1) }
    ];
    for (const operation of operations) {
      const before = mockSuccess.mock.calls.length;
      await operation.call();
      expect(mockSuccess.mock.calls.length).toBe(before + 1);
      const [url, init] = mockSuccess.mock.calls.at(-1)! as [string, RequestInit];
      expect(url).toBe("https://test-only.invalid/rest/v1/rpc/tranquila_admin_action");
      const body = JSON.parse(String(init?.body));
      expect(body.p_action).toBe(operation.action);
      expect(body.p_branch).toBe(branch);
      expect(body.p_actor).toBe(actor);
      expect(body.p_fallback_menu.items.length).toBeGreaterThan(50);
      expect(init.method).toBe("POST");
    }
  });

  it("sends inventory and whole-menu publishing as single RPC calls", async () => {
    await setItemAvailability(branch, item.id, false, actor);
    expect(mockSuccess).toHaveBeenCalledTimes(1);
    expect(String(mockSuccess.mock.calls[0]![0])).toContain("/rpc/tranquila_admin_action");
    expect(JSON.parse(String(mockSuccess.mock.calls[0]![1]?.body)).p_available).toBe(false);
    mockSuccess.mockClear();
    const document = { categories: [{ id: "breakfast" as const, label: "Breakfast" }], items: [item] };
    await saveMenu(document, true, actor, branch);
    expect(mockSuccess).toHaveBeenCalledTimes(1);
    expect(String(mockSuccess.mock.calls[0]![0])).toContain("/rpc/tranquila_admin_save_menu");
  });

  it("reports server failures without making a second side-effecting request", async () => {
    const failedFetch = vi.fn(async () => Response.json({ error: "Simulated audit failure" }, { status: 503 }));
    vi.stubGlobal("fetch", failedFetch);
    await expect(publishDraft(branch, actor, item.id)).rejects.toThrow(/could not be completed/);
    expect(failedFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects missing confirmation, invalid data and unauthorized whole-menu saves", async () => {
    const unconfirmed = vi.fn(async () => Response.json({ ok: false }, { status: 200 }));
    vi.stubGlobal("fetch", unconfirmed);
    await expect(archiveItem(branch, actor, item.id)).rejects.toThrow(/did not confirm/);
    expect(unconfirmed).toHaveBeenCalledTimes(1);
    await expect(upsertDraft(branch, actor, { ...item, basePrice: -3 })).rejects.toThrow(/valid name/);
    await expect(saveMenu({ categories: [], items: [] }, true, undefined, branch)).rejects.toThrow(/STAFF_AUTHORIZATION_REQUIRED/);
    expect(unconfirmed).toHaveBeenCalledTimes(1);
  });
});
