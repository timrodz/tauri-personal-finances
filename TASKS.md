# Personal Finance App - Tasks

## Phase 0: Frontend Setup ✅

- [x] Install Tailwind CSS v4 + Vite plugin
- [x] Configure path aliases in tsconfig.json and vite.config.ts
- [x] Initialize shadcn/ui with neutral theme

## Phase 1: Foundation & Core Data Layer

- [ ] Add sqlx + SQLite dependencies to Cargo.toml
- [ ] Setup database connection and migrations infrastructure
- [ ] Create migration: user_settings table
- [ ] Create migration: accounts table
- [ ] Create migration: balance_sheets table
- [ ] Create migration: entries table
- [ ] Create migration: currency_rates table
- [ ] Implement Rust models for all entities
- [ ] Implement basic CRUD Tauri commands
- [ ] Setup React routing and app structure

## Phase 2: User Onboarding

- [ ] Detect first-time user (no settings in DB)
- [ ] Create SettingsForm component (name, home currency)
- [ ] Implement get_user_settings command
- [ ] Implement update_user_settings command
- [ ] Auto-redirect to setup on first launch

## Phase 3: Account Management

- [ ] Create AccountForm component (name, type, currency)
- [ ] Build AccountsList component with edit/delete
- [ ] Implement account CRUD commands
- [ ] Validate unique account names

## Phase 4: Balance Sheet Core

- [ ] Create YearSelector component
- [ ] Implement create_balance_sheet command (prevent duplicates)
- [ ] Build spreadsheet Grid component
- [ ] Implement inline cell editing
- [ ] Auto-create empty entries for new accounts

## Phase 5: Currency Conversion

- [ ] Add currency rate sub-rows for foreign accounts
- [ ] Implement rate CRUD commands
- [ ] Default new rates to 1.0
- [ ] Apply conversion in totals calculation

## Phase 6: Net Worth Dashboard

- [ ] Calculate net worth per month (assets - liabilities)
- [ ] Build Dashboard component with current net worth
- [ ] Integrate Chart.js for trend graph
- [ ] Add time range filters (1M, 3M, 6M, YTD, 1Y, 5Y, All)
- [ ] Show month-over-month growth indicator

## Phase 7: Polish & UX

- [ ] Add growth row to balance sheet grid
- [ ] Implement loading states
- [ ] Add error handling and validation feedback
- [ ] Visual polish (colors, spacing, typography)
- [ ] Test full user flow end-to-end
