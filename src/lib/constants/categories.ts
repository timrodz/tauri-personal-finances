import type { SubCategory, SubCategoryOption } from "@/lib/types/categories";
import {
  CarIcon,
  ChartCandlestickIcon,
  CreditCardIcon,
  HandCoinsIcon,
  HandHeartIcon,
  HouseIcon,
  LandmarkIcon,
  LucideIcon,
} from "lucide-react";

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

export const ALL_SUB_CATEGORIES_WITH_ICONS: Record<
  SubCategory,
  LucideIcon | undefined
> = {
  cash: LandmarkIcon,
  investments: ChartCandlestickIcon,
  retirement: HandHeartIcon,
  real_estate: HouseIcon,
  vehicles: CarIcon,
  other_asset: undefined,
  credit_cards: CreditCardIcon,
  loans: HandCoinsIcon,
  mortgages: HouseIcon,
  other_liability: undefined,
};
