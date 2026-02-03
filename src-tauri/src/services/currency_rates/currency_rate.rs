use crate::models::CurrencyRate;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct CurrencyRateService;

impl CurrencyRateService {
    // LIST
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<CurrencyRate>, String> {
        sqlx::query_as::<_, CurrencyRate>(
            "SELECT * FROM currency_rates ORDER BY year DESC, month ASC",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())
    }

    // LIST BY YEAR & MONTH
    #[allow(dead_code)]
    pub async fn get_by_date(
        pool: &SqlitePool,
        year: i32,
        month: i32,
    ) -> Result<Vec<CurrencyRate>, String> {
        sqlx::query_as::<_, CurrencyRate>(
            "SELECT * FROM currency_rates WHERE year = ? AND month = ?",
        )
        .bind(year)
        .bind(month)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())
    }

    // READ
    pub async fn get_by_id(pool: &SqlitePool, id: String) -> Result<Option<CurrencyRate>, String> {
        sqlx::query_as::<_, CurrencyRate>("SELECT * FROM currency_rates WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // UPSERT
    // Uniqueness is usually (from_currency, to_currency, month, year) but not enforced by unique constraint in previous migration.
    // However, for rate logic, we should probably check if a rate for that currency pair exists for that month.
    // Assuming simple CRUD for now as requested.
    pub async fn upsert(
        pool: &SqlitePool,
        id: Option<String>,
        from_currency: String,
        to_currency: String,
        provider: String,
        rate: f64,
        month: u32,
        year: i32,
    ) -> Result<CurrencyRate, String> {
        let now = chrono::Utc::now();

        if let Some(uid) = id {
            let exists: Option<CurrencyRate> = Self::get_by_id(pool, uid.clone()).await?;
            if exists.is_some() {
                return sqlx::query_as::<_, CurrencyRate>(
                    "UPDATE currency_rates SET from_currency = ?, to_currency = ?, provider = ?, rate = ?, month = ?, year = ?, timestamp = ? WHERE id = ? RETURNING *"
                )
                .bind(from_currency)
                .bind(to_currency)
                .bind(provider)
                .bind(rate)
                .bind(month)
                .bind(year)
                .bind(now)
                .bind(uid)
                .fetch_one(pool)
                .await
                .map_err(|e| e.to_string());
            }
        }

        let new_id = Uuid::new_v4().to_string();
        sqlx::query_as::<_, CurrencyRate>(
            "INSERT INTO currency_rates (id, from_currency, to_currency, provider, rate, month, year, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(new_id)
        .bind(from_currency)
        .bind(to_currency)
        .bind(provider)
        .bind(rate)
        .bind(month)
        .bind(year)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
    }

    // DELETE
    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM currency_rates WHERE id = ?")
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
    async fn test_currency_rate_crud() {
        let pool = setup_test_db().await;

        // 1. Create
        let rate = CurrencyRateService::upsert(
            &pool,
            None,
            "USD".into(),
            "NZD".into(),
            "manual".into(),
            1.5,
            1,
            2025,
        )
        .await
        .expect("Failed to create rate");

        assert_eq!(rate.rate, 1.5);
        assert_eq!(rate.from_currency, "USD");
        assert_eq!(rate.provider, "manual");

        // 2. Get All
        let rates = CurrencyRateService::get_all(&pool)
            .await
            .expect("Failed to get all");
        assert_eq!(rates.len(), 1);

        // 3. Update
        let updated = CurrencyRateService::upsert(
            &pool,
            Some(rate.id.clone()),
            "USD".into(),
            "NZD".into(),
            "manual".into(),
            1.6,
            1,
            2025,
        )
        .await
        .expect("Failed to update");

        assert_eq!(updated.rate, 1.6);
        assert_eq!(updated.id, rate.id);

        // 4. Get by Date
        let date_rates = CurrencyRateService::get_by_date(&pool, 2025, 1)
            .await
            .expect("get by date");
        assert_eq!(date_rates.len(), 1);

        // 5. Delete
        CurrencyRateService::delete(&pool, rate.id.clone())
            .await
            .expect("Failed to delete");
        let check = CurrencyRateService::get_by_id(&pool, rate.id)
            .await
            .expect("Failed check");
        assert!(check.is_none());
    }
}
