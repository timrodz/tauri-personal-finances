CREATE TABLE IF NOT EXISTS retirement_plan_projections (
    id TEXT PRIMARY KEY NOT NULL,
    plan_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    projected_net_worth REAL NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES retirement_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projections_plan_id ON retirement_plan_projections(plan_id);
CREATE INDEX IF NOT EXISTS idx_projections_year_month ON retirement_plan_projections(plan_id, year, month);
