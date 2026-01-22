# AGENTS.md

This is a desktop application built with Tauri.

## Project Technologies

- Backend: Rust (`src-tauri/`)
- Frontend: React (`src/`)
- UI: Shadcn + Tailwind
- Framework: Tauri

All application logic must be built with Rust, and the frontend must be used for rendering / manipulating data from the backend.

## Development practics

### Backend

- typecheck: Prefer `cargo clippy` over `cargo check`

### Frontend

- lint: `bun lint`
- typecheck: `bun typecheck`

### Database notes

- Retirement planner data is stored in the `retirement_plans` table (see `src-tauri/migrations`).
- Retirement planner CRUD commands live in `src-tauri/src/commands.rs` for Tauri invoke handlers.
- Net worth commands include `get_net_worth_history` and `get_latest_net_worth` in `src-tauri/src/commands.rs`.

## Rules

- Add or update tests even if not asked to.
- Run type checks and linters before committing work
- Update documentation with findings and changes to systems
