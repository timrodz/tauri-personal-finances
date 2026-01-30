import { MonthlyGrowthChart } from "@/components/charts/monthly-growth-chart";
import { NetWorthBreakdownChart } from "@/components/charts/net-worth-breakdown-chart";
import { NetWorthTrendChart } from "@/components/charts/net-worth-trend-chart";
import { SubCategoryBreakdownChart } from "@/components/charts/sub-category-breakdown-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/hooks/use-accounts";
import { useBalanceSheets } from "@/hooks/use-balance-sheets";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { useUserSettings } from "@/hooks/use-user-settings";
import { api } from "@/lib/api";
import {
  getMonthlyGrowthChartData,
  getNetWorthBreakdownChartData,
  getNetWorthTrendChartData,
  getSubCategoryBreakdownChartData,
} from "@/lib/charts";
import { ACCOUNTS_CHANGED_EVENT } from "@/lib/constants/events";
import { calculateGrowth, getFilteredHistory } from "@/lib/net-worth";
import type { Entry } from "@/lib/types/balance-sheets";
import { ChartColumnBigIcon, ChartLineIcon, ChartPieIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NetWorthKPIs } from "./net-worth-kpis";

export function SectionNetWorth() {
  const { data: settings } = useUserSettings();
  const { data: netWorthHistory, isLoading: historyLoading } =
    useNetWorthHistory();
  const {
    data: accounts,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useAccounts();
  const { data: balanceSheets, loading: balanceSheetsLoading } =
    useBalanceSheets();

  // State
  const [timeRange, setTimeRange] = useState("ALL");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const fetchAllEntries = useCallback(async () => {
    if (balanceSheets.length === 0) {
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    try {
      const allEntries: Entry[] = [];
      for (const sheet of balanceSheets) {
        const sheetEntries = await api.getEntries(sheet.id);
        allEntries.push(...sheetEntries);
      }
      setEntries(allEntries);
    } finally {
      setEntriesLoading(false);
    }
  }, [balanceSheets]);

  useEffect(() => {
    if (!balanceSheetsLoading) {
      fetchAllEntries();
    }
  }, [balanceSheetsLoading, fetchAllEntries]);

  useEffect(() => {
    const handleAccountsChanged = () => {
      refetchAccounts();
    };

    window.addEventListener(ACCOUNTS_CHANGED_EVENT, handleAccountsChanged);
    return () =>
      window.removeEventListener(ACCOUNTS_CHANGED_EVENT, handleAccountsChanged);
  }, [refetchAccounts]);

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

  const subCategoryLoading =
    accountsLoading || balanceSheetsLoading || entriesLoading;

  const assetBreakdownData = useMemo(
    () =>
      getSubCategoryBreakdownChartData({
        accounts,
        entries,
        accountType: "Asset",
      }),
    [accounts, entries],
  );

  const liabilityBreakdownData = useMemo(
    () =>
      getSubCategoryBreakdownChartData({
        accounts,
        entries,
        accountType: "Liability",
      }),
    [accounts, entries],
  );

  if (!settings) return null;
  if (historyLoading) return null;
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

  const hasSubCategoryBreakdownData =
    assetBreakdownData || liabilityBreakdownData;
  const showSubCategoryBreakdown =
    !subCategoryLoading && hasSubCategoryBreakdownData;

  return (
    <section className="space-y-4">
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
        <div className="flex items-center justify-between mb-2">
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
            <div className="space-y-6">
              <NetWorthBreakdownChart
                isLoading={historyLoading}
                chartData={breakdownChartData}
              />
              {showSubCategoryBreakdown && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SubCategoryBreakdownChart
                    isLoading={subCategoryLoading}
                    chartData={assetBreakdownData}
                    title="Assets by Sub-Category"
                  />
                  <SubCategoryBreakdownChart
                    isLoading={subCategoryLoading}
                    chartData={liabilityBreakdownData}
                    title="Liabilities by Sub-Category"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
