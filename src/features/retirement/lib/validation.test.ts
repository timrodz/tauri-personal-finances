import {
  formatNumberForInput,
  validateRetirementInputs,
} from "./validation";

const validErrors = validateRetirementInputs({
  planName: "Example",
  startingNetWorth: "250000",
  monthlyContribution: "1200",
  expectedMonthlyExpenses: "3500",
  inflationRate: "2.5",
});
console.assert(validErrors.length === 0, "Expected no validation errors");

const invalidErrors = validateRetirementInputs({
  planName: "",
  startingNetWorth: "0",
  monthlyContribution: "-10",
  expectedMonthlyExpenses: "",
  inflationRate: "20",
});
console.assert(invalidErrors.length >= 3, "Expected validation errors");

const formatted = formatNumberForInput(1234.567);
console.assert(formatted === "1234.57", "Expected rounding to 2 decimals");

void validErrors;
void invalidErrors;
void formatted;
