use crate::models::Account;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct AccountService;

impl AccountService {
    // LIST
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<Account>, String> {
        sqlx::query_as::<_, Account>("SELECT * FROM accounts ORDER BY sort_order ASC")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // READ
    pub async fn get_by_id(pool: &SqlitePool, id: String) -> Result<Option<Account>, String> {
        sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_by_name(pool: &SqlitePool, name: String) -> Result<Option<Account>, String> {
        sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE name = ?")
            .bind(name)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // UPSERT
    pub async fn upsert(
        pool: &SqlitePool,
        id: Option<String>,
        name: String,
        account_type: String,
        currency: String,
    ) -> Result<Account, String> {
        let now = chrono::Utc::now();

        // Check for unique name
        if let Some(existing) = Self::get_by_name(pool, name.clone()).await? {
            if id.as_ref() != Some(&existing.id) {
                return Err(format!("Account with name '{name}' already exists"));
            }
        }

        if let Some(uid) = id {
            let exists: Option<Account> = Self::get_by_id(pool, uid.clone()).await?;
            if exists.is_some() {
                return sqlx::query_as::<_, Account>(
                    "UPDATE accounts SET name = ?, account_type = ?, currency = ? WHERE id = ? RETURNING *"
                )
                .bind(name)
                .bind(account_type)
                .bind(currency)
                .bind(uid)
                .fetch_one(pool)
                .await
                .map_err(|e| e.to_string());
            }
        }

        let new_id = Uuid::new_v4().to_string();

        // Get current max sort_order
        let max_order: (i32,) = sqlx::query_as("SELECT COALESCE(MAX(sort_order), 0) FROM accounts")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;
        let next_order = max_order.0 + 1;

        sqlx::query_as::<_, Account>(
            "INSERT INTO accounts (id, name, account_type, currency, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(new_id)
        .bind(name)
        .bind(account_type)
        .bind(currency)
        .bind(next_order)
        .bind(now)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn update_order(pool: &SqlitePool, ids: Vec<String>) -> Result<(), String> {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        for (index, id) in ids.into_iter().enumerate() {
            let order = (index + 1) as i32;
            sqlx::query("UPDATE accounts SET sort_order = ? WHERE id = ?")
                .bind(order)
                .bind(id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        tx.commit().await.map_err(|e| e.to_string())
    }

    // DELETE
    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM accounts WHERE id = ?")
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
    async fn test_account_crud() {
        let pool = setup_test_db().await;

        // 1. Create
        let account = AccountService::upsert(
            &pool,
            None,
            "Test Bank".into(),
            "Asset".into(),
            "NZD".into(),
        )
        .await
        .expect("Failed to create account");

        assert_eq!(account.name, "Test Bank");

        // 2. Get All
        let accounts = AccountService::get_all(&pool)
            .await
            .expect("Failed to get all");
        assert_eq!(accounts.len(), 1);

        // 3. Update
        let updated = AccountService::upsert(
            &pool,
            Some(account.id.clone()),
            "Test Bank Updated".into(),
            "Liability".into(),
            "AUD".into(),
        )
        .await
        .expect("Failed to update");

        assert_eq!(updated.name, "Test Bank Updated");
        assert_eq!(updated.account_type, "Liability");
        assert_eq!(updated.currency, "AUD");

        // 4. Test Unique Name
        let duplicate_result = AccountService::upsert(
            &pool,
            None,
            "Test Bank Updated".into(),
            "Asset".into(),
            "NZD".into(),
        )
        .await;

        assert!(duplicate_result.is_err());
        assert_eq!(
            duplicate_result.unwrap_err(),
            "Account with name 'Test Bank Updated' already exists"
        );

        // 5. Delete
        AccountService::delete(&pool, account.id.clone())
            .await
            .expect("Failed to delete");
        let check = AccountService::get_by_id(&pool, account.id)
            .await
            .expect("Failed check");
        assert!(check.is_none());
    }
}
