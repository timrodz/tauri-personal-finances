import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNetWorthChartOptions } from "@/lib/charts/net-worth-utils";
import { ChartData } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

interface NetWorthTrendChartProps {
  isLoading: boolean;
  chartData: ChartData<"line"> | null;
  homeCurrency: string;
}

export function NetWorthTrendChart({
  isLoading,
  chartData,
  homeCurrency,
}: NetWorthTrendChartProps) {
  const chartOptions = useMemo(
    () => getNetWorthChartOptions(homeCurrency),
    [homeCurrency],
  );

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
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
      </CardContent>
    </Card>
  );
}
