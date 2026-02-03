use crate::services::balance_sheet::BalanceSheetService;
use crate::services::currency_rates::currency_rate::CurrencyRateService;
use crate::services::currency_rates::sync_frankfurter::FrankfurterProvider;
use crate::services::user_settings::UserSettingsService;
use crate::{models::CurrencyRate, services::account::AccountService};
use chrono::NaiveDate;
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};

pub const DECEMBER: u32 = 12;

#[derive(Debug, Clone, Copy)]
pub(crate) enum ProviderKind {
    Frankfurter,
}

impl ProviderKind {
    fn as_str(self) -> &'static str {
        match self {
            ProviderKind::Frankfurter => "frankfurter",
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct ProviderApiResponse {
    pub rates: HashMap<String, HashMap<String, f64>>,
}

#[derive(Debug)]
pub(crate) struct SyncInputs {
    pub(crate) home_currency: String,
    pub(crate) foreign_currencies: Vec<String>,
    pub(crate) years: Vec<i32>,
    pub(crate) existing_rates: HashMap<String, CurrencyRate>,
}

#[derive(Debug, Clone)]
pub(crate) struct ProviderRate {
    pub(crate) year: i32,
    pub(crate) month: u32,
    pub(crate) currency: String,
    pub(crate) value: f64,
}

impl PartialEq for ProviderRate {
    fn eq(&self, other: &Self) -> bool {
        self.year == other.year && self.month == other.month && self.currency == other.currency
    }
}

impl Eq for ProviderRate {}

impl std::hash::Hash for ProviderRate {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.year.hash(state);
        self.month.hash(state);
        self.currency.hash(state);
    }
}

#[derive(Debug)]
pub(crate) struct ProviderRates {
    pub(crate) provider: ProviderKind,
    pub(crate) rates: HashSet<ProviderRate>,
}

pub struct SyncService;

impl SyncService {
    pub async fn sync_exchange_rates(pool: &SqlitePool) -> Result<bool, String> {
        println!("[Sync] Starting exchange rate sync...");

        // A) Gather inputs
        let inputs = Self::gather_sync_inputs(pool).await?;

        // B/C/D) Provider-specific fetching and parsing
        let mut provider_rates = Vec::new();
        for provider in Self::provider_candidates() {
            match provider {
                ProviderKind::Frankfurter => {
                    if let Some(rates) = FrankfurterProvider::fetch_provider_rates(&inputs).await? {
                        provider_rates.push(rates);
                    }
                }
            }
        }

        if provider_rates.is_empty() {
            return Ok(false);
        }

        // E) Ingest per provider using generic interface
        for parsed in provider_rates {
            Self::ingest_provider_rates(pool, &parsed, &inputs).await?;
        }

        UserSettingsService::set_exchange_sync_needed(pool, false).await?;
        println!("[Sync] Exchange rate sync complete.");
        Ok(true)
    }

    async fn gather_sync_inputs(pool: &SqlitePool) -> Result<SyncInputs, String> {
        // Home currency
        let settings_list = UserSettingsService::get_all(pool).await?;
        let settings = settings_list.first().ok_or("User settings not found")?;
        let home_currency = settings.home_currency.clone();

        // Foreign currencies from accounts
        let accounts = AccountService::get_all(pool, true).await?;
        let foreign_currencies: Vec<String> = accounts
            .into_iter()
            .map(|a| a.currency)
            .filter(|c| c != &home_currency)
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();

        // Balance sheet years
        let sheets = BalanceSheetService::get_all(pool).await?;
        let years: Vec<i32> = sheets.into_iter().map(|s| s.year).collect();

        // Existing rates for dedup/finalization
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

        Ok(SyncInputs {
            home_currency,
            foreign_currencies,
            years,
            existing_rates,
        })
    }

    fn provider_candidates() -> Vec<ProviderKind> {
        vec![ProviderKind::Frankfurter]
    }

    async fn ingest_provider_rates(
        pool: &SqlitePool,
        parsed: &ProviderRates,
        inputs: &SyncInputs,
    ) -> Result<(), String> {
        let provider = parsed.provider;
        let rates_list = &parsed.rates;
        let home_currency = &inputs.home_currency;
        let existing_rates = &inputs.existing_rates;
        let total_to_process = rates_list.len();
        println!(
            "[Sync] Processing {total_to_process} rates (provider: {})...",
            provider.as_str()
        );

        let mut success_count = 0;
        let mut fail_count = 0;

        for rate in rates_list {
            let year = rate.year;
            let month = rate.month;

            //
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

            let foreign = &rate.currency;
            let rate_in_home = rate.value;

            let key = format!("{year}-{month}-{foreign}-{home_currency}");
            let existing_rate_for_end_of_month = match existing_rates.get(&key) {
                Some(rate) => rate.timestamp.naive_utc().date() > last_day,
                None => false,
            };
            if existing_rate_for_end_of_month {
                continue;
            }

            let inverted_rate = if rate_in_home == 0.0 {
                0.0
            } else {
                1.0 / rate_in_home
            };

            println!(
                "[Sync] Upserting rate for {month:02}/{year} ({foreign}->{home_currency}): {inverted_rate}",
            );

            let existing_id = existing_rates.get(&key).map(|r| r.id.clone());
            match CurrencyRateService::upsert(
                pool,
                existing_id,
                foreign.clone(),
                home_currency.to_string(),
                provider.as_str().to_string(),
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
                        "[Sync] Failed to upsert rate for {month:02}/{year} ({foreign}->{home_currency}): {e}",
                    );
                }
            }
        }
        println!("[Sync] Sync complete: {success_count} upserted, {fail_count} failed.");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::services::currency_rates::currency_rate::CurrencyRateService;

    use super::*;
    use wiremock::matchers::{method, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn test_frankfurter_single_api_call() {
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

        let result = SyncService::sync_exchange_rates(&pool).await;

        assert!(
            matches!(result, Ok(true)),
            "Sync should succeed: {:?}",
            result
        );

        let all_rates = CurrencyRateService::get_all(&pool)
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
