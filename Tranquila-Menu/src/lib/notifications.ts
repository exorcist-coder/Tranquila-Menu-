"use client";
import { showNotification } from "./notificationController";

/** Compact confirmations; errors and actions retain time to read or respond. */
export const notify = {
  success(title: string, description?: string, duration = description ? 4500 : 2000) { return showNotification("success", { title, description, duration }); },
  error(description: string) { return showNotification("error", { title: "Please try again", description, duration: 8500 }); },
  warning(description: string) { return showNotification("warning", { title: "Check your choices", description, duration: 6500 }); },
  info(title: string, description?: string) { return showNotification("info", { title, description }); },
};
