import { getSubCategoryTrendChartOptions } from "@/lib/charts";
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

interface SubCategoryTrendChartProps {
  isLoading: boolean;
  chartData: ChartData<"bar"> | null;
  homeCurrency: string;
  title: string;
  className?: string;
}

export function SubCategoryTrendChart({
  isLoading,
  chartData,
  homeCurrency,
  title,
  className,
}: SubCategoryTrendChartProps) {
  const { isPrivacyMode } = usePrivacy();

  const chartOptions = useMemo(
    () => getSubCategoryTrendChartOptions(homeCurrency, isPrivacyMode),
    [homeCurrency, isPrivacyMode],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground text-center">
        {title}
      </h4>
      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading trend...
          </div>
        ) : chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
