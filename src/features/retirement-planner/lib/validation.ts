export interface RetirementFormInputs {
  planName: string;
  startingNetWorth: string;
  monthlyContribution: string;
  expectedMonthlyExpenses: string;
  inflationRate: string;
}

export function validateRetirementInputs(
  inputs: RetirementFormInputs,
): string[] {
  const errors: string[] = [];

  if (!inputs.planName.trim()) {
    errors.push("Plan name is required.");
  }

  const startingNetWorth = Number(inputs.startingNetWorth);
  if (!Number.isFinite(startingNetWorth) || startingNetWorth <= 0) {
    errors.push("Starting net worth must be a positive amount.");
  }

  const monthlyContribution = Number(inputs.monthlyContribution);
  if (!Number.isFinite(monthlyContribution) || monthlyContribution <= 0) {
    errors.push("Monthly contribution must be a positive amount.");
  }

  const expectedMonthlyExpenses = Number(inputs.expectedMonthlyExpenses);
  if (
    !Number.isFinite(expectedMonthlyExpenses) ||
    expectedMonthlyExpenses <= 0
  ) {
    errors.push("Expected monthly expenses must be a positive amount.");
  }

  const inflationRateInput = inputs.inflationRate.trim();
  if (inflationRateInput) {
    const inflationRate = Number(inflationRateInput);
    if (
      !Number.isFinite(inflationRate) ||
      inflationRate < 0 ||
      inflationRate > 15
    ) {
      errors.push("Inflation rate must be between 0% and 15%.");
    }
  }

  return errors;
}

export function formatNumberForInput(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return String(Math.round(value * 100) / 100);
}
