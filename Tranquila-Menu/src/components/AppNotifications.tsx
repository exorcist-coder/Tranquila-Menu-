"use client";
import { Toaster } from "sileo";

export default function AppNotifications() {
  return <Toaster position="top-center" offset={{ top: "max(12px, env(safe-area-inset-top))" }} options={{ fill: "#ffffff", roundness: 16, duration: 5000, styles: { title: "hotel-notification-title", description: "hotel-notification-description", button: "hotel-notification-button" } }} />;
}
