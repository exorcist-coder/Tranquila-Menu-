"use client";
import { useEffect } from "react";
import { Toaster } from "sileo";
import { dismissNotification } from "@/lib/notificationController";
import { notificationBottom } from "@/lib/notificationGestures";
import { useNotificationGestures } from "./useNotificationGestures";

export default function AppNotifications() {
  useNotificationGestures();
  useEffect(() => {
    let frame = 0;
    const watched = new Set<Element>();
    const resize = new ResizeObserver(() => schedule());
    const measure = () => {
      frame = 0;
      const height = window.innerHeight;
      const viewport = window.visualViewport;
      const inset = viewport ? Math.max(0, height - viewport.height - viewport.offsetTop) : 0;
      const controls = Array.from(document.querySelectorAll<HTMLElement>(".apple-floating-order, .sheet .dock-foot, .sheet .wfoot"));
      const tops: number[] = [];
      const present = new Set<Element>(controls);
      for (const previous of watched) if (!present.has(previous)) { resize.unobserve(previous); watched.delete(previous); }
      for (const control of controls) {
        if (!watched.has(control)) { resize.observe(control); watched.add(control); }
        const rect = control.getBoundingClientRect();
        if (!rect.height || getComputedStyle(control).visibility === "hidden") continue;
        // Reserve the footer's final space even while its sheet animates in.
        tops.push(control.matches(".apple-floating-order") ? rect.top : height - inset - rect.height);
      }
      document.body.style.setProperty("--hotel-notification-bottom", `${notificationBottom(height, tops, inset)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    const media = window.matchMedia("(max-width: 600px)");
    const rotate = () => { dismissNotification(); schedule(); };
    media.addEventListener("change", rotate);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      media.removeEventListener("change", rotate);
      document.body.style.removeProperty("--hotel-notification-bottom");
    };
  }, []);
  return <Toaster position="top-right" offset={{ top: "max(12px, env(safe-area-inset-top))", right: 12, bottom: "var(--hotel-notification-bottom, calc(12px + env(safe-area-inset-bottom)))" }} options={{ fill: "#ffffff", roundness: 16, duration: 2000, autopilot: false, styles: { title: "hotel-notification-title", description: "hotel-notification-description", button: "hotel-notification-button" } }} />;
}
