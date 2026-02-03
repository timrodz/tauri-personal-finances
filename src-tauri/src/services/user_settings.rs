use crate::models::UserSettings;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct UserSettingsService;

impl UserSettingsService {
    // LIST
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<UserSettings>, String> {
        sqlx::query_as::<_, UserSettings>("SELECT * FROM user_settings")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // READ
    #[allow(dead_code)]
    pub async fn get_by_id(pool: &SqlitePool, id: String) -> Result<Option<UserSettings>, String> {
        sqlx::query_as::<_, UserSettings>("SELECT * FROM user_settings WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // UPSERT
    pub async fn upsert(
        pool: &SqlitePool,
        name: String,
        home_currency: String,
        theme: String,
    ) -> Result<UserSettings, String> {
        // Since we are enforcing a singleton pattern for user settings (one row),
        // we check if it exists first.
        let existing = Self::get_all(pool).await?;

        if let Some(settings) = existing.first() {
            // Update
            let updated_record = sqlx::query_as::<_, UserSettings>(
                "UPDATE user_settings SET name = $1, home_currency = $2, theme = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *"
            )
            .bind(name)
            .bind(home_currency)
            .bind(theme)
            .bind(&settings.id)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

            Ok(updated_record)
        } else {
            // Create
            let new_id = Uuid::new_v4().to_string();
            let new_record = sqlx::query_as::<_, UserSettings>(
                "INSERT INTO user_settings (id, name, home_currency, theme) VALUES ($1, $2, $3, $4) RETURNING *"
            )
            .bind(new_id)
            .bind(name)
            .bind(home_currency)
            .bind(theme)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

            Ok(new_record)
        }
    }

    pub async fn set_exchange_sync_needed(
        pool: &SqlitePool,
        needs_exchange_sync: bool,
    ) -> Result<UserSettings, String> {
        let existing = Self::get_all(pool).await?;
        let settings = existing
            .first()
            .ok_or_else(|| "User settings not found".to_string())?;

        sqlx::query_as::<_, UserSettings>(
            "UPDATE user_settings SET needs_exchange_sync = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        )
        .bind(needs_exchange_sync)
        .bind(&settings.id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
    }

    // DELETE
    #[allow(dead_code)]
    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM user_settings WHERE id = ?")
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
    async fn test_user_settings_crud() {
        let pool = setup_test_db().await;

        // 1. Upsert (Create)
        let created =
            UserSettingsService::upsert(&pool, "Test User".into(), "NZD".into(), "system".into())
                .await
                .expect("Failed to create user settings");

        assert_eq!(created.name, "Test User");
        assert_eq!(created.home_currency, "NZD");
        assert_eq!(created.theme, "system");
        assert!(!created.needs_exchange_sync);

        // 2. Get All
        let all = UserSettingsService::get_all(&pool)
            .await
            .expect("Failed to get all");
        assert_eq!(all.len(), 1);

        // 3. Get By ID
        let fetched = UserSettingsService::get_by_id(&pool, created.id.clone())
            .await
            .expect("Failed to get by id");
        assert!(fetched.is_some());
        assert_eq!(fetched.unwrap().id, created.id);

        // 4. Upsert (Update)
        let updated =
            UserSettingsService::upsert(&pool, "Updated User".into(), "USD".into(), "dark".into())
                .await
                .expect("Failed to update");
        assert_eq!(updated.name, "Updated User");
        assert_eq!(updated.home_currency, "USD");
        assert_eq!(updated.theme, "dark");
        assert_eq!(updated.id, created.id); // ID should remain same

        let flagged = UserSettingsService::set_exchange_sync_needed(&pool, true)
            .await
            .expect("Failed to set exchange sync flag");
        assert!(flagged.needs_exchange_sync);

        // 5. Delete
        UserSettingsService::delete(&pool, created.id.clone())
            .await
            .expect("Failed to delete");
        let after_delete = UserSettingsService::get_by_id(&pool, created.id)
            .await
            .expect("Failed to get");
        assert!(after_delete.is_none());
    }
}
