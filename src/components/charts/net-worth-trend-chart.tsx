import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { NET_WORTH_TREND_COLORS } from "@/lib/constants/charts";
import { formatCurrencyCompact } from "@/lib/currency-formatting";
import type { NetWorthTrendChartPoint } from "@/lib/charts/net-worth-trend";
import { toPrivateValue } from "@/lib/private-value";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface NetWorthTrendChartProps {
  isLoading: boolean;
  chartData: NetWorthTrendChartPoint[] | null;
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

  const chartConfig = {
    netWorth: {
      label: "Net Worth",
      color: NET_WORTH_TREND_COLORS.line,
    },
  };

  if (isLoading || !chartData) return null;

  return (
    <div className={cn("min-h-75 h-75 w-full", className)}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={chartData} margin={{ left: 8, right: 16, top: 8 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={NET_WORTH_TREND_COLORS.gradientStart}
                stopOpacity={1}
              />
              <stop
                offset="95%"
                stopColor={NET_WORTH_TREND_COLORS.gradientEnd}
                stopOpacity={1}
              />
            </linearGradient>
          </defs>
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
                formatter={(value) => {
                  const formattedValue =
                    typeof value === "number"
                      ? toPrivateValue(
                          formatCurrencyCompact(value, homeCurrency),
                          isPrivacyMode,
                        )
                      : value;
                  return <div>{formattedValue}</div>;
                }}
              />
            }
          />
          <Area
            dataKey="netWorth"
            name="Net Worth"
            type="monotone"
            stroke={NET_WORTH_TREND_COLORS.line}
            fill="url(#netWorthGradient)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
