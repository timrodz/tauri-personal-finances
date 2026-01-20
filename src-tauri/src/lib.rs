use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::fs;
use tauri::Manager;

mod commands;
pub mod constants;
mod models;
mod services;

// Create a custom struct to hold the database pool
struct AppState {
    db: SqlitePool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
// # Panics
//
// Will panic if the app crashes
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Get the app data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");

            // Ensure the directory exists
            if !app_data_dir.exists() {
                fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            }

            // Path for the SQLite database
            let db_path = app_data_dir.join("personal_finances.db");
            let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

            tauri::async_runtime::block_on(async move {
                // Connect to the database
                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&db_url)
                    .await
                    .expect("failed to connect to database");

                // Run migrations
                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .expect("failed to run migrations");

                // Sync exchange rates on boot (background)
                let pool_clone = pool.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) =
                        crate::services::currency_exchange_sync::SyncService::sync_exchange_rates(
                            &pool_clone,
                        )
                        .await
                    {
                        eprintln!("Failed to sync exchange rates on boot: {e}");
                    }
                });

                // Manage the pool in Tauri state
                app.manage(AppState { db: pool });
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_user_settings,
            commands::update_user_settings,
            commands::get_all_accounts,
            commands::toggle_archive_account,
            commands::create_account,
            commands::update_account,
            commands::update_account_order,
            commands::delete_account,
            commands::get_balance_sheets,
            commands::create_balance_sheet,
            commands::delete_balance_sheet,
            commands::get_entries,
            commands::upsert_entry,
            commands::get_currency_rates,
            commands::upsert_currency_rate,
            commands::delete_currency_rate,
            commands::get_net_worth_history,
            commands::get_onboarding_status,
            commands::complete_onboarding_step
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
pub mod test_utils {
    use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

    pub async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory database");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        pool
    }
}
