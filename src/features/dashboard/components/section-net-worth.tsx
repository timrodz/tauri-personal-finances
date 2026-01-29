import { MonthlyGrowthChart } from "@/components/charts/monthly-growth-chart";
import { NetWorthBreakdownChart } from "@/components/charts/net-worth-breakdown-chart";
import { NetWorthTrendChart } from "@/components/charts/net-worth-trend-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { useUserSettings } from "@/hooks/use-user-settings";
import {
  getMonthlyGrowthChartData,
  getNetWorthBreakdownChartData,
  getNetWorthTrendChartData,
} from "@/lib/charts";
import { calculateGrowth, getFilteredHistory } from "@/lib/net-worth";
import { ChartColumnBigIcon, ChartLineIcon, ChartPieIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { NetWorthKPIs } from "./net-worth-kpis";

export function SectionNetWorth() {
  const { data: settings } = useUserSettings();
  const { data: netWorthHistory, isLoading: historyLoading } =
    useNetWorthHistory();

  // State
  const [timeRange, setTimeRange] = useState("ALL");

  // Logic: Chart Data & KPIs
  const filteredHistory = useMemo(
    () => getFilteredHistory(netWorthHistory, timeRange),
    [netWorthHistory, timeRange],
  );

  // Time-aware KPI Logic
  const latestPoint =
    filteredHistory.length > 0
      ? filteredHistory[filteredHistory.length - 1]
      : undefined;
  const startPoint =
    filteredHistory.length > 0 ? filteredHistory[0] : undefined;

  const trendChartData = useMemo(
    () => getNetWorthTrendChartData(filteredHistory),
    [filteredHistory],
  );

  const monthlyGrowthChartData = useMemo(
    () => getMonthlyGrowthChartData(filteredHistory),
    [filteredHistory],
  );

  const breakdownChartData = useMemo(
    () => getNetWorthBreakdownChartData(latestPoint),
    [filteredHistory],
  );

  if (!settings) return null;
  if (!historyLoading && (!netWorthHistory || netWorthHistory.length === 0)) {
    return null;
  }

  // Logic: Net Worth Calc
  const homeCurrency = settings.homeCurrency;

  const currentNetWorth = latestPoint?.netWorth || 0;
  const startNetWorth = startPoint?.netWorth || 0;

  const growth = calculateGrowth(currentNetWorth, startNetWorth);

  const totalAssets = latestPoint?.totalAssets || 0;
  const startAssets = startPoint?.totalAssets || 0;
  const assetGrowth = calculateGrowth(totalAssets, startAssets);

  const totalLiabilities = latestPoint?.totalLiabilities || 0;
  const startLiabilities = startPoint?.totalLiabilities || 0;
  const liabilityGrowth = calculateGrowth(totalLiabilities, startLiabilities);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Net Worth Overview</h2>
        <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="5Y">5Y</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
            <TabsTrigger value="YTD">YTD</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <NetWorthKPIs
        currentNetWorth={currentNetWorth}
        momGrowth={growth.percentage}
        totalAssets={totalAssets}
        assetGrowth={assetGrowth.percentage}
        totalLiabilities={totalLiabilities}
        liabilityGrowth={liabilityGrowth.percentage}
        homeCurrency={homeCurrency}
        periodLabel={timeRange === "ALL" ? "all time" : `in ${timeRange}`}
      />

      {/* Charts Area with Tabs */}
      <Tabs defaultValue="trend" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="trend">
              <ChartLineIcon /> Trend
            </TabsTrigger>
            <TabsTrigger value="growth">
              <ChartColumnBigIcon /> Monthly Growth
            </TabsTrigger>
            <TabsTrigger value="breakdown">
              <ChartPieIcon />
              Breakdown
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <TabsContent value="trend" className="mt-0">
            <NetWorthTrendChart
              isLoading={historyLoading}
              chartData={trendChartData}
              homeCurrency={homeCurrency}
            />
          </TabsContent>
          <TabsContent value="growth" className="mt-0">
            <MonthlyGrowthChart
              isLoading={historyLoading}
              chartData={monthlyGrowthChartData}
              homeCurrency={homeCurrency}
            />
          </TabsContent>
          <TabsContent value="breakdown" className="mt-0">
            <NetWorthBreakdownChart
              isLoading={historyLoading}
              chartData={breakdownChartData}
            />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
