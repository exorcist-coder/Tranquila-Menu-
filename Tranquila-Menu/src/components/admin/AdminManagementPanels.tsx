"use client";
import type { Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { AdminIcon } from "./AdminIcon";

type DisplayItem = Item & { visible?: boolean; published?: boolean };
export type AdminCategory = { id: string; label: string; visible?: boolean };
export type AdminArchived = { id: number; item_id: string; item: DisplayItem; archived_at: string };
export type AdminEvent = { id: number; action: string; details: Record<string, unknown>; created_at: string };
export type AdminRevision = { id: number; reason: string; created_at: string };
export type AdminSettings = { whatsapp: string; open: string; close: string; paused: boolean };
const date = (value: string) => new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const image = (item: DisplayItem) => item.imageUrl || (item.photos?.[0] ? PHOTOS[item.photos[0]]?.src : undefined);
const humanAction = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

export function AdminArchivePanel({ entries, busy, onRestore, onDelete }: {
  entries: AdminArchived[]; busy: boolean; onRestore: (item: AdminArchived) => void; onDelete: (item: AdminArchived) => void;
}) {
  return <div className="pro-management-page">
    <div className="pro-management-intro"><div><p className="pro-eyebrow">SAFE STORAGE / RECOVERABLE CONTENT</p><h2>Out of sight. Never out of reach.</h2><p>Archived dishes are removed from your guest menu. Restore them whenever you're ready.</p></div><span className="pro-management-count">{entries.length} archived</span></div>
    <div className="pro-archive-message"><AdminIcon name="shield" size={19}/><span><strong>A safe second chance.</strong> Archive keeps a dish recoverable. Permanent deletion is a separate, restricted action.</span></div>
    {entries.length ? <div className="pro-archive-grid">{entries.map(entry => <article className="pro-archive-card" key={entry.id}>
      <div className="pro-archive-thumb">{image(entry.item) ? <img src={image(entry.item)} alt=""/> : <AdminIcon name="image" size={30}/>}</div>
      <div className="pro-archive-body"><span className="pro-chip amber">Archived</span><h3>{entry.item.name}</h3><p>Archived {date(entry.archived_at)}</p><div className="pro-archive-actions"><button type="button" className="pro-btn primary" disabled={busy} onClick={() => onRestore(entry)}><AdminIcon name="refresh" size={15}/> Restore</button><button type="button" className="pro-btn danger" disabled={busy} onClick={() => onDelete(entry)}><AdminIcon name="trash" size={15}/> Delete permanently</button></div></div>
    </article>)}</div> : <EmptyPanel icon="archive" title="Your archive is clear." description="When you archive a menu item, it will appear here for review or restoration."/>}
  </div>;
}

export function AdminHistoryPanel({ events, revisions, busy, onViewRevision }: {
  events: AdminEvent[]; revisions: AdminRevision[]; busy: boolean; onViewRevision: (revision: AdminRevision) => void;
}) {
  return <div className="pro-management-page">
    <div className="pro-management-intro"><div><p className="pro-eyebrow">ACCOUNTABILITY / RECOVERY</p><h2>Every change has a story.</h2><p>A record of menu edits, publishing actions and recoverable snapshots, in one place.</p></div><span className="pro-management-count">{events.length} activities</span></div>
    <div className="pro-management-columns">
      <section className="pro-management-card"><div className="pro-management-card-head"><span className="pro-management-icon"><AdminIcon name="history" size={19}/></span><div><h3>Recent activity</h3><p>Recorded operations across this hotel</p></div></div>
        {events.length ? <div className="pro-event-list">{events.map(event => <div key={event.id} className="pro-event"><span className="pro-event-dot"/><div><strong>{humanAction(event.action)}</strong><p>{typeof event.details?.item_id === "string" ? event.details.item_id : "Menu workspace"}</p><small>{date(event.created_at)}</small></div></div>)}</div>
        : <EmptyPanel icon="clock" title="Nothing recorded yet." description="Saved changes and publishing actions will appear here."/>}
      </section>
      <section className="pro-management-card"><div className="pro-management-card-head"><span className="pro-management-icon gold"><AdminIcon name="shield" size={19}/></span><div><h3>Recovery snapshots</h3><p>Previous versions available for review</p></div></div>
        {revisions.length ? <div className="pro-revisions">{revisions.map(revision => <div className="pro-revision-row" key={revision.id}><div className="pro-revision-symbol"><AdminIcon name="history" size={17}/></div><div><strong>{revision.reason}</strong><small>{date(revision.created_at)}</small></div><button type="button" disabled={busy} className="pro-revision-open" onClick={() => onViewRevision(revision)} aria-label={"View snapshot " + revision.reason}><AdminIcon name="arrow" size={17}/></button></div>)}</div>
        : <EmptyPanel icon="archive" title="No snapshots yet." description="Publishing and restoration activities automatically create recovery points."/>}
      </section>
    </div>
  </div>;
}

export function AdminCategoriesPanel({ categories, items, busy, onChange, onPublish }: {
  categories: AdminCategory[]; items: DisplayItem[]; busy: boolean;
  onChange: (categories: AdminCategory[]) => void; onPublish: () => void;
}) {
  const number = (id: string) => items.filter(item => item.category === id).length;
  return <div className="pro-management-page">
    <div className="pro-management-intro"><div><p className="pro-eyebrow">MENU STRUCTURE / CATEGORIES</p><h2>Thoughtfully arranged.</h2><p>Shape how guests browse your menu. Changes are published only when you confirm.</p></div><button type="button" className="pro-btn primary" onClick={() => onChange([...categories, { id: "category-" + Date.now().toString(36), label: "New category", visible: true }])}><AdminIcon name="plus" size={17}/> Add category</button></div>
    <section className="pro-management-card"><div className="pro-categories-header"><span>CATEGORY NAME</span><span>ITEMS</span><span>VISIBILITY</span><span>MANAGE</span></div>
      {categories.map((category, index) => <div className="pro-category-row" key={category.id}>
        <div className="pro-category-label"><span className="pro-category-symbol"><AdminIcon name="categories" size={18}/></span><label><span className="sr-only">Category name</span><input value={category.label} onChange={e => onChange(categories.map((c,i) => index === i ? { ...c, label: e.target.value } : c))}/></label></div>
        <span className="pro-category-count">{number(category.id)} dishes</span>
        <label className="pro-category-visibility"><input type="checkbox" checked={category.visible !== false} onChange={e => onChange(categories.map((c,i) => i === index ? { ...c, visible: e.target.checked } : c))}/><span className="pro-category-visibility-track" aria-hidden="true"/><span>{category.visible === false ? "Hidden" : "Visible"}</span></label>
        <button type="button" className="pro-category-remove" title={number(category.id) ? "Move all items before removing this category" : "Remove category"} disabled={number(category.id) > 0} onClick={() => onChange(categories.filter((_,i) => i !== index))}><AdminIcon name="trash" size={17}/></button>
      </div>)}
    </section>
    <div className="pro-category-save"><div><AdminIcon name="shield" size={17}/><span>Your edits aren't visible to guests until you publish them.</span></div><button type="button" className="pro-btn primary" disabled={busy} onClick={onPublish}><AdminIcon name="check" size={16}/> Publish category changes</button></div>
  </div>;
}

export function AdminServicePanel({ settings, branchName, busy, onChange, onSave }: {
  settings: AdminSettings; branchName: string; busy: boolean;
  onChange: (settings: AdminSettings) => void; onSave: () => void;
}) {
  return <div className="pro-management-page">
    <div className="pro-management-intro"><div><p className="pro-eyebrow">SERVICE OPERATIONS / HOTEL SETTINGS</p><h2>Set the standard for service.</h2><p>Dining hours, order availability and the WhatsApp destination for {branchName}.</p></div></div>
    <div className="pro-management-columns">
      <section className="pro-management-card"><div className="pro-management-card-head"><span className="pro-management-icon"><AdminIcon name="clock" size={20}/></span><div><h3>Dining hours</h3><p>Let guests know when they can order</p></div></div><div className="pro-service-form">
        <label>Service opens<input type="time" value={settings.open} onChange={e => onChange({ ...settings, open: e.target.value })}/></label>
        <label>Service closes<input type="time" value={settings.close} onChange={e => onChange({ ...settings, close: e.target.value })}/></label>
      </div>
      <div className="pro-service-toggle"><div><strong>Pause new orders</strong><p>Temporarily stop guest orders without hiding your menu.</p></div><label className="pro-category-visibility"><input type="checkbox" checked={settings.paused} onChange={e => onChange({ ...settings, paused: e.target.checked })}/><span className="pro-category-visibility-track" aria-hidden="true"/></label></div>
      </section>
      <section className="pro-management-card"><div className="pro-management-card-head"><span className="pro-management-icon gold"><AdminIcon name="store" size={20}/></span><div><h3>Guest order destination</h3><p>Where confirmed WhatsApp orders arrive</p></div></div>
        <div className="pro-service-form"><label>Business WhatsApp number<input type="tel" inputMode="tel" value={settings.whatsapp} placeholder="2348101702422" onChange={e => onChange({ ...settings, whatsapp: e.target.value })}/></label></div>
        <div className="pro-service-guidance"><AdminIcon name="shield" size={16}/><span>Use the hotel's official international-format number. This setting is independent for each property.</span></div>
      </section>
    </div>
    <div className="pro-category-save"><div><AdminIcon name="shield" size={17}/><span>Settings apply to {branchName} only.</span></div><button type="button" className="pro-btn primary" disabled={busy} onClick={onSave}><AdminIcon name="check" size={16}/> Save service settings</button></div>
  </div>;
}

function EmptyPanel({ icon, title, description }: { icon: "archive"|"clock"; title: string; description: string }) {
  return <div className="pro-management-empty"><span><AdminIcon name={icon} size={24}/></span><strong>{title}</strong><p>{description}</p></div>;
}
