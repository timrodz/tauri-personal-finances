use crate::services::balance_sheet::BalanceSheetService;
use crate::services::currency_rate::CurrencyRateService;
use crate::services::user_settings::UserSettingsService;
use crate::{models::CurrencyRate, services::account::AccountService};
use chrono::{Datelike, NaiveDate};
use reqwest::Client;
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};

pub const FRANKFURTER_BASE_URL: &str = "https://api.frankfurter.dev/v1";
pub const FRANKFURTER_DATE_FORMAT: &str = "%Y-%m-%d";
pub const DECEMBER: u32 = 12;

#[derive(Deserialize, Debug)]
struct FrankfurterResponse {
    rates: HashMap<String, HashMap<String, f64>>,
}

pub struct SyncService;

impl SyncService {
    fn get_query_url(
        base_url: &str,
        start_date: &str,
        end_date: &str,
        home_currency: &str,
        symbols: &str,
    ) -> String {
        let query_params = format!(
            "{}..{}?base={}&symbols={}",
            start_date, end_date, home_currency, symbols
        );

        format!("{base_url}/{query_params}")
    }

    pub async fn sync_exchange_rates(pool: &SqlitePool) -> Result<bool, String> {
        Self::sync_exchange_rates_with_client_and_url(pool, None, None).await
    }

    pub async fn sync_exchange_rates_with_client_and_url(
        pool: &SqlitePool,
        client: Option<Client>,
        base_url: Option<String>,
    ) -> Result<bool, String> {
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
            return Ok(false);
        }

        // 3. Get Years from Balance Sheets
        let sheets = BalanceSheetService::get_all(pool).await?;
        let years: Vec<i32> = sheets.into_iter().map(|s| s.year).collect();

        if years.is_empty() {
            println!("[Sync] No balance sheets found. Sync skipped.");
            return Ok(false);
        }

        // 4. Existing Rates for Dedup and Finalization Check
        let all_rates = CurrencyRateService::get_all(pool).await?;
        let existing_rates: HashMap<String, CurrencyRate> = all_rates
            .into_iter()
            .map(|rate| {
                let key = format!(
                    "{}-{}-{}-{}",
                    rate.year, rate.month, rate.from_currency, rate.to_currency
                );

                (key, rate)
            })
            .collect();

        let client = match client {
            Some(c) => c,
            None => Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .map_err(|e| format!("Failed to build HTTP client: {e}"))?,
        };
        let today = chrono::Utc::now().naive_utc().date();
        let today_year = today.year();

        let earliest_year = *years.iter().min().unwrap_or(&today_year);
        if earliest_year > today_year {
            println!(
                       "[Sync] Earliest balance sheet year {earliest_year} is in the future. Sync skipped."
                   );
            return Ok(false);
        }
        let foreign_currency_symbols = foreign_currencies.join(",");
        let start_date = format!("{earliest_year}-01-01");
        let end_date = format!("{}", today.format("%Y-%m-%d"));

        let base_url = base_url.unwrap_or(FRANKFURTER_BASE_URL.to_string());
        let query_url = Self::get_query_url(
            &base_url,
            &start_date,
            &end_date,
            home_currency,
            &foreign_currency_symbols,
        );

        println!(
            "[Sync] Fetching rates from {start_date} to {end_date} with base currency: {home_currency}",
        );

        let resp = match client.get(&query_url).send().await {
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
                    Self::process_and_save_rates(pool, data.rates, home_currency, &existing_rates)
                        .await;
            }
            Err(e) => return Err(format!("Failed to parse JSON: {e}")),
        }

        UserSettingsService::set_exchange_sync_needed(pool, false).await?;
        println!("[Sync] Exchange rate sync complete.");
        Ok(true)
    }

    async fn process_and_save_rates(
        pool: &SqlitePool,
        rates: HashMap<String, HashMap<String, f64>>,
        home_currency: &str,
        existing_rates: &HashMap<String, CurrencyRate>,
    ) -> Result<(), String> {
        let monthly_rates = Self::parse_frankfurter_rates_for_most_recent(rates);
        let total_to_process = monthly_rates.values().map(|m| m.len()).sum::<usize>();
        println!("[Sync] Processing {total_to_process} rates...",);

        let mut success_count = 0;
        let mut fail_count = 0;

        // Upsert
        for ((year, month), rates_obj) in monthly_rates {
            // Finalization check
            let last_day = if month == DECEMBER {
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
                let existing_rate_for_end_of_month = match existing_rates.get(&key) {
                    Some(rate) => rate.timestamp.naive_utc().date() > last_day,
                    None => false,
                };
                if existing_rate_for_end_of_month {
                    continue;
                }

                let inverted_rate = 1.0 / rate_in_home;
                let existing_id = existing_rates.get(&key).map(|r| r.id.clone());

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

    /**
     * Finds the most recent date of any given month and returns those currency rates
     * Given {"2024-12-31": {"EUR": 0.5516, "USD": 0.5913}, "2023-06-30": {"EUR": 0.5681, "USD": 0.6089}, "2023-12-31": {"USD": 0.6187, "EUR": 0.5772}, "2022-12-31": {"USD": 0.642, "EUR": 0.5985}, "2024-01-31": {"USD": 0.615, "EUR": 0.5742}, "2022-02-28": {"EUR": 0.5912, "USD": 0.635}, "2024-06-30": {"USD": 0.6098, "EUR": 0.5693}, "2022-01-31": {"USD": 0.6321, "EUR": 0.5891}}
     * Return {(2022, 2): {"EUR": 0.5912, "USD": 0.635}, (2024, 12): {"EUR": 0.5516, "USD": 0.5913}, (2024, 1): {"USD": 0.615, "EUR": 0.5742}, (2023, 6): {"EUR": 0.5681, "USD": 0.6089}, (2023, 12): {"USD": 0.6187, "EUR": 0.5772}, (2022, 12): {"USD": 0.642, "EUR": 0.5985}, (2024, 6): {"USD": 0.6098, "EUR": 0.5693}, (2022, 1): {"USD": 0.6321, "EUR": 0.5891}}
     */
    fn parse_frankfurter_rates_for_most_recent(
        rates: HashMap<String, HashMap<String, f64>>,
    ) -> HashMap<(i32, u32), HashMap<String, f64>> {
        let mut monthly_max_dates: HashMap<(i32, u32), NaiveDate> = HashMap::new();
        let mut monthly_rates: HashMap<(i32, u32), HashMap<String, f64>> = HashMap::new();

        for (date_str, rates_obj) in rates {
            if let Ok(date) = NaiveDate::parse_from_str(&date_str, FRANKFURTER_DATE_FORMAT) {
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
    use wiremock::matchers::{method, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

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

        let processed = SyncService::parse_frankfurter_rates_for_most_recent(rates);

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

        let processed = SyncService::parse_frankfurter_rates_for_most_recent(rates);

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
            None,
        )
        .await
        .expect("Failed to create USD account");

        let _account_eur = crate::services::account::AccountService::upsert(
            &pool,
            None,
            "EU Bank".to_string(),
            "Asset".to_string(),
            "EUR".to_string(),
            None,
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

        // Setup mock server with realistic fixture data
        let mock_body = r#"{
            "rates": {
                "2022-01-31": {"USD": 0.6321, "EUR": 0.5891},
                "2022-02-28": {"USD": 0.6350, "EUR": 0.5912},
                "2022-12-31": {"USD": 0.6420, "EUR": 0.5985},
                "2023-06-30": {"USD": 0.6089, "EUR": 0.5681},
                "2023-12-31": {"USD": 0.6187, "EUR": 0.5772},
                "2024-01-31": {"USD": 0.6150, "EUR": 0.5742},
                "2024-06-30": {"USD": 0.6098, "EUR": 0.5693},
                "2024-12-31": {"USD": 0.5913, "EUR": 0.5516}
            }
        }"#;
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(query_param("base", "NZD"))
            .respond_with(ResponseTemplate::new(200).set_body_raw(mock_body, "application/json"))
            .mount(&mock_server)
            .await;

        let test_client = Client::new();
        let test_base_url = mock_server.uri();

        let result = SyncService::sync_exchange_rates_with_client_and_url(
            &pool,
            Some(test_client),
            Some(test_base_url),
        )
        .await;

        assert!(
            matches!(result, Ok(true)),
            "Sync should succeed: {:?}",
            result
        );

        let all_rates = crate::services::currency_rate::CurrencyRateService::get_all(&pool)
            .await
            .expect("Failed to get rates");

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
