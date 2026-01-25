use crate::models::{Account, BalanceSheet};
use chrono::Datelike;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct NetWorthDataPoint {
    pub year: i32,
    pub month: u32,
    pub total_assets: f64,
    pub total_liabilities: f64,
    pub net_worth: f64,
    pub currency: String,
}

pub struct NetWorthService;

impl NetWorthService {
    pub async fn get_history(pool: &SqlitePool) -> Result<Vec<NetWorthDataPoint>, String> {
        // 1. Get Home Currency
        let settings = crate::services::user_settings::UserSettingsService::get_all(pool)
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .next()
            .ok_or("User settings not found")?;
        let home_currency = settings.home_currency;

        // 2. Fetch all required data
        let entries = crate::services::entry::EntryService::get_all(pool).await?;
        let accounts = crate::services::account::AccountService::get_all(pool, true).await?;
        let sheets = crate::services::balance_sheet::BalanceSheetService::get_all(pool).await?;
        let rates = crate::services::currency_rate::CurrencyRateService::get_all(pool).await?;

        // 3. Build fast lookups
        let account_map: HashMap<String, Account> =
            accounts.into_iter().map(|a| (a.id.clone(), a)).collect();

        let sheet_map: HashMap<String, BalanceSheet> =
            sheets.into_iter().map(|s| (s.id.clone(), s)).collect();

        // Key: (Year, Month, FromCurrency, ToCurrency) -> Rate
        let mut rate_map: HashMap<(i32, u32, String, String), f64> = HashMap::new();
        for r in rates {
            rate_map.insert(
                (
                    r.year,
                    r.month,
                    r.from_currency.clone(),
                    r.to_currency.clone(),
                ),
                r.rate,
            );
        }

        // 4. Aggregate data
        // specific struct to hold aggregated sums
        struct MonthlyAgg {
            assets: f64,
            liabilities: f64,
        }
        // Map (Year, Month) -> MonthlyAgg
        let mut agg_map: HashMap<(i32, u32), MonthlyAgg> = HashMap::new();

        for entry in entries {
            let sheet = sheet_map
                .get(&entry.balance_sheet_id)
                .ok_or("Balance sheet not found for entry")?;
            let account = account_map
                .get(&entry.account_id)
                .ok_or("Account not found for entry")?;

            let year = sheet.year;
            let month = entry.month;

            // Convert amount
            let amount_in_home = if account.currency == home_currency {
                entry.amount
            } else {
                // Find rate for explicit pair
                let rate =
                    rate_map.get(&(year, month, account.currency.clone(), home_currency.clone()));

                let conversion_rate = rate.unwrap_or(&1.0);
                entry.amount * conversion_rate
            };

            let entry_agg = agg_map.entry((year, month)).or_insert(MonthlyAgg {
                assets: 0.0,
                liabilities: 0.0,
            });

            if account.account_type == "Asset" {
                entry_agg.assets += amount_in_home;
            } else {
                entry_agg.liabilities += amount_in_home;
            }
        }

        // 5. Convert to Result List
        // 5. Filter future dates and Convert to Result List
        let now = chrono::Local::now();
        let current_year = now.year();
        let current_month = now.month();

        let mut result: Vec<NetWorthDataPoint> = agg_map
            .into_iter()
            .filter(|((year, month), _)| {
                if *year < current_year {
                    true
                } else if *year == current_year {
                    *month <= current_month
                } else {
                    false
                }
            })
            .map(|((year, month), agg)| NetWorthDataPoint {
                year,
                month,
                total_assets: agg.assets,
                total_liabilities: agg.liabilities,
                net_worth: agg.assets - agg.liabilities,
                currency: home_currency.clone(),
            })
            .collect();

        // 6. Sort by date
        result.sort_by(|a, b| {
            if a.year != b.year {
                a.year.cmp(&b.year)
            } else {
                a.month.cmp(&b.month)
            }
        });

        Ok(result)
    }

    pub async fn get_latest(pool: &SqlitePool) -> Result<Option<NetWorthDataPoint>, String> {
        let mut history = Self::get_history(pool).await?;
        Ok(history.pop())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::{
        account::AccountService, balance_sheet::BalanceSheetService,
        currency_rate::CurrencyRateService, entry::EntryService,
        user_settings::UserSettingsService,
    };
    use crate::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_net_worth_calculation() {
        let pool = setup_test_db().await;

        // 1. Setup Settings (Home = USD)
        UserSettingsService::upsert(&pool, "Test User".into(), "USD".into(), "system".into())
            .await
            .expect("setup settings");

        // 2. Setup Accounts
        // Asset A: USD (Native)
        let asset_usd =
            AccountService::upsert(&pool, None, "Cash".into(), "Asset".into(), "USD".into(), None)
                .await
                .expect("asset usd");
        // Asset B: EUR (Foreign)
        let asset_eur = AccountService::upsert(
            &pool,
            None,
            "Euro Stash".into(),
            "Asset".into(),
            "EUR".into(),
            None,
        )
        .await
        .expect("asset eur");
        // Liability: USD
        let liab_usd =
            AccountService::upsert(&pool, None, "Loan".into(), "Liability".into(), "USD".into(), None)
                .await
                .expect("liab usd");

        // 3. Setup Sheet (2025)
        let sheet = BalanceSheetService::upsert(&pool, None, 2025)
            .await
            .expect("sheet");

        // 4. Setup Rate (EUR -> USD = 1.1) for Jan 2025
        CurrencyRateService::upsert(&pool, None, "EUR".into(), "USD".into(), 1.1, 1, 2025)
            .await
            .expect("rate");

        // 5. Add Entries (Month 1 - Jan)
        // Asset USD: 1000
        EntryService::upsert(&pool, sheet.id.clone(), asset_usd.id.clone(), 1, 1000.0)
            .await
            .expect("entry 1");
        // Asset EUR: 100
        EntryService::upsert(&pool, sheet.id.clone(), asset_eur.id.clone(), 1, 100.0)
            .await
            .expect("entry 2");
        // Liab USD: 50
        EntryService::upsert(&pool, sheet.id.clone(), liab_usd.id.clone(), 1, 50.0)
            .await
            .expect("entry 3");

        // 6. Calculate
        let history = NetWorthService::get_history(&pool)
            .await
            .expect("get history");

        assert_eq!(history.len(), 1);
        let point = &history[0];

        // Expected:
        // Assets = 1000 (USD) + 100 * 1.1 (EUR->USD) = 1110.0
        // Liabs = 50.0
        // Net Worth = 1110 - 50 = 1060.0

        assert_eq!(point.year, 2025);
        assert_eq!(point.month, 1);
        assert!(
            (point.total_assets - 1110.0).abs() < 0.001,
            "Assets mismatch: {}",
            point.total_assets
        );
        assert!((point.total_liabilities - 50.0).abs() < 0.001);
        assert!((point.net_worth - 1060.0).abs() < 0.001);
    }

    #[tokio::test]
    async fn test_net_worth_future_exclusion() {
        let pool = setup_test_db().await;

        // 1. Setup Settings
        UserSettingsService::upsert(&pool, "Test User".into(), "USD".into(), "system".into())
            .await
            .expect("setup settings");

        // 2. Setup Account
        let asset_usd =
            AccountService::upsert(&pool, None, "Cash".into(), "Asset".into(), "USD".into(), None)
                .await
                .expect("asset usd");

        // 3. Setup Sheet (Future Year)
        // Assume test runs before 3000
        let sheet = BalanceSheetService::upsert(&pool, None, 3000)
            .await
            .expect("sheet");

        // 4. Add Entry for Future
        EntryService::upsert(&pool, sheet.id.clone(), asset_usd.id.clone(), 1, 5000.0)
            .await
            .expect("entry future");

        // 5. Calculate
        let history = NetWorthService::get_history(&pool)
            .await
            .expect("get history");

        // 6. Verify empty because 3000 is in the future
        assert_eq!(history.len(), 0);
    }

    #[tokio::test]
    async fn test_get_latest_net_worth() {
        let pool = setup_test_db().await;

        UserSettingsService::upsert(&pool, "Test User".into(), "USD".into(), "system".into())
            .await
            .expect("setup settings");

        let asset_usd =
            AccountService::upsert(&pool, None, "Cash".into(), "Asset".into(), "USD".into(), None)
                .await
                .expect("asset usd");

        let sheet = BalanceSheetService::upsert(&pool, None, 2025)
            .await
            .expect("sheet");

        EntryService::upsert(&pool, sheet.id.clone(), asset_usd.id.clone(), 1, 1000.0)
            .await
            .expect("entry jan");
        EntryService::upsert(&pool, sheet.id.clone(), asset_usd.id.clone(), 2, 1500.0)
            .await
            .expect("entry feb");

        let latest = NetWorthService::get_latest(&pool).await.expect("latest");

        let latest = latest.expect("expected latest point");
        assert_eq!(latest.year, 2025);
        assert_eq!(latest.month, 2);
        assert!((latest.net_worth - 1500.0).abs() < 0.001);
    }

    #[tokio::test]
    async fn test_get_latest_net_worth_empty() {
        let pool = setup_test_db().await;

        UserSettingsService::upsert(&pool, "Test User".into(), "USD".into(), "system".into())
            .await
            .expect("setup settings");

        let latest = NetWorthService::get_latest(&pool).await.expect("latest");

        assert!(latest.is_none());
    }
}
