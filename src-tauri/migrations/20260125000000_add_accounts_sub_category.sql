-- Add sub_category column to accounts table
ALTER TABLE accounts
ADD COLUMN sub_category TEXT DEFAULT NULL
CHECK(sub_category IN ('cash', 'investments', 'retirement', 'real_estate', 'vehicles', 'other_asset', 'credit_cards', 'loans', 'mortgages', 'other_liability') OR sub_category IS NULL);
