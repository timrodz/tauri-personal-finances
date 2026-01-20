import { getNetWorthTrendChartOptions } from "@/lib/charts";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
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
  const { isPrivacyMode } = usePrivacy();
  const chartOptions = useMemo(
    () => getNetWorthTrendChartOptions(homeCurrency, isPrivacyMode),
    [homeCurrency, isPrivacyMode],
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading trend...
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
