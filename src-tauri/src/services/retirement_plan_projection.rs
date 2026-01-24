use crate::models::RetirementPlanProjection;
use crate::services::retirement::ProjectionDataPoint;
use sqlx::{Sqlite, SqlitePool};
use uuid::Uuid;

pub struct RetirementPlanProjectionService;

impl RetirementPlanProjectionService {
    pub async fn delete_by_plan_id(pool: &SqlitePool, plan_id: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM retirement_plan_projections WHERE plan_id = ?")
            .bind(plan_id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn save_projections(
        pool: &SqlitePool,
        plan_id: &str,
        data_points: Vec<ProjectionDataPoint>,
    ) -> Result<Vec<RetirementPlanProjection>, String> {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let projections = Self::save_projections_in_tx(&mut tx, plan_id, data_points).await?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(projections)
    }

    pub async fn save_projections_in_tx(
        tx: &mut sqlx::Transaction<'_, Sqlite>,
        plan_id: &str,
        data_points: Vec<ProjectionDataPoint>,
    ) -> Result<Vec<RetirementPlanProjection>, String> {
        sqlx::query("DELETE FROM retirement_plan_projections WHERE plan_id = ?")
            .bind(plan_id)
            .execute(&mut **tx)
            .await
            .map_err(|e| e.to_string())?;

        let now = chrono::Utc::now();
        let mut projections = Vec::with_capacity(data_points.len());

        for point in data_points {
            let new_id = Uuid::new_v4().to_string();
            let projection = sqlx::query_as::<_, RetirementPlanProjection>(
                "INSERT INTO retirement_plan_projections (id, plan_id, year, month, projected_net_worth, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
            )
            .bind(&new_id)
            .bind(plan_id)
            .bind(point.year)
            .bind(point.month)
            .bind(point.projected_net_worth)
            .bind(now)
            .fetch_one(&mut **tx)
            .await
            .map_err(|e| e.to_string())?;

            projections.push(projection);
        }

        Ok(projections)
    }

    pub async fn get_by_plan_id(
        pool: &SqlitePool,
        plan_id: &str,
    ) -> Result<Vec<RetirementPlanProjection>, String> {
        sqlx::query_as::<_, RetirementPlanProjection>(
            "SELECT * FROM retirement_plan_projections WHERE plan_id = ? ORDER BY year ASC, month ASC",
        )
        .bind(plan_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::retirement_plan::RetirementPlanService;
    use crate::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_save_and_get_projections() {
        let pool = setup_test_db().await;

        let plan = RetirementPlanService::create(
            &pool,
            "Test Plan".to_string(),
            None,
            100_000.0,
            1_000.0,
            3_000.0,
            "moderate".to_string(),
            0.0,
        )
        .await
        .expect("create plan");

        let data_points = vec![
            ProjectionDataPoint {
                year: 2026,
                month: 1,
                projected_net_worth: 100_000.0,
            },
            ProjectionDataPoint {
                year: 2026,
                month: 2,
                projected_net_worth: 101_500.0,
            },
            ProjectionDataPoint {
                year: 2026,
                month: 3,
                projected_net_worth: 103_100.0,
            },
        ];

        let saved = RetirementPlanProjectionService::save_projections(&pool, &plan.id, data_points)
            .await
            .expect("save projections");

        assert_eq!(saved.len(), 3);
        assert_eq!(saved[0].year, 2026);
        assert_eq!(saved[0].month, 1);

        let fetched = RetirementPlanProjectionService::get_by_plan_id(&pool, &plan.id)
            .await
            .expect("get projections");

        assert_eq!(fetched.len(), 3);
        assert_eq!(fetched[0].projected_net_worth, 100_000.0);
        assert_eq!(fetched[2].projected_net_worth, 103_100.0);
    }

    #[tokio::test]
    async fn test_save_replaces_existing_projections() {
        let pool = setup_test_db().await;

        let plan = RetirementPlanService::create(
            &pool,
            "Replace Test".to_string(),
            None,
            50_000.0,
            500.0,
            2_000.0,
            "conservative".to_string(),
            1.0,
        )
        .await
        .expect("create plan");

        let initial_points = vec![
            ProjectionDataPoint {
                year: 2026,
                month: 1,
                projected_net_worth: 50_000.0,
            },
            ProjectionDataPoint {
                year: 2026,
                month: 2,
                projected_net_worth: 51_000.0,
            },
        ];

        RetirementPlanProjectionService::save_projections(&pool, &plan.id, initial_points)
            .await
            .expect("save initial");

        let new_points = vec![ProjectionDataPoint {
            year: 2027,
            month: 1,
            projected_net_worth: 75_000.0,
        }];

        RetirementPlanProjectionService::save_projections(&pool, &plan.id, new_points)
            .await
            .expect("save new");

        let fetched = RetirementPlanProjectionService::get_by_plan_id(&pool, &plan.id)
            .await
            .expect("get projections");

        assert_eq!(fetched.len(), 1);
        assert_eq!(fetched[0].year, 2027);
        assert_eq!(fetched[0].projected_net_worth, 75_000.0);
    }

    #[tokio::test]
    async fn test_cascade_delete_on_plan_removal() {
        let pool = setup_test_db().await;

        let plan = RetirementPlanService::create(
            &pool,
            "Cascade Test".to_string(),
            None,
            80_000.0,
            1_200.0,
            2_500.0,
            "aggressive".to_string(),
            0.0,
        )
        .await
        .expect("create plan");

        let data_points = vec![ProjectionDataPoint {
            year: 2026,
            month: 6,
            projected_net_worth: 85_000.0,
        }];

        RetirementPlanProjectionService::save_projections(&pool, &plan.id, data_points)
            .await
            .expect("save");

        RetirementPlanService::delete(&pool, plan.id.clone())
            .await
            .expect("delete plan");

        let fetched = RetirementPlanProjectionService::get_by_plan_id(&pool, &plan.id)
            .await
            .expect("get projections");

        assert_eq!(fetched.len(), 0);
    }
}
