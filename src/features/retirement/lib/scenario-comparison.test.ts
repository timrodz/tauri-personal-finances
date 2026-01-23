import {
  getEarliestScenarioIds,
  getHighestIncomeScenarioIds,
} from "@/features/retirement/lib/scenario-comparison";

const summaries = [
  {
    id: "alpha",
    yearsToRetirement: 12,
    monthlyIncome3pct: 2200,
    monthlyIncome4pct: 2900,
  },
  {
    id: "bravo",
    yearsToRetirement: 8,
    monthlyIncome3pct: 1800,
    monthlyIncome4pct: 2600,
  },
  {
    id: "charlie",
    yearsToRetirement: 8,
    monthlyIncome3pct: 2500,
    monthlyIncome4pct: 3200,
  },
];

const earliestIds = getEarliestScenarioIds(summaries);
if (!earliestIds.has("bravo") || !earliestIds.has("charlie")) {
  throw new Error("Expected earliest scenarios to include tied results.");
}

const highestIncomeIds = getHighestIncomeScenarioIds(summaries);
if (!highestIncomeIds.has("charlie") || highestIncomeIds.size !== 1) {
  throw new Error("Expected highest income scenario to be unique.");
}

const emptyEarliest = getEarliestScenarioIds([]);
if (emptyEarliest.size !== 0) {
  throw new Error("Expected empty earliest set for missing summaries.");
}
