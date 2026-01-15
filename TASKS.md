# Personal Finance App - Tasks

## Phase 0: Frontend Setup ✅

- [x] Install Tailwind CSS v4 + Vite plugin
- [x] Configure path aliases in tsconfig.json and vite.config.ts
- [x] Initialize shadcn/ui with neutral theme

## Phase 1: Foundation & Core Data Layer

- [x] Add sqlx version 0.8 + SQLite dependencies to Cargo.toml
- [x] Setup database connection and migrations infrastructure
- [x] Create migration: user_settings table
- [x] Create migration: accounts table
- [x] Create migration: balance_sheets table
- [x] Create migration: entries table
- [x] Create migration: currency_rates table
- [x] Implement Rust models and DTOs for all entities
- [x] Implement Rust backend commands for all CRUD operations
- [x] Setup React routing and app structure

## Phase 2: User Onboarding

- [x] Detect first-time user (no settings in DB)
- [x] Create SettingsForm component (name, home currency)
- [x] Implement get_user_settings command
- [x] Implement update_user_settings command
- [x] Auto-redirect to setup on first launch
- [x] Implement a theme provider for light, dark, system options

## Phase 3: Account Management ✅

- [x] Create AccountForm component (name, type, currency)
- [x] Build AccountsList component with edit/delete
- [x] Implement account CRUD commands
- [x] Validate unique account names
- [x] Add unit tests to verify logic

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
