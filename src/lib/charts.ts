import { NetWorthDataPoint } from "@/lib/api";
import { MONTHS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/currency-formatting";
import { toPrivateValue } from "@/lib/private-value";
import { MonthlyTotal, RetirementPlanProjection } from "@/lib/types";
import {
  ChartData,
  ChartOptions,
  ChartType,
  ScriptableContext,
  TooltipItem,
} from "chart.js";
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
