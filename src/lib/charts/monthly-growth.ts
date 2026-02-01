import {
  MIN_NET_WORTH_POINTS_FOR_GROWTH,
  MONTHLY_GROWTH_COLORS,
} from "@/lib/constants/charts";
import type { NetWorthDataPoint } from "@/lib/types/net-worth";

export type MonthlyGrowthChartPoint = {
  label: string;
  change: number;
  fill: string;
};

export function getMonthlyGrowthChartData(
  history: NetWorthDataPoint[] | undefined,
): MonthlyGrowthChartPoint[] | null {
  if (!history || history.length < MIN_NET_WORTH_POINTS_FOR_GROWTH) {
    return null;
  }

  const trimmedHistory = [...history];
  const lastPoint = trimmedHistory[trimmedHistory.length - 1];
  const lastPointIsEmpty =
    lastPoint &&
    (lastPoint.totalAssets == null || lastPoint.totalAssets === 0) &&
    (lastPoint.totalLiabilities == null || lastPoint.totalLiabilities === 0) &&
    (lastPoint.netWorth == null || lastPoint.netWorth === 0);

  if (lastPointIsEmpty) {
    trimmedHistory.pop();
  }

  if (trimmedHistory.length < MIN_NET_WORTH_POINTS_FOR_GROWTH) {
    return null;
  }

  const data: MonthlyGrowthChartPoint[] = [];

  for (let i = 1; i < trimmedHistory.length; i++) {
    const current = trimmedHistory[i];
    const previous = trimmedHistory[i - 1];
    const change = current.netWorth - previous.netWorth;

    const date = new Date(current.year, current.month - 1);
    const label = date.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    data.push({
      label,
      change,
      fill:
        change >= 0
          ? MONTHLY_GROWTH_COLORS.positive.bg
          : MONTHLY_GROWTH_COLORS.negative.bg,
    });
  }

  return data;
}
