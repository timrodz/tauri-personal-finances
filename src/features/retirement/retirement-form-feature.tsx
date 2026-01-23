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
import { RetirementProjectionChart } from "@/components/charts/retirement-projection-chart";
import { useLatestNetWorth } from "@/hooks/use-net-worth";
import {
  useRetirementPlanProjections,
  useRetirementProjection,
  useRetirementScenarioProjections,
} from "@/hooks/use-retirement";
import { useRetirementPlans } from "@/hooks/use-retirement-plans";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency-formatting";
import { getRetirementProjectionChartData } from "@/lib/charts";
import { RetirementPlan, ReturnScenario } from "@/lib/types";
import {
  getEarliestScenarioIds,
  getHighestIncomeScenarioIds,
} from "@/features/retirement/lib/scenario-comparison";
import {
  formatNumberForInput,
  validateRetirementInputs,
} from "@/features/retirement/lib/validation";
import {
  getProjectionErrorKind,
  getProjectionStatus,
} from "@/features/retirement/lib/projection";
import {
  getScenarioLimitMessage,
  isScenarioLimitReached,
} from "@/features/retirement/lib/scenarios";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [inflationRate, setInflationRate] = useState("0");
  const [returnScenario, setReturnScenario] =
    useState<ReturnScenario>("moderate");
  const [hasEditedStartingNetWorth, setHasEditedStartingNetWorth] =
    useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);

  const homeCurrency = settings?.homeCurrency ?? "USD";
  const latestNetWorthMissing =
    !latestNetWorthLoading && !latestNetWorthError && latestNetWorth === null;
  const parsedStartingNetWorth = Number(startingNetWorth);
  const parsedMonthlyContribution = Number(monthlyContribution);
  const parsedExpectedMonthlyExpenses = Number(expectedMonthlyExpenses);
  const inflationRateInput = inflationRate.trim();
  const parsedInflationRatePercent = inflationRateInput
    ? Number(inflationRateInput)
    : 0;
  const inflationRateValid =
    !inflationRateInput ||
    (Number.isFinite(parsedInflationRatePercent) &&
      parsedInflationRatePercent >= 0 &&
      parsedInflationRatePercent <= 15);
  const parsedInflationRate = inflationRateValid
    ? parsedInflationRatePercent / 100
    : 0;
  const canCalculateProjection =
    Number.isFinite(parsedStartingNetWorth) &&
    parsedStartingNetWorth > 0 &&
    Number.isFinite(parsedMonthlyContribution) &&
    parsedMonthlyContribution > 0 &&
    Number.isFinite(parsedExpectedMonthlyExpenses) &&
    parsedExpectedMonthlyExpenses > 0 &&
    inflationRateValid;

  const projectionQuery = useRetirementProjection(
    {
      startingNetWorth: parsedStartingNetWorth,
      monthlyContribution: parsedMonthlyContribution,
      expectedMonthlyExpenses: parsedExpectedMonthlyExpenses,
      returnScenario,
      targetRetirementDate: targetRetirementDate || null,
      inflationRate: parsedInflationRate,
    },
    { enabled: canCalculateProjection },
  );
  const {
    data: savedPlans,
    isLoading: savedPlansLoading,
    isError: savedPlansError,
    error: savedPlansErrorData,
    createPlan,
    deletePlan,
  } = useRetirementPlans();
  const scenarioProjectionQueries =
    useRetirementScenarioProjections(savedPlans);

  const [chartPlanId, setChartPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (savedPlans && savedPlans.length > 0 && !chartPlanId) {
      setChartPlanId(savedPlans[0].id);
    }
    if (chartPlanId && savedPlans && !savedPlans.some((p) => p.id === chartPlanId)) {
      setChartPlanId(savedPlans[0]?.id ?? null);
    }
    if (loadedPlanId && savedPlans && !savedPlans.some((p) => p.id === loadedPlanId)) {
      setLoadedPlanId(null);
    }
  }, [savedPlans, chartPlanId, loadedPlanId]);

  const chartPlan = savedPlans?.find((p) => p.id === chartPlanId) ?? null;
  const chartPlanProjectionQuery = scenarioProjectionQueries.find(
    (_, index) => savedPlans?.[index]?.id === chartPlanId,
  );

  const {
    data: chartProjectionDataPoints,
    isLoading: chartProjectionLoading,
  } = useRetirementPlanProjections(chartPlanId, {
    enabled: Boolean(chartPlanId),
  });

  const chartData = useMemo(
    () =>
      getRetirementProjectionChartData(chartProjectionDataPoints, {
        projectedRetirementDate:
          chartPlanProjectionQuery?.data?.projectedRetirementDate ?? null,
      }),
    [chartProjectionDataPoints, chartPlanProjectionQuery?.data?.projectedRetirementDate],
  );

  const scenarioRows =
    savedPlans?.map((plan, index) => {
      const projectionQuery = scenarioProjectionQueries[index];

      return {
        plan,
        projection: projectionQuery?.data ?? null,
        isLoading: projectionQuery?.isLoading ?? false,
        isError: projectionQuery?.isError ?? false,
        error: projectionQuery?.error ?? null,
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
      inflationRate,
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
      inflationRate,
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
        inflationRate: parsedInflationRate,
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

  const handleLoadPlan = (plan: RetirementPlan) => {
    setPlanName(plan.name);
    setTargetRetirementDate(plan.targetRetirementDate ?? "");
    setStartingNetWorth(formatNumberForInput(plan.startingNetWorth));
    setMonthlyContribution(formatNumberForInput(plan.monthlyContribution));
    setExpectedMonthlyExpenses(
      formatNumberForInput(plan.expectedMonthlyExpenses),
    );
    setInflationRate(formatNumberForInput(plan.inflationRate * 100));
    setReturnScenario(plan.returnScenario);
    setHasEditedStartingNetWorth(true);
    setErrors([]);
    setSaveNotice(null);
    setLoadedPlanId(plan.id);
    setChartPlanId(plan.id);
  };

  const projectedDateLabel = projectionQuery.data?.projectedRetirementDate
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(
        new Date(`${projectionQuery.data.projectedRetirementDate}T00:00:00`),
      )
    : projectionQuery.data
      ? "Already achievable"
      : "—";

  const targetDateLabel = targetRetirementDate
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(`${targetRetirementDate}T00:00:00`))
    : null;
  const projectionModeLabel = targetRetirementDate
    ? "Target Date"
    : "Earliest Possible";
  const projectionModeHeader = targetRetirementDate
    ? `Projections for ${targetDateLabel ?? "selected date"}`
    : `Earliest Retirement: ${projectedDateLabel}`;

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
  const projectionErrorKind = projectionQuery.isError
    ? getProjectionErrorKind(projectionQuery.error)
    : null;
  const projectionErrorMessage =
    projectionErrorKind === "notAchievable"
      ? "Retirement is not achievable with the current inputs. Try adjusting your savings or expenses."
      : projectionQuery.isError
        ? "Unable to calculate a projection right now."
        : null;
  const projectionErrorTone =
    projectionErrorKind === "notAchievable" ? "text-amber-600" : "text-destructive";

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
                {latestNetWorthMissing && (
                  <p className="text-xs text-muted-foreground">
                    Enter starting net worth manually.
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
              <div className="space-y-2">
                <Label htmlFor="inflation-rate">Inflation rate (%)</Label>
                <Input
                  id="inflation-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="15"
                  step="0.1"
                  placeholder="0"
                  value={inflationRate}
                  onChange={(event) => setInflationRate(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Use 0% to ignore inflation.
                </p>
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
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
              Calculating your projection...
            </div>
          )}

          {!projectionQuery.isLoading && projectionErrorMessage && (
            <div className={`rounded-md border border-border/60 bg-muted/30 p-4 text-sm ${projectionErrorTone}`}>
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

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Net worth growth projection</CardTitle>
          <CardDescription>
            {chartPlan
              ? `Projected growth for "${chartPlan.name}" scenario`
              : "Save a scenario to view your projected net worth growth over time."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!chartPlanId && !savedPlansLoading && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Save a retirement scenario to see your projected net worth growth.
            </div>
          )}
          {chartPlanId && (
            <RetirementProjectionChart
              isLoading={chartProjectionLoading}
              chartData={chartData}
              homeCurrency={homeCurrency}
            />
          )}
          {chartPlan && chartPlanProjectionQuery?.data?.projectedRetirementDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              The green marker indicates your projected retirement date (
              {new Intl.DateTimeFormat(undefined, {
                year: "numeric",
              }).format(
                new Date(chartPlanProjectionQuery.data.projectedRetirementDate),
              )}
              ).
            </p>
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
              {scenarioRows.some((row) => row.isError) && (
                <div className="text-xs text-amber-600">
                  One or more scenarios could not be calculated.
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
                    const isLoaded = loadedPlanId === row.plan.id;
                    const isEarliest = earliestScenarioIds.has(row.plan.id);
                    const isHighestIncome = highestIncomeScenarioIds.has(
                      row.plan.id,
                    );
                    const scenarioErrorKind = getProjectionErrorKind(row.error);
                    const scenarioErrorLabel =
                      scenarioErrorKind === "notAchievable"
                        ? "Not achievable"
                        : "Unavailable";

                    return (
                      <TableRow
                        key={row.plan.id}
                        className={`cursor-pointer transition-colors ${
                          isLoaded ? "bg-sky-50" : "hover:bg-muted/40"
                        }`}
                        onClick={() => handleLoadPlan(row.plan)}
                      >
                        <TableCell className="max-w-[220px] whitespace-normal">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">
                                {row.plan.name}
                              </span>
                              {isLoaded && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                  Loaded
                                </span>
                              )}
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
                          {row.isError && (
                            <span className="text-xs text-amber-600">
                              {scenarioErrorLabel}
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {formatScenarioDate(
                                row.projection.projectedRetirementDate,
                              )}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && !row.isError && (
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
                          {row.isError && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                          {!row.isLoading && row.projection && (
                            <span>
                              {row.projection.yearsToRetirement.toFixed(1)}
                            </span>
                          )}
                          {!row.isLoading && !row.projection && !row.isError && (
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
                          {row.isError && (
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
                          {!row.isLoading && !row.projection && !row.isError && (
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
                          {row.isError && (
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
                          {!row.isLoading && !row.projection && !row.isError && (
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
                            onClick={(event) => {
                              event.stopPropagation();
                              deletePlan.mutate(row.plan.id);
                            }}
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
    </div>
  );
}
