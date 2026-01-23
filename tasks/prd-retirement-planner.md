# PRD: Retirement Planner

## Introduction

The Retirement Planner enables users to project their financial future by calculating when they can retire based on current net worth, investment strategies, and expected expenses. Users can model scenarios using 3% and 4% safe withdrawal rules to understand how savings will sustain their retirement lifestyle. The feature supports goal-oriented planning (target retirement date) and discovery planning (earliest possible retirement date).

---

## Goals

- Enable users to set a target retirement date and calculate required savings
- Calculate earliest possible retirement date based on current trajectory
- Display projections including net worth growth, years to goal, and sustainable monthly income under 3%/4% withdrawal rules
- Support multiple investment return scenarios (conservative/moderate/aggressive)
- Allow saving and comparing up to 3 retirement scenarios side-by-side
- Persist retirement plans in local SQLite database
- Pre-populate starting net worth from the most recent balance sheet entry

---

## User Stories

### US-001: Create retirement planner database models
**Description:** As a developer, I need database models to store retirement plan data so it persists across sessions.

**Acceptance Criteria:**
- [ ] Create `retirement_plans` table with fields: id (UUID), name (String), target_retirement_date (Date nullable), starting_net_worth (f64), monthly_contribution (f64), expected_monthly_expenses (f64), return_scenario (enum: conservative/moderate/aggressive), created_at, updated_at
- [ ] Create `retirement_plan_results` table for cached calculation results: id, plan_id (FK), withdrawal_rate (f64), projected_retirement_date (Date), years_to_retirement (f64), final_net_worth (f64), sustainable_monthly_income (f64), calculated_at
- [ ] Create `retirement_plan_projections` table for net worth growth data points: id, plan_id (FK), year (i32), month (i32), projected_net_worth (f64), created_at
- [ ] Add SQLx migrations
- [ ] Typecheck passes (`cargo clippy`)

### US-002: Implement retirement calculation engine
**Description:** As a user, I want the app to calculate my retirement projections so I can understand my financial trajectory.

**Acceptance Criteria:**
- [ ] Create `RetirementService` in Rust with calculation logic
- [ ] Implement compound growth formula: `FV = PV * (1 + r)^n + PMT * (((1 + r)^n - 1) / r)`
- [ ] Support three return scenarios: conservative (4%), moderate (7%), aggressive (10%) annual returns
- [ ] Calculate sustainable monthly income using both 3% and 4% annual withdrawal rules
- [ ] Calculate years to reach retirement goal (target net worth = annual_expenses / withdrawal_rate)
- [ ] Calculate earliest retirement date when savings can sustain expenses indefinitely
- [ ] **Target date mode:** When a target retirement date is specified, calculate projections for that specific date (projected net worth, sustainable income at that date) even if it differs from the earliest possible retirement date
- [ ] **Discovery mode:** When no target date is specified (null/cleared), fall back to calculating earliest possible retirement date
- [ ] Generate and store monthly net worth projection data points from current date to retirement date
- [ ] Projection data points are recalculated and replaced when plan inputs change
- [ ] All calculations use home currency from user settings
- [ ] Unit tests cover all calculation scenarios including both target date and discovery modes
- [ ] Typecheck passes (`cargo clippy`)

### US-003: Create Tauri commands for retirement planning
**Description:** As a frontend developer, I need Tauri commands to interact with retirement planning from React.

**Acceptance Criteria:**
- [ ] `create_retirement_plan` command - creates new plan with inputs
- [ ] `get_retirement_plans` command - returns all saved plans (max 3)
- [ ] `get_retirement_plan` command - returns single plan by ID with calculated results
- [ ] `update_retirement_plan` command - updates plan and recalculates
- [ ] `delete_retirement_plan` command - removes plan
- [ ] `get_latest_net_worth` command - returns most recent net worth from balance sheet data
- [ ] `get_retirement_plan_projections` command - returns net worth projection data points for a plan (for charting)
- [ ] Commands registered in main.rs
- [ ] Typecheck passes (`cargo clippy`)

### US-004: Create retirement plan input form
**Description:** As a user, I want to enter my retirement planning inputs so I can generate projections.

**Acceptance Criteria:**
- [ ] Form includes: plan name, target retirement date (optional date picker), monthly contribution, expected monthly expenses in retirement
- [ ] Return scenario selector: Conservative (4%), Moderate (7%), Aggressive (10%)
- [ ] Starting net worth field pre-populated from latest balance sheet net worth
- [ ] Starting net worth is editable (user can override)
- [ ] Form validation: all monetary values must be positive, expenses required
- [ ] Submit creates plan via Tauri command
- [ ] Typecheck passes (`pnpm run typecheck`)
- [ ] Verify in browser using dev-browser skill

### US-005: Display retirement projection results
**Description:** As a user, I want to see my retirement projections so I can understand my financial future.

**Acceptance Criteria:**
- [ ] **Discovery mode (no target date):** Display earliest possible retirement date and projections at that date
- [ ] **Target date mode:** When target retirement date is set, display projections for that specific date regardless of earliest possible date
- [ ] Display the retirement date being used (target date or earliest possible)
- [ ] Display years until retirement
- [ ] Display projected net worth at retirement date
- [ ] Display sustainable monthly income under 3% rule (based on projected net worth at retirement date)
- [ ] Display sustainable monthly income under 4% rule (based on projected net worth at retirement date)
- [ ] Highlight if projected income meets/exceeds expected expenses
- [ ] Show net worth growth chart from current date to retirement date using stored projection data points
- [ ] Chart displays monthly or yearly data points (yearly recommended for long time horizons)
- [ ] Chart clearly marks the retirement date on the timeline
- [ ] Chart shows the projected net worth value at key milestones (current, midpoint, retirement)
- [ ] Results and chart update when inputs change (including when target date is set or cleared)
- [ ] When target date is cleared, immediately switch to showing earliest possible retirement date projections
- [ ] Typecheck passes (`pnpm run typecheck`)
- [ ] Verify in browser using dev-browser skill

### US-006: Implement scenario comparison view
**Description:** As a user, I want to compare up to 3 retirement scenarios side-by-side so I can make informed decisions.

**Acceptance Criteria:**
- [ ] Display saved scenarios in a comparison table/grid
- [ ] Show key metrics for each scenario: name, retirement date, years remaining, monthly income (3%), monthly income (4%)
- [ ] Visual indicator showing which scenario reaches retirement earliest
- [ ] Visual indicator showing which scenario provides highest sustainable income
- [ ] Clicking/selecting a saved scenario loads it into the main view (form inputs and projection results)
- [ ] When a scenario is loaded, the form is populated with its inputs and results/chart update accordingly
- [ ] Visual indicator showing which scenario is currently loaded/active
- [ ] Ability to delete a scenario from comparison
- [ ] Empty state when no scenarios saved
- [ ] Limit enforcement: cannot save more than 3 scenarios (show message)
- [ ] Typecheck passes (`pnpm run typecheck`)
- [ ] Verify in browser using dev-browser skill

### US-007: Add retirement planner navigation
**Description:** As a user, I want to access the retirement planner from the app navigation.

**Acceptance Criteria:**
- [ ] Add "Retirement Planner" link to main navigation/sidebar
- [ ] Route `/retirement` displays the retirement planner page
- [ ] Page layout includes: input form section, results section, scenario comparison section
- [ ] Responsive layout works on different window sizes
- [ ] Typecheck passes (`pnpm run typecheck`)
- [ ] Verify in browser using dev-browser skill

### US-008: Handle edge cases and error states
**Description:** As a user, I want clear feedback when calculations aren't possible or inputs are invalid.

**Acceptance Criteria:**
- [ ] Show message when no balance sheet data exists (cannot pre-populate net worth)
- [ ] Handle case where retirement is not achievable with current inputs (e.g., expenses exceed income)
- [ ] Show loading state while calculations are processing
- [ ] Display error messages for failed Tauri commands
- [ ] Handle currency display using home currency from user settings
- [ ] Typecheck passes (`pnpm run typecheck` and `cargo clippy`)

---

## Functional Requirements

- **FR-1:** The system must store retirement plans in SQLite with fields for all input parameters
- **FR-2:** The system must calculate compound growth using industry-standard formulas
- **FR-3:** The system must support three investment return scenarios: conservative (4%), moderate (7%), aggressive (10%)
- **FR-4:** The system must calculate sustainable withdrawal amounts using both 3% and 4% annual safe withdrawal rules
- **FR-5:** The system must pre-populate starting net worth from the most recent `NetWorthDataPoint` (sorted by year/month descending)
- **FR-6:** The system must limit saved scenarios to a maximum of 3
- **FR-7:** The system must recalculate projections whenever input parameters change
- **FR-8:** The system must display all monetary values in the user's home currency
- **FR-9:** The system must persist retirement plans across app sessions
- **FR-10:** The system must support both goal-oriented (target date) and discovery (earliest date) planning modes
- **FR-11:** When a target retirement date is specified, the system must calculate and display projections for that specific date (projected net worth and sustainable income at target date)
- **FR-12:** When the target retirement date is cleared/null, the system must fall back to discovery mode and display earliest possible retirement date projections
- **FR-13:** The system must always display the projected net worth at the selected retirement date (whether target or earliest possible)
- **FR-14:** The system must generate and store net worth projection data points (monthly) from current date to retirement date
- **FR-15:** The system must recalculate and replace projection data points when plan inputs change
- **FR-16:** The system must provide projection data points via a dedicated command for rendering the growth chart
- **FR-17:** The system must allow loading a saved scenario to view its inputs, results, and projection chart

---

## Non-Goals

- No integration with external financial APIs or data sources
- No inflation adjustment calculations (future enhancement)
- No tax considerations or tax-advantaged account modeling
- No Monte Carlo simulations or probability-based projections
- No export/import of retirement plans
- No social security or pension income modeling
- No automatic rebalancing or asset allocation recommendations
- No mobile-specific UI optimizations

---

## Technical Considerations

### Backend (Rust)

- Reuse `NetWorthService::get_history()` to fetch latest net worth for pre-population
- Create new `RetirementService` following existing service patterns in `src-tauri/src/services/`
- Add models to `src-tauri/src/models.rs` following existing struct patterns
- Register commands in `src-tauri/src/main.rs` following existing patterns
- Use SQLx for database operations with migrations in `src-tauri/migrations/`

### Frontend (React)

- Create new route at `/retirement` 
- Use existing UI component patterns from the codebase
- Invoke Tauri commands using `@tauri-apps/api/core`
- Follow existing TypeScript type patterns in `src/lib/types.ts`

### Calculation Formulas

```
// Future Value with regular contributions
FV = PV × (1 + r)^n + PMT × (((1 + r)^n - 1) / r)

Where:
- PV = Present Value (starting net worth)
- r = Monthly return rate (annual_rate / 12)
- n = Number of months
- PMT = Monthly contribution

// Safe Withdrawal Rate
Annual_Withdrawal = Net_Worth × Withdrawal_Rate
Monthly_Income = Annual_Withdrawal / 12

// Target Net Worth for Retirement
Target_Net_Worth = Annual_Expenses / Withdrawal_Rate
```

---

## Success Metrics

- Users can create a retirement plan in under 2 minutes
- Projections calculate and display in under 500ms
- Users can compare 3 scenarios with clear visual differentiation
- Starting net worth pre-populates correctly from balance sheet data
- All calculations produce mathematically accurate results

---

## Open Questions

- Should we add an inflation adjustment toggle in a future iteration?
- Should the growth chart show monthly or yearly data points?
- Should we warn users if their return scenario assumptions seem unrealistic?
