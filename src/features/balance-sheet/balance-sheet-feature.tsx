import { BalanceSheetChart } from "@/components/charts/balance-sheet-chart";
import { Card, CardContent } from "@/components/ui/card";
import { useAccounts } from "@/hooks/use-accounts";
import {
  useBalanceSheets,
  useEntries,
  useUpsertEntry,
} from "@/hooks/use-balance-sheets";
import {
  useCurrencyRates,
  useUpsertCurrencyRate,
} from "@/hooks/use-currency-rates";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { calculateMonthlyTotals } from "@/lib/balance-sheets";
import { getBalanceSheetChartData } from "@/lib/charts/balance-sheet";
import {
  getMaxAvailableMonthForYear,
  isMonthAvailableForYear,
} from "@/lib/dates";
import type { BalanceSheet } from "@/lib/types/balance-sheets";
import { useUserSettingsContext } from "@/providers/user-settings-provider";
import { useMemo } from "react";
import { AccountsGrid } from "./components/accounts-grid";
import { DangerZone } from "./components/danger-zone";
import { ExchangeRatesGrid } from "./components/exchange-rates-grid";
import { TotalsGrid } from "./components/totals-grid";

interface BalanceSheetFeatureProps {
  balanceSheet: BalanceSheet;
}

export function BalanceSheetFeature({
  balanceSheet,
}: BalanceSheetFeatureProps) {
  const {
    settings: { homeCurrency },
  } = useUserSettingsContext();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(true);
  const { data: sheets = [], isLoading: sheetsLoading } = useBalanceSheets();
  const { data: netWorthHistory, isLoading: netWorthLoading } =
    useNetWorthHistory();
  const {
    data: entries = [],
    isLoading: entriesLoading,
    refetch: refetchEntries,
  } = useEntries(balanceSheet.id);
  const { mutateAsync: upsertEntry } = useUpsertEntry();
  const {
    data: rates = [],
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useCurrencyRates(balanceSheet.year);
  const { mutateAsync: upsertRate } = useUpsertCurrencyRate();

  const maxEditableMonth = useMemo(
    () => getMaxAvailableMonthForYear(balanceSheet.year),
    [balanceSheet.year],
  );

  const visibleEntries = useMemo(() => {
    if (maxEditableMonth >= 12) return entries;
    return entries.filter((entry) => entry.month <= maxEditableMonth);
  }, [entries, maxEditableMonth]);

  const visibleRates = useMemo(() => {
    if (maxEditableMonth >= 12) return rates;
    return rates.filter((rate) => rate.month <= maxEditableMonth);
  }, [rates, maxEditableMonth]);

  const handleEntryChange = async (
    accountId: string,
    month: number,
    amount: number,
  ) => {
    if (!isMonthAvailableForYear(month, balanceSheet.year)) {
      return;
    }

    try {
      await upsertEntry({
        balanceSheetId: balanceSheet.id,
        accountId,
        month,
        amount,
      });
      refetchEntries();
    } catch (e) {
      console.error("Failed to update entry:", e);
    }
  };

  const handleRateChange = async (
    fromCurrency: string,
    month: number,
    rate: number,
  ) => {
    if (!isMonthAvailableForYear(month, balanceSheet.year)) {
      return;
    }
    // Find existing rate to get ID
    const existingRate = visibleRates.find(
      (r) =>
        r.fromCurrency === fromCurrency &&
        r.toCurrency === homeCurrency &&
        r.month === month &&
        r.year === balanceSheet.year,
    );

    // // Optimistic update
    // const previousRates = [...rates];
    // setRates((prev) => {
    //   const idx = prev.findIndex(
    //     (r) =>
    //       r.fromCurrency === fromCurrency &&
    //       r.toCurrency === homeCurrency &&
    //       r.month === month &&
    //       r.year === balanceSheet.year,
    //   );

    //   const newRateObj = {
    //     id: existingRate?.id || "temp",
    //     fromCurrency,
    //     toCurrency: homeCurrency,
    //     provider: "manual",
    //     rate,
    //     month,
    //     year: balanceSheet.year,
    //     timestamp: new Date().toISOString(),
    //   };

    //   if (idx >= 0) {
    //     const newRates = [...prev];
    //     newRates[idx] = newRateObj;
    //     return newRates;
    //   } else {
    //     return [...prev, newRateObj];
    //   }
    // });

    try {
      await upsertRate({
        id: existingRate?.id || null,
        fromCurrency,
        toCurrency: homeCurrency,
        provider: "manual",
        rate,
        month,
        year: balanceSheet.year,
      });
      refetchRates();
    } catch (e) {
      console.error("Failed to update rate:", e);
      // setRates(() => previousRates);
    }
  };

  const monthlyTotals = useMemo(
    () =>
      calculateMonthlyTotals(
        accounts,
        visibleEntries,
        visibleRates,
        balanceSheet.year,
        homeCurrency,
      ),
    [visibleEntries, accounts, visibleRates, balanceSheet.year, homeCurrency],
  );

  const chartData = useMemo(
    () => getBalanceSheetChartData(monthlyTotals, maxEditableMonth),
    [monthlyTotals, maxEditableMonth],
  );

  const isLoading =
    accountsLoading || (entriesLoading && entries.length === 0) || ratesLoading;
  const latestYear =
    sheets.length > 0 ? Math.max(...sheets.map((sheet) => sheet.year)) : null;
  const hasNetWorthData = (netWorthHistory?.length ?? 0) > 0;
  const isMostRecentSheet =
    latestYear !== null && balanceSheet.year === latestYear;
  const showOnboardingHint =
    !sheetsLoading && !netWorthLoading && !hasNetWorthData && isMostRecentSheet;
  const showEmptySheetHint =
    showOnboardingHint && !isLoading && visibleEntries.length === 0;

  const foreignCurrencies = useMemo(() => {
    return Array.from(
      new Set(
        accounts.map((a) => a.currency).filter((c) => c !== homeCurrency),
      ),
    );
  }, [accounts, homeCurrency]);

  if (isLoading) {
    return null;
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
        entries={visibleEntries}
        onEntryChange={handleEntryChange}
        maxEditableMonth={maxEditableMonth}
      />

      {/* EXCHANGE RATES GRID */}
      {foreignCurrencies.length > 0 && (
        <ExchangeRatesGrid
          currencies={foreignCurrencies}
          homeCurrency={homeCurrency}
          rates={visibleRates}
          onRateChange={handleRateChange}
          maxEditableMonth={maxEditableMonth}
        />
      )}

      <TotalsGrid
        monthlyTotals={monthlyTotals}
        homeCurrency={homeCurrency}
        maxVisibleMonth={maxEditableMonth}
      />
      <DangerZone balanceSheetId={balanceSheet.id} year={balanceSheet.year} />
    </div>
  );
}
