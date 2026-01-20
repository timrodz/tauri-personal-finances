import { NetWorthDataPoint } from "@/lib/api";
import {
  getMonthlyGrowthChartData,
  getNetWorthChartOptions,
} from "@/lib/charts/net-worth-utils";
import {
  BarElement,
  CategoryScale,
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
  filteredHistory: NetWorthDataPoint[] | undefined;
  homeCurrency: string;
}

export function MonthlyGrowthChart({
  filteredHistory,
  homeCurrency,
}: MonthlyGrowthChartProps) {
  const chartData = useMemo(
    () => getMonthlyGrowthChartData(filteredHistory),
    [filteredHistory],
  );

  const chartOptions = useMemo(
    () => getNetWorthChartOptions(homeCurrency),
    [homeCurrency],
  );

  if (!chartData) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Not enough data for growth chart
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
