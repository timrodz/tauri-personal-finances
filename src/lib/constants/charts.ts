import type { SubCategory } from "@/lib/types/categories";

export const RESPONSIVE_CHART_DEBOUNCE_MS = 300;

export const SUB_CATEGORY_COLORS: Record<
  SubCategory | "uncategorized",
  { bg: string; border: string }
> = {
  cash: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)" },
  investments: { bg: "var(--color-chart-2)", border: "var(--color-chart-2)" },
  retirement: { bg: "var(--color-chart-3)", border: "var(--color-chart-3)" },
  real_estate: { bg: "var(--color-chart-4)", border: "var(--color-chart-4)" },
  vehicles: { bg: "var(--color-chart-5)", border: "var(--color-chart-5)" },
  other_asset: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)" },
  credit_cards: { bg: "var(--color-chart-2)", border: "var(--color-chart-2)" },
  loans: { bg: "var(--color-chart-3)", border: "var(--color-chart-3)" },
  mortgages: { bg: "var(--color-chart-4)", border: "var(--color-chart-4)" },
  other_liability: {
    bg: "var(--color-chart-5)",
    border: "var(--color-chart-5)",
  },
  uncategorized: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)" },
};

export const MIN_NET_WORTH_POINTS_FOR_GROWTH = 2;

export const MONTHLY_GROWTH_COLORS = {
  positive: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)" },
  negative: { bg: "var(--color-chart-2)", border: "var(--color-chart-2)" },
};

export const NET_WORTH_TREND_COLORS = {
  line: "var(--color-chart-1)",
  gradientStart: "var(--color-chart-1)",
  gradientEnd: "var(--color-chart-1)",
};

export const NET_WORTH_BREAKDOWN_COLORS = {
  assets: { bg: "var(--color-chart-1)", border: "var(--color-chart-1)" },
  liabilities: { bg: "var(--color-chart-2)", border: "var(--color-chart-2)" },
};

export const RETIREMENT_PROJECTION_POINT_COLORS = {
  highlight: "var(--color-chart-1)",
  default: "var(--color-chart-2)",
};

export const CHART_GRID_LINE_COLOR = "var(--color-border)";
