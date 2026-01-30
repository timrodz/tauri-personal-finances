import z from "zod/v3";

export type ReturnScenario = "conservative" | "moderate" | "aggressive";

export interface RetirementPlan {
  id: string;
  name: string;
  targetRetirementDate: string | null;
  startingNetWorth: number;
  monthlyContribution: number;
  expectedMonthlyExpenses: number;
  returnScenario: ReturnScenario;
  inflationRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface RetirementProjection {
  projectedRetirementDate: string | null;
  yearsToRetirement: number;
  finalNetWorth: number;
  monthlyIncome3pct: number;
  monthlyIncome4pct: number;
  inflationAdjustedExpenses: number;
}

export interface RetirementPlanProjection {
  id: string;
  planId: string;
  year: number;
  month: number;
  projectedNetWorth: number;
  createdAt: string;
}

export type ProjectionStatus = "onTrack" | "shortfall";
export type ProjectionErrorKind = "notAchievable" | "unknown";

export interface ScenarioProjectionSummary {
  id: string;
  yearsToRetirement: number;
  monthlyIncome3pct: number;
  monthlyIncome4pct: number;
}

export interface RetirementFormInputs {
  planName: string;
  startingNetWorth: string;
  monthlyContribution: string;
  expectedMonthlyExpenses: string;
  inflationRate: string;
}

export const retirementProjectionFormSchema = z.object({
  planName: z
    .string()
    .min(1, "Plan name is required.")
    .max(50, "Plan name must be at most 50 characters."),
  targetRetirementYear: z.coerce.number().min(2026).optional(),
  startingNetWorth: z.coerce
    .number()
    .positive("Starting net worth must be greater than 0."),
  monthlyContribution: z.coerce
    .number()
    .positive("Monthly contribution must be greater than 0."),
  expectedMonthlyExpenses: z.coerce
    .number()
    .positive("Expected monthly expenses must be greater than 0."),
  inflationRate: z.coerce
    .number()
    .min(0)
    .max(15, "Inflation rate must be 0-15%."),
  returnScenario: z.enum(["conservative", "moderate", "aggressive"]),
});

export type retirementProjectionFormValues = z.infer<
  typeof retirementProjectionFormSchema
>;
