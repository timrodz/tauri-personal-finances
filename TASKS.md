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

### 4.1 Year Selector & Balance Sheet Management

- [x] Create YearSelector component (dropdown with "+ New Year" option)
- [x] Filter year options to exclude years that already have balance sheets
- [x] Add `get_balance_sheets` query hook to fetch existing sheets
- [x] Show balance sheet cards on dashboard (2025, 2024, + New)

**Acceptance Criteria:**

- [x] Year dropdown only shows years without existing balance sheets (current year ± 5)
- [x] Creating duplicate year returns user-friendly error
- [x] Clicking a balance sheet card navigates to the grid view

### 4.2 Spreadsheet Grid Component

- [x] Create BalanceSheetPage route (`/balance-sheet/:year`)
- [x] Build BalanceSheetGrid component with 14 columns (Account, Jan-Dec, Currency)
- [x] Group rows by account type (Assets section, Liabilities section)
- [x] Display currency rate input rows for each unique foreign currency pair
- [x] Show calculated rows: Total Assets, Total Liabilities, Net Worth, Growth

**Acceptance Criteria:**

- [x] Grid displays all accounts grouped by Asset/Liability
- [x] Foreign currency accounts show a sub-row for rate input (e.g., "USD→NZD")
- [x] Currency rate rows appear once per unique `from_currency→home_currency` pair
- [x] Empty cells for months before account creation shown as blank (not $0)
- [x] Totals row converts foreign currencies using the rate for that month

### 4.3 Inline Cell Editing

- [x] Implement EditableCell component
- [x] Support keyboard navigation (Tab, Arrows, Enter, Escape)
- [x] Integrate with `upsert_entry` command
- [x] Optimistic UI updates
- [x] Fix empty cells rendering issue (visual polish)
- [x] Format numbers with locale-aware thousands separators

**Acceptance Criteria:**

- [x] Clicking a cell enters edit mode with input focused
- [x] Tab moves to next cell, Shift+Tab to previous
- [x] Arrow keys navigate between cells when not editing
- [x] Enter commits edit and moves down, Escape cancels edit
- [x] Invalid input (non-numeric) shows validation error
- [x] All amounts are stored as positive; liabilities subtracted in totals

### 4.4 Real-time Calculations

- [x] Compute monthly totals (Assets, Liabilities, Net Worth) with currency conversion
- [x] Compute Growth row (current month - previous month)
- [x] Update totals immediately when any cell changes
- [x] Handle missing rates gracefully (show warning, use 1.0 fallback)

**Acceptance Criteria:**

- [x] Editing any cell recalculates totals within 100ms
- [x] Net Worth = Total Assets - Total Liabilities (converted to home currency)
- [x] Growth shows delta from previous month (first month shows "—")
- [x] Missing currency rate shows ⚠️ icon with tooltip

### 4.5 Balance Sheet Yearly Chart

- [x] Install Chart.js version 4.5.1 and react-chartjs-2
- [x] Add Chart.js line chart at bottom of balance sheet page
- [x] X-axis: Jan-Dec, Y-axis: Net worth in home currency
- [x] Show MoM (month-over-month) percentage change below chart
- [x] Style chart to match app theme (dark mode support)

**Acceptance Criteria:**

- [x] Chart updates in real-time as grid values change
- [x] MoM percentages displayed for each month (e.g., "+5.2%", "-1.3%")
- [x] Months with no data shown as gaps in line
- [x] Chart responsive to container width

---

### Implementation Order

1. **Backend first**: Verify `create_balance_sheet` prevents duplicates (already exists)
2. **Year selector + navigation**: Dashboard → balance sheet cards → routing
3. **Grid skeleton**: Layout with headers, empty cells, account grouping
4. **Read-only grid**: Fetch entries, display values, calculate totals
5. **Editable cells**: Click-to-edit, keyboard nav, persistence
6. **Currency rates**: Rate rows, conversion in totals
7. **Chart**: Add visualization with MoM metrics

## Phase 5: Currency Conversion ✅

- [x] Add currency rate sub-rows for foreign accounts
- [x] Implement rate CRUD commands
- [x] Default new rates to 1.0
- [x] Apply conversion in totals calculation

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
