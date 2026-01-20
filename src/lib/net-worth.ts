import { NetWorthDataPoint } from "@/lib/api";
import { ONE_YEAR_IN_MONTHS } from "@/lib/constants";

export function getFilteredHistory(
  history: NetWorthDataPoint[] | undefined,
  timeRange: string,
): NetWorthDataPoint[] {
  if (!history) return [];

  const now = new Date();
  const currentYear = now.getFullYear();

  switch (timeRange) {
    case "5Y":
      return history.slice(-(ONE_YEAR_IN_MONTHS * 5 + 1));
    case "1Y":
      return history.slice(-(ONE_YEAR_IN_MONTHS + 1));
    case "6M":
      return history.slice(-7);
    case "3M":
      return history.slice(-4);
    case "1M":
      // Return last 2 points to show change from previous month to current
      return history.slice(-2);
    case "YTD": {
      const yearPoints = history.filter((p) => p.year === currentYear);
      // To show growth since the start of the year, we need the last point of the previous year
      const lastYearPoint = history
        .filter((p) => p.year === currentYear - 1)
        .slice(-1)[0];
      if (lastYearPoint) {
        return [lastYearPoint, ...yearPoints];
      }
      return yearPoints;
    }
    case "ALL":
    default:
      return history;
  }
}

export function calculateGrowth(
  current: number,
  previous: number,
): { value: number; percentage: number } {
  const value = current - previous;
  if (previous === 0) {
    return { value, percentage: current > 0 ? 100 : 0 };
  }
  const percentage = (value / Math.abs(previous)) * 100;
  return { value, percentage };
}
