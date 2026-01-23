export type ProjectionStatus = "onTrack" | "shortfall";
export type ProjectionErrorKind = "notAchievable" | "unknown";

export function getProjectionStatus(
  monthlyIncome: number,
  expectedMonthlyExpenses: number,
): ProjectionStatus {
  if (monthlyIncome >= expectedMonthlyExpenses) {
    return "onTrack";
  }

  return "shortfall";
}

export function getProjectionErrorKind(
  error: unknown,
): ProjectionErrorKind | null {
  if (!error) {
    return null;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  if (message.toLowerCase().includes("not achievable")) {
    return "notAchievable";
  }

  return "unknown";
}
