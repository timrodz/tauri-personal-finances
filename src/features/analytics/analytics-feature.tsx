import { SubCategoryBreakdownChart } from "@/components/charts/sub-category-breakdown-chart";
import { SubCategoryTrendChart } from "@/components/charts/sub-category-trend-chart";
import { useAccounts } from "@/hooks/use-accounts";
import { useBalanceSheets } from "@/hooks/use-balance-sheets";
import { useUserSettings } from "@/hooks/use-user-settings";
import { api } from "@/lib/api";
import { getSubCategoryBreakdownChartData } from "@/lib/charts/sub-category-breakdown";
import { getSubCategoryTrendChartData } from "@/lib/charts/sub-category-trend";
import type { Entry } from "@/lib/types/balance-sheets";
import { useCallback, useEffect, useMemo, useState } from "react";

export function AnalyticsFeature() {
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
  if (isLoading) return null;

  const hasBreakdownData = assetBreakdownData || liabilityBreakdownData;
  const hasTrendData = assetTrendData || liabilityTrendData;
  const hasNoData = !isLoading && !hasBreakdownData && !hasTrendData;

  const homeCurrency = settings.homeCurrency;

  return (
    <div className="space-y-4">
      {hasNoData ? (
        <div className="rounded-xl border bg-card text-card-foreground shadow text-center">
          <p className="text-muted-foreground">
            No sub-category data available. Add sub-categories to your accounts
            to see analytics.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Sub-Category Breakdown</h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SubCategoryBreakdownChart
                  homeCurrency={homeCurrency}
                  isLoading={isLoading}
                  chartData={assetBreakdownData}
                  title="Assets by Sub-Category"
                />
                <SubCategoryBreakdownChart
                  homeCurrency={homeCurrency}
                  isLoading={isLoading}
                  chartData={liabilityBreakdownData}
                  title="Liabilities by Sub-Category"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Sub-Category Trends</h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}
