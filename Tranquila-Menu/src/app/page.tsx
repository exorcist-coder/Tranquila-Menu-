import MenuApp from "@/components/MenuApp";
import { getSettings } from "@/lib/cms";
import { getBranch } from "@/lib/branches";

export const dynamic = "force-dynamic";

// Guest entry is hotel-specific. No hotel chooser or branch switching.
export default async function Page() {
  const configured = process.env.NEXT_PUBLIC_HOTEL_BRANCH_ID;
  const branch = getBranch(configured) ?? getBranch("tranquila")!;
  const settings = await getSettings(branch.id);
  return <MenuApp branch={branch} hours={{ open: settings.open, close: settings.close, paused: settings.paused }} serverNow={new Date().toISOString()} />;
}
