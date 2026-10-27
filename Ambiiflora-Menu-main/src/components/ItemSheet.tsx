"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { isDrink, type Item } from "@/lib/catalog";
import { describeSelection, missingGroups, naira, normalize, priceRange, showsPrice, unitPrice, visibleGroups, visibleOptions, type Selection } from "@/lib/pricing";
import { cart } from "./useCart";
import type { BranchId } from "@/lib/branches";
import Sheet, { useSheetDrag } from "./Sheet";
import Media, { Bottle } from "./Media";
import Stepper from "./Stepper";
import { IconClose } from "./icons";

export default function ItemSheet({ item, branchId, onClose, canOrder, onAdded }: { item: Item | null; branchId: BranchId; onClose: () => void; canOrder: boolean; onAdded: (name: string) => void }) {
  const last = useRef<Item | null>(item);
  if (item) last.current = item; // keep content mounted while the sheet animates out
  return (
    <Sheet open={!!item} onClose={onClose} label={last.current?.name ?? "Dish"}>
      {last.current ? <Body key={last.current.id} item={last.current} branchId={branchId} onClose={onClose} canOrder={canOrder} onAdded={onAdded} /> : null}
    </Sheet>
  );
}

function Body({ item, branchId, onClose, canOrder, onAdded }: { item: Item; branchId: BranchId; onClose: () => void; canOrder: boolean; onAdded: (name: string) => void }) {
  const drag = useSheetDrag();
  const [sel, setSel] = useState<Selection>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [slide, setSlide] = useState(0);
  const refs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const missing = missingGroups(item, sel);
  const groups = visibleGroups(item, sel);
  const unit = unitPrice(item, sel);
  const [lo] = priceRange(item);
  const photos = Math.max(1, item.photos?.length ?? 0);
  const drink = isDrink(item.category);

  useEffect(() => { if (tried && missing.length === 0) setTried(false); }, [tried, missing.length]);

  function submit() {
    if (!canOrder || item.available === false) return;
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
        <button type="button" className="round close" onClick={onClose} aria-label="Close"><IconClose /></button>
      </div>
      <div className="sheet-scroll item-sheet-scroll">
        {drink ? (
          <div className="wd-head">
            <div className="wd-art"><Bottle item={item} /></div>
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
          <div className="gallery" onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} tabIndex={photos > 1 ? 0 : undefined} aria-label={photos > 1 ? `${item.name} photos` : undefined}>
            {Array.from({ length: photos }, (_, i) => (
              <div className="slide" key={i}><Media item={item} index={i} radius={28} layoutId={i === 0 ? `media-${item.id}` : undefined} eager alt={i === 0 ? item.name : ""} /></div>
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
                        <input type="radio" name={g.id} checked={on} onChange={() => setSel((p) => normalize(item, { ...p, [g.id]: o.id }))} />
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

          <label className="note-field"><span>Special request <em>optional</em></span>
            <textarea rows={2} maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, no pepper, extra sauce…" />
          </label>
          <p className="allergen-hint"><strong>Food allergies?</strong> Confirm ingredients and cross-contact with staff in WhatsApp before ordering. A note alone cannot guarantee an allergen-free meal.</p>
        </div>
      </div>

      {drink ? (
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
      <p className="sr-only" aria-live="polite">{describeSelection(item, sel)}</p>
    </div>
  );
}
