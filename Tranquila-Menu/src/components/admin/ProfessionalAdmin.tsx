"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item, Group } from "@/lib/catalog";
import { CATEGORIES, ITEMS } from "@/lib/catalog";
import { BRANCHES, type BranchId } from "@/lib/branches";

import OptionGroupsEditor from "./OptionGroupsEditor";
import AdminHybridShell from "./AdminHybridShell";
import { AdminMenuWorkspace } from "./AdminMenuWorkspace";
import AdminItemPreview from "./AdminItemPreview";
import AdminEditorAside from "./AdminEditorAside";
import AdminLoginScreen from "./AdminLoginScreen";
import AdminImageGallery, { appendItemImage, itemImageRefs, MAX_ITEM_IMAGES, imageSrc } from "./AdminImageGallery";
import { notify } from "@/lib/notifications";
import { readUploadResult } from "@/lib/readUploadResult";
import { AdminIcon } from "./AdminIcon";
import { AdminArchivePanel, AdminHistoryPanel, AdminCategoriesPanel, AdminServicePanel } from "./AdminManagementPanels";
import "./professional-admin.css";
import "./hybrid-admin.css";
import "./apple-admin.css";
import "./tranquila-admin.css";

type DisplayItem = Item & { published?: boolean; visible?: boolean };
type Menu = { categories: { id: string; label: string; visible?: boolean }[]; items: DisplayItem[] };
type Draft = { id: number; item_id: string; item: DisplayItem; updated_at: string; created_at: string };
type Archive = { id: number; item_id: string; item: DisplayItem; archived_at: string };
type Event = { id: number; action: string; details: Record<string, unknown>; created_at: string };
type Revision = { id: number; reason: string; created_at: string };
type Workspace = { published: Menu; drafts: Draft[]; archived: Archive[]; history: { events: Event[]; revisions: Revision[] } };
type Settings = { whatsapp: string; open: string; close: string; paused: boolean };
type Tab = "overview" | "live" | "drafts" | "archive" | "history" | "categories" | "settings";
const activeBranch: BranchId = process.env.NEXT_PUBLIC_HOTEL_BRANCH_ID === "tranquila-nest" ? "tranquila-nest" : "tranquila";
const initialMenu: Menu = { categories: CATEGORIES, items: ITEMS };
const baseItem = (): DisplayItem => ({ id: "new-item-" + Date.now().toString(36), name: "", description: "", category: "breakfast", basePrice: 0, groups: [], photos: [], published: true, visible: true });
const blank: Workspace = { published: initialMenu, drafts: [], archived: [], history: { events: [], revisions: [] } };
const date = (s: string) => new Date(s).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const cash = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");
const photo = (i: DisplayItem) => imageSrc(itemImageRefs(i)[0] ?? "");
const branchName = BRANCHES.find(b => b.id === activeBranch)?.name ?? "Tranquila Hotels";
const nav: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "▦" }, { id: "live", label: "Live menu", icon: "▤" },
  { id: "drafts", label: "Draft library", icon: "✎" }, { id: "archive", label: "Archive", icon: "▣" },
  { id: "history", label: "History & recovery", icon: "◷" }, { id: "categories", label: "Categories", icon: "☷" },
  { id: "settings", label: "Service settings", icon: "⚙" }
];

export default function ProfessionalAdmin() {
  const [token, setToken] = useState("");
  const [authInput, setAuthInput] = useState({ email: "", password: "" });
  const [workspace, setWorkspace] = useState<Workspace>(blank);
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState("");
  const setError = useCallback((message: string) => { setErrorState(message); if (message) notify.error(message); }, []);
  const setNotice = (message: string) => { if (message) notify.success("All set", message); };
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<DisplayItem | null>(null);
  const [options, setOptions] = useState<Group[]>([]);
  const [preview, setPreview] = useState<DisplayItem | null>(null);
  const [previewIsDraft, setPreviewIsDraft] = useState(false);
  const [revisionPreview, setRevisionPreview] = useState<{ id: number; reason: string; menu: Menu } | null>(null);
  const [settings, setSettings] = useState<Settings>({ whatsapp: BRANCHES.find(b => b.id === activeBranch)?.whatsapp ?? "", open: "08:00", close: "22:00", paused: false });
  const [categories, setCategories] = useState<Menu["categories"]>(initialMenu.categories);

  const headers = useCallback(() => ({ Authorization: "Bearer " + token, "Content-Type": "application/json" }), [token]);
  const workspaceUrl = "/api/admin/workspace?branch=" + activeBranch;
  const refresh = useCallback(async (authToken: string) => {
    const h = { Authorization: "Bearer " + authToken };
    const [res, sr] = await Promise.all([
      fetch(workspaceUrl, { headers: h, cache: "no-store" }),
      fetch("/api/admin/settings?branch=" + activeBranch, { headers: h, cache: "no-store" })
    ]);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Unable to load admin workspace.");
    setWorkspace(body);
    setCategories(body.published.categories);
    if (sr.ok) setSettings((await sr.json()).settings);
  }, [workspaceUrl]);

  useEffect(() => {
    const saved = sessionStorage.getItem("tranquila-admin-token");
    if (!saved) return;
    setToken(saved);
    setLoading(true);
    refresh(saved).catch(e => { setError(e instanceof Error ? e.message : "Session expired."); sessionStorage.removeItem("tranquila-admin-token"); setToken(""); }).finally(() => setLoading(false));
  }, [refresh]);

  async function signin(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authInput) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Unable to sign in.");
      await refresh(data.access_token);
      setToken(data.access_token); sessionStorage.setItem("tranquila-admin-token", data.access_token);
      setAuthInput({ email: "", password: "" }); notify.success("Signed in");
    } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed."); }
    finally { setBusy(false); }
  }
  type AdminView = { branch: string; tab: Tab; editorId?: string; previewId?: string };
  function historyView(): AdminView | null {
    const view = (window.history.state as { hotelAdminView?: AdminView } | null)?.hotelAdminView;
    return view?.branch === activeBranch ? view : null;
  }
  function pushView(view: AdminView) {
    window.history.pushState({ ...(window.history.state ?? {}), hotelAdminView: view }, "", window.location.href);
  }
  useEffect(() => {
    const onBack = () => {
      const view = historyView();
      setTab(view?.tab ?? "overview");
      const edited = view?.editorId
        ? workspace.drafts.find(d=>d.item_id===view.editorId)?.item
          ?? workspace.published.items.find(i=>i.id===view.editorId)
        : undefined;
      setEditor(edited ? structuredClone(edited) : null);
      setOptions(edited ? structuredClone(edited.groups ?? []) : []);
      const p = view?.previewId
        ? workspace.drafts.find(d=>d.item_id===view.previewId)?.item
          ?? workspace.published.items.find(i=>i.id===view.previewId)
        : undefined;
      setPreview(p ?? null);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [workspace]);
  function navigateTab(next: Tab) {
    pushView({ branch: activeBranch, tab: next });
    setTab(next); setEditor(null); setPreview(null); setQuery("");
  }
  function closeEditor() {
    if (historyView()?.editorId) window.history.back();
    else setEditor(null);
  }
  function closePreview() {
    if (historyView()?.previewId) window.history.back();
    else setPreview(null);
  }
  function signout() { sessionStorage.removeItem("tranquila-admin-token"); setToken(""); setWorkspace(blank); setEditor(null); setError(""); notify.info("Signed out"); }
  async function action(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(workspaceUrl, { method: "POST", headers: headers(), body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error ?? "The server did not confirm the change.");
      }
      // A refresh failure must never turn a successful database commit into a
      // misleading "save failed" message that encourages duplicate actions.
      setNotice(success);
      try {
        await refresh(token);
      } catch {
        setError("Your change was saved, but the dashboard could not refresh. Reload to see the latest information.");
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "The change was not confirmed.");
      return false;
    } finally { setBusy(false); }
  }
  function showPreview(item: DisplayItem, isDraft: boolean) { pushView({ branch: activeBranch, tab, previewId: item.id }); setPreview(item); setPreviewIsDraft(isDraft); }
  function edit(item: DisplayItem) { pushView({ branch: activeBranch, tab: "drafts", editorId: item.id }); setEditor(structuredClone(item)); setOptions(structuredClone(item.groups ?? [])); setTab("drafts"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function saveDraft() {
    if (!editor) return;
    const item = { ...editor, groups: options, published: true };
    if (!item.name.trim()) { setError("Enter an item name."); return; }
    if (!workspace.published.categories.some(c => c.id === item.category)) { setError("Select a valid category."); return; }
    if (await action({ action: "save_draft", item }, "Draft saved to your library. The guest menu has not changed.")) setEditor(null);
  }
  async function inventory(item: DisplayItem) {
    // Stock is independent of menu publishing. The button only changes after
    // the server confirms that this specific item's state was persisted.
    const available = item.available === false;
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/admin/availability?branch=" + activeBranch, {
        method: "PATCH", headers: headers(), body: JSON.stringify({ itemId: item.id, available })
      });
      const data = await r.json();
      if (!r.ok || data.ok !== true || data.itemId !== item.id || data.available !== available) {
        throw new Error(data.error || "The server did not confirm the inventory change.");
      }
      // Keep the UI accurate even if reloading the rest of the admin workspace
      // fails after the inventory write itself succeeds.
      setWorkspace(current => ({
        ...current,
        published: {
          ...current.published,
          items: current.published.items.map(i => i.id === item.id ? { ...i, available } : i)
        }
      }));
      setNotice(available ? item.name + " is available again." : item.name + " marked SOLD OUT. Guests can no longer order it.");
      try { await refresh(token); } catch { setError("Stock status was saved, but the dashboard could not refresh. Please reload the page."); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The stock change could not be saved.");
    } finally { setBusy(false); }
  }
  async function upload(files: File[]) {
    if (!editor || !files.length) return;
    const room = MAX_ITEM_IMAGES - itemImageRefs(editor).length;
    if (files.length > room) { setError("You can add up to " + MAX_ITEM_IMAGES + " photos per item."); return; }
    if (files.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 4_000_000)) { setError("Choose JPG, PNG or WebP images under 4 MB each."); return; }
    setBusy(true); setError("");
    let added = 0;
    try {
      for (const file of files) {
        const form = new FormData(); form.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
        const result = await readUploadResult(response);
        setEditor(previous => previous ? appendItemImage(previous,result.url) : null);
        added++;
      }
      setNotice(added + " photo" + (added === 1 ? "" : "s") + " uploaded. Save the item to keep the changes.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Upload failed.";
      setError(added ? added + " uploaded; next photo failed: " + message : message);
    } finally { setBusy(false); }
  }
  async function saveService() {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/settings?branch=" + activeBranch, { method: "PUT", headers: headers(), body: JSON.stringify(settings) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to save service settings.");
      setNotice("Service settings saved."); await refresh(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save service settings."); }
    finally { setBusy(false); }
  }
  async function publishCategories() {
    if (!confirm("Publish these category changes to the LIVE hotel menu?")) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/menu?branch=" + activeBranch, { method: "PUT", headers: headers(), body: JSON.stringify({ menu: { categories, items: workspace.published.items }, publish: true }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Unable to publish categories.");
      await refresh(token); setNotice("Category changes published successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Category changes failed."); }
    finally { setBusy(false); }
  }

  const items = useMemo(() => workspace.published.items.filter(i => [i.name, i.description, i.category].some(v => v?.toLowerCase().includes(query.toLowerCase()))), [workspace, query]);
  const draftList = useMemo(() => workspace.drafts.filter(d => d.item.name.toLowerCase().includes(query.toLowerCase())), [workspace, query]);
  const stats = { live: workspace.published.items.filter(i => i.visible !== false && i.published !== false).length, unavailable: workspace.published.items.filter(i => i.available === false).length, drafts: workspace.drafts.length, archives: workspace.archived.length };

  if (!token) return <AdminLoginScreen
    branchName={branchName} branchId={activeBranch}
    email={authInput.email} password={authInput.password}
    onEmail={email => setAuthInput(v => ({ ...v, email }))}
    onPassword={password => setAuthInput(v => ({ ...v, password }))}
    onSubmit={signin} busy={busy} loading={loading} error={error}
  />;

  return <AdminHybridShell
    tab={tab} branchName={branchName} branchId={activeBranch}
    drafts={stats.drafts} busy={busy}
    onTab={navigateTab}
    onSignout={signout}
    onRefresh={() => { void refresh(token).then(() => setNotice("Everything is up to date.")).catch(e => setError(e instanceof Error ? e.message : "Refresh failed.")); }}>
      {busy && <p className="pro-working" role="status"><AdminIcon name="refresh" size={14}/> Saving changes securely…</p>}
      {tab === "overview" && <>
        <section className="pro-overview-banner">
          <div className="pro-overview-banner-content"><h2>Menu management</h2><p>Manage live items, drafts and availability.</p><div className="pro-banner-actions"><button className="pro-btn ivory" type="button" onClick={() => navigateTab("live")}>Explore live menu <AdminIcon name="arrow" size={17}/></button><button className="pro-banner-secondary" type="button" onClick={() => edit(baseItem())}>Create a new dish <AdminIcon name="plus" size={16}/></button></div></div>
          <div className="pro-overview-banner-photo" aria-hidden="true"><img src="/images/okra-seafood.webp" alt=""/></div>
        </section>
        <div className="pro-metrics"><Metric label="Live menu items" value={stats.live} hint="Visible to guests"/><Metric label="Sold out" value={stats.unavailable} hint="Inventory changes immediately"/><Metric label="Saved drafts" value={stats.drafts} hint="Not visible to guests"/><Metric label="Archived items" value={stats.archives} hint="Recoverable items"/></div>
        <div className="pro-columns"><section className="pro-panel"><h2>Quick actions</h2><p>Draft changes are private until published.</p><div className="pro-quick"><button onClick={() => edit(baseItem())}><b>＋</b><span><strong>Create menu item</strong><small>Start a new editable draft</small></span>›</button><button onClick={() => navigateTab("drafts")}><b>✎</b><span><strong>Review drafts</strong><small>Preview, edit or publish individual items</small></span>›</button><button onClick={() => setTab("live")}><b>▤</b><span><strong>Manage availability</strong><small>Mark dishes sold out or restock</small></span>›</button></div></section>
        <section className="pro-panel"><h2>Recent activity</h2>{workspace.history.events.length ? <div className="pro-timeline">{workspace.history.events.slice(0, 6).map(e => <div key={e.id}><span className="pro-activity-dot"/><strong>{e.action.replaceAll("_", " ")}</strong><small>{date(e.created_at)}</small></div>)}</div> : <div className="pro-empty">No recorded actions yet. Changes will appear here after they are saved.</div>}<button className="pro-btn secondary" onClick={() => navigateTab("history")}>View all history</button></section></div>
      </>}
      {(tab === "live" || tab === "drafts") && !editor && <AdminMenuWorkspace
        mode={tab} categories={workspace.published.categories} items={workspace.published.items}
        drafts={workspace.drafts} query={query} onQuery={setQuery} busy={busy}
        onNew={() => edit(baseItem())} onEdit={edit} onPreview={showPreview}
        onAvailability={item => { void inventory(item); }}
        onArchive={item => {
          if (confirm("Move \"" + item.name + "\" to the archive? It will be removed from the guest menu and can be restored later.")) {
            void action({ action: "archive", itemId: item.id }, item.name + " moved to the archive.");
          }
        }}
        onPublish={draft => {
          if (confirm("Publish \"" + draft.item.name + "\" to the live guest menu?")) {
            void action({ action: "publish_draft", itemId: draft.item_id }, draft.item.name + " is now published.");
          }
        }}
        onDiscard={draft => {
          if (confirm("Discard the unpublished draft \"" + draft.item.name + "\"? This does not affect the live menu.")) {
            void action({ action: "discard_draft", itemId: draft.item_id }, "Draft discarded. Live menu is unchanged.");
          }
        }}
      />}
      {editor && tab === "drafts" && <div className="pro-editor"><div className="pro-editor-top"><div><span className="pro-status draft">DRAFT WORKSPACE</span><h2>{editor.name || "New menu item"}</h2><p>Changes are private until you publish from the Draft library.</p></div><button className="pro-btn secondary" onClick={closeEditor}>← Back to drafts</button></div>
        <div className="pro-editor-layout"><div className="pro-editor-fields"><div className="pro-panel"><h3>Item details</h3><div className="pro-form-grid"><label>Item name<input value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })} placeholder="e.g. Chicken Caesar Salad"/></label><label>Category<select value={editor.category} onChange={e => setEditor({ ...editor, category: e.target.value })}>{workspace.published.categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>Price (₦)<input type="number" min={0} value={editor.basePrice} onChange={e => setEditor({ ...editor, basePrice: Number(e.target.value) })}/></label><label>Item reference<input disabled={workspace.published.items.some(i => i.id === editor.id) || workspace.drafts.some(d => d.item_id === editor.id)} value={editor.id} onChange={e => setEditor({ ...editor, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}/></label><label className="span-two">Description<textarea rows={3} value={editor.description} onChange={e => setEditor({ ...editor, description: e.target.value })}/></label><label>Guest visibility<select value={editor.visible === false ? "hidden" : "visible"} onChange={e => setEditor({ ...editor, visible: e.target.value === "visible" })}><option value="visible">Visible when published</option><option value="hidden">Hidden when published</option></select></label></div></div>
        <AdminImageGallery item={editor} onChange={value => setEditor(value as DisplayItem)} onUpload={files => { void upload(files); }} uploading={busy} error={error || undefined} /><div className="pro-panel pro-options"><h3>Choices & customizations</h3><OptionGroupsEditor groups={options} onChange={setOptions}/></div></div>
        <AdminEditorAside item={{ ...editor, groups: options }} category={workspace.published.categories.find(c => c.id === editor.category)?.label ?? editor.category} onPreview={() => showPreview({ ...editor, groups: options }, true)}/>
        </div>
        <div className="pro-editor-footer"><button className="pro-btn secondary" onClick={() => showPreview({ ...editor, groups: options }, true)}>Preview item</button><button className="pro-btn primary" disabled={busy} onClick={saveDraft}>Save to draft library</button></div>
      </div>}
      {tab === "archive" && <AdminArchivePanel entries={workspace.archived} busy={busy}
        onRestore={entry => { void action({ action: "restore", itemId: entry.item_id }, entry.item.name + " restored to the live menu."); }}
        onDelete={entry => {
          const typed = prompt("Type DELETE to permanently remove \"" + entry.item.name + "\". You cannot recover it from the archive afterwards.");
          if (typed === "DELETE") void action({ action: "delete_permanently", itemId: entry.item_id }, "Item permanently removed from the archive.");
        }}
      />}
      {tab === "history" && <AdminHistoryPanel events={workspace.history.events} revisions={workspace.history.revisions} busy={busy}
        onViewRevision={revision => {
          void (async () => {
            setBusy(true); setError("");
            try {
              const response = await fetch(workspaceUrl + "&section=revision&id=" + revision.id, { headers: headers() });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Could not load this snapshot.");
              setRevisionPreview(data.revision);
            } catch (e) { setError(e instanceof Error ? e.message : "Could not load this snapshot."); }
            finally { setBusy(false); }
          })();
        }}
      />}
      {tab === "categories" && <AdminCategoriesPanel categories={categories} items={workspace.published.items} busy={busy} onChange={setCategories} onPublish={() => { void publishCategories(); }}/>}
      {tab === "settings" && <AdminServicePanel settings={settings} branchName={branchName} busy={busy} onChange={setSettings} onSave={() => { void saveService(); }}/>}
      {preview && <AdminItemPreview
        item={preview}
        category={workspace.published.categories.find(c => c.id === preview.category)?.label ?? preview.category}
        isDraft={previewIsDraft}
        busy={busy}
        onClose={closePreview}
        onEdit={() => { const item = preview; setPreview(null); edit(item); }}
        onPublish={previewIsDraft && workspace.drafts.some(d => d.item_id === preview.id) ? () => {
          if (confirm("Publish \"" + preview.name + "\" to the live guest menu?")) {
            void action({ action: "publish_draft", itemId: preview.id }, preview.name + " published.").then(ok => { if (ok) setPreview(null); });
          }
        } : undefined}
      />}
      {revisionPreview && <div className="pro-modal-bg"><section role="dialog" aria-modal="true" aria-label="Snapshot preview" className="pro-modal"><button className="pro-modal-close" onClick={() => setRevisionPreview(null)} aria-label="Close">×</button><span className="pro-status draft">HISTORY SNAPSHOT</span><h2>{revisionPreview.reason}</h2><p>{revisionPreview.menu.items.length} menu items · {revisionPreview.menu.categories.length} categories</p><div className="pro-snapshot-list">{revisionPreview.menu.items.slice(0, 100).map(i => <div key={i.id}><strong>{i.name}</strong><small>{cash(i.basePrice)}</small></div>)}</div><div className="pro-actions"><button className="pro-btn secondary" onClick={() => setRevisionPreview(null)}>Close</button><button className="pro-btn primary" disabled={busy} onClick={async () => { if (!confirm("Restore this snapshot to the LIVE menu? A backup of the current menu will be saved first.")) return; const ok = await action({ action: "restore_revision", revisionId: revisionPreview.id }, "Previous menu version restored."); if (ok) setRevisionPreview(null); }}>Restore this version</button></div></section></div>}
  </AdminHybridShell>;
}
function Metric({ label, value, hint }: { label: string; value: number; hint: string }) { return <div className="pro-metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>; }
