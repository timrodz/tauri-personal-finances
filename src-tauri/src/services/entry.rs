use crate::models::Entry;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct EntryService;

impl EntryService {
    // LIST All (Required by standard)
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<Entry>, String> {
        sqlx::query_as::<_, Entry>("SELECT * FROM entries")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // LIST by Balance Sheet
    pub async fn get_by_balance_sheet(
        pool: &SqlitePool,
        balance_sheet_id: String,
    ) -> Result<Vec<Entry>, String> {
        sqlx::query_as::<_, Entry>("SELECT * FROM entries WHERE balance_sheet_id = ?")
            .bind(balance_sheet_id)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // READ
    pub async fn get_by_id(pool: &SqlitePool, id: String) -> Result<Option<Entry>, String> {
        sqlx::query_as::<_, Entry>("SELECT * FROM entries WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())
    }

    // UPSERT (Create or Update based on business keys: balance_sheet + account + month)
    pub async fn upsert(
        pool: &SqlitePool,
        balance_sheet_id: String,
        account_id: String,
        month: i32,
        amount: f64,
    ) -> Result<Entry, String> {
        let existing: Option<Entry> = sqlx::query_as(
            "SELECT * FROM entries WHERE balance_sheet_id = ? AND account_id = ? AND month = ?",
        )
        .bind(&balance_sheet_id)
        .bind(&account_id)
        .bind(month)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

        let now = chrono::Utc::now();

        if let Some(entry) = existing {
            sqlx::query_as::<_, Entry>(
                "UPDATE entries SET amount = ?, updated_at = ? WHERE id = ? RETURNING *",
            )
            .bind(amount)
            .bind(now)
            .bind(entry.id)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())
        } else {
            let id = Uuid::new_v4().to_string();
            sqlx::query_as::<_, Entry>(
                "INSERT INTO entries (id, balance_sheet_id, account_id, month, amount, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
            )
            .bind(id)
            .bind(balance_sheet_id)
            .bind(account_id)
            .bind(month)
            .bind(amount)
            .bind(now)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())
        }
    }

    // DELETE
    pub async fn delete(pool: &SqlitePool, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM entries WHERE id = ?")
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
    // We need services to create dependencies (entries depend on account + sheet)
    use crate::services::account::AccountService;
    use crate::services::balance_sheet::BalanceSheetService;

    #[tokio::test]
    async fn test_entry_crud() {
        let pool = setup_test_db().await;

        // Dependencies
        let sheet = BalanceSheetService::upsert(&pool, None, 2025)
            .await
            .expect("setup sheet");
        let account = AccountService::upsert(&pool, None, "A".into(), "Asset".into(), "NZD".into(), None)
            .await
            .expect("setup acct");

        // 1. Upsert (Create)
        let entry = EntryService::upsert(&pool, sheet.id.clone(), account.id.clone(), 1, 100.0)
            .await
            .expect("created");
        assert_eq!(entry.amount, 100.0);

        // 2. Upsert (Update - Key based)
        let updated = EntryService::upsert(&pool, sheet.id.clone(), account.id.clone(), 1, 200.0)
            .await
            .expect("updated");
        assert_eq!(updated.amount, 200.0);
        assert_eq!(updated.id, entry.id); // Same entry

        // 3. Get All / By Sheet
        let list = EntryService::get_by_balance_sheet(&pool, sheet.id.clone())
            .await
            .expect("list");
        assert_eq!(list.len(), 1);

        // 4. Delete
        EntryService::delete(&pool, entry.id.clone())
            .await
            .expect("deleted");
        let check = EntryService::get_by_id(&pool, entry.id)
            .await
            .expect("check");
        assert!(check.is_none());
    }
}
