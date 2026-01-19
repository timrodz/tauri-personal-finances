import { invoke } from "@tauri-apps/api/core";
import { COMMANDS } from "./commands";
import {
  Account,
  BalanceSheet,
  CurrencyRate,
  Entry,
  UserSettings,
} from "./types";

// Re-export types for consumers
export type { Account, BalanceSheet, CurrencyRate, Entry, UserSettings };

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
  getAllAccounts: async (): Promise<Account[]> => {
    return await invoke(COMMANDS.GET_ALL_ACCOUNTS);
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
};
