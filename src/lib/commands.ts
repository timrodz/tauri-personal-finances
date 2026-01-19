// Invoke command names matching src-tauri/src/commands.rs
// Keeping them here allows for easier refactoring and "find usages"

export const COMMANDS = {
  // User Settings
  GET_USER_SETTINGS: "get_user_settings",
  UPDATE_USER_SETTINGS: "update_user_settings",

  // Accounts
  GET_ALL_ACCOUNTS: "get_all_accounts",
  CREATE_ACCOUNT: "create_account",
  UPDATE_ACCOUNT: "update_account",
  UPDATE_ACCOUNT_ORDER: "update_account_order",
  DELETE_ACCOUNT: "delete_account",

  // Balance Sheets
  GET_BALANCE_SHEETS: "get_balance_sheets",
  CREATE_BALANCE_SHEET: "create_balance_sheet",

  // Entries
  GET_ENTRIES: "get_entries",
  UPSERT_ENTRY: "upsert_entry",

  // Currency Rates
  GET_CURRENCY_RATES: "get_currency_rates",
  UPSERT_CURRENCY_RATE: "upsert_currency_rate",
  DELETE_CURRENCY_RATE: "delete_currency_rate",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];
