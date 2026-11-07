"use client";
import { dismissNotification, showNotification } from "../lib/notificationController";

export const toast = {
  show(message: string, action?: { label: string; run: () => void }, ms = action ? 7000 : 2000) {
    return showNotification(action ? "action" : "success", { title: message, ...(action ? { description: "You can undo this change." } : {}), duration: ms }, action);
  },
  hide: dismissNotification,
};
