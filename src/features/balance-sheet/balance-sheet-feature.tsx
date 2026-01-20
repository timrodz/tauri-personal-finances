import { BalanceSheetChart } from "@/components/charts/balance-sheet-chart";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBalanceSheetChartData } from "@/lib/charts";
import { MONTHS } from "@/lib/constants";
import {
  useAccounts,
  useCurrencyRates,
  useEntries,
  useUpsertCurrencyRate,
  useUpsertEntry,
} from "@/lib/queries";
import { BalanceSheet } from "@/lib/types";
import { useMemo } from "react";
import { AccountSection } from "./components/account-section";
import { DangerZone } from "./components/danger-zone";
import { ExchangeRatesGrid } from "./components/exchange-rates-grid";
import { TotalsGrid } from "./components/totals-grid";
import { calculateMonthlyTotals } from "./lib/calculations";

const TOTAL_COLUMNS = 14;

interface BalanceSheetFeatureProps {
  balanceSheet: BalanceSheet;
  homeCurrency: string;
}

export function BalanceSheetFeature({
  balanceSheet,
  homeCurrency,
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

  const { assets, liabilities } = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.isArchived);
    const assetsList = activeAccounts.filter((a) => a.accountType === "Asset");
    const liabilitiesList = activeAccounts.filter(
      (a) => a.accountType === "Liability",
    );

    return {
      assets: assetsList,
      liabilities: liabilitiesList,
    };
  }, [accounts]);

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
      <div>
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 z-10 bg-background border-r">
                Account
              </TableHead>
              <TableHead className="w-[100px] text-center">Currency</TableHead>
              {MONTHS.map((month) => (
                <TableHead key={month} className="text-right min-w-[100px]">
                  {month}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
              <TableCell
                colSpan={TOTAL_COLUMNS}
                className="sticky left-0 bg-muted/50 border-r"
              >
                ASSETS
              </TableCell>
            </TableRow>
            <AccountSection
              accounts={assets}
              entries={entries}
              onEntryChange={handleEntryChange}
            />
            {assets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={TOTAL_COLUMNS}
                  className="text-center text-muted-foreground py-4"
                >
                  No asset accounts found.
                </TableCell>
              </TableRow>
            )}

            <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
              <TableCell
                colSpan={TOTAL_COLUMNS}
                className="sticky left-0 bg-muted/50 border-r"
              >
                LIABILITIES
              </TableCell>
            </TableRow>
            <AccountSection
              accounts={liabilities}
              entries={entries}
              onEntryChange={handleEntryChange}
            />
            {liabilities.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={TOTAL_COLUMNS}
                  className="text-center text-muted-foreground py-4"
                >
                  No liability accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
