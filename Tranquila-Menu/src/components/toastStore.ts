"use client";
import { sileo } from "sileo";

let current: string | undefined;
export const toast = {
  show(message: string, action?: { label: string; run: () => void }, ms = 7000) {
    if (current) sileo.dismiss(current);
    if (action) {
      let used = false;
      const id = sileo.action({ title: message, description: "You can undo this change.", duration: ms, button: { title: action.label, onClick: () => { if (used) return; used = true; action.run(); sileo.dismiss(id); if (current === id) current = undefined; } } });
      current = id;
    } else current = sileo.success({ title: message, duration: ms });
    return current;
  },
  hide() { if (current) sileo.dismiss(current); current = undefined; },
};
