import { NetWorthDataPoint } from "@/lib/api";
import { formatCurrencyCompact } from "@/lib/currency-formatting";
import { ChartData, ChartType, ScriptableContext, TooltipItem } from "chart.js";

export function getFilteredHistory(
  history: NetWorthDataPoint[] | undefined,
  timeRange: string,
): NetWorthDataPoint[] {
  if (!history) return [];

  const now = new Date();
  const currentYear = now.getFullYear();

  switch (timeRange) {
    case "5Y":
      return history.slice(-60);
    case "1Y":
      return history.slice(-12);
    case "6M":
      return history.slice(-6);
    case "3M":
      return history.slice(-3);
    case "1M":
      // Return last 2 points to show change from previous month to current
      return history.slice(-2);
    case "YTD":
      return history.filter((p) => p.year === currentYear);
    case "ALL":
    default:
      return history;
  }
}

export function getNetWorthChartData(
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

export function getNetWorthChartOptions(homeCurrency: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += formatCurrencyCompact(context.parsed.y, homeCurrency);
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
            formatCurrencyCompact(+value, homeCurrency),
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };
}

export function calculateGrowth(
  current: number,
  previous: number,
): { value: number; percentage: number } {
  if (previous === 0) return { value: 0, percentage: 0 };
  const value = current - previous;
  const percentage = (value / Math.abs(previous)) * 100;
  return { value, percentage };
}

export function getBreakdownChartData(
  latestPoint: NetWorthDataPoint | undefined,
) {
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
