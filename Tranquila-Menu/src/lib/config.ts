import type { Hours } from "./hours";

export const brand = { name: "Tranquila", descriptor: "Hotels and Suites · Food & drinks", tagline: "Calm, served well" };

/** Server-only. Read at request time so staff can change hours with an env update, no redeploy of code. */
export function serverConfig(): { whatsapp: string; hours: Hours } {
  return {
    whatsapp: (process.env.WHATSAPP_NUMBER ?? "2348160784818").replace(/\D/g, ""),
    hours: { open: process.env.ORDERING_OPEN ?? "08:00", close: process.env.ORDERING_CLOSE ?? "08:00", paused: process.env.ORDERING_PAUSED === "1" },
  };
}
