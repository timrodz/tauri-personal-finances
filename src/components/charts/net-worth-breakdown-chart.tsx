import { NetWorthDataPoint } from "@/lib/api";
import { getBreakdownChartData } from "@/lib/charts/net-worth-utils";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface NetWorthBreakdownChartProps {
  latestPoint: NetWorthDataPoint | undefined;
}

export function NetWorthBreakdownChart({
  latestPoint,
}: NetWorthBreakdownChartProps) {
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
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
