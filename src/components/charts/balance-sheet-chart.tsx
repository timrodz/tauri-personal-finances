import { MONTHS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/currency-formatting";
import { toPrivateValue } from "@/lib/private-value";
import { MonthlyTotal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface BalanceSheetChartProps {
  monthlyTotals: MonthlyTotal[];
  homeCurrency: string;
  className?: string;
}

export function BalanceSheetChart({
  monthlyTotals,
  homeCurrency,
  className,
}: BalanceSheetChartProps) {
  const { isPrivacyMode } = usePrivacy();
  const data = useMemo(() => {
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
  }, [monthlyTotals]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
        text: "Net Worth Trend",
      },
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
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className={cn("h-[300px] w-full", className)}>
      <Line options={options} data={data} />
    </div>
  );
}
