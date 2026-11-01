"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Item } from "@/lib/catalog";
import { PHOTOS } from "@/lib/photos";
import { AdminIcon } from "./AdminIcon";

type DisplayItem = Item & { published?: boolean; visible?: boolean };
const money = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");
function displayPrice(item: DisplayItem) {
  if (item.basePrice > 0) return money(item.basePrice);
  const absolute = item.groups?.filter(g => g.mode === "absolute").flatMap(g => g.options.map(o => o.price)) ?? [];
  const positive = absolute.filter(n => n > 0);
  return positive.length ? "From " + money(Math.min(...positive)) : "Price varies by selection";
}

export default function AdminItemPreview({
  item, category, isDraft, onClose, onEdit, onPublish, busy
}: {
  item: DisplayItem;
  category: string;
  isDraft: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  busy?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const src = item.imageUrl || (item.photos?.[0] ? PHOTOS[item.photos[0]]?.src : undefined);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>(".pro-preview-dialog button:not([disabled])"));
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handle);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="pro-modal-bg pro-preview-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={"Preview " + item.name} className="pro-preview-dialog">
        <div className="pro-preview-media">
          {src ? <img src={src} alt={item.name} /> : <div className="pro-preview-placeholder"><AdminIcon name="image" size={44}/><span>Image not yet added</span></div>}
          <div className="pro-preview-media-top"><span className="pro-preview-stage">{isDraft ? "PRIVATE PREVIEW" : "LIVE MENU PREVIEW"}</span></div>
        </div>
        <div className="pro-preview-content">
          <div className="pro-preview-toolbar">
            <span className="pro-eyebrow">ITEM DETAILS / {category.toUpperCase()}</span>
            <button type="button" ref={closeRef} className="pro-icon-button" onClick={onClose} aria-label="Close preview"><AdminIcon name="close" size={20}/></button>
          </div>
          <div className="pro-preview-scroll">
            <div className="pro-preview-kicker"><span className={"pro-chip " + (isDraft ? "amber" : "green")}>{isDraft ? "Unpublished draft" : "Published"}</span><span className="pro-muted">Guest-facing information</span></div>
            <h2>{item.name || "Untitled menu item"}</h2>
            <p className="pro-preview-cost">{displayPrice(item)}</p>
            <p className="pro-preview-description">{item.description || "A description hasn't been added yet."}</p>
            <div className="pro-preview-divider"/>
            <div className="pro-preview-meta"><span>Category</span><strong>{category}</strong></div>
            <div className="pro-preview-meta"><span>Visibility</span><strong>{item.visible === false ? "Hidden from guests" : isDraft ? "Visible after publishing" : "Visible on guest menu"}</strong></div>
            {!isDraft && <div className="pro-preview-meta"><span>Availability</span><strong>{item.available === false ? "Sold out" : "Available"}</strong></div>}
            {item.groups?.length > 0 && <div className="pro-preview-choices">
              <h3>Choices & customisations</h3>
              {item.groups.map(group => <div className="pro-preview-choice-group" key={group.id}>
                <div className="pro-preview-choice-label"><strong>{group.label}</strong><small>{group.required ? "Required" : "Optional"}</small></div>
                {group.options.map(option => <div className="pro-preview-choice" key={option.id}><span>{option.label}</span><span>{group.mode === "absolute" ? money(option.price) : option.price === 0 ? "Included" : "+" + money(option.price)}</span></div>)}
              </div>)}
            </div>}
          </div>
          <div className="pro-preview-foot">
            <button type="button" className="pro-btn secondary" onClick={onClose}>Close preview</button>
            <button type="button" className="pro-btn primary" onClick={onEdit}><AdminIcon name="edit" size={16}/> Edit item</button>
            {isDraft && onPublish && <button type="button" className="pro-btn gold" disabled={busy} onClick={onPublish}><AdminIcon name="check" size={16}/> Publish</button>}
          </div>
        </div>
      </section>
    </div>, document.body
  );
}
