"use client";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { AdminIcon } from "./AdminIcon";

type DisplayItem = Item & { published?: boolean; visible?: boolean };
type Category = { id: string; label: string; visible?: boolean };
type Draft = { id: number; item_id: string; item: DisplayItem; updated_at: string };
type Mode = "live" | "drafts";
const money = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");
function price(item: DisplayItem) {
  if (item.basePrice > 0) return money(item.basePrice);
  const nums = item.groups?.filter(g => g.mode === "absolute").flatMap(g => g.options.map(o => o.price)).filter(n => n > 0) ?? [];
  return nums.length ? "From " + money(Math.min(...nums)) : "Price on selection";
}
const image = (item: DisplayItem) => item.imageUrl || (item.photos?.[0] ? PHOTOS[item.photos[0]]?.src : undefined);
const date = (s: string) => new Date(s).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const categoryOf = (categories: Category[], id: string) => categories.find(c => c.id === id)?.label ?? id;

export function AdminMenuWorkspace({
  mode, categories, items, drafts, query, onQuery, busy,
  onNew, onEdit, onPreview, onArchive, onAvailability, onPublish, onDiscard
}: {
  mode: Mode; categories: Category[]; items: DisplayItem[]; drafts: Draft[];
  query: string; onQuery: (value: string) => void; busy: boolean;
  onNew: () => void; onEdit: (item: DisplayItem) => void;
  onPreview: (item: DisplayItem, isDraft: boolean) => void;
  onArchive: (item: DisplayItem) => void;
  onAvailability: (item: DisplayItem) => void;
  onPublish: (draft: Draft) => void; onDiscard: (draft: Draft) => void;
}) {
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [stock, setStock] = useState<"all" | "available" | "soldout">("all");
  const [sort, setSort] = useState<"menu" | "name" | "price" | "recent">("menu");
  const [page, setPage] = useState(1);
  const entries = useMemo(() => mode === "live"
    ? items.map(item => ({ item, draft: undefined as Draft | undefined }))
    : drafts.map(draft => ({ item: draft.item, draft })), [mode, items, drafts]);
  const visibleEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const results = entries.filter(({ item }) =>
      (category === "all" || item.category === category) &&
      (!needle || [item.name, item.description, categoryOf(categories, item.category)].some(s => (s ?? "").toLowerCase().includes(needle))) &&
      (mode !== "live" || stock === "all" || (stock === "available" ? item.available !== false : item.available === false))
    );
    if (sort === "name") results.sort((a,b) => a.item.name.localeCompare(b.item.name));
    if (sort === "price") results.sort((a,b) => a.item.basePrice - b.item.basePrice);
    if (sort === "recent" && mode === "drafts") results.sort((a,b) => (b.draft?.updated_at ?? "").localeCompare(a.draft?.updated_at ?? ""));
    return results;
  }, [entries, categories, category, query, stock, sort, mode]);
  const countFor = (id: string) => entries.filter(({ item }) => id === "all" || item.category === id).length;
  const total = entries.length;
  const perPage = view === "grid" ? 12 : 15;
  const pages = Math.max(1, Math.ceil(visibleEntries.length / perPage));
  const currentPage = Math.min(page, pages);
  const pageEntries = visibleEntries.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => { setPage(1); }, [mode, category, query, stock, sort, view]);

  return <section className="pro-collection">
    <div className="pro-collection-heading">
      <div><p className="pro-eyebrow">MENU / {mode === "live" ? "PUBLISHED COLLECTION" : "EDITORIAL WORKSPACE"}</p>
        <h2>{mode === "live" ? "Your menu, beautifully organised." : "Work in progress."}</h2>
        <p>{mode === "live"
          ? "Browse your dishes, manage stock instantly, and prepare edits safely."
          : "Private drafts. Review every detail before anything reaches guests."}</p>
      </div>
      <button type="button" className="pro-btn primary pro-add" onClick={onNew}><AdminIcon name="plus" size={18}/> Create item</button>
    </div>

    <div className="pro-category-tabs" role="group" aria-label="Filter menu by category">
      <button className={category === "all" ? "active" : ""} aria-pressed={category === "all"} onClick={() => setCategory("all")}>All items <span>{total}</span></button>
      {categories.filter(c => countFor(c.id) > 0).map(c =>
        <button key={c.id} aria-pressed={category === c.id} className={category === c.id ? "active" : ""} onClick={() => setCategory(c.id)}>{c.label}<span>{countFor(c.id)}</span></button>)}
    </div>

    <div className="pro-collection-tools">
      <label className="pro-search-input"><AdminIcon name="search" size={19}/><span className="sr-only">Search menu items</span><input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={mode === "live" ? "Search dishes, ingredients, categories…" : "Find a saved draft…"}/>{query && <button type="button" aria-label="Clear search" onClick={() => onQuery("")}><AdminIcon name="close" size={15}/></button>}</label>
      {mode === "live" && <label className="pro-filter-control"><AdminIcon name="filter" size={16}/><span className="sr-only">Availability filter</span><select value={stock} onChange={e => setStock(e.target.value as typeof stock)}><option value="all">All stock</option><option value="available">Available</option><option value="soldout">Sold out</option></select></label>}
      <label className="pro-filter-control"><span className="sr-only">Sort items</span><select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="menu">Menu order</option><option value="name">Name A–Z</option><option value="price">Price low–high</option>{mode === "drafts" && <option value="recent">Last edited</option>}</select></label>
      <div className="pro-view-switch" role="group" aria-label="Layout">
        <button type="button" className={view === "grid" ? "active" : ""} aria-pressed={view === "grid"} aria-label="Card grid" title="Card grid" onClick={() => setView("grid")}><AdminIcon name="grid" size={17}/></button>
        <button type="button" className={view === "list" ? "active" : ""} aria-pressed={view === "list"} aria-label="Compact list" title="Compact list" onClick={() => setView("list")}><AdminIcon name="list" size={18}/></button>
      </div>
    </div>
    <div className="pro-results-line"><span>Showing <strong>{visibleEntries.length ? (currentPage - 1) * perPage + 1 : 0}–{Math.min(currentPage * perPage, visibleEntries.length)}</strong> of {visibleEntries.length} {mode === "live" ? "published items" : "saved drafts"}</span><span><i className="pro-legend-dot"/> {mode === "live" ? "Stock updates immediately" : "Drafts are not visible to guests"}</span></div>

    {visibleEntries.length ? <div className={"pro-food-grid " + (view === "list" ? "as-list" : "")}>
      {pageEntries.map(({ item, draft }, index) => <article key={item.id} className="pro-food-card" style={{ animationDelay: Math.min(index * 24, 200) + "ms" }}>
        <div className="pro-food-visual">
          {image(item) ? <img src={image(item)} alt={item.name} loading="lazy"/> : <div className="pro-food-placeholder"><AdminIcon name="image" size={38}/><span>No photograph</span></div>}
          <span className="pro-food-category">{categoryOf(categories, item.category)}</span>
          {mode === "drafts"
            ? <span className="pro-food-state draft">Draft</span>
            : <span className={"pro-food-state " + (item.available === false ? "soldout" : "available")}>{item.available === false ? "Sold out" : "Live"}</span>}
          <button type="button" className="pro-food-preview" aria-label={"Preview " + item.name} title="Preview" onClick={() => onPreview(item, mode === "drafts")}><AdminIcon name="eye" size={18}/></button>
        </div>
        <div className="pro-food-body">
          <div className="pro-food-title-block"><h3>{item.name}</h3><p>{item.description || "No description added yet."}</p></div>
          <div className="pro-food-bottom"><strong className="pro-food-price">{price(item)}</strong>{draft && <span className="pro-food-date">Edited {date(draft.updated_at)}</span>}</div>
          {mode === "live"
            ? <div className="pro-food-footer">
                <button type="button" className={"pro-stock " + (item.available === false ? "out" : "in")} role="switch" aria-label={item.name + " availability"} aria-checked={item.available !== false} disabled={busy} onClick={() => onAvailability(item)}><span className="pro-stock-track" aria-hidden="true"><span /></span><span className="pro-stock-label">{item.available === false ? "Sold out" : "Available"}</span></button>
                <div className="pro-food-actions"><button type="button" title="Edit item as a draft" aria-label={"Edit " + item.name} onClick={() => onEdit(item)}><AdminIcon name="edit" size={17}/></button><button type="button" title="Archive item" aria-label={"Archive " + item.name} disabled={busy} onClick={() => onArchive(item)}><AdminIcon name="archive" size={17}/></button></div>
              </div>
            : <div className="pro-food-footer draft-actions">
                <button type="button" className="pro-btn secondary" onClick={() => onEdit(item)}><AdminIcon name="edit" size={15}/> Edit</button>
                <button type="button" className="pro-btn gold" disabled={busy} onClick={() => draft && onPublish(draft)}><AdminIcon name="check" size={15}/> Publish</button>
                <button type="button" className="pro-icon-button danger" disabled={busy} aria-label={"Discard draft " + item.name} onClick={() => draft && onDiscard(draft)}><AdminIcon name="trash" size={17}/></button>
              </div>}
        </div>
      </article>)}
    </div> : <div className="pro-empty-collection"><span className="pro-empty-illustration"><AdminIcon name={mode === "live" ? "search" : "draft"} size={32}/></span><h3>{mode === "drafts" && total === 0 ? "A fresh canvas for new ideas." : "Nothing matches your filters."}</h3><p>{mode === "drafts" && total === 0 ? "Create a draft, shape the details, and publish only when it's ready." : "Try a different search term, category or stock filter."}</p><button type="button" className="pro-btn secondary" onClick={() => {onQuery("");setCategory("all");setStock("all");}}>{mode === "drafts" && total === 0 ? "Browse categories" : "Clear filters"}</button></div>}
    {pages > 1 && <nav className="pro-pagination" aria-label="Menu pages">
      <span>Page {currentPage} of {pages}</span>
      <div className="pro-pagination-controls">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous page"><AdminIcon name="back" size={16}/></button>
        {Array.from({ length: pages }, (_,i) => i + 1).filter(n => pages <= 5 || n === 1 || n === pages || Math.abs(n - currentPage) <= 1).map((n,i,visible) =>
          <span key={n} className="pro-pagination-entry">{i > 0 && visible[i-1] !== n-1 && <span className="pro-pagination-ellipsis">…</span>}<button type="button" aria-current={currentPage === n ? "page" : undefined} className={currentPage === n ? "active" : ""} onClick={() => setPage(n)}>{n}</button></span>)}
        <button type="button" disabled={currentPage === pages} onClick={() => setPage(p => Math.min(pages, p + 1))} aria-label="Next page"><AdminIcon name="arrow" size={16}/></button>
      </div>
    </nav>}
  </section>;
}
