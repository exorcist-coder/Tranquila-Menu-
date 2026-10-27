export const BRANCHES = [
  {
    id: "tranquila",
    name: "Tranquila Hotel",
    address: "Plot 1731 off Ahmadu Bello Wy, Mabushi, Abuja 900108, Federal Capital Territory",
  },
  {
    id: "tranquila-nest",
    name: "Tranquila Nest",
    address: "12 Williams F, William F. Kumuyi St, Gwarinpa, Abuja 900108, Federal Capital Territory",
  },
] as const;

export type BranchId = (typeof BRANCHES)[number]["id"];
export type Branch = (typeof BRANCHES)[number];

export function getBranch(id: string | null | undefined): Branch | undefined {
  return BRANCHES.find((branch) => branch.id === id);
}

export function isBranchId(id: string | null | undefined): id is BranchId {
  return !!getBranch(id);
}