use crate::models::{
    Account, BalanceSheet, CurrencyRate, Entry, OnboardingStep, RetirementPlan, UserSettings,
};
use crate::services::account::AccountService;
use crate::services::balance_sheet::BalanceSheetService;
use crate::services::entry::EntryService;
use crate::services::net_worth::{NetWorthDataPoint, NetWorthService};
use crate::services::onboarding::OnboardingService;
use crate::services::retirement_plan::RetirementPlanService;
use crate::services::user_settings::UserSettingsService;
use crate::AppState;
use chrono::NaiveDate;
use tauri::State;

// --- User Settings ---

#[tauri::command]
pub async fn get_user_settings(state: State<'_, AppState>) -> Result<Option<UserSettings>, String> {
    // We can use get_all and return the first one, or get_by_id if we knew it.
    // Or keep get_all logic. Since UserSettings is a singleton concept, let's just get all and take first.
    let settings = UserSettingsService::get_all(&state.db).await?;
    Ok(settings.into_iter().next())
}

#[tauri::command]
pub async fn get_net_worth_history(
    state: State<'_, AppState>,
) -> Result<Vec<NetWorthDataPoint>, String> {
    NetWorthService::get_history(&state.db).await
}

#[tauri::command]
pub async fn get_latest_net_worth(
    state: State<'_, AppState>,
) -> Result<Option<NetWorthDataPoint>, String> {
    NetWorthService::get_latest(&state.db).await
}

#[tauri::command]
pub async fn update_user_settings(
    state: State<'_, AppState>,
    name: String,
    home_currency: String,
    theme: String,
) -> Result<UserSettings, String> {
    let pool = &state.db;
    UserSettingsService::upsert(pool, name, home_currency, theme)
        .await
        .map_err(|e| e.to_string())
}

// --- Accounts ---

#[tauri::command]
pub async fn get_all_accounts(
    state: State<'_, AppState>,
    include_archived: bool,
) -> Result<Vec<Account>, String> {
    AccountService::get_all(&state.db, include_archived).await
}

#[tauri::command]
pub async fn toggle_archive_account(
    state: State<'_, AppState>,
    id: String,
) -> Result<Account, String> {
    AccountService::toggle_archive(&state.db, id).await
}

#[tauri::command]
pub async fn create_account(
    state: State<'_, AppState>,
    name: String,
    account_type: String,
    currency: String,
) -> Result<Account, String> {
    AccountService::upsert(&state.db, None, name, account_type, currency).await
}

#[tauri::command]
pub async fn update_account(
    state: State<'_, AppState>,
    id: String,
    name: String,
    account_type: String,
    currency: String,
) -> Result<Account, String> {
    AccountService::upsert(&state.db, Some(id), name, account_type, currency).await
}

#[tauri::command]
pub async fn update_account_order(
    state: State<'_, AppState>,
    ids: Vec<String>,
) -> Result<(), String> {
    AccountService::update_order(&state.db, ids).await
}

#[tauri::command]
pub async fn delete_account(state: State<'_, AppState>, id: String) -> Result<(), String> {
    AccountService::delete(&state.db, id).await
}

// --- Balance Sheets ---

#[tauri::command]
pub async fn get_balance_sheets(state: State<'_, AppState>) -> Result<Vec<BalanceSheet>, String> {
    BalanceSheetService::get_all(&state.db).await
}

#[tauri::command]
pub async fn create_balance_sheet(
    state: State<'_, AppState>,
    year: i32,
) -> Result<BalanceSheet, String> {
    let sheet = BalanceSheetService::upsert(&state.db, None, year).await?;

    // Trigger background sync
    let pool = state.db.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) =
            crate::services::currency_exchange_sync::SyncService::sync_exchange_rates(&pool).await
        {
            eprintln!("Failed to sync rates after creating balance sheet: {e}");
        }
    });

    Ok(sheet)
}

#[tauri::command]
pub async fn delete_balance_sheet(state: State<'_, AppState>, id: String) -> Result<(), String> {
    BalanceSheetService::delete(&state.db, id).await
}

// --- Entries ---

#[tauri::command]
pub async fn get_entries(
    state: State<'_, AppState>,
    balance_sheet_id: String,
) -> Result<Vec<Entry>, String> {
    EntryService::get_by_balance_sheet(&state.db, balance_sheet_id).await
}

#[tauri::command]
pub async fn upsert_entry(
    state: State<'_, AppState>,
    balance_sheet_id: String,
    account_id: String,
    month: i32,
    amount: f64,
) -> Result<Entry, String> {
    EntryService::upsert(&state.db, balance_sheet_id, account_id, month, amount).await
}

// --- Currency Rates ---

#[tauri::command]
pub async fn get_currency_rates(state: State<'_, AppState>) -> Result<Vec<CurrencyRate>, String> {
    crate::services::currency_rate::CurrencyRateService::get_all(&state.db).await
}

#[tauri::command]
pub async fn upsert_currency_rate(
    state: State<'_, AppState>,
    id: Option<String>,
    from_currency: String,
    to_currency: String,
    rate: f64,
    month: u32,
    year: i32,
) -> Result<CurrencyRate, String> {
    crate::services::currency_rate::CurrencyRateService::upsert(
        &state.db,
        id,
        from_currency,
        to_currency,
        rate,
        month,
        year,
    )
    .await
}

#[tauri::command]
pub async fn delete_currency_rate(state: State<'_, AppState>, id: String) -> Result<(), String> {
    crate::services::currency_rate::CurrencyRateService::delete(&state.db, id).await
}

// --- Onboarding ---

#[tauri::command]
pub async fn get_onboarding_status(
    state: State<'_, AppState>,
) -> Result<Vec<OnboardingStep>, String> {
    OnboardingService::get_status(&state.db).await
}

#[tauri::command]
pub async fn complete_onboarding_step(
    state: State<'_, AppState>,
    step_key: String,
) -> Result<(), String> {
    OnboardingService::complete_step(&state.db, step_key).await
}

// --- Retirement Plans ---

#[tauri::command]
pub async fn create_retirement_plan(
    state: State<'_, AppState>,
    name: String,
    target_retirement_date: Option<NaiveDate>,
    starting_net_worth: f64,
    monthly_contribution: f64,
    expected_monthly_expenses: f64,
    return_scenario: String,
) -> Result<RetirementPlan, String> {
    RetirementPlanService::create(
        &state.db,
        name,
        target_retirement_date,
        starting_net_worth,
        monthly_contribution,
        expected_monthly_expenses,
        return_scenario,
    )
    .await
}

#[tauri::command]
pub async fn get_retirement_plans(
    state: State<'_, AppState>,
) -> Result<Vec<RetirementPlan>, String> {
    RetirementPlanService::get_all(&state.db).await
}

#[tauri::command]
pub async fn get_retirement_plan(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<RetirementPlan>, String> {
    RetirementPlanService::get_by_id(&state.db, id).await
}

#[tauri::command]
pub async fn update_retirement_plan(
    state: State<'_, AppState>,
    id: String,
    name: String,
    target_retirement_date: Option<NaiveDate>,
    starting_net_worth: f64,
    monthly_contribution: f64,
    expected_monthly_expenses: f64,
    return_scenario: String,
) -> Result<RetirementPlan, String> {
    RetirementPlanService::update(
        &state.db,
        id,
        name,
        target_retirement_date,
        starting_net_worth,
        monthly_contribution,
        expected_monthly_expenses,
        return_scenario,
    )
    .await
}

#[tauri::command]
pub async fn delete_retirement_plan(state: State<'_, AppState>, id: String) -> Result<(), String> {
    RetirementPlanService::delete(&state.db, id).await
}
