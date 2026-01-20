import { getBalanceSheetChartOptions } from "@/lib/charts";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
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
  isLoading: boolean;
  chartData: ChartData<"line"> | null;
  homeCurrency: string;
  className?: string;
}

export function BalanceSheetChart({
  isLoading,
  chartData,
  homeCurrency,
  className,
}: BalanceSheetChartProps) {
  const { isPrivacyMode } = usePrivacy();

  const chartOptions = useMemo(
    () => getBalanceSheetChartOptions(homeCurrency, isPrivacyMode),
    [homeCurrency, isPrivacyMode],
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading balance sheet...
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
