use chrono::{Datelike, Duration, Local, NaiveDate};
use serde::{Deserialize, Serialize};

pub const RETURN_SCENARIO_CONSERVATIVE: &str = "conservative";
pub const RETURN_SCENARIO_MODERATE: &str = "moderate";
pub const RETURN_SCENARIO_AGGRESSIVE: &str = "aggressive";

pub const RETURN_RATE_CONSERVATIVE: f64 = 0.04;
pub const RETURN_RATE_MODERATE: f64 = 0.07;
pub const RETURN_RATE_AGGRESSIVE: f64 = 0.10;

pub const WITHDRAWAL_RATE_LOW: f64 = 0.03;
pub const WITHDRAWAL_RATE_HIGH: f64 = 0.04;

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RetirementProjection {
    pub projected_retirement_date: Option<NaiveDate>,
    pub years_to_retirement: f64,
    pub final_net_worth: f64,
    pub monthly_income_3pct: f64,
    pub monthly_income_4pct: f64,
    pub inflation_adjusted_expenses: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ProjectionDataPoint {
    pub year: i32,
    pub month: i32,
    pub projected_net_worth: f64,
}

pub struct RetirementService;

impl RetirementService {
    pub fn inflation_adjusted_expenses(
        expected_monthly_expenses: f64,
        inflation_rate: f64,
        years: f64,
    ) -> f64 {
        if expected_monthly_expenses <= 0.0 || inflation_rate == 0.0 || years <= 0.0 {
            return expected_monthly_expenses;
        }

        expected_monthly_expenses * (1.0 + inflation_rate).powf(years)
    }

    pub fn annual_return_rate(scenario: &str) -> Result<f64, String> {
        match scenario {
            RETURN_SCENARIO_CONSERVATIVE => Ok(RETURN_RATE_CONSERVATIVE),
            RETURN_SCENARIO_MODERATE => Ok(RETURN_RATE_MODERATE),
            RETURN_SCENARIO_AGGRESSIVE => Ok(RETURN_RATE_AGGRESSIVE),
            _ => Err(format!("Unknown return scenario: {scenario}")),
        }
    }

    pub fn compound_growth_future_value(
        starting_net_worth: f64,
        monthly_contribution: f64,
        annual_return_rate: f64,
        years: f64,
    ) -> f64 {
        if years <= 0.0 {
            return starting_net_worth;
        }

        let annual_contribution = monthly_contribution * 12.0;

        if annual_return_rate.abs() < f64::EPSILON {
            return starting_net_worth + annual_contribution * years;
        }

        let growth_factor = (1.0 + annual_return_rate).powf(years);
        starting_net_worth * growth_factor
            + annual_contribution * ((growth_factor - 1.0) / annual_return_rate)
    }

    pub fn monthly_income_from_withdrawal(net_worth: f64, withdrawal_rate: f64) -> f64 {
        net_worth * withdrawal_rate / 12.0
    }

    pub fn target_net_worth(expected_monthly_expenses: f64, withdrawal_rate: f64) -> Option<f64> {
        if expected_monthly_expenses <= 0.0 || withdrawal_rate <= 0.0 {
            return None;
        }

        Some(expected_monthly_expenses * 12.0 / withdrawal_rate)
    }

    fn years_to_target_net_worth(
        starting_net_worth: f64,
        monthly_contribution: f64,
        target_net_worth: f64,
        annual_return_rate: f64,
    ) -> Option<f64> {
        if target_net_worth <= 0.0 {
            return None;
        }

        if starting_net_worth >= target_net_worth {
            return Some(0.0);
        }

        let annual_contribution = monthly_contribution * 12.0;

        if annual_return_rate.abs() < f64::EPSILON {
            if annual_contribution <= 0.0 {
                return None;
            }
            return Some((target_net_worth - starting_net_worth) / annual_contribution);
        }

        let contribution_factor = annual_contribution / annual_return_rate;
        let numerator = target_net_worth + contribution_factor;
        let denominator = starting_net_worth + contribution_factor;

        if numerator <= 0.0 || denominator <= 0.0 {
            return None;
        }

        let years = (numerator / denominator).ln() / (1.0 + annual_return_rate).ln();

        if !years.is_finite() || years < 0.0 {
            return None;
        }

        Some(years)
    }

    pub fn years_to_retirement(
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        withdrawal_rate: f64,
        annual_return_rate: f64,
    ) -> Option<f64> {
        Self::years_to_retirement_with_inflation(
            starting_net_worth,
            monthly_contribution,
            expected_monthly_expenses,
            withdrawal_rate,
            annual_return_rate,
            0.0,
        )
    }

    pub fn years_to_retirement_with_inflation(
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        withdrawal_rate: f64,
        annual_return_rate: f64,
        inflation_rate: f64,
    ) -> Option<f64> {
        let base_target = Self::target_net_worth(expected_monthly_expenses, withdrawal_rate)?;

        if inflation_rate == 0.0 {
            return Self::years_to_target_net_worth(
                starting_net_worth,
                monthly_contribution,
                base_target,
                annual_return_rate,
            );
        }

        let mut years = Self::years_to_target_net_worth(
            starting_net_worth,
            monthly_contribution,
            base_target,
            annual_return_rate,
        )?;

        for _ in 0..20 {
            let adjusted_expenses =
                Self::inflation_adjusted_expenses(expected_monthly_expenses, inflation_rate, years);
            let adjusted_target = Self::target_net_worth(adjusted_expenses, withdrawal_rate)?;
            let next_years = Self::years_to_target_net_worth(
                starting_net_worth,
                monthly_contribution,
                adjusted_target,
                annual_return_rate,
            )?;

            if (next_years - years).abs() < 1e-4 {
                return Some(next_years);
            }

            years = next_years;
        }

        Some(years)
    }

    pub fn monthly_income_3pct(net_worth: f64) -> f64 {
        Self::monthly_income_from_withdrawal(net_worth, WITHDRAWAL_RATE_LOW)
    }

    pub fn monthly_income_4pct(net_worth: f64) -> f64 {
        Self::monthly_income_from_withdrawal(net_worth, WITHDRAWAL_RATE_HIGH)
    }

    pub fn income_meets_expenses(
        monthly_income: f64,
        expected_monthly_expenses: f64,
        inflation_rate: f64,
        years: f64,
    ) -> bool {
        let adjusted_expenses =
            Self::inflation_adjusted_expenses(expected_monthly_expenses, inflation_rate, years);
        monthly_income >= adjusted_expenses
    }

    pub fn calculate_projection(
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        return_scenario: &str,
        target_retirement_year: Option<i32>,
        inflation_rate: f64,
    ) -> Result<RetirementProjection, String> {
        let annual_return_rate = Self::annual_return_rate(return_scenario)?;
        let today = Local::now().date_naive();
        let target_retirement_date = match target_retirement_year {
            Some(year) => NaiveDate::from_ymd_opt(year, 1, 1),
            None => None,
        };

        // If target date is set, use it; otherwise calculate earliest possible retirement date
        let (years_to_retirement, projected_retirement_date) = match target_retirement_date {
            Some(target_date) => {
                // Target date mode: calculate years from today to target date
                let days_diff = (target_date - today).num_days();
                let years = if days_diff <= 0 {
                    0.0
                } else {
                    days_diff as f64 / 365.25
                };
                let date = if years <= 0.0 {
                    None
                } else {
                    Some(target_date)
                };
                (years, date)
            }
            None => {
                // Discovery mode: find earliest possible retirement date
                let years = Self::years_to_retirement_with_inflation(
                    starting_net_worth,
                    monthly_contribution,
                    expected_monthly_expenses,
                    WITHDRAWAL_RATE_LOW,
                    annual_return_rate,
                    inflation_rate,
                )
                .ok_or_else(|| {
                    "Retirement goal is not achievable with current inputs".to_string()
                })?;

                let date = if years <= 0.0 {
                    None
                } else {
                    let days = (years * 365.25).round() as i64;
                    Some(today + Duration::days(days))
                };
                (years, date)
            }
        };

        let final_net_worth = Self::compound_growth_future_value(
            starting_net_worth,
            monthly_contribution,
            annual_return_rate,
            years_to_retirement,
        );
        let monthly_income_3pct = Self::monthly_income_3pct(final_net_worth);
        let monthly_income_4pct = Self::monthly_income_4pct(final_net_worth);
        let inflation_adjusted_expenses = Self::inflation_adjusted_expenses(
            expected_monthly_expenses,
            inflation_rate,
            years_to_retirement,
        );

        Ok(RetirementProjection {
            projected_retirement_date,
            years_to_retirement,
            final_net_worth,
            monthly_income_3pct,
            monthly_income_4pct,
            inflation_adjusted_expenses,
        })
    }

    pub fn generate_projection_data_points(
        starting_net_worth: f64,
        monthly_contribution: f64,
        annual_return_rate: f64,
        retirement_date: NaiveDate,
    ) -> Vec<ProjectionDataPoint> {
        let today = Local::now().date_naive();
        let mut data_points = Vec::new();

        if retirement_date <= today {
            return vec![ProjectionDataPoint {
                year: today.year(),
                month: today.month() as i32,
                projected_net_worth: starting_net_worth,
            }];
        }

        let monthly_return_rate = (1.0 + annual_return_rate).powf(1.0 / 12.0) - 1.0;
        let mut current_net_worth = starting_net_worth;
        let mut current_date = today;

        while current_date <= retirement_date {
            data_points.push(ProjectionDataPoint {
                year: current_date.year(),
                month: current_date.month() as i32,
                projected_net_worth: current_net_worth,
            });

            current_net_worth =
                current_net_worth * (1.0 + monthly_return_rate) + monthly_contribution;

            let next_month = if current_date.month() == 12 {
                NaiveDate::from_ymd_opt(current_date.year() + 1, 1, 1)
            } else {
                NaiveDate::from_ymd_opt(current_date.year(), current_date.month() + 1, 1)
            };

            match next_month {
                Some(d) => current_date = d,
                None => break,
            }
        }

        data_points
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn annual_return_rate_maps_scenarios() {
        assert_eq!(
            RetirementService::annual_return_rate(RETURN_SCENARIO_CONSERVATIVE).unwrap(),
            RETURN_RATE_CONSERVATIVE
        );
        assert_eq!(
            RetirementService::annual_return_rate(RETURN_SCENARIO_MODERATE).unwrap(),
            RETURN_RATE_MODERATE
        );
        assert_eq!(
            RetirementService::annual_return_rate(RETURN_SCENARIO_AGGRESSIVE).unwrap(),
            RETURN_RATE_AGGRESSIVE
        );
    }

    #[test]
    fn compound_growth_handles_zero_return_rate() {
        let future = RetirementService::compound_growth_future_value(10_000.0, 500.0, 0.0, 2.0);
        let expected = 10_000.0 + 500.0 * 12.0 * 2.0;
        assert!((future - expected).abs() < 0.001);
    }

    #[test]
    fn compound_growth_matches_known_values() {
        let future = RetirementService::compound_growth_future_value(10_000.0, 100.0, 0.10, 1.0);
        let expected = 12_200.0;
        assert!((future - expected).abs() < 0.001);
    }

    #[test]
    fn monthly_income_withdrawal_rates_match_expected() {
        let net_worth = 1_200_000.0;
        assert!((RetirementService::monthly_income_3pct(net_worth) - 3_000.0).abs() < 0.001);
        assert!((RetirementService::monthly_income_4pct(net_worth) - 4_000.0).abs() < 0.001);
    }

    #[test]
    fn inflation_adjusted_expenses_compounds_over_time() {
        let adjusted = RetirementService::inflation_adjusted_expenses(1_000.0, 0.03, 2.0);
        let expected = 1_000.0 * 1.03_f64.powf(2.0);
        assert!((adjusted - expected).abs() < 0.001);
    }

    #[test]
    fn income_meets_expenses_accounts_for_inflation() {
        let meets = RetirementService::income_meets_expenses(4_000.0, 3_500.0, 0.05, 10.0);
        assert!(!meets);
    }

    #[test]
    fn compound_growth_applies_all_return_scenarios() {
        let base = 10_000.0;
        let years = 1.0;
        let conservative = RetirementService::compound_growth_future_value(
            base,
            0.0,
            RETURN_RATE_CONSERVATIVE,
            years,
        );
        let moderate =
            RetirementService::compound_growth_future_value(base, 0.0, RETURN_RATE_MODERATE, years);
        let aggressive = RetirementService::compound_growth_future_value(
            base,
            0.0,
            RETURN_RATE_AGGRESSIVE,
            years,
        );

        assert!((conservative - 10_400.0).abs() < 0.001);
        assert!((moderate - 10_700.0).abs() < 0.001);
        assert!((aggressive - 11_000.0).abs() < 0.001);
    }

    #[test]
    fn years_to_retirement_returns_zero_when_already_achievable() {
        let years =
            RetirementService::years_to_retirement(1_000_000.0, 0.0, 3_000.0, 0.04, 0.07).unwrap();
        assert!((years - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn years_to_retirement_with_inflation_increases_target() {
        let base_years =
            RetirementService::years_to_retirement(50_000.0, 500.0, 3_000.0, 0.04, 0.07).unwrap();
        let inflated_years = RetirementService::years_to_retirement_with_inflation(
            50_000.0, 500.0, 3_000.0, 0.04, 0.07, 0.03,
        )
        .unwrap();

        assert!(inflated_years >= base_years);
    }

    #[test]
    fn calculate_projection_returns_expected_values_for_already_achievable() {
        let projection = RetirementService::calculate_projection(
            1_200_000.0,
            0.0,
            3_000.0,
            RETURN_SCENARIO_MODERATE,
            None,
            0.0,
        )
        .expect("projection");

        assert_eq!(projection.years_to_retirement, 0.0);
        assert_eq!(projection.projected_retirement_date, None);
        assert!((projection.final_net_worth - 1_200_000.0).abs() < 0.001);
        assert!((projection.monthly_income_3pct - 3_000.0).abs() < 0.001);
        assert!((projection.monthly_income_4pct - 4_000.0).abs() < 0.001);
        assert!((projection.inflation_adjusted_expenses - 3_000.0).abs() < 0.001);
    }

    #[test]
    fn calculate_projection_discovery_mode_returns_date_for_future_retirement() {
        let projection = RetirementService::calculate_projection(
            50_000.0,
            500.0,
            3_000.0,
            RETURN_SCENARIO_CONSERVATIVE,
            None,
            0.0,
        )
        .expect("projection");

        assert!(projection.years_to_retirement > 0.0);
        let today = Local::now().date_naive();
        assert!(
            projection
                .projected_retirement_date
                .expect("projection date")
                >= today
        );
    }

    #[test]
    fn calculate_projection_discovery_mode_uses_3pct_rule() {
        // Annual expenses: 30,000
        // Target 4% rule: 750,000
        // Target 3% rule: 1,000,000
        // Starting net worth: 800,000
        //
        // If reusing 4% rule -> 800k > 750k -> 0 years to retirement
        // If reusing 3% rule -> 800k < 1M -> >0 years to retirement

        let projection = RetirementService::calculate_projection(
            800_000.0,
            1_000.0, // Some contribution to ensure it's not infinite if we fail check
            2_500.0, // 30k / year
            RETURN_SCENARIO_MODERATE,
            None,
            0.0,
        )
        .expect("projection");

        // Should return years > 0 because 800k is not enough for 3% rule (needs 1M)
        assert!(projection.years_to_retirement > 0.0);
        assert!((projection.final_net_worth - 1_000_000.0).abs() < 1000.0);
    }

    #[test]
    fn calculate_projection_target_date_mode_uses_specified_date() {
        let today = Local::now().date_naive();
        let target_date = NaiveDate::from_ymd_opt(today.year() + 10, 6, 15).unwrap();

        let projection = RetirementService::calculate_projection(
            100_000.0,
            1_000.0,
            3_000.0,
            RETURN_SCENARIO_MODERATE,
            Some(target_date.year()),
            0.0,
        )
        .expect("projection");

        assert_eq!(
            projection.projected_retirement_date.unwrap().year(),
            target_date.year()
        );
        assert!(projection.years_to_retirement > 9.0 && projection.years_to_retirement < 11.0);
        assert!(projection.final_net_worth > 100_000.0);
    }

    #[test]
    fn calculate_projection_target_date_mode_past_date_returns_zero_years() {
        let today = Local::now().date_naive();
        let past_date = today - Duration::days(30);

        let projection = RetirementService::calculate_projection(
            100_000.0,
            1_000.0,
            3_000.0,
            RETURN_SCENARIO_MODERATE,
            Some(past_date.year()),
            0.0,
        )
        .expect("projection");

        assert_eq!(projection.years_to_retirement, 0.0);
        assert_eq!(projection.projected_retirement_date, None);
        assert!((projection.final_net_worth - 100_000.0).abs() < 0.001);
    }

    #[test]
    fn calculate_projection_target_date_mode_calculates_correct_net_worth() {
        let today = Local::now().date_naive();
        let target_date = NaiveDate::from_ymd_opt(today.year() + 1, today.month(), today.day())
            .unwrap_or_else(|| {
                NaiveDate::from_ymd_opt(today.year() + 1, today.month(), 28).unwrap()
            });

        let projection = RetirementService::calculate_projection(
            10_000.0,
            100.0,
            3_000.0,
            RETURN_SCENARIO_AGGRESSIVE,
            Some(target_date.year()),
            0.0,
        )
        .expect("projection");

        // Target date mode uses Jan 1 of the target year.
        let target_date = NaiveDate::from_ymd_opt(target_date.year(), 1, 1).unwrap();
        let days_diff = (target_date - today).num_days();
        let years = if days_diff <= 0 {
            0.0
        } else {
            days_diff as f64 / 365.25
        };

        let growth_factor = (1.0 + RETURN_RATE_AGGRESSIVE).powf(years);
        let expected =
            10_000.0 * growth_factor + 1_200.0 * ((growth_factor - 1.0) / RETURN_RATE_AGGRESSIVE);

        assert!((projection.final_net_worth - expected).abs() < 1.0);
    }

    #[test]
    fn calculate_projection_returns_inflation_adjusted_expenses() {
        let projection = RetirementService::calculate_projection(
            200_000.0,
            500.0,
            2_500.0,
            RETURN_SCENARIO_MODERATE,
            None,
            0.03,
        )
        .expect("projection");

        assert!(projection.years_to_retirement >= 0.0);
        assert!(projection.inflation_adjusted_expenses >= 2_500.0);
    }

    #[test]
    fn generate_projection_data_points_returns_single_point_for_past_date() {
        let today = Local::now().date_naive();
        let past_date = today - Duration::days(30);

        let points =
            RetirementService::generate_projection_data_points(100_000.0, 1_000.0, 0.07, past_date);

        assert_eq!(points.len(), 1);
        assert_eq!(points[0].year, today.year());
        assert_eq!(points[0].month, today.month() as i32);
        assert!((points[0].projected_net_worth - 100_000.0).abs() < 0.001);
    }

    #[test]
    fn generate_projection_data_points_creates_monthly_points() {
        let today = Local::now().date_naive();
        let retirement_date = NaiveDate::from_ymd_opt(today.year() + 1, today.month(), 1).unwrap();

        let points = RetirementService::generate_projection_data_points(
            100_000.0,
            1_000.0,
            0.07,
            retirement_date,
        );

        assert!(points.len() >= 12);
        assert_eq!(points[0].projected_net_worth, 100_000.0);
        assert!(points.last().unwrap().projected_net_worth > 100_000.0);
    }

    #[test]
    fn generate_projection_data_points_applies_growth_over_time() {
        let today = Local::now().date_naive();
        let next_month = if today.month() == 12 {
            NaiveDate::from_ymd_opt(today.year() + 1, 2, 1).unwrap()
        } else if today.month() == 11 {
            NaiveDate::from_ymd_opt(today.year() + 1, 1, 1).unwrap()
        } else {
            NaiveDate::from_ymd_opt(today.year(), today.month() + 2, 1).unwrap()
        };

        let points = RetirementService::generate_projection_data_points(
            100_000.0, 1_000.0, 0.12, next_month,
        );

        assert!(points.len() >= 2);
        assert!(points[1].projected_net_worth > points[0].projected_net_worth);
    }
}
