"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { findItem } from "@/lib/catalog";
import { describeSelection, naira, unitPrice, vatBreakdown } from "@/lib/pricing";
import { cart, useCart } from "./useCart";
import { toast } from "./toastStore";
import Sheet, { useSheetDrag } from "./Sheet";
import Stepper from "./Stepper";
import { Thumb } from "./Media";
import { IconClose, IconTrash } from "./icons";
import type { BranchId } from "@/lib/branches";

type Prepared = { ok: true; ref: string; total: number; message: string; waUrl: string };
type Step = "basket" | "details" | "review";
const ORDER: Step[] = ["basket", "details", "review"];
const ROOM_NUMBER_ERROR = "Enter your room number.";
const PICKUP_NAME_ERROR = "Enter a name for collection.";
const PICKUP_CONTACT_ERROR = "Enter a valid phone number for pickup updates.";

export default function CartSheet({ open, branchId, onClose, canOrder, closedReason }: { open: boolean; branchId: BranchId; onClose: () => void; canOrder: boolean; closedReason: string }) {
  return <Sheet open={open} onClose={onClose} label="Your order" tone="dark"><Body branchId={branchId} onClose={onClose} canOrder={canOrder} closedReason={closedReason} /></Sheet>;
}

function Choice({ group, checked, onChange, title, sub }: { group: string; checked: boolean; onChange: () => void; title: string; sub?: string }) {
  return (
    <label className="choice" data-on={checked ? "" : undefined}>
      <input type="radio" name={group} checked={checked} onChange={onChange} />
      {checked && <motion.span layoutId={`ring-${group}`} className="choice-ring" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
      <span className="choice-dot" aria-hidden />
      <span className="choice-t"><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </label>
  );
}

function Body({ branchId, onClose, canOrder, closedReason }: { branchId: BranchId; onClose: () => void; canOrder: boolean; closedReason: string }) {
  const drag = useSheetDrag();
  const lines = useCart(branchId);
  const rows = useMemo(() => lines.flatMap((l) => { const item = findItem(l.itemId); return item ? [{ l, item, unit: unitPrice(item, l.sel) }] : []; }), [lines]);
  const total = rows.reduce((s, r) => s + r.unit * r.l.qty, 0);
  const [step, setStepRaw] = useState<Step>("basket");
  const [dir, setDir] = useState(1);
  const [fulfilment, setFulfilment] = useState<"room" | "collect" | "">("");
  const [room, setRoom] = useState("");
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [payment, setPayment] = useState<"cash" | "pos" | "">("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const roomNumberError = errors.includes(ROOM_NUMBER_ERROR);
  const pickupNameError = errors.includes(PICKUP_NAME_ERROR);
  const pickupContactError = errors.includes(PICKUP_CONTACT_ERROR);

  const go = (s: Step) => { setDir(ORDER.indexOf(s) >= ORDER.indexOf(step) ? 1 : -1); setErrors([]); setStepRaw(s); };

  async function review() {
    const local: string[] = [];
    if (!fulfilment) local.push("Choose delivery or collection.");
    if (fulfilment === "room" && !room.trim()) local.push(ROOM_NUMBER_ERROR);
    if (fulfilment === "collect" && !guestName.trim()) local.push(PICKUP_NAME_ERROR);
    const contactDigits = contact.replace(/\D/g, "").length;
    if (fulfilment === "collect" && (contactDigits < 10 || contactDigits > 15)) local.push(PICKUP_CONTACT_ERROR);
    if (!payment) local.push("Choose how you will pay.");
    if (local.length) return setErrors(local);
    setBusy(true); setErrors([]);
    try {
      const res = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branchId, lines: rows.map(({ l }) => ({ itemId: l.itemId, sel: l.sel, qty: l.qty, note: l.note })), fulfilment, room, guestName, contact, payment, note }) });
      const data = await res.json();
      if (data.ok) { setPrepared(data); go("review"); } else setErrors(data.errors ?? ["Something went wrong. Try again."]);
    } catch { setErrors(["No connection. Check your network and try again."]); }
    setBusy(false);
  }

  const sentDone = () => { cart.clear(branchId); onClose(); toast.show("Order cleared. Enjoy your meal."); };
  const cancelOrder = () => { const prev = cart.clear(branchId); onClose(); toast.show("Order cancelled", { label: "Undo", run: () => cart.restore(prev, branchId) }); };
  const copy = async () => { try { await navigator.clipboard.writeText(prepared!.message); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the text is selectable */ } };

  const title = step === "basket" ? "Your order" : step === "details" ? "Delivery & payment" : "Review & send";
  const slideV = { enter: (d: number) => ({ x: 36 * d, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: -36 * d, opacity: 0 }) };

  return (
    <div className="sheet-body">
      <header className="sheet-head" {...drag}>
        <div className="grab" aria-hidden><i /></div>
        <div className="sheet-title">
          <h2>{title}</h2>
          {step === "details" && <p>No account needed. You pay in person.</p>}
        </div>
        <div className="head-actions">
          {rows.length > 0 && (
            <motion.button type="button" className="chip-btn danger" whileTap={{ scale: 0.94 }} onClick={() => setConfirming(true)} aria-label="Cancel this order">
              <IconTrash width={18} height={18} /><span>Cancel order</span>
            </motion.button>
          )}
          <button type="button" className="round" onClick={onClose} aria-label="Close"><IconClose /></button>
        </div>
      </header>

      <div className="sheet-scroll">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={step} custom={dir} variants={slideV} initial="enter" animate="center" exit="exit" transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}>
            {step === "basket" && (rows.length === 0 ? (
              <div className="empty">
                <p>Your order is empty.</p>
                <button type="button" className="ghost" onClick={onClose}>Back to the menu</button>
              </div>
            ) : (
              <>
                <ul className="lines">
                  <AnimatePresence initial={false}>
                    {rows.map(({ l, item, unit }) => (
                      <motion.li key={l.id} layout="position" exit={{ opacity: 0, x: -28, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 420, damping: 38 }}>
                        <Thumb item={item} />
                        <div className="line-main">
                          <b>{item.name}</b>
                          {describeSelection(item, l.sel) && <span>{describeSelection(item, l.sel)}</span>}
                          {l.note && <span>“{l.note}”</span>}
                          <button type="button" className="link" onClick={() => cart.remove(branchId, l.id)}>Remove</button>
                        </div>
                        <div className="line-side">
                          <b>{naira(unit * l.qty)}</b>
                          <Stepper size="sm" tone="dark" value={l.qty} label={`Quantity for ${item.name}`} onDec={() => (l.qty === 1 ? cart.remove(branchId, l.id) : cart.setQty(branchId, l.id, l.qty - 1))} onInc={() => cart.setQty(branchId, l.id, l.qty + 1)} incDisabled={l.qty >= 20} />
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <dl className="totals">
                  <div><dt>Delivery to your room</dt><dd>Free</dd></div>
                  <div><dt>Subtotal (excl. VAT)</dt><dd>{naira(vatBreakdown(total).net)}</dd></div>
                  <div><dt>7.5% VAT inclusive</dt><dd>{naira(vatBreakdown(total).vat)}</dd></div>
                  <div className="grand"><dt>Total</dt><dd>{naira(total)}</dd></div>
                </dl>
              </>
            ))}

            {step === "details" && (
              <>
                <fieldset className="group"><legend><span>How should we serve you?</span></legend>
                  <div className="choices">
                    <Choice group="f" checked={fulfilment === "room"} onChange={() => setFulfilment("room")} title="Deliver to my room" sub="Free" />
                    <Choice group="f" checked={fulfilment === "collect"} onChange={() => setFulfilment("collect")} title="I’ll collect it" sub="From the restaurant counter" />
                  </div>
                </fieldset>
                {fulfilment === "collect" && (
                  <>
                    <label className="field">
                      <span>Name for collection</span>
                      <input type="text" autoComplete="name" maxLength={80} value={guestName} aria-invalid={pickupNameError} aria-describedby="pickup-name-hint" onChange={(e) => { setGuestName(e.target.value); setErrors(current => current.filter(error => error !== PICKUP_NAME_ERROR)); }} />
                      <small className="field-hint" id="pickup-name-hint">This helps staff identify your order at the counter.</small>
                      {pickupNameError && <small className="field-error" role="alert">Enter a name for collection.</small>}
                    </label>
                    <label className="field">
                      <span>Phone for pickup updates</span>
                      <input type="tel" inputMode="tel" autoComplete="tel" maxLength={32} placeholder="+234 801 234 5678" value={contact} aria-invalid={pickupContactError} aria-describedby="pickup-contact-hint" onChange={(e) => { setContact(e.target.value); setErrors(current => current.filter(error => error !== PICKUP_CONTACT_ERROR)); }} />
                      <small className="field-hint" id="pickup-contact-hint">Staff will use this number to contact you and confirm collection timing.</small>
                      {pickupContactError && <small className="field-error" role="alert">Enter a valid phone number with country code.</small>}
                    </label>
                  </>
                )}
                <AnimatePresence initial={false}>
                  {fulfilment === "room" && (
                    <motion.div key="room" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }} style={{ overflow: "hidden" }}>
                      <label className="field">
                        <span>Room number</span>
                        <input inputMode="text" maxLength={12} value={room} aria-invalid={roomNumberError} aria-describedby="room-number-hint" onChange={(e) => { setRoom(e.target.value); setErrors(current => current.filter(error => error !== ROOM_NUMBER_ERROR)); }} autoComplete="off" />
                        <small className="field-hint" id="room-number-hint">Double-check the room number so staff deliver to the right room.</small>
                        {roomNumberError && <small className="field-error" role="alert">Enter your room number for delivery.</small>}
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
                <fieldset className="group"><legend><span>Payment</span><em>In person</em></legend>
                  <div className="choices">
                    <Choice group="p" checked={payment === "cash"} onChange={() => setPayment("cash")} title="Cash" />
                    <Choice group="p" checked={payment === "pos"} onChange={() => setPayment("pos")} title="POS" />
                  </div>
                </fieldset>
                <label className="note-field"><span>Note for the front desk <em>optional</em></span><textarea rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} /></label>
              </>
            )}

            {step === "review" && prepared && (
              <>
                <p className="lead">Your message is ready. Tap <b>Send on WhatsApp</b> to place the order. <b>It isn’t placed until you send it.</b></p>
                <p className="allergen-hint"><strong>Food allergies?</strong> Confirm ingredients and cross-contact with staff in WhatsApp before ordering. Notes alone cannot guarantee an allergen-free meal.</p>
                {fulfilment === "collect" && <p className="pickup-estimate">Estimated collection is about 15–20 minutes after staff confirms your order on WhatsApp. Busy periods may take longer; staff will contact you if timing changes.</p>}
                <pre className="msg">{prepared.message}</pre>
                {sent && <p className="notice">Back already? Check WhatsApp and tap Send. You can reopen it below.</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {errors.some(error => error !== ROOM_NUMBER_ERROR && error !== PICKUP_NAME_ERROR && error !== PICKUP_CONTACT_ERROR) && <ul className="errors" role="alert">{errors.filter(error => error !== ROOM_NUMBER_ERROR && error !== PICKUP_NAME_ERROR && error !== PICKUP_CONTACT_ERROR).map((e) => <li key={e}>{e}</li>)}</ul>}
        {!canOrder && rows.length > 0 && step !== "review" && <p className="errors" role="status">{closedReason}</p>}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.footer key="confirm" className="dock-foot col confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} role="alertdialog" aria-label="Cancel this order?">
            <p><b>Cancel this order?</b><span>Everything in your basket will be removed.</span></p>
            <div className="row">
              <button type="button" className="ghost grow" onClick={() => setConfirming(false)} autoFocus>Keep order</button>
              <button type="button" className="danger-solid grow" onClick={cancelOrder}>Cancel order</button>
            </div>
          </motion.footer>
        ) : (
          <motion.footer key="foot" className="dock-foot col" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
            {step === "basket" && rows.length > 0 && <button type="button" className="cta" disabled={!canOrder} onClick={() => go("details")}><span>Continue</span><span className="cta-p">{naira(total)}</span></button>}
            {step === "details" && (
              <div className="row">
                <button type="button" className="ghost" onClick={() => go("basket")}>Back</button>
                <button type="button" className="cta grow" onClick={review} disabled={busy || !canOrder}><span>{busy ? "Checking…" : "Review order"}</span></button>
              </div>
            )}
            {step === "review" && prepared && (
              <>
                <a className="cta" href={prepared.waUrl} target="_blank" rel="noopener" onClick={() => setSent(true)}><span>Send on WhatsApp</span></a>
                <div className="row">
                  <button type="button" className="ghost grow" onClick={copy}>{copied ? "Copied" : "Copy order"}</button>
                  <button type="button" className="ghost grow" onClick={() => go("details")}>Edit</button>
                </div>
                {sent && <button type="button" className="link center" onClick={sentDone}>I’ve sent it. Clear my order</button>}
              </>
            )}
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
