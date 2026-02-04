import { MONTHS_PER_YEAR } from "./constants/time";

export function getRetirementYearFromDateString(
  dateString: string | null | undefined,
): number | undefined {
  if (!dateString) {
    return undefined;
  }
  try {
    return new Date(dateString).getFullYear();
  } catch {
    return undefined;
  }
}

export function getMaxAvailableMonthForYear(
  year: number,
  now: Date = new Date(),
): number {
  const currentYear = now.getFullYear();
  if (year < currentYear) return MONTHS_PER_YEAR;
  if (year > currentYear) return 0;
  return now.getMonth() + 1;
}

export function isMonthAvailableForYear(
  month: number,
  year: number,
  now: Date = new Date(),
): boolean {
  if (month < 1 || month > MONTHS_PER_YEAR) return false;
  return month <= getMaxAvailableMonthForYear(year, now);
}
