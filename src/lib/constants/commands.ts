// Invoke command names matching src-tauri/src/commands.rs
// Keeping them here allows for easier refactoring and "find usages"

export const COMMANDS = {
  // User Settings
  GET_USER_SETTINGS: "get_user_settings",
  UPDATE_USER_SETTINGS: "update_user_settings",

  // Accounts
  GET_ALL_ACCOUNTS: "get_all_accounts",
  TOGGLE_ARCHIVE_ACCOUNT: "toggle_archive_account",
  CREATE_ACCOUNT: "create_account",
  UPDATE_ACCOUNT: "update_account",
  UPDATE_ACCOUNT_ORDER: "update_account_order",
  DELETE_ACCOUNT: "delete_account",

  // Balance Sheets
  GET_BALANCE_SHEETS: "get_balance_sheets",
  CREATE_BALANCE_SHEET: "create_balance_sheet",
  DELETE_BALANCE_SHEET: "delete_balance_sheet",

  // Entries
  GET_ENTRIES: "get_entries",
  UPSERT_ENTRY: "upsert_entry",

  // Currency Rates
  GET_CURRENCY_RATES: "get_currency_rates",
  SYNC_EXCHANGE_RATES: "sync_exchange_rates",
  UPSERT_CURRENCY_RATE: "upsert_currency_rate",
  DELETE_CURRENCY_RATE: "delete_currency_rate",

  // Net Worth
  GET_NET_WORTH_HISTORY: "get_net_worth_history",
  GET_LATEST_NET_WORTH: "get_latest_net_worth",

  // Retirement
  CREATE_RETIREMENT_PLAN: "create_retirement_plan",
  GET_RETIREMENT_PLANS: "get_retirement_plans",
  GET_RETIREMENT_PLAN: "get_retirement_plan",
  UPDATE_RETIREMENT_PLAN: "update_retirement_plan",
  DELETE_RETIREMENT_PLAN: "delete_retirement_plan",
  CALCULATE_RETIREMENT_PROJECTION: "calculate_retirement_projection",
  GET_RETIREMENT_PLAN_PROJECTIONS: "get_retirement_plan_projections",

  // Onboarding
  GET_ONBOARDING_STATUS: "get_onboarding_status",
  COMPLETE_ONBOARDING_STEP: "complete_onboarding_step",
} as const;
