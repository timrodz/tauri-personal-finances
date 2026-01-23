import { invoke } from "@tauri-apps/api/core";
import { COMMANDS } from "./commands";
import {
  Account,
  BalanceSheet,
  CurrencyRate,
  Entry,
  OnboardingStep,
  RetirementPlan,
  RetirementProjection,
  ReturnScenario,
  UserSettings,
} from "./types";

export interface NetWorthDataPoint {
  year: number;
  month: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
}

// Re-export types for consumers
export type {
  Account,
  BalanceSheet,
  CurrencyRate,
  Entry,
  RetirementPlan,
  UserSettings,
};

// API Adapter
export const api = {
  // User Settings
  getUserSettings: async (): Promise<UserSettings | null> => {
    return await invoke(COMMANDS.GET_USER_SETTINGS);
  },

  updateUserSettings: async (
    name: string,
    homeCurrency: string,
    theme: string,
  ): Promise<UserSettings> => {
    return await invoke(COMMANDS.UPDATE_USER_SETTINGS, {
      name,
      homeCurrency,
      theme,
    });
  },

  // Accounts
  getAllAccounts: async (
    includeArchived: boolean = false,
  ): Promise<Account[]> => {
    return await invoke(COMMANDS.GET_ALL_ACCOUNTS, { includeArchived });
  },

  toggleArchiveAccount: async (id: string): Promise<Account> => {
    return await invoke(COMMANDS.TOGGLE_ARCHIVE_ACCOUNT, { id });
  },

  createAccount: async (
    name: string,
    accountType: string,
    currency: string,
  ): Promise<Account> => {
    return await invoke(COMMANDS.CREATE_ACCOUNT, {
      name,
      accountType,
      currency,
    });
  },

  updateAccount: async (
    id: string,
    name: string,
    accountType: string,
    currency: string,
  ): Promise<Account> => {
    return await invoke(COMMANDS.UPDATE_ACCOUNT, {
      id,
      name,
      accountType,
      currency,
    });
  },

  updateAccountOrder: async (ids: string[]): Promise<void> => {
    await invoke(COMMANDS.UPDATE_ACCOUNT_ORDER, { ids });
  },

  deleteAccount: async (id: string): Promise<void> => {
    await invoke(COMMANDS.DELETE_ACCOUNT, { id });
  },

  // Balance Sheets
  getBalanceSheets: async (): Promise<BalanceSheet[]> => {
    return await invoke(COMMANDS.GET_BALANCE_SHEETS);
  },

  createBalanceSheet: async (year: number): Promise<BalanceSheet> => {
    // Note: Rust command uses i32, JS number is fine
    return await invoke(COMMANDS.CREATE_BALANCE_SHEET, { year });
  },

  deleteBalanceSheet: async (id: string): Promise<void> => {
    await invoke(COMMANDS.DELETE_BALANCE_SHEET, { id });
  },

  // Entries
  getEntries: async (balanceSheetId: string): Promise<Entry[]> => {
    return await invoke(COMMANDS.GET_ENTRIES, { balanceSheetId });
  },

  upsertEntry: async (
    balanceSheetId: string,
    accountId: string,
    month: number,
    amount: number,
  ): Promise<Entry> => {
    return await invoke(COMMANDS.UPSERT_ENTRY, {
      balanceSheetId,
      accountId,
      month,
      amount,
    });
  },

  // Currency Rates
  getCurrencyRates: async (): Promise<CurrencyRate[]> => {
    return await invoke(COMMANDS.GET_CURRENCY_RATES);
  },

  upsertCurrencyRate: async (
    id: string | null,
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    month: number,
    year: number,
  ): Promise<CurrencyRate> => {
    return await invoke(COMMANDS.UPSERT_CURRENCY_RATE, {
      id,
      fromCurrency,
      toCurrency,
      rate,
      month,
      year,
    });
  },

  deleteCurrencyRate: async (id: string): Promise<void> => {
    await invoke(COMMANDS.DELETE_CURRENCY_RATE, { id });
  },

  // Net Worth
  getNetWorthHistory: async (): Promise<NetWorthDataPoint[]> => {
    return await invoke(COMMANDS.GET_NET_WORTH_HISTORY);
  },
  getLatestNetWorth: async (): Promise<NetWorthDataPoint | null> => {
    return await invoke(COMMANDS.GET_LATEST_NET_WORTH);
  },

  // Retirement
  getRetirementPlans: async (): Promise<RetirementPlan[]> => {
    return await invoke(COMMANDS.GET_RETIREMENT_PLANS);
  },

  createRetirementPlan: async (input: {
    name: string;
    targetRetirementDate: string | null;
    startingNetWorth: number;
    monthlyContribution: number;
    expectedMonthlyExpenses: number;
    returnScenario: ReturnScenario;
  }): Promise<RetirementPlan> => {
    return await invoke(COMMANDS.CREATE_RETIREMENT_PLAN, input);
  },

  calculateRetirementProjection: async (
    startingNetWorth: number,
    monthlyContribution: number,
    expectedMonthlyExpenses: number,
    returnScenario: ReturnScenario,
  ): Promise<RetirementProjection> => {
    return await invoke(COMMANDS.CALCULATE_RETIREMENT_PROJECTION, {
      startingNetWorth,
      monthlyContribution,
      expectedMonthlyExpenses,
      returnScenario,
    });
  },

  // Onboarding
  getOnboardingStatus: async (): Promise<OnboardingStep[]> => {
    return await invoke(COMMANDS.GET_ONBOARDING_STATUS);
  },

  completeOnboardingStep: async (stepKey: string): Promise<void> => {
    await invoke(COMMANDS.COMPLETE_ONBOARDING_STEP, { stepKey });
  },
};
