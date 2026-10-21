"use client";
import { AnimatePresence, motion } from "framer-motion";
import { toast, useToast } from "./toastStore";

export default function Toast({ lifted }: { lifted: boolean }) {
  const t = useToast();
  return (
    <div className="toast-wrap" data-lifted={lifted ? "" : undefined} aria-live="polite">
      <AnimatePresence>
        {t && (
          <motion.div key={t.id} className="toast" initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
            <span>{t.message}</span>
            {t.action && <button type="button" onClick={() => { t.action!.run(); toast.hide(); }}>{t.action.label}</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
