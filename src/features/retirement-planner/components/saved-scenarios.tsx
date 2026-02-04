import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteRetirementPlan,
  useRetirementScenarioProjections,
} from "@/hooks/use-retirement";
import { SCENARIO_LIMIT } from "@/lib/constants/retirement";
import {
  getEarliestScenarioIds,
  getHighestIncomeScenarioIds,
} from "@/lib/retirement";
import type { RetirementPlan } from "@/lib/types/retirement";
import { RefreshCwIcon } from "lucide-react";
import { ScenarioTableRow } from "./scenario-table-row";

interface SavedScenariosProps {
  savedPlansLoading: boolean;
  savedPlans: RetirementPlan[] | undefined;
  savedPlansError: boolean;
  savedPlansErrorData: Error | null;
  loadedPlanId: string | null;
  homeCurrency: string;
  onLoadPlan: (plan: RetirementPlan) => void;
}

export function SavedScenarios({
  savedPlansLoading,
  savedPlans,
  savedPlansError,
  savedPlansErrorData,
  loadedPlanId,
  homeCurrency,
  onLoadPlan,
}: SavedScenariosProps) {
  const {
    mutateAsync: deletePlan,
    isError,
    isPending,
    variables,
  } = useDeleteRetirementPlan();
  const scenarioProjectionQueries =
    useRetirementScenarioProjections(savedPlans);

  const scenarioRows =
    savedPlans?.map((plan, index) => {
      const queryResults = scenarioProjectionQueries[index];

      return {
        plan,
        projection: queryResults?.data ?? null,
        isLoading: queryResults?.isLoading ?? false,
        isError: queryResults?.isError ?? false,
        error: queryResults?.error ?? null,
      };
    }) ?? [];

  const scenarioSummaries = scenarioRows
    .filter((row) => row.projection)
    .map((row) => ({
      id: row.plan.id,
      yearsToRetirement: row.projection?.yearsToRetirement ?? 0,
      monthlyIncome3pct: row.projection?.monthlyIncome3pct ?? 0,
      monthlyIncome4pct: row.projection?.monthlyIncome4pct ?? 0,
    }));

  const earliestScenarioIds = getEarliestScenarioIds(scenarioSummaries);
  const highestIncomeScenarioIds =
    getHighestIncomeScenarioIds(scenarioSummaries);

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Saved scenarios</CardTitle>
        <CardDescription>
          Keep up to {SCENARIO_LIMIT} scenarios to compare your retirement
          options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedPlansLoading && (
          <div className="text-sm text-muted-foreground">
            Loading saved scenarios...
          </div>
        )}
        {!savedPlansLoading && savedPlans && savedPlans.length > 0 && (
          <div className="space-y-4">
            {scenarioRows.some((row) => row.isLoading) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                Calculating scenario projections...
              </div>
            )}
            {scenarioRows.some((row) => row.isError) && (
              <div className="text-xs text-amber-600">
                One or more scenarios could not be calculated.
              </div>
            )}
            {isError && (
              <div className="text-xs text-destructive">
                Unable to delete the scenario right now.
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Retirement date</TableHead>
                  <TableHead>Years remaining</TableHead>
                  <TableHead>Income (3%)</TableHead>
                  <TableHead>Income (4%)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarioRows.map((row) => {
                  const isDeleting = isPending && variables === row.plan.id;
                  const isLoaded = loadedPlanId === row.plan.id;
                  const isEarliest = earliestScenarioIds.has(row.plan.id);
                  const isHighestIncome = highestIncomeScenarioIds.has(
                    row.plan.id,
                  );

                  return (
                    <ScenarioTableRow
                      key={row.plan.id}
                      row={row}
                      isLoaded={isLoaded}
                      isEarliest={isEarliest}
                      isHighestIncome={isHighestIncome}
                      homeCurrency={homeCurrency}
                      onLoad={onLoadPlan}
                      onDelete={deletePlan}
                      isDeleting={isDeleting}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {!savedPlansLoading &&
          !savedPlansError &&
          (!savedPlans || savedPlans.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No scenarios saved yet. Save a scenario to compare later.
            </div>
          )}
        {savedPlansError && (
          <div className="text-sm text-destructive">
            {savedPlansErrorData instanceof Error
              ? savedPlansErrorData.message
              : "Unable to load saved scenarios right now."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
