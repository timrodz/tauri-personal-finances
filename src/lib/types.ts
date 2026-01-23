export type Theme = "light" | "dark" | "system";

export interface UserSettings {
  id: string;
  name: string;
  homeCurrency: string;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  accountType: "Asset" | "Liability";
  currency: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
}

export interface BalanceSheet {
  id: string;
  year: number;
  createdAt: string;
}

export interface Entry {
  id: string;
  balanceSheetId: string;
  accountId: string;
  month: number;
  amount: number;
  updatedAt: string;
}

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  month: number; // 1-12
  year: number;
  timestamp: string;
}

export interface MonthlyTotal {
  month: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  hasMissingRates: boolean;
}

export type OnboardingStepKey =
  | "CONFIGURE_SETTINGS"
  | "CREATE_FIRST_ACCOUNT"
  | "CREATE_FIRST_BALANCE_SHEET";

export interface OnboardingStep {
  stepKey: OnboardingStepKey;
  isCompleted: boolean;
  updatedAt: string;
}

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
