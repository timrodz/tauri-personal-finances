CREATE TABLE IF NOT EXISTS retirement_plans (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    target_retirement_date DATETIME,
    starting_net_worth REAL NOT NULL,
    monthly_contribution REAL NOT NULL,
    expected_monthly_expenses REAL NOT NULL,
    return_scenario TEXT NOT NULL CHECK(
        return_scenario IN ('conservative', 'moderate', 'aggressive')
    ),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
