import { PageContainer } from "@/components/page-container";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { BalanceSheetFeature } from "@/features/balance-sheet/balance-sheet-feature";
import { useBalanceSheet } from "@/hooks/use-balance-sheets";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export function BalanceSheetPage() {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const selectedYear = year ? parseInt(year, 10) : null;
  const {
    data: balanceSheet,
    isLoading: sheetLoading,
    error: sheetError,
  } = useBalanceSheet(selectedYear);

  if (sheetLoading) {
    return null;
  }

  if (sheetError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">
          Error:{" "}
          {sheetError instanceof Error
            ? sheetError.message
            : String(sheetError)}
        </div>
      </div>
    );
  }

  if (!selectedYear || !balanceSheet) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <h2 className="text-2xl font-bold">Balance Sheet Not Found</h2>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeftIcon className="mr-2 size-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageTitle>Balance sheet - {year}</PageTitle>
      <BalanceSheetFeature balanceSheet={balanceSheet} />
    </PageContainer>
  );
}
