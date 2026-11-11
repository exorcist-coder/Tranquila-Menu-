"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isDrink, type Item } from "@/lib/catalog";
import { describeSelection, missingGroups, naira, normalize, priceRange, showsPrice, unitPrice, visibleGroups, visibleOptions, type Selection } from "@/lib/pricing";
import { notify } from "@/lib/notifications";
import { searchPhotoIndex } from "@/lib/searchPhoto";
import { cart } from "./useCart";
import type { BranchId } from "@/lib/branches";
import Sheet, { useSheetDrag } from "./Sheet";
import Media, { Bottle, photoOf, isPhotoDrink } from "./Media";
import Stepper from "./Stepper";
import { IconClose } from "./icons";

export default function ItemSheet({ item, initialSelection = {}, initialPhotoIndex = 0, branchId, onClose, canOrder, onAdded, browseOnly = false }: { item: Item | null; initialSelection?: Selection; initialPhotoIndex?: number; branchId: BranchId; onClose: () => void; canOrder: boolean; onAdded: (name: string) => void; browseOnly?: boolean }) {
  const last = useRef<Item | null>(item);
  if (item) last.current = item; // keep content mounted while the sheet animates out
  return (
    <Sheet open={!!item} onClose={onClose} label={last.current?.name ?? "Dish"}>
      {last.current ? <Body key={`${last.current.id}:${JSON.stringify(initialSelection)}`} initialSelection={initialSelection} initialPhotoIndex={initialPhotoIndex} item={last.current} branchId={branchId} onClose={onClose} canOrder={canOrder} onAdded={onAdded} browseOnly={browseOnly} /> : null}
    </Sheet>
  );
}

function Body({ item, initialSelection, initialPhotoIndex, branchId, onClose, canOrder, onAdded, browseOnly }: { item: Item; initialSelection: Selection; initialPhotoIndex: number; branchId: BranchId; onClose: () => void; canOrder: boolean; onAdded: (name: string) => void; browseOnly: boolean }) {
  const drag = useSheetDrag();
  const [sel, setSel] = useState<Selection>(() => normalize(item, initialSelection));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [showOrderingHelp, setShowOrderingHelp] = useState(false);
  const [slide, setSlide] = useState(initialPhotoIndex);
  const [expandedPhoto, setExpandedPhoto] = useState<number | null>(null);
  const refs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const missing = missingGroups(item, sel);
  const groups = visibleGroups(item, sel);
  const unit = unitPrice(item, sel);
  const [lo] = priceRange(item);
  const photos = Math.max(1, (item.photos?.length ?? 0) + (item.imageUrl ? 1 : 0));
  const photoUrls = Array.from({ length: photos }, (_, i) => item.imageUrl && i === 0 ? item.imageUrl : photoOf(item, i - (item.imageUrl ? 1 : 0))?.src);
  const drink = isDrink(item.category);
  const photoDrink = isPhotoDrink(item);
  const coverIndex = Math.min(initialPhotoIndex + (item.imageUrl ? 1 : 0), photos - 1);

  useEffect(() => { if (tried && missing.length === 0) setTried(false); }, [tried, missing.length]);
  useEffect(() => { const gallery = galleryRef.current; if (gallery && initialPhotoIndex > 0) gallery.scrollLeft = initialPhotoIndex * gallery.clientWidth; }, [initialPhotoIndex]);

  function submit() {
    if (browseOnly) { setShowOrderingHelp(true); return; }
    if (!canOrder || item.available === false) { notify.warning(item.available === false ? "This item is sold out." : "Ordering is currently closed."); return; }
    if (missing.length) { setTried(true); refs.current[missing[0]!.id]?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    cart.add(branchId, { itemId: item.id, sel: normalize(item, sel), qty, note: note.trim() });
    onAdded(item.name);
    onClose();
  }

  return (
    <div className="sheet-body">
      <div className={`item-sheet-bar${drink ? " wbar" : ""}`} {...drag}>
        <div className="grab" aria-hidden><i /></div>
        {drink && <span className="wbar-t">Product details</span>}
        <button type="button" className="round close item-close-compact" onClick={onClose} aria-label="Close item details"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div className="sheet-scroll item-sheet-scroll">
        {drink ? (
          <div className={`wd-head${photoDrink ? " wd-head-photo" : ""}`}>
            <div className="wd-art">{photoDrink ? <button type="button" className="drink-cover" onClick={() => setExpandedPhoto(coverIndex)} aria-label={`View ${item.name} photo ${coverIndex + 1} full screen`}><Bottle item={item} index={coverIndex} /></button> : <Bottle item={item} />}{photos > 1 && <div className="drink-photo-strip" aria-label="More product photos">{photoUrls.map((url, i) => url && <button key={url + i} type="button" onClick={() => setExpandedPhoto(i)} aria-label={"View " + item.name + " photo " + (i + 1)}><img src={url} alt="" /></button>)}</div>}</div>
            <div className="wd-info">
              <h2>{item.name}</h2>
              <p className="item-desc">{item.description}</p>
              {item.details && item.details.length > 0 && (
                <dl className="wd-list"><dt className="wd-h">Details</dt>{item.details.map((d) => <div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>)}</dl>
              )}
            </div>
          </div>
        ) : (
        <div className="hero">
          <div className="gallery" ref={galleryRef} onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} tabIndex={photos > 1 ? 0 : undefined} aria-label={photos > 1 ? `${item.name} photos` : undefined}>
            {Array.from({ length: photos }, (_, i) => (
              <div className="slide" key={i}><button type="button" className="gallery-open" onClick={() => setExpandedPhoto(i)} disabled={!photoUrls[i]} aria-label={`View ${item.name} photo ${i + 1} full screen`}><Media item={item} index={i} radius={28} layoutId={i === 0 ? `media-${item.id}` : undefined} eager alt={i === 0 ? item.name : ""} /></button></div>
            ))}
          </div>
          {photos > 1 && <div className="dots" aria-hidden>{Array.from({ length: photos }, (_, i) => <i key={i} data-on={i === slide ? "" : undefined} />)}</div>}
        </div>
        )}
        <div className="item-content">
          {!drink && <>
            <div className="item-head">
              <h2>{item.name}</h2>
              <p className="item-price">{unit > 0 ? naira(unit) : <><small>from</small> {naira(lo)}</>}</p>
            </div>
            <p className="item-desc">{item.description}</p>
          </>}

          {groups.map((g) => {
            const bad = tried && missing.some((m) => m.id === g.id);
            return (
              <fieldset key={g.id} ref={(el) => { refs.current[g.id] = el; }} className={`group${bad ? " bad" : ""}`}>
                <legend><span>{g.label}</span><em>{bad ? "Please choose one" : "Choose 1"}</em></legend>
                <div className="pills" role="radiogroup" aria-label={g.label}>
                  {visibleOptions(g, sel).map((o) => {
                    const on = sel[g.id] === o.id;
                    return (
                      <label key={o.id} className="pill" data-on={on ? "" : undefined}>
                        <input type="radio" name={g.id} checked={on} onChange={() => { setSel((p) => normalize(item, { ...p, [g.id]: o.id })); if (item.id === "sides" && o.id === "coleslaw") { const i = searchPhotoIndex(item, { groupId: g.id, optionId: o.id }); galleryRef.current?.scrollTo({ left: i * galleryRef.current.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } }} />
                        {on && <motion.span layoutId={`pill-${g.id}`} className="pill-bg" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
                        <span className="pill-t">{o.label}</span>
                        {showsPrice(g, o) && <span className="pill-p">{g.mode === "addon" ? "+" : ""}{naira(o.price)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {!browseOnly && <label className="note-field"><span>Special request <em>optional</em></span>
            <textarea rows={2} maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, no pepper, extra sauce…" />
          </label>}
          <p className="allergen-hint"><strong>Food allergies?</strong> {browseOnly ? "Please ask a member of staff about ingredients and cross-contact before ordering." : "Confirm ingredients and cross-contact with staff in WhatsApp before ordering. A note alone cannot guarantee an allergen-free meal."}</p>
        </div>
      </div>

      {browseOnly ? <footer className="dock-foot public-order-footer">
        {drink && <p className="public-menu-price" aria-live="polite"><span>{unit > 0 ? "Price" : "From"}</span><strong>{naira(unit > 0 ? unit : lo)}</strong></p>}
        {showOrderingHelp && <p role="status">To place an order, please scan the QR code in your room or ask a member of staff for the ordering link.</p>}
        <motion.button type="button" className="cta" whileTap={{ scale: 0.97 }} onClick={submit}>Order at the hotel</motion.button>
      </footer> : drink ? (
        <footer className="wfoot">
          <div className="wprice"><small>{unit > 0 ? "Total" : "From"}</small><b>{unit > 0 ? naira(unit * qty) : naira(lo * qty)}</b></div>
          <Stepper value={qty} tone="light" size="sm" label="Quantity" onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => Math.min(20, q + 1))} incDisabled={qty >= 20} />
          <motion.button type="button" className="wbtn" whileTap={{ scale: 0.97 }} onClick={submit} disabled={!canOrder || item.available === false}>{item.available === false ? "Sold out" : canOrder ? "Add to cart" : "Closed"}</motion.button>
        </footer>
      ) : (
      <footer className="dock-foot">
        <Stepper value={qty} tone="light" label="Quantity" onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => Math.min(20, q + 1))} incDisabled={qty >= 20} />
        <motion.button type="button" className="cta" whileTap={{ scale: 0.97 }} onClick={submit} disabled={!canOrder || item.available === false}>
          <span>{item.available === false ? "Sold out" : canOrder ? "Add to order" : "Ordering is closed"}</span>
          {canOrder && item.available !== false && <span className="cta-p">{unit > 0 ? naira(unit * qty) : `from ${naira(lo * qty)}`}</span>}
        </motion.button>
      </footer>
      )}
      {expandedPhoto !== null && <PhotoViewer itemName={item.name} urls={photoUrls} initialIndex={expandedPhoto} onClose={() => setExpandedPhoto(null)} />}
      <p className="sr-only" aria-live="polite">{describeSelection(item, sel)}</p>
    </div>
  );
}

/** A separate portal avoids clipping the enlarged photo inside the draggable item sheet. */
function PhotoViewer({ itemName, urls, initialIndex, onClose }: { itemName: string; urls: (string | undefined)[]; initialIndex: number; onClose: () => void }) {
  const available = urls.map((src, i) => ({ src, i })).filter((p): p is { src: string; i: number } => !!p.src);
  const [index, setIndex] = useState(() => Math.max(0, available.findIndex(p => p.i === initialIndex)));
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    window.history.pushState({ ...(window.history.state ?? {}), hotelPhotoViewer: true }, "", window.location.href);
    const pop = () => closeRef.current();
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const closePhotoViewer = () => {
    if ((window.history.state as {hotelPhotoViewer?: boolean}|null)?.hotelPhotoViewer) window.history.back();
    else onClose();
  };
  const startX = useRef<number | null>(null);
  const count = available.length;
  const previous = () => setIndex(i => (i - 1 + count) % count);
  const next = () => setIndex(i => (i + 1) % count);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    // Stop the parent sheet from interpreting Escape or trapping focus behind this dialog.
    event.stopPropagation();
    if (event.key === "Escape") { closePhotoViewer(); return; }
    if (event.key === "ArrowLeft" && count > 1) { event.preventDefault(); previous(); }
    if (event.key === "ArrowRight" && count > 1) { event.preventDefault(); next(); }
    if (event.key === "Tab") {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const active = document.activeElement;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (active === first || active === event.currentTarget)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
    }
  }

  if (!count) return null;
  return createPortal(
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={itemName + " photo viewer"} tabIndex={-1} onKeyDown={onKeyDown}
      onTouchStart={e => { startX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={e => { if (startX.current === null || count < 2) return; const delta = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current; startX.current = null; if (delta > 50) previous(); else if (delta < -50) next(); }}>
      <button type="button" className="photo-viewer-close" ref={closeButton} onClick={closePhotoViewer} aria-label="Back to item"><IconClose /></button>
      <div className="photo-viewer-stage">
        <img key={available[index]!.src} src={available[index]!.src} alt={itemName + " photo " + (index + 1)} draggable={false} />
      </div>
      {count > 1 && <>
        <button type="button" className="photo-viewer-nav photo-viewer-prev" onClick={previous} aria-label="Previous photo">‹</button>
        <button type="button" className="photo-viewer-nav photo-viewer-next" onClick={next} aria-label="Next photo">›</button>
        <span className="photo-viewer-count" aria-live="polite">{index + 1} / {count}</span>
      </>}
    </div>, document.body
  );
}
