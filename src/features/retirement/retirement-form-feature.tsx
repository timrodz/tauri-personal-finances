import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLatestNetWorth } from "@/hooks/use-net-worth";
import {
  useRetirementProjection,
  useRetirementScenarioProjections,
} from "@/hooks/use-retirement";
import { useRetirementPlans } from "@/hooks/use-retirement-plans";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency-formatting";
import { ReturnScenario } from "@/lib/types";
import {
  getEarliestScenarioIds,
  getHighestIncomeScenarioIds,
} from "@/features/retirement/lib/scenario-comparison";
import {
  formatNumberForInput,
  validateRetirementInputs,
} from "@/features/retirement/lib/validation";
import { getProjectionStatus } from "@/features/retirement/lib/projection";
import {
  getScenarioLimitMessage,
  isScenarioLimitReached,
} from "@/features/retirement/lib/scenarios";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export function RetirementFormFeature() {
  const { data: settings } = useUserSettings();
  const {
    data: latestNetWorth,
    isLoading: latestNetWorthLoading,
    isError: latestNetWorthError,
  } = useLatestNetWorth();

  const [planName, setPlanName] = useState("");
  const [targetRetirementDate, setTargetRetirementDate] = useState("");
  const [startingNetWorth, setStartingNetWorth] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedMonthlyExpenses, setExpectedMonthlyExpenses] = useState("");
  const [returnScenario, setReturnScenario] =
    useState<ReturnScenario>("moderate");
  const [hasEditedStartingNetWorth, setHasEditedStartingNetWorth] =
    useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const homeCurrency = settings?.homeCurrency ?? "USD";
  const parsedStartingNetWorth = Number(startingNetWorth);
  const parsedMonthlyContribution = Number(monthlyContribution);
  const parsedExpectedMonthlyExpenses = Number(expectedMonthlyExpenses);
  const canCalculateProjection =
    Number.isFinite(parsedStartingNetWorth) &&
    parsedStartingNetWorth > 0 &&
    Number.isFinite(parsedMonthlyContribution) &&
    parsedMonthlyContribution > 0 &&
    Number.isFinite(parsedExpectedMonthlyExpenses) &&
    parsedExpectedMonthlyExpenses > 0;

  const projectionQuery = useRetirementProjection(
    {
      startingNetWorth: parsedStartingNetWorth,
      monthlyContribution: parsedMonthlyContribution,
      expectedMonthlyExpenses: parsedExpectedMonthlyExpenses,
      returnScenario,
    },
    { enabled: canCalculateProjection },
  );
  const {
    data: savedPlans,
    isLoading: savedPlansLoading,
    createPlan,
    deletePlan,
  } = useRetirementPlans();
  const scenarioProjectionQueries =
    useRetirementScenarioProjections(savedPlans);

  const scenarioRows =
    savedPlans?.map((plan, index) => {
      const projectionQuery = scenarioProjectionQueries[index];

      return {
        plan,
        projection: projectionQuery?.data ?? null,
        isLoading: projectionQuery?.isLoading ?? false,
        isError: projectionQuery?.isError ?? false,
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

  const scenarioCount = savedPlans?.length ?? 0;
  const scenarioLimitReached = isScenarioLimitReached(scenarioCount);
  const scenarioLimitMessage = getScenarioLimitMessage(scenarioCount);
  const saveDisabled =
    createPlan.isPending || savedPlansLoading || scenarioLimitReached;
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error" | "limit";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!hasEditedStartingNetWorth && latestNetWorth?.netWorth != null) {
      setStartingNetWorth(formatNumberForInput(latestNetWorth.netWorth));
    }
  }, [hasEditedStartingNetWorth, latestNetWorth]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validateRetirementInputs({
      planName,
      startingNetWorth,
      monthlyContribution,
      expectedMonthlyExpenses,
    });

    setErrors(validationErrors);
  };

  const handleSavePlan = async () => {
    if (scenarioLimitReached) {
      setSaveNotice({
        type: "limit",
        message: scenarioLimitMessage ?? "Scenario limit reached.",
      });
      return;
    }

    const validationErrors = validateRetirementInputs({
      planName,
      startingNetWorth,
      monthlyContribution,
      expectedMonthlyExpenses,
    });

    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      return;
    }

    setSaveNotice(null);

    try {
      await createPlan.mutateAsync({
        name: planName.trim(),
        targetRetirementDate: targetRetirementDate || null,
        startingNetWorth: parsedStartingNetWorth,
        monthlyContribution: parsedMonthlyContribution,
        expectedMonthlyExpenses: parsedExpectedMonthlyExpenses,
        returnScenario,
      });
      setSaveNotice({
        type: "success",
        message: "Scenario saved successfully.",
      });
    } catch (error) {
      setSaveNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the scenario right now.",
      });
    }
  };

  const projectedDateLabel = projectionQuery.data?.projectedRetirementDate
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(
        new Date(`${projectionQuery.data.projectedRetirementDate}T00:00:00`),
      )
    : "Already achievable";

  const formatScenarioDate = (projectedRetirementDate: string | null) => {
    if (!projectedRetirementDate) {
      return "Already achievable";
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(`${projectedRetirementDate}T00:00:00`));
  };

  const income3Status = projectionQuery.data
    ? getProjectionStatus(
        projectionQuery.data.monthlyIncome3pct,
        parsedExpectedMonthlyExpenses,
      )
    : "shortfall";
  const income4Status = projectionQuery.data
    ? getProjectionStatus(
        projectionQuery.data.monthlyIncome4pct,
        parsedExpectedMonthlyExpenses,
      )
    : "shortfall";

  const income3Class =
    income3Status === "onTrack" ? "text-emerald-600" : "text-amber-600";
  const income4Class =
    income4Status === "onTrack" ? "text-emerald-600" : "text-amber-600";

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Build your retirement plan</CardTitle>
          <CardDescription>
            Enter your savings assumptions to preview how quickly you can reach
            your retirement goal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Please fix the following:</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan name</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g. Base Scenario"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-date">
                  Target retirement date (optional)
                </Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetRetirementDate}
                  onChange={(event) =>
                    setTargetRetirementDate(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="starting-net-worth">
                  Starting net worth ({homeCurrency})
                </Label>
                <div className="relative">
                  <Input
                    id="starting-net-worth"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={startingNetWorth}
                    onChange={(event) => {
                      setStartingNetWorth(event.target.value);
                      setHasEditedStartingNetWorth(true);
                    }}
                    required
                  />
                  {latestNetWorthLoading && (
                    <RefreshCwIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {latestNetWorth && !hasEditedStartingNetWorth && (
                  <p className="text-xs text-muted-foreground">
                    Pre-filled from your latest net worth snapshot.
                  </p>
                )}
                {latestNetWorthError && (
                  <p className="text-xs text-muted-foreground">
                    Unable to fetch the latest net worth right now.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-contribution">
                  Monthly contribution ({homeCurrency})
                </Label>
                <Input
                  id="monthly-contribution"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={monthlyContribution}
                  onChange={(event) => setMonthlyContribution(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-expenses">
                  Expected monthly expenses ({homeCurrency})
                </Label>
                <Input
                  id="monthly-expenses"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={expectedMonthlyExpenses}
                  onChange={(event) =>
                    setExpectedMonthlyExpenses(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Return scenario</Label>
                <Select
                  value={returnScenario}
                  onValueChange={(value: ReturnScenario) =>
                    setReturnScenario(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (4%)</SelectItem>
                    <SelectItem value="moderate">Moderate (7%)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (10%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button type="submit" className="w-full">
                Generate projection
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleSavePlan}
                disabled={saveDisabled}
              >
                {createPlan.isPending ? "Saving scenario..." : "Save scenario"}
              </Button>
            </div>
            {scenarioLimitReached && scenarioLimitMessage && (
              <p className="text-xs text-amber-600">{scenarioLimitMessage}</p>
            )}
            {saveNotice && (
              <p
                className={`text-xs ${
                  saveNotice.type === "success"
                    ? "text-emerald-600"
                    : saveNotice.type === "error"
                      ? "text-destructive"
                      : "text-amber-600"
                }`}
              >
                {saveNotice.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Projection results</CardTitle>
          <CardDescription>
            Your retirement timeline and sustainable monthly income estimates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectionQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
              Calculating your projection...
            </div>
          )}

          {!projectionQuery.isLoading && projectionQuery.data && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Projected retirement
                  </p>
                  <p className="mt-2 text-lg font-semibold">{projectedDateLabel}</p>
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
                      ? "Meets expected monthly expenses."
                      : "Falls short of expected expenses."}
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
                      ? "Meets expected monthly expenses."
                      : "Falls short of expected expenses."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!projectionQuery.isLoading &&
            !projectionQuery.data &&
            canCalculateProjection && (
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

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Saved scenarios</CardTitle>
          <CardDescription>
            Keep up to three scenarios to compare your retirement options.
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
              {deletePlan.isError && (
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
                    const isDeleting =
                      deletePlan.isPending &&
                      deletePlan.variables === row.plan.id;
                    const isEarliest = earliestScenarioIds.has(row.plan.id);
                    const isHighestIncome = highestIncomeScenarioIds.has(
                      row.plan.id,
                    );

                    return (
                      <TableRow key={row.plan.id}>
                        <TableCell className="max-w-[220px] whitespace-normal">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">
                                {row.plan.name}
                              </span>
                              {isEarliest && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  Earliest
                                </span>
                              )}
                              {isHighestIncome && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                  Top income
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {row.plan.returnScenario
                                .charAt(0)
                                .toUpperCase() +
                                row.plan.returnScenario.slice(1)}{" "}
                              ·{" "}
                              {formatCurrencyCompact(
                                row.plan.startingNetWorth,
                                homeCurrency,
                              )}{" "}
                              starting
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.isLoading && (
                            <span className="text-xs text-muted-foreground">
                              Calculating...
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {formatScenarioDate(
                                row.projection.projectedRetirementDate,
                              )}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isLoading && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {row.projection.yearsToRetirement.toFixed(1)}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isLoading && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {formatCurrency(
                                row.projection.monthlyIncome3pct,
                                homeCurrency,
                              )}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isLoading && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {formatCurrency(
                                row.projection.monthlyIncome4pct,
                                homeCurrency,
                              )}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deletePlan.mutate(row.plan.id)}
                            disabled={deletePlan.isPending}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            {isDeleting ? "Removing..." : "Delete"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!savedPlansLoading && (!savedPlans || savedPlans.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No scenarios saved yet. Save a scenario to compare later.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
