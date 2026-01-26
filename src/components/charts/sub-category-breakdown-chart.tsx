import { getSubCategoryBreakdownChartOptions } from "@/lib/charts";
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

interface SubCategoryBreakdownChartProps {
  isLoading: boolean;
  chartData: ChartData<"doughnut"> | null;
  title: string;
  className?: string;
}

export function SubCategoryBreakdownChart({
  isLoading,
  chartData,
  title,
  className,
}: SubCategoryBreakdownChartProps) {
  const { isPrivacyMode } = usePrivacy();

  const chartOptions = useMemo(
    () => getSubCategoryBreakdownChartOptions(isPrivacyMode),
    [isPrivacyMode],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground text-center">
        {title}
      </h4>
      <div className="h-[280px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : chartData ? (
          <Doughnut data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
