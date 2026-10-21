import MenuApp from "@/components/MenuApp";
import { serverConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Page() {
  const { hours, whatsapp } = serverConfig();
  return <MenuApp hours={hours} whatsapp={whatsapp} serverNow={new Date().toISOString()} />;
}
