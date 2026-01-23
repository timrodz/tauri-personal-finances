export const SCENARIO_LIMIT = 3;

export function isScenarioLimitReached(
  planCount: number,
  limit: number = SCENARIO_LIMIT,
): boolean {
  return planCount >= limit;
}

export function getScenarioLimitMessage(
  planCount: number,
  limit: number = SCENARIO_LIMIT,
): string | null {
  if (planCount < limit) {
    return null;
  }

  return `You can save up to ${limit} scenarios.`;
}
