import { api } from "@/lib/api";
import { getRetirementYearFromDateString } from "@/lib/dates";
import { queryClient } from "@/lib/react-query";
import type {
  RetirementPlan,
  RetirementPlanProjection,
  ReturnScenario,
} from "@/lib/types/retirement";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";

export const RETIREMENT_KEYS = {
  all: ["retirement"] as const,
  projection: (inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
    targetRetirementYear: number | undefined;
    inflationRate: number;
  }) =>
    [
      ...RETIREMENT_KEYS.all,
      "projection",
      inputs.startingNetWorth,
      inputs.monthlyContribution,
      inputs.expectedMonthlyExpenses,
      inputs.returnScenario,
      inputs.targetRetirementYear,
      inputs.inflationRate,
    ] as const,
  scenarioProjection: (
    planId: string,
    inputs: {
      startingNetWorth: number;
      monthlyContribution: number;
      expectedMonthlyExpenses: number;
      returnScenario: ReturnScenario;
      targetRetirementYear: number | undefined;
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
      inputs.targetRetirementYear,
      inputs.inflationRate,
    ] as const,
  planProjections: (planId: string) =>
    [...RETIREMENT_KEYS.all, "plan-projections", planId] as const,
};

export const RETIREMENT_PLAN_KEYS = {
  all: ["retirementPlans"] as const,
  list: () => [...RETIREMENT_PLAN_KEYS.all, "list"] as const,
};

export interface RetirementPlanInput {
  name: string;
  targetRetirementYear: number | null;
  startingNetWorth: number;
  monthlyContribution: number;
  expectedMonthlyExpenses: number;
  returnScenario: ReturnScenario;
  inflationRate: number;
}

export function useRetirementProjection(
  inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
    targetRetirementYear: number | undefined;
    inflationRate: number;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: RETIREMENT_KEYS.projection({
      startingNetWorth: inputs.startingNetWorth,
      monthlyContribution: inputs.monthlyContribution,
      expectedMonthlyExpenses: inputs.expectedMonthlyExpenses,
      returnScenario: inputs.returnScenario,
      targetRetirementYear: inputs.targetRetirementYear,
      inflationRate: inputs.inflationRate,
    }),
    queryFn: () =>
      api.calculateRetirementProjection(
        inputs.startingNetWorth,
        inputs.monthlyContribution,
        inputs.expectedMonthlyExpenses,
        inputs.returnScenario,
        inputs.inflationRate,
        inputs.targetRetirementYear,
      ),
    enabled: options?.enabled,
  });
}

export function useRetirementScenarioProjections(
  plans: RetirementPlan[] | undefined,
) {
  return useQueries({
    queries: (plans ?? []).map((plan) => {
      const targetRetirementYear = getRetirementYearFromDateString(
        plan.targetRetirementDate,
      );
      return {
        queryKey: RETIREMENT_KEYS.scenarioProjection(plan.id, {
          startingNetWorth: plan.startingNetWorth,
          monthlyContribution: plan.monthlyContribution,
          expectedMonthlyExpenses: plan.expectedMonthlyExpenses,
          returnScenario: plan.returnScenario,
          targetRetirementYear,
          inflationRate: plan.inflationRate,
        }),
        queryFn: () =>
          api.calculateRetirementProjection(
            plan.startingNetWorth,
            plan.monthlyContribution,
            plan.expectedMonthlyExpenses,
            plan.returnScenario,
            plan.inflationRate,
            targetRetirementYear,
          ),
        enabled: Boolean(plans?.length),
      };
    }),
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

export function useRetirementPlans() {
  return useQuery({
    queryKey: RETIREMENT_PLAN_KEYS.list(),
    queryFn: () => api.getRetirementPlans(),
  });
}

export function useCreateRetirementPlan() {
  return useMutation({
    mutationFn: (input: RetirementPlanInput): Promise<RetirementPlan> =>
      api.createRetirementPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETIREMENT_PLAN_KEYS.list() });
    },
  });
}

export function useDeleteRetirementPlan() {
  return useMutation({
    mutationFn: (id: string): Promise<void> => api.deleteRetirementPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETIREMENT_PLAN_KEYS.list() });
    },
  });
}
