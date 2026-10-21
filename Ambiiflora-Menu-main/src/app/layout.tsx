import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/figtree/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tranquila Hotels and Suites · Food & drinks",
  description: "Order from the Tranquila food and drinks menu. Delivered to your room or ready for collection.",
  icons: { icon: "/brand/mark.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F3F1E8" };

/** Marks the page as script-enabled before first paint. If the motion layer has not started after 4s, show everything as-is. */
const boot = `document.documentElement.classList.add("js");try{if(sessionStorage.getItem("amb.in")||JSON.parse(localStorage.getItem("tranquila.cart.v1")||"[]").length)document.documentElement.classList.add("skip-welcome")}catch(e){}setTimeout(function(){if(!document.documentElement.dataset.motion)document.documentElement.classList.add("no-motion")},4000)`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body>{children}</body>
    </html>
  );
}
