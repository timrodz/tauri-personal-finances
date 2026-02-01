import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import type {
  SubCategoryTrendChartPoint,
  SubCategoryTrendSeries,
} from "@/lib/charts/sub-category-trend";
import { formatCurrencyCompact } from "@/lib/currency-formatting";
import { toPrivateValue } from "@/lib/private-value";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface SubCategoryTrendChartProps {
  isLoading: boolean;
  chartData: {
    data: SubCategoryTrendChartPoint[];
    series: SubCategoryTrendSeries[];
  } | null;
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

  const chartConfig =
    chartData?.series.reduce<Record<string, { label: string; color: string }>>(
      (acc, series) => {
        acc[series.key] = { label: series.label, color: series.color };
        return acc;
      },
      {},
    ) ?? {};

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground text-center">
        {title}
      </h4>
      <div className="h-75 w-full min-h-[300px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading trend...
          </div>
        ) : chartData ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={chartData.data}
              margin={{ left: 8, right: 16, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
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
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                      <div className="font-medium">{label}</div>
                      <div className="grid gap-1">
                        {payload.map((item) => {
                          const value = item.value;
                          const formattedValue =
                            typeof value === "number"
                              ? toPrivateValue(
                                  formatCurrencyCompact(value, homeCurrency),
                                  isPrivacyMode,
                                )
                              : value;
                          return (
                            <div
                              key={`${item.name}-${item.dataKey}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-muted-foreground">
                                {item.name}
                              </span>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                {formattedValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {chartData.series.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  stackId="trend"
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
              <ChartLegend
                content={<ChartLegendContent nameKey="dataKey" />}
                verticalAlign="bottom"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
