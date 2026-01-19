-- Add sort_order column to accounts table
ALTER TABLE accounts
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
-- Initialize sort_order based on created_at
UPDATE accounts
SET sort_order = (
        SELECT COUNT(*)
        FROM accounts as a2
        WHERE a2.created_at <= accounts.created_at
    );