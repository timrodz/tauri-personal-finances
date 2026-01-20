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
import { YearSelector } from "@/components/year-selector";
import { useBalanceSheets, useCreateBalanceSheet } from "@/lib/queries";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SectionBalanceSheets() {
  const navigate = useNavigate();
  const [createYearOpen, setCreateYearOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const {
    data: balanceSheets,
    loading: sheetsLoading,
    refetch: refetchSheets,
  } = useBalanceSheets();

  const {
    mutate: createSheet,
    loading: createLoading,
    error: createError,
  } = useCreateBalanceSheet();

  const existingYears = balanceSheets?.map((bs) => bs.year) ?? [];

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
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[140px] cursor-pointer hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
                  <Plus className="h-8 w-8 mb-2" />
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
                      {createError}
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
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
