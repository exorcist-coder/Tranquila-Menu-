import type { Metadata, Viewport } from "next";
import AppNotifications from "@/components/AppNotifications";
import "sileo/styles.css";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/figtree/index.css";
import "./globals.css";
import "./apple-guest.css";
import "./admin/auth.css";
import "./admin/editor-fixes.css";
import "./admin/auth-refinement.css";
import "./motion-system.css";
import "./admin/auth-field-fix.css";
import "./mobile-layout-fixes.css";
import "./drink-photos.css";
import "./notifications.css";
import "./public-menu.css";

export const metadata: Metadata = {
  title: "Tranquila Hotels · Food & drinks",
  description: "Choose Tranquila Hotel or Tranquila Nest to view the menu and order for your stay.",
  icons: { icon: "/images/mark.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F3F1E8" };

/** Marks the page as script-enabled before first paint. If the motion layer has not started after 4s, show everything as-is. */
const boot = `document.documentElement.classList.add("js");try{if(sessionStorage.getItem("tranquila.in")||JSON.parse(localStorage.getItem("tranquila.cart.v1")||"[]").length)document.documentElement.classList.add("skip-welcome")}catch(e){}setTimeout(function(){if(!document.documentElement.dataset.motion)document.documentElement.classList.add("no-motion")},4000)`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body>{children}<AppNotifications /></body>
    </html>
  );
}
