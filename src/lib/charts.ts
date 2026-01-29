import {
  ASSET_SUB_CATEGORIES,
  LIABILITY_SUB_CATEGORIES,
} from "@/lib/constants/categories";
import { MONTHS } from "@/lib/constants/time";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/currency-formatting";
import { toPrivateValue } from "@/lib/private-value";
import type { Account } from "@/lib/types/accounts";
import type {
  BalanceSheet,
  Entry,
  MonthlyTotal,
} from "@/lib/types/balance-sheets";
import type { NetWorthDataPoint } from "@/lib/types/net-worth";
import type { RetirementPlanProjection } from "@/lib/types/retirement";
import {
  ChartData,
  ChartOptions,
  ChartType,
  ScriptableContext,
  TooltipItem,
} from "chart.js";
import { SUB_CATEGORY_COLORS } from "./constants/charts";
import { getRetirementYearFromDateString } from "./dates";

export function getBalanceSheetChartData(monthlyTotals: MonthlyTotal[]) {
  const labels = [...MONTHS];
  const netWorthData = monthlyTotals.map((t) => t.netWorth);

  return {
    labels,
    datasets: [
      {
        label: "Net Worth",
        data: netWorthData,
        fill: true,
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsla(var(--primary), 0.1)",
        tension: 0.4,
      },
    ],
  };
}

export function getBalanceSheetChartOptions(
  homeCurrency: string,
  isPrivacyMode: boolean = false,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += toPrivateValue(
                formatCurrency(context.parsed.y, homeCurrency),
                isPrivacyMode,
              );
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "hsl(var(--muted))",
        },
        ticks: {
          callback: function (value) {
            return toPrivateValue(
              formatCurrencyCompact(+value, homeCurrency),
              isPrivacyMode,
            );
          },
        },
      },
    },
  };
}

export function getNetWorthTrendChartData(
  filteredHistory: NetWorthDataPoint[] | undefined,
) {
  if (!filteredHistory || filteredHistory.length === 0) return null;

  return {
    labels: filteredHistory.map((p) => {
      const date = new Date(p.year, p.month - 1);
      return date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
    }),
    datasets: [
      {
        label: "Net Worth",
        data: filteredHistory.map((p) => p.netWorth),
        fill: true,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
          return gradient;
        },
        borderColor: "rgb(59, 130, 246)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
}

export function getNetWorthTrendChartOptions(
  homeCurrency: string,
  isPrivacyMode: boolean = false,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += toPrivateValue(
                formatCurrencyCompact(context.parsed.y, homeCurrency),
                isPrivacyMode,
              );
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value: string | number) =>
            toPrivateValue(
              formatCurrencyCompact(+value, homeCurrency),
              isPrivacyMode,
            ),
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };
}

export function getMonthlyGrowthChartData(
  history: NetWorthDataPoint[] | undefined,
): ChartData<"bar"> | null {
  if (!history || history.length < 2) return null;

  // Calculate monthly changes
  const labels: string[] = [];
  const data: number[] = [];
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];

  for (let i = 1; i < history.length; i++) {
    const current = history[i];
    const previous = history[i - 1];
    const change = current.netWorth - previous.netWorth;

    const date = new Date(current.year, current.month - 1);
    labels.push(
      date.toLocaleString("default", { month: "short", year: "2-digit" }),
    );
    data.push(change);

    if (change >= 0) {
      backgroundColors.push("rgba(34, 197, 94, 0.6)");
      borderColors.push("rgb(34, 197, 94)");
    } else {
      backgroundColors.push("rgba(239, 68, 68, 0.6)");
      borderColors.push("rgb(239, 68, 68)");
    }
  }

  return {
    labels,
    datasets: [
      {
        label: "Monthly Growth",
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };
}

export function getMonthlyGrowthChartOptions(
  homeCurrency: string,
  isPrivacyMode: boolean = false,
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += toPrivateValue(
                formatCurrencyCompact(context.parsed.y, homeCurrency),
                isPrivacyMode,
              );
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value: string | number) =>
            toPrivateValue(
              formatCurrencyCompact(+value, homeCurrency),
              isPrivacyMode,
            ),
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };
}

export function getNetWorthBreakdownChartData(
  latestPoint: NetWorthDataPoint | undefined,
): ChartData<"doughnut"> | null {
  if (!latestPoint) return null;

  return {
    labels: ["Assets", "Liabilities"],
    datasets: [
      {
        data: [latestPoint.totalAssets, latestPoint.totalLiabilities],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"],
        borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderWidth: 1,
      },
    ],
  };
}

export function getNetworthBreakdownChartOptions(
  isPrivacyMode: boolean,
): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            let label = context.label || "";
            if (label) label += ": ";
            label += toPrivateValue(context.formattedValue, isPrivacyMode);
            return label;
          },
        },
      },
    },
  };
}

export interface RetirementProjectionChartDataOptions {
  projectedRetirementDate: string | null;
}

export function getRetirementProjectionChartData(
  projections: RetirementPlanProjection[] | undefined,
  options?: RetirementProjectionChartDataOptions,
): ChartData<"line"> | null {
  if (!projections || projections.length === 0) return null;

  const yearlyMap = new Map<number, number>();
  const retirementYear = options?.projectedRetirementDate
    ? getRetirementYearFromDateString(options.projectedRetirementDate)
    : null;

  for (const p of projections) {
    if (!yearlyMap.has(p.year) || p.month === 12) {
      yearlyMap.set(p.year, p.projectedNetWorth);
    }
  }

  const sortedYears = Array.from(yearlyMap.keys()).sort((a, b) => a - b);
  const labels = sortedYears.map((y) => String(y));
  const data = sortedYears.map((y) => yearlyMap.get(y) ?? 0);

  const pointBackgroundColors = sortedYears.map((y) =>
    retirementYear && y === retirementYear
      ? "rgb(34, 197, 94)"
      : "rgb(59, 130, 246)",
  );
  const pointRadii = sortedYears.map((y) =>
    retirementYear && y === retirementYear ? 6 : 3,
  );

  return {
    labels,
    datasets: [
      {
        label: "Projected Net Worth",
        data,
        fill: true,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
          return gradient;
        },
        borderColor: "rgb(59, 130, 246)",
        tension: 0.4,
        pointRadius: pointRadii,
        pointHoverRadius: 6,
        pointBackgroundColor: pointBackgroundColors,
      },
    ],
  };
}

export function getRetirementProjectionChartOptions(
  homeCurrency: string,
  isPrivacyMode: boolean = false,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += toPrivateValue(
                formatCurrencyCompact(context.parsed.y, homeCurrency),
                isPrivacyMode,
              );
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value: string | number) =>
            toPrivateValue(
              formatCurrencyCompact(+value, homeCurrency),
              isPrivacyMode,
            ),
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };
}

export interface SubCategoryBreakdownInput {
  accounts: Account[];
  entries: Entry[];
  accountType: "Asset" | "Liability";
}

export function getSubCategoryBreakdownChartData(
  input: SubCategoryBreakdownInput,
): ChartData<"doughnut"> | null {
  const { accounts, entries, accountType } = input;

  const filteredAccounts = accounts.filter(
    (a) => a.accountType === accountType && !a.isArchived,
  );

  if (filteredAccounts.length === 0) return null;

  const latestEntryByAccount = new Map<string, number>();
  for (const entry of entries) {
    const existing = latestEntryByAccount.get(entry.accountId);
    if (existing === undefined || entry.month > existing) {
      latestEntryByAccount.set(entry.accountId, entry.amount);
    }
  }

  const subCategoryTotals = new Map<string, number>();
  let uncategorizedTotal = 0;

  for (const account of filteredAccounts) {
    const balance = latestEntryByAccount.get(account.id) ?? 0;
    if (balance === 0) continue;

    if (account.subCategory) {
      const current = subCategoryTotals.get(account.subCategory) ?? 0;
      subCategoryTotals.set(account.subCategory, current + balance);
    } else {
      uncategorizedTotal += balance;
    }
  }

  const subCategoryOptions =
    accountType === "Asset" ? ASSET_SUB_CATEGORIES : LIABILITY_SUB_CATEGORIES;

  const labels: string[] = [];
  const data: number[] = [];
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];

  for (const option of subCategoryOptions) {
    const total = subCategoryTotals.get(option.key);
    if (total && total > 0) {
      labels.push(option.label);
      data.push(total);
      const colors = SUB_CATEGORY_COLORS[option.key];
      backgroundColors.push(colors.bg);
      borderColors.push(colors.border);
    }
  }

  if (uncategorizedTotal > 0) {
    labels.push("Uncategorized");
    data.push(uncategorizedTotal);
    backgroundColors.push(SUB_CATEGORY_COLORS.uncategorized.bg);
    borderColors.push(SUB_CATEGORY_COLORS.uncategorized.border);
  }

  if (data.length === 0) return null;

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };
}

export function getSubCategoryBreakdownChartOptions(
  isPrivacyMode: boolean,
): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            let label = context.label || "";
            if (label) label += ": ";
            label += toPrivateValue(context.formattedValue, isPrivacyMode);
            return label;
          },
        },
      },
    },
  };
}

export interface SubCategoryTrendInput {
  accounts: Account[];
  entries: Entry[];
  balanceSheets: BalanceSheet[];
  accountType: "Asset" | "Liability";
}

export function getSubCategoryTrendChartData(
  input: SubCategoryTrendInput,
): ChartData<"bar"> | null {
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

  const datasets: ChartData<"bar">["datasets"] = [];

  for (const option of subCategoryOptions) {
    const data = labels.map((label) => {
      const periodMap = periodTotals.get(label);
      return periodMap?.get(option.key) ?? 0;
    });

    if (data.some((d) => d > 0)) {
      const colors = SUB_CATEGORY_COLORS[option.key];
      datasets.push({
        label: option.label,
        data,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
      });
    }
  }

  if (hasUncategorized) {
    const data = labels.map((label) => {
      const periodMap = periodTotals.get(label);
      return periodMap?.get("uncategorized") ?? 0;
    });

    if (data.some((d) => d > 0)) {
      datasets.push({
        label: "Uncategorized",
        data,
        backgroundColor: SUB_CATEGORY_COLORS.uncategorized.bg,
        borderColor: SUB_CATEGORY_COLORS.uncategorized.border,
        borderWidth: 1,
      });
    }
  }

  if (datasets.length === 0) return null;

  return {
    labels,
    datasets,
  };
}

export function getSubCategoryTrendChartOptions(
  homeCurrency: string,
  isPrivacyMode: boolean = false,
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        mode: "index",
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += toPrivateValue(
                formatCurrencyCompact(context.parsed.y, homeCurrency),
                isPrivacyMode,
              );
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value: string | number) =>
            toPrivateValue(
              formatCurrencyCompact(+value, homeCurrency),
              isPrivacyMode,
            ),
        },
      },
    },
  };
}
