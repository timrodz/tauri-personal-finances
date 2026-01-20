import { NetWorthDataPoint } from "@/lib/api";
import { getBreakdownChartData } from "@/lib/charts/net-worth-utils";
import { toPrivateValue } from "@/lib/private-value";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface NetWorthBreakdownChartProps {
  latestPoint: NetWorthDataPoint | undefined;
  className?: string;
}

export function NetWorthBreakdownChart({
  latestPoint,
  className,
}: NetWorthBreakdownChartProps) {
  const { isPrivacyMode } = usePrivacy();
  const chartData = useMemo(
    () => getBreakdownChartData(latestPoint),
    [latestPoint],
  );

  if (!chartData) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for breakdown
      </div>
    );
  }

  const options = {
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

  return (
    <div className={cn("h-[300px] w-full", className)}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
