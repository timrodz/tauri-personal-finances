import { getNetworthBreakdownChartOptions } from "@/lib/charts";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import {
  ArcElement,
  ChartData,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface NetWorthBreakdownChartProps {
  isLoading: boolean;
  chartData: ChartData<"doughnut"> | null;
  className?: string;
}

export function NetWorthBreakdownChart({
  isLoading,
  chartData,
  className,
}: NetWorthBreakdownChartProps) {
  const { isPrivacyMode } = usePrivacy();

  const chartOptions = useMemo(
    () => getNetworthBreakdownChartOptions(isPrivacyMode),
    [isPrivacyMode],
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading trend...
        </div>
      ) : chartData ? (
        <Doughnut data={chartData} options={chartOptions} />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
