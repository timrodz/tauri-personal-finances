use crate::models::OnboardingStep;
use crate::services::account::AccountService;
use crate::services::balance_sheet::BalanceSheetService;
use crate::services::user_settings::UserSettingsService;
use sqlx::SqlitePool;

pub const STEP_CONFIGURE_SETTINGS: &str = "CONFIGURE_SETTINGS";
pub const STEP_CREATE_FIRST_ACCOUNT: &str = "CREATE_FIRST_ACCOUNT";
pub const STEP_CREATE_FIRST_BALANCE_SHEET: &str = "CREATE_FIRST_BALANCE_SHEET";

pub struct OnboardingService;

impl OnboardingService {
    pub async fn get_status(pool: &SqlitePool) -> Result<Vec<OnboardingStep>, String> {
        // Ensure steps exist
        Self::ensure_steps_exist(pool).await?;

        // Auto-complete steps based on existing data
        Self::auto_complete_steps(pool).await?;

        sqlx::query_as::<_, OnboardingStep>("SELECT * FROM onboarding_steps")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn complete_step(pool: &SqlitePool, step_key: String) -> Result<(), String> {
        sqlx::query("UPDATE onboarding_steps SET is_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE step_key = ? AND is_completed = 0")
            .bind(step_key)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    async fn ensure_steps_exist(pool: &SqlitePool) -> Result<(), String> {
        let steps = vec![
            STEP_CONFIGURE_SETTINGS,
            STEP_CREATE_FIRST_ACCOUNT,
            STEP_CREATE_FIRST_BALANCE_SHEET,
        ];

        for step in steps {
            sqlx::query(
                "INSERT OR IGNORE INTO onboarding_steps (step_key, is_completed) VALUES (?, 0)",
            )
            .bind(step)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub async fn auto_complete_steps(pool: &SqlitePool) -> Result<(), String> {
        // Step 1: Settings
        let settings = UserSettingsService::get_all(pool).await?;
        if !settings.is_empty() {
            Self::complete_step(pool, STEP_CONFIGURE_SETTINGS.to_string()).await?;
        }

        // Step 2: Accounts
        let accounts = AccountService::get_all(pool, true).await?;
        if !accounts.is_empty() {
            Self::complete_step(pool, STEP_CREATE_FIRST_ACCOUNT.to_string()).await?;
        }

        // Step 3: Balance Sheets
        let sheets = BalanceSheetService::get_all(pool).await?;
        if !sheets.is_empty() {
            Self::complete_step(pool, STEP_CREATE_FIRST_BALANCE_SHEET.to_string()).await?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_onboarding_status() {
        let pool = setup_test_db().await;

        let status = OnboardingService::get_status(&pool)
            .await
            .expect("Failed status");
        assert_eq!(status.len(), 3);
        assert!(status.iter().all(|s| !s.is_completed));

        // Complete a step
        OnboardingService::complete_step(&pool, STEP_CONFIGURE_SETTINGS.into())
            .await
            .expect("Failed complete");

        let status = OnboardingService::get_status(&pool)
            .await
            .expect("Failed status");
        let settings_step = status
            .iter()
            .find(|s| s.step_key == STEP_CONFIGURE_SETTINGS)
            .unwrap();
        assert!(settings_step.is_completed);
    }

    #[tokio::test]
    async fn test_onboarding_auto_complete() {
        let pool = setup_test_db().await;

        // Create settings
        UserSettingsService::upsert(&pool, "User".into(), "USD".into(), "system".into())
            .await
            .unwrap();

        // Status should auto-complete first step
        let status = OnboardingService::get_status(&pool)
            .await
            .expect("Failed status");
        let settings_step = status
            .iter()
            .find(|s| s.step_key == STEP_CONFIGURE_SETTINGS)
            .unwrap();
        assert!(settings_step.is_completed);

        let account_step = status
            .iter()
            .find(|s| s.step_key == STEP_CREATE_FIRST_ACCOUNT)
            .unwrap();
        assert!(!account_step.is_completed);
    }
}
