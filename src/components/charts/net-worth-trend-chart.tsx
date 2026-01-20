import { getNetWorthChartOptions } from "@/lib/charts/net-worth-utils";
import { cn } from "@/lib/utils";
import { ChartData } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

interface NetWorthTrendChartProps {
  isLoading: boolean;
  chartData: ChartData<"line"> | null;
  homeCurrency: string;
  className?: string;
}

export function NetWorthTrendChart({
  isLoading,
  chartData,
  homeCurrency,
  className,
}: NetWorthTrendChartProps) {
  const chartOptions = useMemo(
    () => getNetWorthChartOptions(homeCurrency),
    [homeCurrency],
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading history...
        </div>
      ) : chartData ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
