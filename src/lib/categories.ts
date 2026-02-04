import {
  ALL_SUB_CATEGORIES,
  ALL_SUB_CATEGORIES_WITH_ICONS,
  ASSET_SUB_CATEGORIES,
  LIABILITY_SUB_CATEGORIES,
} from "@/lib/constants/categories";
import type { AccountType } from "@/lib/types/accounts";
import type { SubCategoryOption } from "@/lib/types/categories";

export function getSubCategoriesByAccountType(
  accountType: AccountType,
): SubCategoryOption[] {
  return accountType === "Asset"
    ? ASSET_SUB_CATEGORIES
    : LIABILITY_SUB_CATEGORIES;
}

export function getSubCategoryRenderOptions(key: string | null) {
  if (!key) return null;
  const option = ALL_SUB_CATEGORIES.find((sc) => sc.key === key);
  if (!option) return null;
  const icon = ALL_SUB_CATEGORIES_WITH_ICONS[option.key];
  return { label: option.label, icon };
}
