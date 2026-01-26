export type AccountType = "Asset" | "Liability";

export type AssetSubCategory =
  | "cash"
  | "investments"
  | "retirement"
  | "real_estate"
  | "vehicles"
  | "other_asset";

export type LiabilitySubCategory =
  | "credit_cards"
  | "loans"
  | "mortgages"
  | "other_liability";

export type SubCategory = AssetSubCategory | LiabilitySubCategory;

export interface SubCategoryOption {
  key: SubCategory;
  label: string;
  accountType: AccountType;
}

export const ASSET_SUB_CATEGORIES: SubCategoryOption[] = [
  { key: "cash", label: "Cash", accountType: "Asset" },
  { key: "investments", label: "Investments", accountType: "Asset" },
  { key: "retirement", label: "Retirement", accountType: "Asset" },
  { key: "real_estate", label: "Real Estate", accountType: "Asset" },
  { key: "vehicles", label: "Vehicles", accountType: "Asset" },
  { key: "other_asset", label: "Other Asset", accountType: "Asset" },
] as const;

export const LIABILITY_SUB_CATEGORIES: SubCategoryOption[] = [
  { key: "credit_cards", label: "Credit Cards", accountType: "Liability" },
  { key: "loans", label: "Loans", accountType: "Liability" },
  { key: "mortgages", label: "Mortgages", accountType: "Liability" },
  {
    key: "other_liability",
    label: "Other Liability",
    accountType: "Liability",
  },
] as const;

export const ALL_SUB_CATEGORIES: SubCategoryOption[] = [
  ...ASSET_SUB_CATEGORIES,
  ...LIABILITY_SUB_CATEGORIES,
];

export function getSubCategoriesByAccountType(
  accountType: AccountType,
): SubCategoryOption[] {
  return accountType === "Asset"
    ? ASSET_SUB_CATEGORIES
    : LIABILITY_SUB_CATEGORIES;
}

export function getSubCategoryLabel(key: string | null): string | null {
  if (!key) return null;
  const option = ALL_SUB_CATEGORIES.find((sc) => sc.key === key);
  return option?.label ?? null;
}
