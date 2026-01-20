import { MonthlyGrowthChart } from "@/components/charts/monthly-growth-chart";
import { NetWorthBreakdownChart } from "@/components/charts/net-worth-breakdown-chart";
import { NetWorthTrendChart } from "@/components/charts/net-worth-trend-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { useUserSettings } from "@/hooks/use-user-settings";
import {
  calculateGrowth,
  getFilteredHistory,
  getNetWorthChartData,
} from "@/lib/charts/net-worth-utils";
import { useMemo, useState } from "react";
import { NetWorthKPIs } from "./net-worth-kpis";

export function SectionNetWorth() {
  const { data: settings } = useUserSettings();
  const { data: history, isLoading: historyLoading } = useNetWorthHistory();

  // State
  const [timeRange, setTimeRange] = useState("ALL");

  if (!settings) return null;

  // Logic: Net Worth Calc
  const homeCurrency = settings.homeCurrency;

  // Logic: Chart Data & KPIs
  const filteredHistory = useMemo(
    () => getFilteredHistory(history, timeRange),
    [history, timeRange],
  );

  const chartData = useMemo(
    () => getNetWorthChartData(filteredHistory),
    [filteredHistory],
  );

  // Time-aware KPI Logic
  const latestPoint =
    filteredHistory.length > 0
      ? filteredHistory[filteredHistory.length - 1]
      : undefined;
  const startPoint =
    filteredHistory.length > 0 ? filteredHistory[0] : undefined;

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
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="growth">Monthly Growth</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <TabsContent value="trend" className="mt-0">
            <NetWorthTrendChart
              isLoading={historyLoading}
              chartData={chartData}
              homeCurrency={homeCurrency}
            />
          </TabsContent>
          <TabsContent value="growth" className="mt-0">
            <MonthlyGrowthChart
              filteredHistory={filteredHistory}
              homeCurrency={homeCurrency}
            />
          </TabsContent>
          <TabsContent value="breakdown" className="mt-0">
            <NetWorthBreakdownChart latestPoint={latestPoint} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
