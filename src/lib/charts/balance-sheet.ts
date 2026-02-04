import { MONTHS, MONTHS_PER_YEAR } from "@/lib/constants/time";
import type { MonthlyTotal } from "@/lib/types/balance-sheets";

export type BalanceSheetChartPoint = {
  label: string;
  netWorth: number;
};

export function getBalanceSheetChartData(
  monthlyTotals: MonthlyTotal[],
  maxMonth: number = MONTHS_PER_YEAR,
): BalanceSheetChartPoint[] {
  const cappedTotals =
    maxMonth >= MONTHS_PER_YEAR
      ? monthlyTotals
      : monthlyTotals.filter((total) => total.month <= maxMonth);

  return cappedTotals.map((total, index) => ({
    label: MONTHS[index] ?? "",
    netWorth: total.netWorth,
  }));
}
