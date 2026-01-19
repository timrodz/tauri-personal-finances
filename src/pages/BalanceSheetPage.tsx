import { Button } from "@/components/ui/button";
import { BalanceSheetFeature } from "@/features/balance-sheet/balance-sheet-feature";
import { useBalanceSheets, useUserSettings } from "@/lib/queries";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export function BalanceSheetPage() {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const {
    data: sheets,
    loading: sheetsLoading,
    error: sheetsError,
  } = useBalanceSheets();
  const { data: settings, loading: settingsLoading } = useUserSettings();

  const selectedYear = year ? parseInt(year, 10) : null;
  const balanceSheet = sheets?.find((s) => s.year === selectedYear);

  if (sheetsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (sheetsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Error: {sheetsError}</div>
      </div>
    );
  }

  if (!selectedYear || !balanceSheet || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <h2 className="text-2xl font-bold">Balance Sheet Not Found</h2>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {balanceSheet.year} Balance Sheet
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 w-full">
        <div className="mx-auto w-full max-w-[1920px]">
          <BalanceSheetFeature
            balanceSheet={balanceSheet}
            homeCurrency={settings.homeCurrency}
          />
        </div>
      </main>
    </div>
  );
}
