import { BalanceSheetChart } from "@/components/charts/balance-sheet-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MONTHS } from "@/lib/constants";
import {
  useAccounts,
  useCurrencyRates,
  useEntries,
  useUpsertCurrencyRate,
  useUpsertEntry,
} from "@/lib/queries";
import { BalanceSheet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { AccountSection } from "./components/account-section";
import { ExchangeRatesGrid } from "./components/exchange-rates-grid";
import { TotalsSection } from "./components/totals-section";
import { calculateMonthlyTotals } from "./lib/calculations";

interface BalanceSheetFeatureProps {
  balanceSheet: BalanceSheet;
  homeCurrency: string;
}

export function BalanceSheetFeature({
  balanceSheet,
  homeCurrency,
}: BalanceSheetFeatureProps) {
  const { data: accounts, loading: accountsLoading } = useAccounts();
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

  const accountsRef = useRef<HTMLDivElement>(null);
  const ratesRef = useRef<HTMLDivElement>(null);
  const totalsRef = useRef<HTMLDivElement>(null);

  const syncScroll = (activeRef: React.RefObject<HTMLDivElement | null>) => {
    if (!activeRef.current) return;
    const scrollLeft = activeRef.current.scrollLeft;

    [accountsRef, ratesRef, totalsRef].forEach((ref) => {
      if (ref !== activeRef && ref.current) {
        ref.current.scrollLeft = scrollLeft;
      }
    });
  };

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
    const assetsList = accounts.filter((a) => a.accountType === "Asset");
    const liabilitiesList = accounts.filter(
      (a) => a.accountType === "Liability",
    );

    return {
      assets: assetsList,
      liabilities: liabilitiesList,
    };
  }, [accounts]);

  const monthlyTotals = useMemo(() => {
    return calculateMonthlyTotals(
      accounts,
      entries,
      rates,
      balanceSheet.year,
      homeCurrency,
    );
  }, [entries, accounts, rates, balanceSheet.year, homeCurrency]);

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

  const hideScrollbarClass =
    "scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="space-y-8 pb-12">
      {/* CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceSheetChart
            monthlyTotals={monthlyTotals}
            homeCurrency={homeCurrency}
          />
        </CardContent>
      </Card>

      {/* ACCOUNTS GRID */}
      <div
        ref={accountsRef}
        onScroll={() => syncScroll(accountsRef)}
        className={cn("border rounded-md overflow-x-auto", hideScrollbarClass)}
      >
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
                colSpan={14}
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
                  colSpan={14}
                  className="text-center text-muted-foreground py-4"
                >
                  No asset accounts found.
                </TableCell>
              </TableRow>
            )}

            <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
              <TableCell
                colSpan={14}
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
                  colSpan={14}
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
          containerRef={ratesRef}
          onScroll={() => syncScroll(ratesRef)}
        />
      )}

      {/* TOTALS GRID */}
      <div
        ref={totalsRef}
        onScroll={() => syncScroll(totalsRef)}
        className={cn("border rounded-md overflow-x-auto", hideScrollbarClass)}
      >
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] sticky left-0 z-10 bg-background border-r font-bold">
                Totals
              </TableHead>
              {MONTHS.map((month) => (
                <TableHead key={month} className="text-right min-w-[100px]">
                  {month}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TotalsSection
              monthlyTotals={monthlyTotals}
              homeCurrency={homeCurrency}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
