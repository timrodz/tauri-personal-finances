import { RETIREMENT_PROJECTION_POINT_COLORS } from "@/lib/constants/charts";
import { MONTHS_PER_YEAR } from "@/lib/constants/time";
import { getRetirementYearFromDateString } from "@/lib/dates";
import type { RetirementPlanProjection } from "@/lib/types/retirement";

export interface RetirementProjectionChartDataOptions {
  projectedRetirementDate: string | null;
}

export type RetirementProjectionChartPoint = {
  label: string;
  projectedNetWorth: number;
  pointColor: string;
  pointRadius: number;
};

export function getRetirementProjectionChartData(
  projections: RetirementPlanProjection[] | undefined,
  options?: RetirementProjectionChartDataOptions,
): RetirementProjectionChartPoint[] | null {
  if (!projections || projections.length === 0) return null;

  const yearlyMap = new Map<number, number>();
  const retirementYear = options?.projectedRetirementDate
    ? getRetirementYearFromDateString(options.projectedRetirementDate)
    : null;

  for (const p of projections) {
    if (!yearlyMap.has(p.year) || p.month === MONTHS_PER_YEAR) {
      yearlyMap.set(p.year, p.projectedNetWorth);
    }
  }

  const sortedYears = Array.from(yearlyMap.keys()).sort((a, b) => a - b);
  return sortedYears.map((year) => {
    const isRetirementYear = retirementYear && year === retirementYear;
    return {
      label: String(year),
      projectedNetWorth: yearlyMap.get(year) ?? 0,
      pointColor: isRetirementYear
        ? RETIREMENT_PROJECTION_POINT_COLORS.highlight
        : RETIREMENT_PROJECTION_POINT_COLORS.default,
      pointRadius: isRetirementYear ? 6 : 3,
    };
  });
}
