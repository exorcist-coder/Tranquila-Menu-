"use client";
import { sileo } from "sileo";

/** One notification system for guests, staff and account screens. */
export const notify = {
  success(title: string, description?: string, duration = 5000) { return sileo.success({ title, description, duration }); },
  error(description: string) { return sileo.error({ title: "Please try again", description, duration: 8500 }); },
  warning(description: string) { return sileo.warning({ title: "Check your choices", description, duration: 6500 }); },
  info(title: string, description?: string) { return sileo.info({ title, description }); },
};
