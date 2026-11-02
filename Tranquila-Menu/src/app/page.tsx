import MenuApp from "@/components/MenuApp";
import BranchSelector from "@/components/BranchSelector";
import { getSettings } from "@/lib/cms";
import { getBranch, isBranchId } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const { branch: branchParam } = await searchParams;
  // Each hotel deployment has a fixed branch. Never send hotel guests to the chooser.
  const fixedBranch = process.env.NEXT_PUBLIC_HOTEL_BRANCH_ID;
  const selectedBranch = fixedBranch && isBranchId(fixedBranch) ? fixedBranch : branchParam;
  if (!isBranchId(selectedBranch)) return <BranchSelector />;
  const branch = getBranch(selectedBranch)!;
  const settings = await getSettings(branch.id);
  return <MenuApp branch={branch} hours={{ open: settings.open, close: settings.close, paused: settings.paused }} serverNow={new Date().toISOString()} />;
}
