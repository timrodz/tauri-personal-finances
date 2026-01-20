import { getMonthlyGrowthChartOptions } from "@/lib/charts";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface MonthlyGrowthChartProps {
  isLoading: boolean;
  chartData: ChartData<"bar"> | null;
  homeCurrency: string;
  className?: string;
}

export function MonthlyGrowthChart({
  isLoading,
  chartData,
  homeCurrency,
  className,
}: MonthlyGrowthChartProps) {
  const { isPrivacyMode } = usePrivacy();

  const chartOptions = useMemo(
    () => getMonthlyGrowthChartOptions(homeCurrency, isPrivacyMode),
    [homeCurrency, isPrivacyMode],
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading monthly growth...
        </div>
      ) : chartData ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
