import { useRetirementProjection } from "@/hooks/use-retirement";
import { useRetirementPlans } from "@/hooks/use-retirement-plans";
import { useUserSettings } from "@/hooks/use-user-settings";
import { getProjectionErrorKind } from "@/lib/retirement";
import type {
  RetirementPlan,
  retirementProjectionFormValues,
} from "@/lib/types/retirement";
import { useEffect, useMemo, useState } from "react";
import { InputForm } from "./components/input-form";
import { NetWorthGrowthProjection } from "./components/net-worth-growth-projection";
import { ProjectionResults } from "./components/projection-results";
import { SavedScenarios } from "./components/saved-scenarios";

export function RetirementPlannerFeature() {
  const { data: settings } = useUserSettings();
  const [projectionInputs, setProjectionInputs] =
    useState<retirementProjectionFormValues | null>(null);
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [chartPlanId, setChartPlanId] = useState<string | null>(null);

  const homeCurrency = settings?.homeCurrency;

  // Queries
  const projectionQuery = useRetirementProjection(
    {
      startingNetWorth: projectionInputs?.startingNetWorth ?? 0,
      monthlyContribution: projectionInputs?.monthlyContribution ?? 0,
      expectedMonthlyExpenses: projectionInputs?.expectedMonthlyExpenses ?? 0,
      returnScenario: projectionInputs?.returnScenario ?? "moderate",
      targetRetirementYear: projectionInputs?.targetRetirementYear,
      inflationRate: projectionInputs?.inflationRate ?? 0,
    },
    { enabled: Boolean(projectionInputs) },
  );

  const {
    data: savedPlans,
    isLoading: savedPlansLoading,
    isError: savedPlansError,
    error: savedPlansErrorData,
    deletePlan,
  } = useRetirementPlans();

  // Effects for Plan Loading / Chart Selection
  useEffect(() => {
    if (savedPlans && savedPlans.length > 0 && !chartPlanId) {
      setChartPlanId(savedPlans[0].id);
    }
    if (
      chartPlanId &&
      savedPlans &&
      !savedPlans.some((p) => p.id === chartPlanId)
    ) {
      setChartPlanId(savedPlans[0]?.id ?? null);
    }
    if (
      loadedPlanId &&
      savedPlans &&
      !savedPlans.some((p) => p.id === loadedPlanId)
    ) {
      setLoadedPlanId(null);
    }
  }, [savedPlans, chartPlanId, loadedPlanId]);

  // Handlers
  const handleLoadPlan = (plan: RetirementPlan) => {
    setLoadedPlanId(plan.id);
    setChartPlanId(plan.id);
  };

  const loadedPlan = useMemo(
    () => savedPlans?.find((p) => p.id === loadedPlanId) ?? null,
    [savedPlans, loadedPlanId],
  );
  const chartPlan = useMemo(
    () => savedPlans?.find((p) => p.id === chartPlanId) ?? null,
    [savedPlans, chartPlanId],
  );

  // Derived View State
  const projectedDateLabel = projectionQuery.data?.projectedRetirementDate
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(projectionQuery.data.projectedRetirementDate))
    : projectionQuery.data
      ? "Already achievable"
      : "—";

  const targetDateLabel = projectionInputs?.targetRetirementYear
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(`${projectionInputs.targetRetirementYear}T00:00:00`))
    : null;
  const projectionModeLabel = projectionInputs?.targetRetirementYear
    ? "Target Date"
    : "Earliest Possible";
  const projectionModeHeader = projectionInputs?.targetRetirementYear
    ? `Projections for ${targetDateLabel ?? "selected date"}`
    : `Earliest Retirement: ${projectedDateLabel}`;

  const hasInflationAdjustment =
    Boolean(projectionQuery.data) && (projectionInputs?.inflationRate ?? 0) > 0;

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
    projectionErrorKind === "notAchievable"
      ? "text-amber-600"
      : "text-destructive";

  if (!homeCurrency) {
    return null;
  }

  return (
    <div className="feature-container">
      <InputForm
        homeCurrency={homeCurrency}
        onProjectionValuesChange={setProjectionInputs}
        loadPlan={loadedPlan}
      />

      <ProjectionResults
        projectionQuery={projectionQuery}
        projectionModeLabel={projectionModeLabel}
        projectionModeHeader={projectionModeHeader}
        projectedDateLabel={projectedDateLabel}
        expectedMonthlyExpenses={projectionInputs?.expectedMonthlyExpenses ?? 0}
        hasInflationAdjustment={hasInflationAdjustment}
        canCalculateProjection={Boolean(projectionInputs)}
        projectionErrorMessage={projectionErrorMessage}
        projectionErrorTone={projectionErrorTone}
        homeCurrency={homeCurrency}
      />

      <NetWorthGrowthProjection
        chartPlanId={chartPlanId}
        savedPlansLoading={savedPlansLoading}
        homeCurrency={homeCurrency}
        chartPlan={chartPlan}
      />

      <SavedScenarios
        savedPlansLoading={savedPlansLoading}
        savedPlans={savedPlans}
        savedPlansError={savedPlansError}
        savedPlansErrorData={savedPlansErrorData}
        loadedPlanId={loadedPlanId}
        homeCurrency={homeCurrency}
        onLoadPlan={handleLoadPlan}
        deletePlan={deletePlan}
      />
    </div>
  );
}
