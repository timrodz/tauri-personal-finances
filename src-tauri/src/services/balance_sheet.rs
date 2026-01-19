use crate::models::BalanceSheet;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct BalanceSheetService;

impl BalanceSheetService {
    // LIST
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<BalanceSheet>, String> {
        sqlx::query_as::<_, BalanceSheet>("SELECT * FROM balance_sheets ORDER BY year DESC")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // READ
    pub async fn get_by_id(pool: &SqlitePool, id: String) -> Result<Option<BalanceSheet>, String> {
        sqlx::query_as::<_, BalanceSheet>("SELECT * FROM balance_sheets WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // UPSERT
    pub async fn upsert(
        pool: &SqlitePool,
        id: Option<String>,
        year: i64,
    ) -> Result<BalanceSheet, String> {
        // Check if year already exists
        // This application-level check is useful for fast feedback, but the DB constraint is the authority.
        let existing_year =
            sqlx::query_as::<_, BalanceSheet>("SELECT * FROM balance_sheets WHERE year = ?")
                .bind(year)
                .fetch_optional(pool)
                .await
                .map_err(|e| e.to_string())?;

        if let Some(existing) = existing_year {
            if let Some(ref uid) = id {
                if existing.id != *uid {
                    return Err(format!("Balance sheet for year {} already exists", year));
                }
            } else {
                return Err(format!("Balance sheet for year {} already exists", year));
            }
        }

        let now = chrono::Utc::now();

        if let Some(uid) = id {
            let exists: Option<BalanceSheet> = Self::get_by_id(pool, uid.clone()).await?;
            if exists.is_some() {
                // For updates, we also need to be careful if we are changing the year to one that exists,
                // but the initial check above handles most of it. The DB constraint handles the race.
                return sqlx::query_as::<_, BalanceSheet>(
                    "UPDATE balance_sheets SET year = ? WHERE id = ? RETURNING *",
                )
                .bind(year)
                .bind(uid)
                .fetch_one(pool)
                .await
                .map_err(|e| Self::handle_db_error(e, year));
            }
        }

        let new_id = Uuid::new_v4().to_string();
        sqlx::query_as::<_, BalanceSheet>(
            "INSERT INTO balance_sheets (id, year, created_at) VALUES (?, ?, ?) RETURNING *",
        )
        .bind(new_id)
        .bind(year)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| Self::handle_db_error(e, year))
    }

    // DELETE
    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM balance_sheets WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn handle_db_error(e: sqlx::Error, year: i64) -> String {
        if let sqlx::Error::Database(db_err) = &e {
            // Check for unique constraint violation.
            // SQLite error code 2067 is SQLITE_CONSTRAINT_UNIQUE
            // sqlx 0.8 might expose .is_unique_violation() or similar
            if db_err.is_unique_violation() {
                return format!("Balance sheet for year {} already exists", year);
            }
        }
        e.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_balance_sheet_crud() {
        let pool = setup_test_db().await;

        // 1. Create
        let sheet = BalanceSheetService::upsert(&pool, None, 2025)
            .await
            .expect("Failed create");
        assert_eq!(sheet.year, 2025);

        // 2. Get All
        let sheets = BalanceSheetService::get_all(&pool)
            .await
            .expect("Failed list");
        assert_eq!(sheets.len(), 1);

        // 3. Update
        let updated = BalanceSheetService::upsert(&pool, Some(sheet.id.clone()), 2026)
            .await
            .expect("Failed update");
        assert_eq!(updated.year, 2026);

        // 4. Delete
        BalanceSheetService::delete(&pool, sheet.id.clone())
            .await
            .expect("Failed delete");
        let check = BalanceSheetService::get_by_id(&pool, sheet.id)
            .await
            .expect("Failed check");
        assert!(check.is_none());
    }

    #[tokio::test]
    async fn test_duplicate_year_race_condition() {
        let pool = setup_test_db().await;

        // 1. Create first sheet
        BalanceSheetService::upsert(&pool, None, 2025)
            .await
            .expect("Failed first create");

        // 2. Try to create duplicate (mimicking race condition by bypassing app check logic if it were separate,
        // but upsert runs the check. However, the DB constraint test is ensuring that even if the app check passed
        // (e.g. if we commented it out) the DB would fail.
        // Since we can't easily simulate concurrent race in this simple test without threads,
        // we rely on upsert hitting the DB.
        // The upsert function will return the user friendly error from the app check first.
        let result = BalanceSheetService::upsert(&pool, None, 2025).await;
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Balance sheet for year 2025 already exists"
        );

        // 3. Direct DB Insert to force verify constraint exists (bypassing service check)
        // This verifies the schema itself has the constraint
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let direct_insert = sqlx::query(
            "INSERT INTO balance_sheets (id, year, created_at) VALUES (?, ?, ?)",
        )
        .bind(id)
        .bind(2025) // Duplicate year
        .bind(now)
        .execute(&pool)
        .await;

        assert!(direct_insert.is_err());
        let err = direct_insert.unwrap_err();
        if let sqlx::Error::Database(db_err) = err {
             assert!(db_err.is_unique_violation(), "Expected unique violation from DB");
        } else {
             panic!("Expected Database error, got {:?}", err);
        }
    }
}
