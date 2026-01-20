CREATE TABLE IF NOT EXISTS onboarding_steps (
    step_key TEXT PRIMARY KEY NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Initial steps
INSERT
    OR IGNORE INTO onboarding_steps (step_key, is_completed)
VALUES ('CONFIGURE_SETTINGS', 0);
INSERT
    OR IGNORE INTO onboarding_steps (step_key, is_completed)
VALUES ('CREATE_FIRST_ACCOUNT', 0);
INSERT
    OR IGNORE INTO onboarding_steps (step_key, is_completed)
VALUES ('CREATE_FIRST_BALANCE_SHEET', 0);