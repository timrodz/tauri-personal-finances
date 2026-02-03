use chrono::{Datelike, NaiveDate};
use reqwest::Client;
use std::collections::{HashMap, HashSet};

use crate::services::currency_rates::sync::{
    ProviderApiResponse, ProviderKind, ProviderRate, ProviderRates, SyncInputs,
};

const FRANKFURTER_BASE_URL: &str = "https://api.frankfurter.dev/v1";
const FRANKFURTER_DATE_FORMAT: &str = "%Y-%m-%d";
const SUPPORTED_CURRENCIES: &[&str] = &[
    "AUD", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS",
    "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD",
    "THB", "TRY", "USD", "ZAR",
];

/**
 * Finds the most recent date of any given month and returns those currency rates
 * Given {"2024-12-31": {"EUR": 0.5516, "USD": 0.5913}, ...}
 * Return {ProviderRate(2024, 12, "EUR", 0.5516), ...}
 */
pub struct FrankfurterProvider;

impl FrankfurterProvider {
    pub async fn fetch_provider_rates(
        inputs: &SyncInputs,
    ) -> Result<Option<ProviderRates>, String> {
        if inputs.foreign_currencies.is_empty() {
            println!("[Sync::Frankfurter] No foreign currencies found. Sync skipped.");
            return Ok(None);
        }

        if inputs.years.is_empty() {
            println!("[Sync::Frankfurter] No balance sheets found. Sync skipped.");
            return Ok(None);
        }

        if !Self::is_supported_currency(&inputs.home_currency) {
            println!(
                "[Sync::Frankfurter] Home currency {} is not supported by Frankfurter. Skipping provider.",
                inputs.home_currency
            );
            return Ok(None);
        }

        let (supported, unsupported) =
            Self::split_supported_currencies(inputs.foreign_currencies.clone());
        if !unsupported.is_empty() {
            println!(
                "[Sync::Frankfurter] Skipping unsupported Frankfurter currencies: {}",
                unsupported.join(", ")
            );
        }

        if supported.is_empty() {
            println!(
                "[Sync::Frankfurter] No Frankfurter-supported foreign currencies found. Skipping provider."
            );
            return Ok(None);
        }

        let today = chrono::Utc::now().naive_utc().date();
        let today_year = today.year();
        let earliest_year = *inputs.years.iter().min().unwrap_or(&today_year);
        if earliest_year > today_year {
            println!(
                "[Sync::Frankfurter] Earliest balance sheet year {earliest_year} is in the future. Sync skipped."
            );
            return Ok(None);
        }

        let start_date = format!("{earliest_year}-01-01");
        let end_date = format!("{}", today.format("%Y-%m-%d"));
        let symbols = supported.join(",");
        let home_currency = &inputs.home_currency;

        println!(
            "[Sync::Frankfurter] Fetching rates for {symbols} from {start_date}..{end_date} with base currency: {home_currency}",
        );

        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

        let request_url =
            format!("{FRANKFURTER_BASE_URL}/{start_date}..{end_date}?base={home_currency}&symbols={symbols}");

        let resp = match client.get(&request_url).send().await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[Sync::Frankfurter] Request error: {e}");
                return Err(format!("Request error: {e}"));
            }
        };

        if !resp.status().is_success() {
            eprintln!("[Sync::Frankfurter] API error: Status {:?}", resp.status());
            return Err(format!("API error: {}", resp.status()));
        }

        match resp.json::<ProviderApiResponse>().await {
            Ok(data) => Ok(Some(ProviderRates {
                provider: ProviderKind::Frankfurter,
                rates: Self::parse_rates_for_most_recent(data.rates),
            })),
            Err(e) => Err(format!("Failed to parse JSON: {e}")),
        }
    }

    fn is_supported_currency(currency: &str) -> bool {
        SUPPORTED_CURRENCIES.contains(&currency)
    }

    fn split_supported_currencies(currencies: Vec<String>) -> (Vec<String>, Vec<String>) {
        let mut supported = Vec::new();
        let mut unsupported = Vec::new();

        for currency in currencies {
            if Self::is_supported_currency(&currency) {
                supported.push(currency);
            } else {
                unsupported.push(currency);
            }
        }

        (supported, unsupported)
    }

    /**
     * Finds the most recent date of any given month and returns those currency rates
     * Given {"2024-12-31": {"EUR": 0.5516, "USD": 0.5913}, ...}
     * Return {ProviderRate(2024, 12, "EUR", 0.5516), ...}
     */
    fn parse_rates_for_most_recent(
        rates: HashMap<String, HashMap<String, f64>>,
    ) -> HashSet<ProviderRate> {
        let mut best_for_month: HashMap<(i32, u32), (NaiveDate, HashMap<String, f64>)> =
            HashMap::new();

        for (date_str, rates_map) in rates {
            if let Ok(date) = NaiveDate::parse_from_str(&date_str, FRANKFURTER_DATE_FORMAT) {
                let key = (date.year(), date.month());

                let is_newer = match best_for_month.get(&key) {
                    Some((prev_date, _)) => date > *prev_date,
                    None => true,
                };

                if is_newer {
                    best_for_month.insert(key, (date, rates_map));
                }
            }
        }

        best_for_month
            .into_iter()
            .flat_map(|((year, month), (_, rates_map))| {
                rates_map
                    .into_iter()
                    .map(move |(currency, value)| ProviderRate {
                        year,
                        month,
                        currency,
                        value,
                    })
            })
            .collect()
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

        let processed = FrankfurterProvider::parse_rates_for_most_recent(rates);

        assert_eq!(processed.len(), 2);

        // Find EUR in Jan (month 1)
        let rate_jan = processed
            .iter()
            .find(|r| r.year == 2024 && r.month == 1 && r.currency == "EUR");
        assert!(rate_jan.is_some());
        assert_eq!(rate_jan.unwrap().value, 0.9);

        // Find EUR in Feb (month 2)
        let rate_feb = processed
            .iter()
            .find(|r| r.year == 2024 && r.month == 2 && r.currency == "EUR");
        assert!(rate_feb.is_some());
        assert_eq!(rate_feb.unwrap().value, 1.1);
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

        let processed = FrankfurterProvider::parse_rates_for_most_recent(rates);

        // 4 months x 2 currencies = 8 rates
        assert_eq!(processed.len(), 8);

        // Check a few specific values
        let find_rate = |year, month, curr| {
            processed
                .iter()
                .find(|r| r.year == year && r.month == month && r.currency == curr)
                .map(|r| r.value)
        };

        // 2023-12 (from Dec 15th)
        assert_eq!(find_rate(2023, 12, "USD"), Some(0.66));
        assert_eq!(find_rate(2023, 12, "EUR"), Some(0.59));

        // 2024-01
        assert_eq!(find_rate(2024, 1, "USD"), Some(0.62));
        assert_eq!(find_rate(2024, 1, "EUR"), Some(0.57));

        // 2024-02
        assert_eq!(find_rate(2024, 2, "USD"), Some(0.63));
        assert_eq!(find_rate(2024, 2, "EUR"), Some(0.56));

        // 2024-03
        assert_eq!(find_rate(2024, 3, "USD"), Some(0.61));
        assert_eq!(find_rate(2024, 3, "EUR"), Some(0.55));
    }
}
