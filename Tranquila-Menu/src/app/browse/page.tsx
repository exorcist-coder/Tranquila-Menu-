import type { Metadata } from "next";
import MenuApp from "@/components/MenuApp";
import { getSettings } from "@/lib/cms";
import { getBranch } from "@/lib/branches";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tranquila Hotels · Browse food & drinks",
  description: "Explore our food and drinks menu. To place an order at the hotel, scan the QR code in your room or ask a member of staff.",
};

// Public website view. The existing QR entry at / keeps its ordering flow.
export default async function BrowsePage() {
  const branch = getBranch(process.env.NEXT_PUBLIC_HOTEL_BRANCH_ID) ?? getBranch("tranquila")!;
  const settings = await getSettings(branch.id);
  return <MenuApp browseOnly branch={branch} hours={{ open: settings.open, close: settings.close, paused: settings.paused }} serverNow={new Date().toISOString()} />;
}
