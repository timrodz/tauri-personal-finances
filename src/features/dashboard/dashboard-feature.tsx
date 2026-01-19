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
import { AccountsListFeature } from "@/features/accounts-list/accounts-list";
import { UserSettingsFormFeature } from "@/features/user-settings-form/user-settings-form-feature";
import { useBalanceSheets, useCreateBalanceSheet } from "@/lib/queries";
import { UserSettings } from "@/lib/types";
import { Plus, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  settings: UserSettings;
  onSettingsUpdated: () => void;
}

export function DashboardFeature({
  settings,
  onSettingsUpdated,
}: DashboardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createYearOpen, setCreateYearOpen] = useState(false);
  const navigate = useNavigate();

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

  const [selectedYear, setSelectedYear] = useState<number | undefined>();

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

  const existingYears = balanceSheets?.map((bs) => bs.year) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b pt-4">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Hello, {settings.name}
            </span>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SettingsIcon className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Update your personal preferences.
                  </DialogDescription>
                </DialogHeader>
                <UserSettingsFormFeature
                  onComplete={() => {
                    onSettingsUpdated();
                    setSettingsOpen(false);
                  }}
                  initialValues={{
                    name: settings.name,
                    currency: settings.homeCurrency,
                    theme: settings.theme,
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Balance Sheets Section */}
        <section className="mb-12">
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
                      <span className="font-medium">New Year</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Balance Sheet</DialogTitle>
                      <DialogDescription>
                        Select a year to begin tracking.
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

        {/* Net Worth Teaser (Future) */}
        {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">
              Net Worth
            </h3>
            <p className="text-2xl font-bold mt-2">
              $0.00 {settings.homeCurrency}
            </p>
          </div>
        </div> */}

        <section className="mt-12">
          <AccountsListFeature homeCurrency={settings.homeCurrency} />
        </section>
      </main>
    </div>
  );
}
