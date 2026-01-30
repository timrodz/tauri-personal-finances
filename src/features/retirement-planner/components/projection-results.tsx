import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/currency-formatting";
import { getProjectionStatus } from "@/lib/retirement";
import type { RetirementProjection } from "@/lib/types/retirement";
import { RefreshCwIcon } from "lucide-react";

interface ProjectionResultsProps {
  projectionQuery: {
    data: RetirementProjection | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
  projectionModeLabel: string;
  projectionModeHeader: string;
  projectedDateLabel: string;
  expectedMonthlyExpenses: number;
  hasInflationAdjustment: boolean;
  canCalculateProjection: boolean;
  projectionErrorMessage: string | null;
  projectionErrorTone: string;
  homeCurrency: string;
}

export function ProjectionResults({
  projectionQuery,
  projectionModeLabel,
  projectionModeHeader,
  projectedDateLabel,
  expectedMonthlyExpenses,
  hasInflationAdjustment,
  canCalculateProjection,
  projectionErrorMessage,
  projectionErrorTone,
  homeCurrency,
}: ProjectionResultsProps) {
  const comparisonExpenses = projectionQuery.data
    ? hasInflationAdjustment
      ? projectionQuery.data.inflationAdjustedExpenses
      : expectedMonthlyExpenses
    : expectedMonthlyExpenses;
  const expenseStatusLabel = hasInflationAdjustment
    ? "inflation-adjusted expenses"
    : "expected monthly expenses";

  const income3Status = projectionQuery.data
    ? getProjectionStatus(
        projectionQuery.data.monthlyIncome3pct,
        comparisonExpenses,
      )
    : "shortfall";
  const income4Status = projectionQuery.data
    ? getProjectionStatus(
        projectionQuery.data.monthlyIncome4pct,
        comparisonExpenses,
      )
    : "shortfall";

  const income3Class =
    income3Status === "onTrack" ? "text-emerald-600" : "text-amber-600";
  const income4Class =
    income4Status === "onTrack" ? "text-emerald-600" : "text-amber-600";

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Projection results</CardTitle>
        <CardDescription>
          Your retirement timeline and sustainable monthly income estimates.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {projectionModeLabel}
          </span>
          <span>{projectionModeHeader}</span>
        </div>
      </CardHeader>
      <CardContent>
        {projectionQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCwIcon className="size-4 animate-spin" />
            Calculating your projection...
          </div>
        )}

        {!projectionQuery.isLoading && projectionErrorMessage && (
          <div
            className={`rounded-md border border-border/60 bg-muted/30 p-4 text-sm ${projectionErrorTone}`}
          >
            {projectionErrorMessage}
          </div>
        )}

        {!projectionQuery.isLoading && projectionQuery.data && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Projected retirement
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {projectedDateLabel}
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Years until retirement
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {projectionQuery.data.yearsToRetirement.toFixed(1)}
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Projected net worth
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatCurrencyCompact(
                    projectionQuery.data.finalNetWorth,
                    homeCurrency,
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sustainable income (3% rule)
                </p>
                <p className={`mt-2 text-lg font-semibold ${income3Class}`}>
                  {formatCurrency(
                    projectionQuery.data.monthlyIncome3pct,
                    homeCurrency,
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {income3Status === "onTrack"
                    ? `Meets ${expenseStatusLabel}.`
                    : `Falls short of ${expenseStatusLabel}.`}
                </p>
              </div>
              <div className="rounded-md border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sustainable income (4% rule)
                </p>
                <p className={`mt-2 text-lg font-semibold ${income4Class}`}>
                  {formatCurrency(
                    projectionQuery.data.monthlyIncome4pct,
                    homeCurrency,
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {income4Status === "onTrack"
                    ? `Meets ${expenseStatusLabel}.`
                    : `Falls short of ${expenseStatusLabel}.`}
                </p>
              </div>
            </div>
            {hasInflationAdjustment && projectionQuery.data && (
              <div className="rounded-md border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Expenses at retirement
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Current expenses</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(expectedMonthlyExpenses, homeCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Inflation-adjusted expenses at retirement</span>
                    <span className="font-semibold text-amber-700">
                      {formatCurrency(
                        projectionQuery.data.inflationAdjustedExpenses,
                        homeCurrency,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!projectionQuery.isLoading &&
          !projectionQuery.data &&
          canCalculateProjection &&
          !projectionQuery.isError && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Enter updated assumptions to refresh your projection results.
            </div>
          )}

        {!projectionQuery.isLoading && !canCalculateProjection && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            Fill in the required values to see your retirement projection.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
