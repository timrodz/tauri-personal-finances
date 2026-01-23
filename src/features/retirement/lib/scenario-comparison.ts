export interface ScenarioProjectionSummary {
  id: string;
  yearsToRetirement: number;
  monthlyIncome3pct: number;
  monthlyIncome4pct: number;
}

export function getEarliestScenarioIds(
  summaries: ScenarioProjectionSummary[],
): Set<string> {
  const validSummaries = summaries.filter((summary) =>
    Number.isFinite(summary.yearsToRetirement),
  );
  if (validSummaries.length === 0) {
    return new Set();
  }

  const earliestYears = Math.min(
    ...validSummaries.map((summary) => summary.yearsToRetirement),
  );

  return new Set(
    validSummaries
      .filter((summary) => summary.yearsToRetirement === earliestYears)
      .map((summary) => summary.id),
  );
}

export function getHighestIncomeScenarioIds(
  summaries: ScenarioProjectionSummary[],
): Set<string> {
  const validSummaries = summaries.filter((summary) =>
    Number.isFinite(summary.monthlyIncome4pct),
  );
  if (validSummaries.length === 0) {
    return new Set();
  }

  const highestIncome = Math.max(
    ...validSummaries.map((summary) => summary.monthlyIncome4pct),
  );

  return new Set(
    validSummaries
      .filter((summary) => summary.monthlyIncome4pct === highestIncome)
      .map((summary) => summary.id),
  );
}
