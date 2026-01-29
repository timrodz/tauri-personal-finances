import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { BalanceSheetFeature } from "@/features/balance-sheet/balance-sheet-feature";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useBalanceSheets } from "@/hooks/use-balance-sheets";
import { useNetWorthHistory } from "@/hooks/use-net-worth";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export function BalanceSheetPage() {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const {
    data: sheets,
    loading: sheetsLoading,
    error: sheetsError,
  } = useBalanceSheets();
  const { data: netWorthHistory, isLoading: netWorthLoading } =
    useNetWorthHistory();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();

  const selectedYear = year ? parseInt(year, 10) : null;
  const balanceSheet = sheets?.find((s) => s.year === selectedYear);
  const latestYear =
    sheets && sheets.length > 0
      ? Math.max(...sheets.map((sheet) => sheet.year))
      : null;
  const hasNetWorthData = (netWorthHistory?.length ?? 0) > 0;
  const isMostRecentSheet = selectedYear !== null && selectedYear === latestYear;
  const showOnboardingHint =
    !netWorthLoading && !hasNetWorthData && isMostRecentSheet;

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
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="page">
      <Header
        title={`${balanceSheet.year} Balance Sheet`}
        navigateBack="/balance-sheets"
      />

      <main>
        <BalanceSheetFeature
          balanceSheet={balanceSheet}
          homeCurrency={settings.homeCurrency}
          showOnboardingHint={showOnboardingHint}
        />
      </main>
    </div>
  );
}
