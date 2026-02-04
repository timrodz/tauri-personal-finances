import { BalanceSheetCard } from "@/components/balance-sheet-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { YearSelector } from "@/components/year-selector";
import { useAccounts } from "@/hooks/use-accounts";
import {
  useBalanceSheets,
  useCreateBalanceSheet,
} from "@/hooks/use-balance-sheets";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { ACCOUNTS_CHANGED_EVENT } from "@/lib/constants/events";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function SectionBalanceSheets() {
  const navigate = useNavigate();
  const location = useLocation();
  const [createYearOpen, setCreateYearOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const {
    data: balanceSheets = [],
    isLoading: sheetsLoading,
    refetch: refetchSheets,
  } = useBalanceSheets();
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useAccounts();
  const { data: netWorthHistory } = useNetWorthHistory();

  const {
    mutateAsync: createSheet,
    isPending: createLoading,
    error: createError,
  } = useCreateBalanceSheet();

  const isLoading = sheetsLoading || accountsLoading;

  const existingYears = balanceSheets.map((bs) => bs.year);
  const latestYear = useMemo(() => {
    if (balanceSheets.length === 0) return null;
    return Math.max(...balanceSheets.map((sheet) => sheet.year));
  }, [balanceSheets]);
  const hasNetWorthData = (netWorthHistory?.length ?? 0) > 0;
  const hasAccounts = accounts.length > 0;

  useEffect(() => {
    refetchAccounts();
  }, [location.pathname, refetchAccounts]);

  useEffect(() => {
    const handleAccountsChanged = () => {
      refetchAccounts();
    };

    window.addEventListener(ACCOUNTS_CHANGED_EVENT, handleAccountsChanged);
    return () =>
      window.removeEventListener(ACCOUNTS_CHANGED_EVENT, handleAccountsChanged);
  }, [refetchAccounts]);

  const handleCreateSheet = async () => {
    if (!selectedYear) return;
    try {
      await createSheet(selectedYear);
      await refetchSheets();
      setCreateYearOpen(false);
      setSelectedYear(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading && balanceSheets.length === 0 && accounts.length === 0) {
    return null;
  }

  if (!accountsLoading && !hasAccounts) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Balance Sheets</h3>
        </div>
        <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground flex items-start justify-between gap-4">
          <div>
            <p className="text-foreground font-medium">
              Create your first account to unlock balance sheets.
            </p>
            <p className="mt-1">
              Add assets and liabilities first, then come back to fill monthly
              balances.
            </p>
          </div>
          <StatusBadge level="error" text="Add account" pulse />
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Balance Sheets</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sheetsLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Loading balance sheets...
          </div>
        ) : (
          <>
            {balanceSheets.map((sheet) => (
              <BalanceSheetCard
                key={sheet.id}
                balanceSheet={sheet}
                onClick={() => navigate(`/balance-sheets/${sheet.year}`)}
                badgeText={
                  !hasNetWorthData && latestYear === sheet.year
                    ? "Start here"
                    : undefined
                }
                badgeLevel="info"
              />
            ))}

            {/* Create New Card */}
            <Dialog
              open={createYearOpen}
              onOpenChange={(open) => {
                setCreateYearOpen(open);
                if (!open) setSelectedYear(undefined);
              }}
            >
              <DialogTrigger asChild>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-35 cursor-pointer hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
                  <PlusIcon className="h-8 w-8 mb-2" />
                  <span className="font-medium">New Balance Sheet</span>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Balance Sheet</DialogTitle>
                  <DialogDescription>
                    Select a year to begin tracking. Note: if the year is
                    missing, that means you already have a balance sheet for it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {createError && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                      {createError instanceof Error
                        ? createError.message
                        : String(createError)}
                    </div>
                  )}

                  <div className="space-y-2">
                    <YearSelector
                      existingYears={existingYears}
                      value={selectedYear}
                      onChange={setSelectedYear}
                      disabled={createLoading}
                    />
                  </div>

                  <Button
                    onClick={handleCreateSheet}
                    className="w-full"
                    disabled={!selectedYear || createLoading}
                  >
                    {createLoading && (
                      <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                    )}
                    {createLoading ? "Creating..." : "Create Balance Sheet"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </section>
  );
}
