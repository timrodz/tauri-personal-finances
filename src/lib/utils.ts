import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getResolvedLocale(locale?: string): string {
  return (locale ?? typeof navigator !== "undefined")
    ? navigator.language
    : "en-US";
}

export function formatCurrency(value: number, locale?: string): string {
  return new Intl.NumberFormat(getResolvedLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCell(
  value: number | undefined,
  isRate: boolean,
  locale?: string
): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat(getResolvedLocale(locale), {
    minimumFractionDigits: isRate ? 4 : 2,
    maximumFractionDigits: isRate ? 6 : 2,
  }).format(value);
}
