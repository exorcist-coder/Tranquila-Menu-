"use client";
import { useEffect } from "react";
import { dismissNotification, notificationToken, subscribeNotificationChanges } from "@/lib/notificationController";
import { shouldDismissNotification } from "@/lib/notificationGestures";

export function useNotificationGestures() {
  useEffect(() => {
    let drag: { element: HTMLElement; pointer: number; x: number; y: number; time: number; token: number; axis?: "x" | "y" } | undefined;
    let settle: Animation | undefined;
    const reset = (element: HTMLElement, animate: boolean) => {
      const translate = element.style.translate;
      const opacity = element.style.opacity;
      if (animate && translate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        settle = element.animate([{ translate, opacity }, { translate: "0px 0px", opacity: "1" }], { duration: 160, easing: "ease-out" });
      }
      element.style.removeProperty("translate");
      element.style.removeProperty("opacity");
    };
    const down = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !event.isPrimary || event.button !== 0 || target.closest("[data-sileo-button]")) return;
      const element = target.closest<HTMLElement>("[data-sileo-toast]:not([data-exiting='true'])");
      const token = notificationToken();
      if (!element || token === undefined) return;
      settle?.cancel();
      if (drag) reset(drag.element, false);
      // Own the gesture instead of competing with Sileo's vertical-only handler.
      event.stopPropagation();
      drag = { element, pointer: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), token };
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      if (notificationToken() !== drag.token) { reset(drag.element, false); drag = undefined; return; }
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.axis && Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      drag.axis ??= Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      const distance = drag.axis === "x" ? dx : dy;
      drag.element.style.translate = drag.axis === "x" ? `${distance}px 0px` : `0px ${distance}px`;
      drag.element.style.opacity = String(Math.max(0.25, 1 - Math.abs(distance) / 300));
      event.preventDefault();
      event.stopPropagation();
    };
    const finish = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const current = drag;
      drag = undefined;
      const dx = event.clientX - current.x, dy = event.clientY - current.y;
      const dismiss = event.type !== "pointercancel" && shouldDismissNotification({ dx, dy, elapsed: performance.now() - current.time, width: current.element.getBoundingClientRect().width });
      if (dismiss && notificationToken() === current.token && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        const sign = (horizontal ? dx : dy) < 0 ? -1 : 1;
        const target = horizontal ? `${sign * window.innerWidth}px 0px` : `0px ${sign * window.innerHeight}px`;
        settle = current.element.animate([{ translate: current.element.style.translate || "0px 0px", opacity: current.element.style.opacity || "1" }, { translate: target, opacity: "0" }], { duration: 180, easing: "ease-out" });
        current.element.style.removeProperty("translate");
        current.element.style.removeProperty("opacity");
      } else reset(current.element, !dismiss);
      if (current.element.hasPointerCapture(event.pointerId)) current.element.releasePointerCapture(event.pointerId);
      if (dismiss) { event.preventDefault(); event.stopPropagation(); dismissNotification(current.token); }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.target instanceof Element && event.target.closest("[data-sileo-toast]")) {
        event.stopPropagation(); dismissNotification();
      }
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, { capture: true, passive: false });
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
    document.addEventListener("keydown", key, true);
    const unsubscribe = subscribeNotificationChanges(() => {
      settle?.cancel();
      if (drag && notificationToken() !== drag.token) { reset(drag.element, false); drag = undefined; }
    });
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", finish, true);
      document.removeEventListener("pointercancel", finish, true);
      document.removeEventListener("keydown", key, true);
      settle?.cancel();
      unsubscribe();
      if (drag) reset(drag.element, false);
    };
  }, []);
}
