use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub id: String,
    pub name: String,
    pub home_currency: String,
    pub theme: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    pub account_type: String, // 'Asset' or 'Liability'
    pub currency: String,
    pub sort_order: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BalanceSheet {
    pub id: String,
    pub year: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub balance_sheet_id: String,
    pub account_id: String,
    pub month: u32,
    pub amount: f64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CurrencyRate {
    pub id: String,
    pub from_currency: String,
    pub to_currency: String,
    pub rate: f64,
    pub month: u32,
    pub year: i32,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingStep {
    pub step_key: String,
    pub is_completed: bool,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct RetirementPlan {
    pub id: String,
    pub name: String,
    pub target_retirement_date: Option<NaiveDate>,
    pub starting_net_worth: f64,
    pub monthly_contribution: f64,
    pub expected_monthly_expenses: f64,
    pub return_scenario: String,
    pub inflation_rate: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct RetirementPlanProjection {
    pub id: String,
    pub plan_id: String,
    pub year: i32,
    pub month: i32,
    pub projected_net_worth: f64,
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::{RetirementPlan, RetirementPlanProjection};
    use chrono::{NaiveDate, TimeZone, Utc};

    #[test]
    fn retirement_plan_serializes_with_camel_case_keys() {
        let plan = RetirementPlan {
            id: "plan-1".to_string(),
            name: "Baseline".to_string(),
            target_retirement_date: Some(NaiveDate::from_ymd_opt(2045, 1, 1).unwrap()),
            starting_net_worth: 250_000.0,
            monthly_contribution: 1_500.0,
            expected_monthly_expenses: 4_000.0,
            return_scenario: "moderate".to_string(),
            inflation_rate: 2.5,
            created_at: Utc.with_ymd_and_hms(2026, 1, 22, 0, 0, 0).unwrap(),
            updated_at: Utc.with_ymd_and_hms(2026, 1, 22, 0, 0, 0).unwrap(),
        };

        let value = serde_json::to_value(plan).expect("serialize retirement plan");

        assert!(value.get("targetRetirementDate").is_some());
        assert!(value.get("startingNetWorth").is_some());
        assert!(value.get("monthlyContribution").is_some());
        assert!(value.get("expectedMonthlyExpenses").is_some());
        assert!(value.get("returnScenario").is_some());
        assert!(value.get("inflationRate").is_some());
        assert!(value.get("createdAt").is_some());
        assert!(value.get("updatedAt").is_some());
    }

    #[test]
    fn retirement_plan_projection_serializes_with_camel_case_keys() {
        let projection = RetirementPlanProjection {
            id: "proj-1".to_string(),
            plan_id: "plan-1".to_string(),
            year: 2030,
            month: 6,
            projected_net_worth: 350_000.0,
            created_at: Utc.with_ymd_and_hms(2026, 1, 23, 0, 0, 0).unwrap(),
        };

        let value = serde_json::to_value(projection).expect("serialize projection");

        assert!(value.get("id").is_some());
        assert!(value.get("planId").is_some());
        assert!(value.get("year").is_some());
        assert!(value.get("month").is_some());
        assert!(value.get("projectedNetWorth").is_some());
        assert!(value.get("createdAt").is_some());
    }
}
