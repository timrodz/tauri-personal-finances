import {
  ASSET_SUB_CATEGORIES,
  LIABILITY_SUB_CATEGORIES,
} from "@/lib/constants/categories";
import { SUB_CATEGORY_COLORS } from "@/lib/constants/charts";
import type { Account } from "@/lib/types/accounts";
import type { BalanceSheet, Entry } from "@/lib/types/balance-sheets";

export interface SubCategoryTrendInput {
  accounts: Account[];
  entries: Entry[];
  balanceSheets: BalanceSheet[];
  accountType: "Asset" | "Liability";
}

export type SubCategoryTrendChartPoint = {
  period: string;
  [key: string]: number | string;
};

export type SubCategoryTrendSeries = {
  key: string;
  label: string;
  color: string;
};

export function getSubCategoryTrendChartData(input: SubCategoryTrendInput): {
  data: SubCategoryTrendChartPoint[];
  series: SubCategoryTrendSeries[];
} | null {
  const { accounts, entries, balanceSheets, accountType } = input;

  const filteredAccounts = accounts.filter(
    (a) => a.accountType === accountType && !a.isArchived,
  );

  if (filteredAccounts.length === 0 || balanceSheets.length === 0) return null;

  const accountMap = new Map(filteredAccounts.map((a) => [a.id, a]));
  const balanceSheetYearMap = new Map(
    balanceSheets.map((bs) => [bs.id, bs.year]),
  );

  const sortedSheets = [...balanceSheets].sort((a, b) => a.year - b.year);

  const subCategoryOptions =
    accountType === "Asset" ? ASSET_SUB_CATEGORIES : LIABILITY_SUB_CATEGORIES;

  const periodTotals = new Map<string, Map<string, number>>();

  for (const sheet of sortedSheets) {
    const periodKey = String(sheet.year);
    if (!periodTotals.has(periodKey)) {
      periodTotals.set(periodKey, new Map());
    }
  }

  const latestEntryByAccountPeriod = new Map<
    string,
    { month: number; amount: number }
  >();

  for (const entry of entries) {
    const account = accountMap.get(entry.accountId);
    if (!account) continue;

    const year = balanceSheetYearMap.get(entry.balanceSheetId);
    if (year === undefined) continue;

    const periodKey = String(year);
    const entryKey = `${entry.accountId}-${periodKey}`;

    const existing = latestEntryByAccountPeriod.get(entryKey);
    if (!existing || entry.month > existing.month) {
      latestEntryByAccountPeriod.set(entryKey, {
        month: entry.month,
        amount: entry.amount,
      });
    }
  }

  let hasUncategorized = false;

  for (const [entryKey, { amount }] of latestEntryByAccountPeriod) {
    const [accountId, periodKey] = entryKey.split("-");
    const account = accountMap.get(accountId);
    if (!account || amount === 0) continue;

    const periodMap = periodTotals.get(periodKey);
    if (!periodMap) continue;

    const subCat = account.subCategory ?? "uncategorized";
    if (subCat === "uncategorized") hasUncategorized = true;

    const current = periodMap.get(subCat) ?? 0;
    periodMap.set(subCat, current + amount);
  }

  const labels = sortedSheets.map((s) => String(s.year));
  const series: SubCategoryTrendSeries[] = [];
  const seriesKeys: string[] = [];

  for (const option of subCategoryOptions) {
    const data = labels.map((label) => {
      const periodMap = periodTotals.get(label);
      return periodMap?.get(option.key) ?? 0;
    });

    if (data.some((d) => d > 0)) {
      const colors = SUB_CATEGORY_COLORS[option.key];
      const key = option.key;
      series.push({ key, label: option.label, color: colors.bg });
      seriesKeys.push(key);
    }
  }

  if (hasUncategorized) {
    const data = labels.map((label) => {
      const periodMap = periodTotals.get(label);
      return periodMap?.get("uncategorized") ?? 0;
    });

    if (data.some((d) => d > 0)) {
      series.push({
        key: "uncategorized",
        label: "Uncategorized",
        color: SUB_CATEGORY_COLORS.uncategorized.bg,
      });
      seriesKeys.push("uncategorized");
    }
  }

  if (series.length === 0) return null;

  const data: SubCategoryTrendChartPoint[] = labels.map((label) => {
    const row: SubCategoryTrendChartPoint = { period: label };
    for (const key of seriesKeys) {
      const periodMap = periodTotals.get(label);
      row[key] = periodMap?.get(key) ?? 0;
    }
    return row;
  });

  return { data, series };
}
