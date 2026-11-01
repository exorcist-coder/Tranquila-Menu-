"use client";
import type { Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { AdminIcon } from "./AdminIcon";

type DisplayItem = Item & { visible?: boolean; published?: boolean };
const money = (n: number) => "₦" + Number(n||0).toLocaleString("en-NG");
export default function AdminEditorAside({ item, category, onPreview }: {
  item: DisplayItem; category: string; onPreview: () => void;
}) {
  const src = item.imageUrl || (item.photos?.[0] ? PHOTOS[item.photos[0]]?.src : undefined);
  return <aside className="pro-editor-aside">
    <div className="pro-editor-aside-heading"><span className="pro-eyebrow">GUEST VIEW / PREVIEW</span><span className="pro-chip amber">Not published</span></div>
    <div className="pro-editor-aside-photo">{src ? <img src={src} alt="Menu item preview"/> : <span><AdminIcon name="image" size={34}/> Add a dish image</span>}</div>
    <div className="pro-editor-aside-content"><span className="pro-editor-aside-category">{category}</span><h3>{item.name?.trim() || "Your new menu item"}</h3><p>{item.description || "Your thoughtful description will appear here as you write."}</p><strong>{item.basePrice > 0 ? money(item.basePrice) : "Price from choices"}</strong></div>
    <button className="pro-btn secondary" type="button" onClick={onPreview}><AdminIcon name="eye" size={16}/> Open full preview</button>
    <div className="pro-editor-aside-note"><AdminIcon name="shield" size={17}/><span>Your changes stay private until you save the draft and explicitly publish it.</span></div>
  </aside>;
}
