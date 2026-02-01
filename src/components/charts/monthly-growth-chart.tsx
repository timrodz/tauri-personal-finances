import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { MonthlyGrowthChartPoint } from "@/lib/charts/monthly-growth";
import { formatCurrencyCompact } from "@/lib/currency-formatting";
import { toPrivateValue } from "@/lib/private-value";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

interface MonthlyGrowthChartProps {
  isLoading: boolean;
  chartData: MonthlyGrowthChartPoint[] | null;
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

  const chartConfig = {
    change: {
      label: "Monthly Growth",
    },
  };

  return (
    <div className={cn("h-75 w-full min-h-[300px]", className)}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Loading monthly growth...
        </div>
      ) : chartData ? (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={chartData} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                toPrivateValue(
                  formatCurrencyCompact(Number(value), homeCurrency),
                  isPrivacyMode,
                )
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => {
                    const formattedValue =
                      typeof value === "number"
                        ? toPrivateValue(
                            formatCurrencyCompact(value, homeCurrency),
                            isPrivacyMode,
                          )
                        : value;
                    return (
                      <div className="flex flex-1 justify-between leading-none">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formattedValue}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="change" name="Monthly Growth" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.label}-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
