use crate::services::balance_sheet::BalanceSheetService;
use crate::services::currency_rate::CurrencyRateService;
use crate::services::user_settings::UserSettingsService;
use crate::{models::CurrencyRate, services::account::AccountService};
use chrono::{Datelike, NaiveDate};
use reqwest::Client;
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};

#[derive(Deserialize, Debug)]
struct FrankfurterResponse {
    rates: HashMap<String, HashMap<String, f64>>,
}

pub struct SyncService;

impl SyncService {
    pub async fn sync_exchange_rates(pool: &SqlitePool) -> Result<(), String> {
        println!("[Sync] Starting exchange rate sync...");

        // 1. Get Home Currency
        let settings_list = UserSettingsService::get_all(pool).await?;
        let settings = settings_list.first().ok_or("User settings not found")?;
        let home_currency = &settings.home_currency;

        // 2. Get Foreign Currencies from Accounts
        let accounts = AccountService::get_all(pool, true).await?;
        let foreign_currencies: Vec<String> = accounts
            .into_iter()
            .map(|a| a.currency)
            .filter(|c| c != home_currency)
            .collect::<HashSet<_>>() // Dedup
            .into_iter()
            .collect();

        if foreign_currencies.is_empty() {
            println!("[Sync] No foreign currencies found. Sync skipped.");
            return Ok(());
        }

        // 3. Get Years from Balance Sheets
        let sheets = BalanceSheetService::get_all(pool).await?;
        let years: Vec<i32> = sheets.into_iter().map(|s| s.year).collect();

        if years.is_empty() {
            println!("[Sync] No balance sheets found. Sync skipped.");
            return Ok(());
        }

        // 4. Existing Rates for Dedup and Finalization Check
        let all_rates = CurrencyRateService::get_all(pool).await?;
        let mut rate_map: HashMap<String, CurrencyRate> = HashMap::new();
        for r in all_rates {
            let key = format!(
                "{}-{}-{}-{}",
                r.year, r.month, r.from_currency, r.to_currency
            );
            rate_map.insert(key, r);
        }

        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| format!("Failed to build HTTP client: {e}"))?;
        let today = chrono::Utc::now().naive_utc().date();
        let today_year = today.year();

        let earliest_year = *years.iter().min().unwrap_or(&today_year);
        if earliest_year > today_year {
            println!(
                       "[Sync] Earliest balance sheet year {earliest_year} is in the future. Sync skipped."
                   );
            return Ok(());
        }
        let symbols = foreign_currencies.join(",");
        let start_date = format!("{earliest_year}-01-01");
        let end_date = format!("{}", today.format("%Y-%m-%d"));

        let optimized_url = crate::constants::FRANKFURTER_BASE_URL
            .replacen("{}", &start_date, 1)
            .replacen("{}", &end_date, 1)
            .replacen("{}", home_currency, 1)
            .replacen("{}", &symbols, 1);

        println!(
            "[Sync] Fetching rates from {start_date} to {end_date} with base currency: {home_currency}",
        );

        let resp = match client.get(&optimized_url).send().await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[Sync] Request error: {e}");
                return Err(format!("Request error: {e}"));
            }
        };

        if !resp.status().is_success() {
            eprintln!("[Sync] Frankfurter API error: Status {}", resp.status());
            return Err(format!("API error: {}", resp.status()));
        }

        match resp.json::<FrankfurterResponse>().await {
            Ok(data) => {
                let _ =
                    Self::process_and_save_rates(pool, data.rates, home_currency, &rate_map).await;
            }
            Err(e) => return Err(format!("Failed to parse JSON: {e}")),
        }

        println!("[Sync] Exchange rate sync complete.");
        Ok(())
    }

    async fn process_and_save_rates(
        pool: &SqlitePool,
        rates: HashMap<String, HashMap<String, f64>>,
        home_currency: &str,
        rate_map: &HashMap<String, CurrencyRate>,
    ) -> Result<(), String> {
        let monthly_rates = Self::process_frankfurter_rates(rates);
        let total_to_process = monthly_rates.values().map(|m| m.len()).sum::<usize>();
        println!("[Sync] Processing {total_to_process} rates...",);

        let mut success_count = 0;
        let mut fail_count = 0;

        // Upsert
        for ((year, month), rates_obj) in monthly_rates {
            // Finalization check
            let last_day = if month == crate::constants::DECEMBER {
                NaiveDate::from_ymd_opt(year + 1, 1, 1)
                    .unwrap()
                    .pred_opt()
                    .unwrap()
            } else {
                NaiveDate::from_ymd_opt(year, month + 1, 1)
                    .unwrap()
                    .pred_opt()
                    .unwrap()
            };

            for (foreign, rate_in_home) in rates_obj {
                let key = format!("{year}-{month}-{foreign}-{home_currency}");
                let existing_rate_for_end_of_month = match rate_map.get(&key) {
                    Some(rate) => rate.timestamp.naive_utc().date() > last_day,
                    None => false,
                };
                if existing_rate_for_end_of_month {
                    continue;
                }

                let inverted_rate = 1.0 / rate_in_home;
                let existing_id = rate_map.get(&key).map(|r| r.id.clone());

                println!(
                    "Processing rate for {month}/{year} ({foreign}->{home_currency}): {rate_in_home}->{inverted_rate}",
                );

                match CurrencyRateService::upsert(
                    pool,
                    existing_id,
                    foreign.clone(),
                    home_currency.to_string(),
                    inverted_rate,
                    month,
                    year,
                )
                .await
                {
                    Ok(_) => success_count += 1,
                    Err(e) => {
                        fail_count += 1;
                        eprintln!(
                            "[Sync] Failed to upsert rate for {year}-{month}-{foreign}-{home_currency}: {e}",
                        );
                    }
                }
            }
        }
        println!("[Sync] Sync complete: {success_count} updated/inserted, {fail_count} failed.");
        Ok(())
    }

    fn process_frankfurter_rates(
        rates: HashMap<String, HashMap<String, f64>>,
    ) -> HashMap<(i32, u32), HashMap<String, f64>> {
        let mut monthly_max_dates: HashMap<(i32, u32), NaiveDate> = HashMap::new();
        let mut monthly_rates: HashMap<(i32, u32), HashMap<String, f64>> = HashMap::new();

        for (date_str, rates_obj) in rates {
            if let Ok(date) =
                NaiveDate::parse_from_str(&date_str, crate::constants::FRANKFURTER_DATE_FORMAT)
            {
                let year = date.year();
                let month = date.month();
                let key = (year, month);

                let is_later = match monthly_max_dates.get(&key) {
                    Some(prev_date) => date > *prev_date,
                    None => true,
                };

                if is_later {
                    monthly_max_dates.insert(key, date);
                    monthly_rates.insert(key, rates_obj);
                }
            }
        }
        monthly_rates
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_frankfurter_rates() {
        let mut rates = HashMap::new();

        // Month 1, earlier date
        let mut m1_d1 = HashMap::new();
        m1_d1.insert("EUR".to_string(), 0.8);
        rates.insert("2024-01-01".to_string(), m1_d1);

        // Month 1, later date
        let mut m1_d2 = HashMap::new();
        m1_d2.insert("EUR".to_string(), 0.9);
        rates.insert("2024-01-15".to_string(), m1_d2);

        // Month 2, single date
        let mut m2_d1 = HashMap::new();
        m2_d1.insert("EUR".to_string(), 1.1);
        rates.insert("2024-02-05".to_string(), m2_d1);

        let processed = SyncService::process_frankfurter_rates(rates);

        assert_eq!(processed.len(), 2);
        assert_eq!(processed.get(&(2024, 1)).unwrap().get("EUR").unwrap(), &0.9);
        assert_eq!(processed.get(&(2024, 2)).unwrap().get("EUR").unwrap(), &1.1);
    }

    #[test]
    fn test_process_frankfurter_rates_multi_year() {
        let mut rates = HashMap::new();

        // 2023 data
        let mut m2023_12_01 = HashMap::new();
        m2023_12_01.insert("USD".to_string(), 0.65);
        m2023_12_01.insert("EUR".to_string(), 0.58);
        rates.insert("2023-12-01".to_string(), m2023_12_01);

        let mut m2023_12_15 = HashMap::new();
        m2023_12_15.insert("USD".to_string(), 0.66);
        m2023_12_15.insert("EUR".to_string(), 0.59);
        rates.insert("2023-12-15".to_string(), m2023_12_15);

        // 2024 data
        let mut m2024_01_10 = HashMap::new();
        m2024_01_10.insert("USD".to_string(), 0.62);
        m2024_01_10.insert("EUR".to_string(), 0.57);
        rates.insert("2024-01-10".to_string(), m2024_01_10);

        let mut m2024_02_20 = HashMap::new();
        m2024_02_20.insert("USD".to_string(), 0.63);
        m2024_02_20.insert("EUR".to_string(), 0.56);
        rates.insert("2024-02-20".to_string(), m2024_02_20);

        let mut m2024_03_05 = HashMap::new();
        m2024_03_05.insert("USD".to_string(), 0.61);
        m2024_03_05.insert("EUR".to_string(), 0.55);
        rates.insert("2024-03-05".to_string(), m2024_03_05);

        let processed = SyncService::process_frankfurter_rates(rates);

        assert_eq!(processed.len(), 4);

        assert_eq!(
            processed.get(&(2023, 12)).unwrap().get("USD").unwrap(),
            &0.66
        );
        assert_eq!(
            processed.get(&(2023, 12)).unwrap().get("EUR").unwrap(),
            &0.59
        );

        assert_eq!(
            processed.get(&(2024, 1)).unwrap().get("USD").unwrap(),
            &0.62
        );
        assert_eq!(
            processed.get(&(2024, 1)).unwrap().get("EUR").unwrap(),
            &0.57
        );

        assert_eq!(
            processed.get(&(2024, 2)).unwrap().get("USD").unwrap(),
            &0.63
        );
        assert_eq!(
            processed.get(&(2024, 2)).unwrap().get("EUR").unwrap(),
            &0.56
        );

        assert_eq!(
            processed.get(&(2024, 3)).unwrap().get("USD").unwrap(),
            &0.61
        );
        assert_eq!(
            processed.get(&(2024, 3)).unwrap().get("EUR").unwrap(),
            &0.55
        );
    }

    #[tokio::test]
    async fn test_sync_single_api_call() {
        let pool = crate::test_utils::setup_test_db().await;

        // Setup: Create user settings with home currency
        let _settings = crate::services::user_settings::UserSettingsService::upsert(
            &pool,
            "Test User".to_string(),
            "NZD".to_string(),
            "Light".to_string(),
        )
        .await
        .expect("Failed to create settings");

        // Setup: Create accounts with foreign currencies
        let _account_usd = crate::services::account::AccountService::upsert(
            &pool,
            None,
            "US Bank".to_string(),
            "Asset".to_string(),
            "USD".to_string(),
        )
        .await
        .expect("Failed to create USD account");

        let _account_eur = crate::services::account::AccountService::upsert(
            &pool,
            None,
            "EU Bank".to_string(),
            "Asset".to_string(),
            "EUR".to_string(),
        )
        .await
        .expect("Failed to create EUR account");

        // Setup: Create balance sheets for multiple years
        let _sheet_2022 =
            crate::services::balance_sheet::BalanceSheetService::upsert(&pool, None, 2022)
                .await
                .expect("Failed to create 2022 balance sheet");

        let _sheet_2023 =
            crate::services::balance_sheet::BalanceSheetService::upsert(&pool, None, 2023)
                .await
                .expect("Failed to create 2023 balance sheet");

        let _sheet_2024 =
            crate::services::balance_sheet::BalanceSheetService::upsert(&pool, None, 2024)
                .await
                .expect("Failed to create 2024 balance sheet");

        // Execute sync
        // TODO: Mock API response
        let result = SyncService::sync_exchange_rates(&pool).await;

        // Verify sync completed successfully
        assert!(result.is_ok(), "Sync should succeed");

        // Verify rates were saved for all years (2022, 2023, 2024) and all months
        let all_rates = crate::services::currency_rate::CurrencyRateService::get_all(&pool)
            .await
            .expect("Failed to get rates");

        // We should have rates for USD and EUR from NZD
        let expected_pairs = vec![("USD", "NZD"), ("EUR", "NZD")];

        for (from_currency, to_currency) in &expected_pairs {
            let has_rates = all_rates
                .iter()
                .any(|r| &r.from_currency == *from_currency && &r.to_currency == *to_currency);
            assert!(
                has_rates,
                "Should have rates for {from_currency} -> {to_currency}"
            );
        }
    }
}
