import { TimeRange } from "@/lib/types/time";

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MONTHS_PER_YEAR = 12;

export const DEFAULT_TIME_RANGE: TimeRange = "YTD";
