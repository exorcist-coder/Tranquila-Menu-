"use client";
import { naira } from "@/lib/pricing";
import { cart } from "./useCart";
import { toast } from "./toastStore";
import Sheet from "./Sheet";

/** Small centred prompt used by the order dock's cancel button. */
export default function ConfirmCancel({ open, onClose, count, total }: { open: boolean; onClose: () => void; count: number; total: number }) {
  const run = () => { const prev = cart.clear(); onClose(); toast.show("Order cancelled", { label: "Undo", run: () => cart.restore(prev) }); };
  return (
    <Sheet open={open} onClose={onClose} label="Cancel this order?" variant="center">
      <div className="confirm-box">
        <h2>Cancel this order?</h2>
        <p>{count} {count === 1 ? "item" : "items"} · {naira(total)} will be removed from your basket.</p>
        <div className="row">
          <button type="button" className="ghost grow" onClick={onClose} autoFocus>Keep order</button>
          <button type="button" className="danger-solid grow" onClick={run}>Cancel order</button>
        </div>
      </div>
    </Sheet>
  );
}
