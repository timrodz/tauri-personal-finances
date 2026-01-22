pub const RETURN_SCENARIO_CONSERVATIVE: &str = "conservative";
pub const RETURN_SCENARIO_MODERATE: &str = "moderate";
pub const RETURN_SCENARIO_AGGRESSIVE: &str = "aggressive";

pub const RETURN_RATE_CONSERVATIVE: f64 = 0.04;
pub const RETURN_RATE_MODERATE: f64 = 0.07;
pub const RETURN_RATE_AGGRESSIVE: f64 = 0.10;

pub const WITHDRAWAL_RATE_LOW: f64 = 0.03;
pub const WITHDRAWAL_RATE_HIGH: f64 = 0.04;

pub struct RetirementService;

impl RetirementService {
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

    pub fn years_to_retirement(
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        withdrawal_rate: f64,
        annual_return_rate: f64,
    ) -> Option<f64> {
        let target = Self::target_net_worth(expected_monthly_expenses, withdrawal_rate)?;

        if starting_net_worth >= target {
            return Some(0.0);
        }

        let annual_contribution = monthly_contribution * 12.0;

        if annual_return_rate.abs() < f64::EPSILON {
            if annual_contribution <= 0.0 {
                return None;
            }
            return Some((target - starting_net_worth) / annual_contribution);
        }

        let contribution_factor = annual_contribution / annual_return_rate;
        let numerator = target + contribution_factor;
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

    pub fn monthly_income_3pct(net_worth: f64) -> f64 {
        Self::monthly_income_from_withdrawal(net_worth, WITHDRAWAL_RATE_LOW)
    }

    pub fn monthly_income_4pct(net_worth: f64) -> f64 {
        Self::monthly_income_from_withdrawal(net_worth, WITHDRAWAL_RATE_HIGH)
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
}
