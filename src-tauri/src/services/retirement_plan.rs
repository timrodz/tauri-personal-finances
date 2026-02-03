use crate::models::RetirementPlan;
use chrono::NaiveDate;
use sqlx::{Executor, Sqlite, SqlitePool};
use uuid::Uuid;

pub struct RetirementPlanService;

impl RetirementPlanService {
    #[allow(dead_code)]
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        target_retirement_year: Option<i32>,
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        return_scenario: String,
        inflation_rate: f64,
    ) -> Result<RetirementPlan, String> {
        Self::create_with_executor(
            pool,
            name,
            target_retirement_year,
            starting_net_worth,
            monthly_contribution,
            expected_monthly_expenses,
            return_scenario,
            inflation_rate,
        )
        .await
    }

    pub async fn create_with_executor<'e, E>(
        executor: E,
        name: String,
        target_retirement_year: Option<i32>,
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        return_scenario: String,
        inflation_rate: f64,
    ) -> Result<RetirementPlan, String>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        let new_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let target_retirement_date = match target_retirement_year {
            Some(year) => NaiveDate::from_ymd_opt(year, 1, 1),
            None => None,
        };

        sqlx::query_as::<_, RetirementPlan>(
            "INSERT INTO retirement_plans (id, name, target_retirement_date, starting_net_worth, monthly_contribution, expected_monthly_expenses, return_scenario, inflation_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
        )
        .bind(new_id)
        .bind(name)
        .bind(target_retirement_date)
        .bind(starting_net_worth)
        .bind(monthly_contribution)
        .bind(expected_monthly_expenses)
        .bind(return_scenario)
        .bind(inflation_rate)
        .bind(now)
        .bind(now)
        .fetch_one(executor)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<RetirementPlan>, String> {
        sqlx::query_as::<_, RetirementPlan>(
            "SELECT * FROM retirement_plans ORDER BY updated_at DESC",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn get_by_id(
        pool: &SqlitePool,
        id: String,
    ) -> Result<Option<RetirementPlan>, String> {
        sqlx::query_as::<_, RetirementPlan>("SELECT * FROM retirement_plans WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update(
        pool: &SqlitePool,
        id: String,
        name: String,
        target_retirement_date: Option<NaiveDate>,
        starting_net_worth: f64,
        monthly_contribution: f64,
        expected_monthly_expenses: f64,
        return_scenario: String,
        inflation_rate: f64,
    ) -> Result<RetirementPlan, String> {
        let now = chrono::Utc::now();

        sqlx::query_as::<_, RetirementPlan>(
            "UPDATE retirement_plans SET name = ?, target_retirement_date = ?, starting_net_worth = ?, monthly_contribution = ?, expected_monthly_expenses = ?, return_scenario = ?, inflation_rate = ?, updated_at = ? WHERE id = ? RETURNING *",
        )
        .bind(name)
        .bind(target_retirement_date)
        .bind(starting_net_worth)
        .bind(monthly_contribution)
        .bind(expected_monthly_expenses)
        .bind(return_scenario)
        .bind(inflation_rate)
        .bind(now)
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM retirement_plans WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_retirement_plan_crud() {
        let pool = setup_test_db().await;

        let plan = RetirementPlanService::create(
            &pool,
            "Baseline".to_string(),
            None,
            120_000.0,
            1_500.0,
            4_000.0,
            "moderate".to_string(),
            2.5,
        )
        .await
        .expect("Failed to create plan");

        assert_eq!(plan.name, "Baseline");

        let fetched = RetirementPlanService::get_by_id(&pool, plan.id.clone())
            .await
            .expect("Failed to fetch plan")
            .expect("Plan missing");

        assert_eq!(fetched.starting_net_worth, 120_000.0);

        let updated = RetirementPlanService::update(
            &pool,
            plan.id.clone(),
            "Updated".to_string(),
            Some(NaiveDate::from_ymd_opt(2040, 6, 1).unwrap()),
            150_000.0,
            2_000.0,
            3_500.0,
            "conservative".to_string(),
            1.5,
        )
        .await
        .expect("Failed to update plan");

        assert_eq!(updated.name, "Updated");
        assert_eq!(updated.return_scenario, "conservative");

        for index in 0..3 {
            RetirementPlanService::create(
                &pool,
                format!("Plan {index}"),
                None,
                100_000.0,
                1_000.0,
                3_000.0,
                "moderate".to_string(),
                0.0,
            )
            .await
            .expect("Failed to create extra plan");
        }

        let limited = RetirementPlanService::get_all(&pool)
            .await
            .expect("Failed to list plans");
        assert_eq!(limited.len(), 4);

        RetirementPlanService::delete(&pool, plan.id.clone())
            .await
            .expect("Failed to delete plan");

        let missing = RetirementPlanService::get_by_id(&pool, plan.id)
            .await
            .expect("Failed to fetch deleted plan");
        assert!(missing.is_none());
    }
}
