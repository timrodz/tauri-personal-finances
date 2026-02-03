import { BalanceSheetChart } from "@/components/charts/balance-sheet-chart";
import { Card, CardContent } from "@/components/ui/card";
import { useAccounts } from "@/hooks/use-accounts";
import { useEntries, useUpsertEntry } from "@/hooks/use-balance-sheets";
import {
  useCurrencyRates,
  useUpsertCurrencyRate,
} from "@/hooks/use-currency-rates";
import { calculateMonthlyTotals } from "@/lib/balance-sheets";
import type { BalanceSheet } from "@/lib/types/balance-sheets";
import { useMemo } from "react";
import { AccountsGrid } from "./components/accounts-grid";
import { DangerZone } from "./components/danger-zone";
import { ExchangeRatesGrid } from "./components/exchange-rates-grid";
import { TotalsGrid } from "./components/totals-grid";
import { getBalanceSheetChartData } from "@/lib/charts/balance-sheet";

interface BalanceSheetFeatureProps {
  balanceSheet: BalanceSheet;
  homeCurrency: string;
  showOnboardingHint?: boolean;
}

export function BalanceSheetFeature({
  balanceSheet,
  homeCurrency,
  showOnboardingHint = false,
}: BalanceSheetFeatureProps) {
  const { data: accounts, loading: accountsLoading } = useAccounts(true);
  const {
    data: entries,
    loading: entriesLoading,
    refetch: refetchEntries,
    setData: setEntries,
  } = useEntries(balanceSheet.id);
  const { mutate: upsertEntry } = useUpsertEntry();
  const {
    data: rates,
    loading: ratesLoading,
    refetch: refetchRates,
    setData: setRates,
  } = useCurrencyRates(balanceSheet.year);
  const { mutate: upsertRate } = useUpsertCurrencyRate();

  const handleEntryChange = async (
    accountId: string,
    month: number,
    amount: number,
  ) => {
    // Optimistic update
    const previousEntries = [...entries];
    setEntries((prev) => {
      const existingIndex = prev.findIndex(
        (e) => e.accountId === accountId && e.month === month,
      );
      if (existingIndex >= 0) {
        const newEntries = [...prev];
        newEntries[existingIndex] = { ...newEntries[existingIndex], amount };
        return newEntries;
      } else {
        // New entry (mock id/timestamps for visual purposes)
        return [
          ...prev,
          {
            id: "temp",
            balanceSheetId: balanceSheet.id,
            accountId,
            month,
            amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });

    try {
      await upsertEntry(balanceSheet.id, accountId, month, amount);
      refetchEntries();
    } catch (e) {
      console.error("Failed to update entry:", e);
      setEntries(previousEntries);
    }
  };

  const handleRateChange = async (
    fromCurrency: string,
    month: number,
    rate: number,
  ) => {
    // Find existing rate to get ID
    const existingRate = rates.find(
      (r) =>
        r.fromCurrency === fromCurrency &&
        r.toCurrency === homeCurrency &&
        r.month === month &&
        r.year === balanceSheet.year,
    );

    // Optimistic update
    const previousRates = [...rates];
    setRates((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.fromCurrency === fromCurrency &&
          r.toCurrency === homeCurrency &&
          r.month === month &&
          r.year === balanceSheet.year,
      );

      const newRateObj = {
        id: existingRate?.id || "temp",
        fromCurrency,
        toCurrency: homeCurrency,
        provider: "manual",
        rate,
        month,
        year: balanceSheet.year,
        timestamp: new Date().toISOString(),
      };

      if (idx >= 0) {
        const newRates = [...prev];
        newRates[idx] = newRateObj;
        return newRates;
      } else {
        return [...prev, newRateObj];
      }
    });

    try {
      await upsertRate(
        existingRate?.id || null,
        fromCurrency,
        homeCurrency,
        "manual",
        rate,
        month,
        balanceSheet.year,
      );
      refetchRates();
    } catch (e) {
      console.error("Failed to update rate:", e);
      setRates(previousRates);
    }
  };

  const monthlyTotals = useMemo(
    () =>
      calculateMonthlyTotals(
        accounts,
        entries,
        rates,
        balanceSheet.year,
        homeCurrency,
      ),
    [entries, accounts, rates, balanceSheet.year, homeCurrency],
  );

  const chartData = useMemo(
    () => getBalanceSheetChartData(monthlyTotals),
    [monthlyTotals],
  );

  const isLoading =
    accountsLoading || (entriesLoading && entries.length === 0) || ratesLoading;
  const showEmptySheetHint =
    showOnboardingHint && !isLoading && entries.length === 0;

  const foreignCurrencies = useMemo(() => {
    return Array.from(
      new Set(
        accounts.map((a) => a.currency).filter((c) => c !== homeCurrency),
      ),
    );
  }, [accounts, homeCurrency]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading grid...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {showEmptySheetHint && (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="text-foreground font-medium mb-1">
            Start your first balance sheet
          </p>
          <p>
            Add each account you track, then fill in the end-of-month balances.
            This gives you a clear net worth snapshot and trend over time.
          </p>
        </div>
      )}
      <Card>
        <CardContent>
          <BalanceSheetChart
            isLoading={isLoading}
            chartData={chartData}
            homeCurrency={homeCurrency}
          />
        </CardContent>
      </Card>

      {/* ACCOUNTS GRID */}
      <AccountsGrid
        accounts={accounts}
        entries={entries}
        onEntryChange={handleEntryChange}
      />

      {/* EXCHANGE RATES GRID */}
      {foreignCurrencies.length > 0 && (
        <ExchangeRatesGrid
          currencies={foreignCurrencies}
          homeCurrency={homeCurrency}
          rates={rates}
          onRateChange={handleRateChange}
        />
      )}

      <TotalsGrid monthlyTotals={monthlyTotals} homeCurrency={homeCurrency} />
      <DangerZone balanceSheetId={balanceSheet.id} year={balanceSheet.year} />
    </div>
  );
}
