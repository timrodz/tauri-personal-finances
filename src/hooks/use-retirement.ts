import { api } from "@/lib/api";
import { RetirementPlan, ReturnScenario } from "@/lib/types";
import { useQueries, useQuery } from "@tanstack/react-query";

export const RETIREMENT_KEYS = {
  all: ["retirement"] as const,
  projection: (inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
  }) =>
    [
      ...RETIREMENT_KEYS.all,
      "projection",
      inputs.startingNetWorth,
      inputs.monthlyContribution,
      inputs.expectedMonthlyExpenses,
      inputs.returnScenario,
    ] as const,
  scenarioProjection: (
    planId: string,
    inputs: {
      startingNetWorth: number;
      monthlyContribution: number;
      expectedMonthlyExpenses: number;
      returnScenario: ReturnScenario;
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
    ] as const,
};

export function useRetirementProjection(
  inputs: {
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
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
      }),
      queryFn: () =>
        api.calculateRetirementProjection(
          plan.startingNetWorth,
          plan.monthlyContribution,
          plan.expectedMonthlyExpenses,
          plan.returnScenario,
        ),
      enabled: Boolean(plans?.length),
    })),
  });
}
