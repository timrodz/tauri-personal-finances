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
