"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { IconMinus, IconPlus } from "./icons";

/** Quantity control. The number rolls in the direction it changes. */
export default function Stepper({ value, onDec, onInc, tone = "light", size = "md", label, incDisabled }: { value: number; onDec: () => void; onInc: () => void; tone?: "light" | "dark"; size?: "md" | "sm"; label: string; incDisabled?: boolean }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  prev.current = value;
  return (
    <div className={`stepper ${tone} ${size}`} role="group" aria-label={label}>
      <motion.button type="button" whileTap={{ scale: 0.86 }} onClick={onDec} aria-label="Decrease quantity"><IconMinus width={size === "sm" ? 16 : 18} height={size === "sm" ? 16 : 18} /></motion.button>
      <span className="stepper-n" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.output key={value} initial={{ y: 10 * dir, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10 * dir, opacity: 0 }} transition={{ duration: 0.18 }}>{value}</motion.output>
        </AnimatePresence>
      </span>
      <motion.button type="button" whileTap={{ scale: 0.86 }} onClick={onInc} disabled={incDisabled} aria-label="Increase quantity"><IconPlus width={size === "sm" ? 16 : 18} height={size === "sm" ? 16 : 18} /></motion.button>
    </div>
  );
}
