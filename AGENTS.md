# AGENTS.md

This is a desktop application for personal finances, built with Tauri (Rust backend + React frontend) that works offline and leverages internet access when needed to.

## Project Technologies

- Tauri: Application framework
- Rust: Backend
- React: Frontend
- TypeScript: Frontend programming language
- Shadcn: pre-defined UI components
- SQLite: Database
- Vitest: Frontend testing framework

All application logic must be built with Rust, and the frontend must be used for rendering / manipulating data from the backend.

There is no cloud storage enabled for this application; it's expected that user data lives in a SQLite `.db` file; we only interact with that file.

## Development practices

Add or update unit tests for every piece of code

### Backend

- Write queries with `sqlx`
- CRUD commands live in `src-tauri/src/commands.rs`
- Services live in `src-tauri/src/services`
- Database migrations live in `src-tauri/migrations`
- Build: `cargo build`
- Lint: `cargo clippy`
- Typecheck: `cargo check`
- Formatter: `cargo fmt`. Apply `rustfmt` default style; use snake_case for Tauri command names.

### Frontend

- Charts: use `Chart.js` with `react-chartjs-2`
- To add shadcn components use `bun shadcn:add`
- Lint: `bun lint`
- Typecheck: `bun typecheck`
- Tests: `bun test`
- Formatting: prefer camelCase for variables and PascalCase for components.

## Commit & Pull Request Guidelines

Git history may not be available in all checkouts. Use clear, imperative commit messages (recommended: Conventional Commits, e.g., `feat: add site editor`).

PRs should include:

- What changed + why, and any UX screenshots for UI changes
- Notes on security-sensitive changes (CSP, capabilities, webview behavior)

## Security & Configuration Notes

This app embeds external sites in webviews and injects scripts. Be cautious when adjusting:

- `src-tauri/tauri.conf.json` (CSP)
- `src-tauri/capabilities/default.json` (permissions)
