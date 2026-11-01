"use client";
import { AnimatePresence, motion, useDragControls, type DragControls } from "framer-motion";
import { createContext, useContext, useEffect, useRef } from "react";

let locks = 0;
const root = () => document.getElementById("app-root");
function lock() { if (locks++ === 0) { document.body.style.overflow = "hidden"; root()?.setAttribute("inert", ""); } }
function unlock() { if (--locks <= 0) { locks = 0; document.body.style.overflow = ""; root()?.removeAttribute("inert"); } }

const DragCtx = createContext<DragControls | null>(null);
/** Pointer-down handler for the grab handle / header: lets the sheet be dragged down without fighting inner scroll. */
export function useSheetDrag() {
  const c = useContext(DragCtx);
  return { onPointerDown: (e: React.PointerEvent) => { c?.start(e); } };
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const spring = { type: "spring", damping: 36, stiffness: 340, mass: 0.9 } as const;

type Props = { open: boolean; onClose: () => void; label: string; tone?: "light" | "dark"; variant?: "bottom" | "center"; children: React.ReactNode };

export default function Sheet(props: Props) {
  return <AnimatePresence>{props.open && <Panel key="panel" {...props} />}</AnimatePresence>;
}

function Panel({ onClose, label, tone = "light", variant = "bottom", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const bottom = variant === "bottom";

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    lock();
    ref.current?.focus({ preventScroll: true });
    return () => { unlock(); prev?.focus?.({ preventScroll: true }); };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
    if (e.key !== "Tab" || !ref.current) return;
    const f = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0]!, last = f[f.length - 1]!;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  return (
    <div className="layer" data-variant={variant}>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose} />
      <div className="stage">
        <DragCtx.Provider value={bottom ? controls : null}>
          <motion.div
            ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKeyDown}
            className={`sheet sheet-${tone}`} data-variant={variant}
            initial={bottom ? { y: "100%" } : { opacity: 0, scale: 0.94, y: 14 }}
            animate={bottom ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={bottom ? { y: "100%", transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } } : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
            transition={spring}
            drag={bottom ? "y" : false} dragControls={controls} dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.02, bottom: 0.7 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 520) onClose(); }}
          >
            {children}
          </motion.div>
        </DragCtx.Provider>
      </div>
    </div>
  );
}
