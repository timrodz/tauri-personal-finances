use crate::models::Account;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct AccountService;

impl AccountService {
    // LIST
    pub async fn get_all(
        pool: &SqlitePool,
        include_archived: bool,
    ) -> Result<Vec<Account>, String> {
        let query = if include_archived {
            "SELECT * FROM accounts ORDER BY sort_order ASC"
        } else {
            "SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC"
        };

        sqlx::query_as::<_, Account>(query)
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
        sub_category: Option<String>,
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
                    "UPDATE accounts SET name = ?, account_type = ?, currency = ?, sub_category = ? WHERE id = ? RETURNING *"
                )
                .bind(name)
                .bind(account_type)
                .bind(currency)
                .bind(&sub_category)
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
            "INSERT INTO accounts (id, name, account_type, currency, sub_category, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(new_id)
        .bind(name)
        .bind(account_type)
        .bind(currency)
        .bind(sub_category)
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

    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM accounts WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn toggle_archive(pool: &SqlitePool, id: String) -> Result<Account, String> {
        let account = Self::get_by_id(pool, id.clone())
            .await?
            .ok_or_else(|| format!("Account with ID {id} not found"))?;

        let new_archived_state = !account.is_archived;

        sqlx::query_as::<_, Account>("UPDATE accounts SET is_archived = ? WHERE id = ? RETURNING *")
            .bind(new_archived_state)
            .bind(id)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())
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
            None,
        )
        .await
        .expect("Failed to create account");

        assert_eq!(account.name, "Test Bank");
        assert!(account.sub_category.is_none());

        // 2. Get All
        let accounts = AccountService::get_all(&pool, true)
            .await
            .expect("Failed to get all");
        assert_eq!(accounts.len(), 1);

        // 3. Toggle Archive
        let archived = AccountService::toggle_archive(&pool, account.id.clone())
            .await
            .expect("Failed to archive");
        assert!(archived.is_archived);

        let active_only = AccountService::get_all(&pool, false)
            .await
            .expect("Failed to get active only");
        assert_eq!(active_only.len(), 0);

        let all = AccountService::get_all(&pool, true)
            .await
            .expect("Failed to get all after archive");
        assert_eq!(all.len(), 1);

        // Unarchive
        let unarchived = AccountService::toggle_archive(&pool, account.id.clone())
            .await
            .expect("Failed to unarchive");
        assert!(!unarchived.is_archived);

        // 4. Update
        let updated = AccountService::upsert(
            &pool,
            Some(account.id.clone()),
            "Test Bank Updated".into(),
            "Liability".into(),
            "AUD".into(),
            None,
        )
        .await
        .expect("Failed to update");

        assert_eq!(updated.name, "Test Bank Updated");
        assert_eq!(updated.account_type, "Liability");
        assert_eq!(updated.currency, "AUD");

        // 5. Test Unique Name
        let duplicate_result = AccountService::upsert(
            &pool,
            None,
            "Test Bank Updated".into(),
            "Asset".into(),
            "NZD".into(),
            None,
        )
        .await;

        assert!(duplicate_result.is_err());
        assert_eq!(
            duplicate_result.unwrap_err(),
            "Account with name 'Test Bank Updated' already exists"
        );

        // 6. Delete
        AccountService::delete(&pool, account.id.clone())
            .await
            .expect("Failed to delete");
        let check = AccountService::get_by_id(&pool, account.id)
            .await
            .expect("Failed check");
        assert!(check.is_none());
    }

    #[tokio::test]
    async fn test_upsert_with_sub_category() {
        let pool = setup_test_db().await;

        // Create account with sub_category
        let account = AccountService::upsert(
            &pool,
            None,
            "Savings Account".into(),
            "Asset".into(),
            "USD".into(),
            Some("cash".into()),
        )
        .await
        .expect("Failed to create account with sub_category");

        assert_eq!(account.name, "Savings Account");
        assert_eq!(account.sub_category, Some("cash".to_string()));

        // Update sub_category
        let updated = AccountService::upsert(
            &pool,
            Some(account.id.clone()),
            "Savings Account".into(),
            "Asset".into(),
            "USD".into(),
            Some("investments".into()),
        )
        .await
        .expect("Failed to update sub_category");

        assert_eq!(updated.sub_category, Some("investments".to_string()));

        // Clear sub_category by setting to None
        let cleared = AccountService::upsert(
            &pool,
            Some(account.id.clone()),
            "Savings Account".into(),
            "Asset".into(),
            "USD".into(),
            None,
        )
        .await
        .expect("Failed to clear sub_category");

        assert!(cleared.sub_category.is_none());
    }
}
