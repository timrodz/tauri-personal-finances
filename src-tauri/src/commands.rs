use crate::models::{Account, BalanceSheet, CurrencyRate, Entry, UserSettings};
use crate::services::account::AccountService;
use crate::services::balance_sheet::BalanceSheetService;
use crate::services::entry::EntryService;
use crate::services::user_settings::UserSettingsService;
use crate::AppState;
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
pub async fn get_all_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, String> {
    AccountService::get_all(&state.db).await
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
