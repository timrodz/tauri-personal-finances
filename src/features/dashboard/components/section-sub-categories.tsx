import { SubCategoryBreakdownChart } from "@/components/charts/sub-category-breakdown-chart";
import { SubCategoryTrendChart } from "@/components/charts/sub-category-trend-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSettings } from "@/hooks/use-user-settings";
import { api } from "@/lib/api";
import {
  getSubCategoryBreakdownChartData,
  getSubCategoryTrendChartData,
} from "@/lib/charts";
import { useAccounts, useBalanceSheets } from "@/lib/queries";
import { Entry } from "@/lib/types";
import { ChartColumnStackedIcon, ChartPieIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function SectionSubCategories() {
  const { data: settings } = useUserSettings();
  const { data: accounts, loading: accountsLoading } = useAccounts();
  const { data: balanceSheets, loading: balanceSheetsLoading } =
    useBalanceSheets();

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

  const isLoading = accountsLoading || balanceSheetsLoading || entriesLoading;

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

  const assetTrendData = useMemo(
    () =>
      getSubCategoryTrendChartData({
        accounts,
        entries,
        balanceSheets,
        accountType: "Asset",
      }),
    [accounts, entries, balanceSheets],
  );

  const liabilityTrendData = useMemo(
    () =>
      getSubCategoryTrendChartData({
        accounts,
        entries,
        balanceSheets,
        accountType: "Liability",
      }),
    [accounts, entries, balanceSheets],
  );

  if (!settings) return null;

  const hasBreakdownData = assetBreakdownData || liabilityBreakdownData;
  const hasTrendData = assetTrendData || liabilityTrendData;

  if (!isLoading && !hasBreakdownData && !hasTrendData) {
    return null;
  }

  const homeCurrency = settings.homeCurrency;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Sub-Category Breakdown</h2>

      <Tabs defaultValue="breakdown" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="breakdown">
              <ChartPieIcon className="h-4 w-4 mr-1" /> Breakdown
            </TabsTrigger>
            <TabsTrigger value="trend">
              <ChartColumnStackedIcon className="h-4 w-4 mr-1" /> Trend
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <TabsContent value="breakdown" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubCategoryBreakdownChart
                isLoading={isLoading}
                chartData={assetBreakdownData}
                title="Assets by Sub-Category"
              />
              <SubCategoryBreakdownChart
                isLoading={isLoading}
                chartData={liabilityBreakdownData}
                title="Liabilities by Sub-Category"
              />
            </div>
          </TabsContent>
          <TabsContent value="trend" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubCategoryTrendChart
                isLoading={isLoading}
                chartData={assetTrendData}
                homeCurrency={homeCurrency}
                title="Asset Trend by Sub-Category"
              />
              <SubCategoryTrendChart
                isLoading={isLoading}
                chartData={liabilityTrendData}
                homeCurrency={homeCurrency}
                title="Liability Trend by Sub-Category"
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
