import type {
  RetirementPlan,
  RetirementProjection,
  ReturnScenario,
} from "./types";

const scenario: ReturnScenario = "moderate";

const plan: RetirementPlan = {
  id: "plan-1",
  name: "Baseline",
  targetRetirementDate: "2045-01-01",
  startingNetWorth: 250000,
  monthlyContribution: 1500,
  expectedMonthlyExpenses: 4000,
  returnScenario: scenario,
  inflationRate: 2.5,
  createdAt: "2026-01-22T00:00:00Z",
  updatedAt: "2026-01-22T00:00:00Z",
};

const projection: RetirementProjection = {
  projectedRetirementDate: "2045-01-01",
  yearsToRetirement: 19.5,
  finalNetWorth: 1200000,
  monthlyIncome3pct: 3000,
  monthlyIncome4pct: 4000,
  inflationAdjustedExpenses: 5200,
};

void plan;
void projection;
void scenario;
