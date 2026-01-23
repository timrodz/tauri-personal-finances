import { api } from "@/lib/api";
import { ReturnScenario, RetirementPlan } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const RETIREMENT_PLAN_KEYS = {
  all: ["retirementPlans"] as const,
  list: () => [...RETIREMENT_PLAN_KEYS.all, "list"] as const,
};

export interface RetirementPlanInput {
  name: string;
  targetRetirementDate: string | null;
  startingNetWorth: number;
  monthlyContribution: number;
  expectedMonthlyExpenses: number;
  returnScenario: ReturnScenario;
  inflationRate: number;
}

export function useRetirementPlans() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: RETIREMENT_PLAN_KEYS.list(),
    queryFn: () => api.getRetirementPlans(),
  });

  const createPlan = useMutation({
    mutationFn: (input: RetirementPlanInput): Promise<RetirementPlan> =>
      api.createRetirementPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETIREMENT_PLAN_KEYS.list() });
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: string): Promise<void> => api.deleteRetirementPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETIREMENT_PLAN_KEYS.list() });
    },
  });

  return {
    ...query,
    createPlan,
    deletePlan,
  };
}
