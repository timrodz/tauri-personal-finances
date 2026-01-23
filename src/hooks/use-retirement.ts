import { api } from "@/lib/api";
import { RetirementPlan, RetirementPlanProjection, ReturnScenario } from "@/lib/types";
import { useQueries, useQuery } from "@tanstack/react-query";

export const RETIREMENT_KEYS = {
  all: ["retirement"] as const,
  projection: (inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
    targetRetirementDate: string | null;
    inflationRate: number;
  }) =>
    [
      ...RETIREMENT_KEYS.all,
      "projection",
      inputs.startingNetWorth,
      inputs.monthlyContribution,
      inputs.expectedMonthlyExpenses,
      inputs.returnScenario,
      inputs.targetRetirementDate,
      inputs.inflationRate,
    ] as const,
  scenarioProjection: (
    planId: string,
    inputs: {
      startingNetWorth: number;
      monthlyContribution: number;
      expectedMonthlyExpenses: number;
      returnScenario: ReturnScenario;
      targetRetirementDate: string | null;
      inflationRate: number;
    },
  ) =>
    [
      ...RETIREMENT_KEYS.all,
      "scenario-projection",
      planId,
      inputs.startingNetWorth,
      inputs.monthlyContribution,
      inputs.expectedMonthlyExpenses,
      inputs.returnScenario,
      inputs.targetRetirementDate,
      inputs.inflationRate,
    ] as const,
  planProjections: (planId: string) =>
    [...RETIREMENT_KEYS.all, "plan-projections", planId] as const,
};

export function useRetirementProjection(
  inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
    targetRetirementDate: string | null;
    inflationRate: number;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: RETIREMENT_KEYS.projection(inputs),
    queryFn: () =>
      api.calculateRetirementProjection(
        inputs.startingNetWorth,
        inputs.monthlyContribution,
        inputs.expectedMonthlyExpenses,
        inputs.returnScenario,
        inputs.targetRetirementDate,
        inputs.inflationRate,
      ),
    enabled: options?.enabled,
  });
}

export function useRetirementScenarioProjections(
  plans: RetirementPlan[] | undefined,
) {
  return useQueries({
    queries: (plans ?? []).map((plan) => ({
      queryKey: RETIREMENT_KEYS.scenarioProjection(plan.id, {
        startingNetWorth: plan.startingNetWorth,
        monthlyContribution: plan.monthlyContribution,
        expectedMonthlyExpenses: plan.expectedMonthlyExpenses,
        returnScenario: plan.returnScenario,
        targetRetirementDate: plan.targetRetirementDate,
        inflationRate: plan.inflationRate,
      }),
      queryFn: () =>
        api.calculateRetirementProjection(
          plan.startingNetWorth,
          plan.monthlyContribution,
          plan.expectedMonthlyExpenses,
          plan.returnScenario,
          plan.targetRetirementDate,
          plan.inflationRate,
        ),
      enabled: Boolean(plans?.length),
    })),
  });
}

export function useRetirementPlanProjections(
  planId: string | null,
  options?: { enabled?: boolean },
): {
  data: RetirementPlanProjection[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: RETIREMENT_KEYS.planProjections(planId ?? ""),
    queryFn: () => api.getRetirementPlanProjections(planId!),
    enabled: Boolean(planId) && (options?.enabled ?? true),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
