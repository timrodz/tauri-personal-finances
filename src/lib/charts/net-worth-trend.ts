import type { NetWorthDataPoint } from "@/lib/types/net-worth";
export type NetWorthTrendChartPoint = {
  label: string;
  netWorth: number;
};

export function getNetWorthTrendChartData(
  filteredHistory: NetWorthDataPoint[] | undefined,
): NetWorthTrendChartPoint[] | null {
  if (!filteredHistory || filteredHistory.length === 0) return null;

  const trimmedHistory = [...filteredHistory];
  const lastPoint = trimmedHistory[trimmedHistory.length - 1];
  const now = new Date();
  const isCurrentMonth =
    lastPoint &&
    lastPoint.year === now.getFullYear() &&
    lastPoint.month === now.getMonth() + 1;
  const lastPointIsEmpty =
    lastPoint &&
    (lastPoint.totalAssets == null || lastPoint.totalAssets === 0) &&
    (lastPoint.totalLiabilities == null || lastPoint.totalLiabilities === 0) &&
    (lastPoint.netWorth == null || lastPoint.netWorth === 0);

  if (isCurrentMonth && lastPointIsEmpty) {
    trimmedHistory.pop();
  }

  if (trimmedHistory.length === 0) {
    return null;
  }

  return trimmedHistory.map((point) => {
    const date = new Date(point.year, point.month - 1);
    const label = date.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    return {
      label,
      netWorth: point.netWorth,
    };
  });
}
