import MenuApp from "@/components/MenuApp";
import BranchSelector from "@/components/BranchSelector";
import { getSettings } from "@/lib/cms";
import { getBranch, isBranchId } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const { branch: branchParam } = await searchParams;
  if (!isBranchId(branchParam)) return <BranchSelector />;
  const branch = getBranch(branchParam)!;
  const settings = await getSettings(branch.id);
  return <MenuApp branch={branch} hours={{ open: settings.open, close: settings.close, paused: settings.paused }} serverNow={new Date().toISOString()} />;
}
