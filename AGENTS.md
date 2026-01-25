# Repository Guidelines

## Project Overview
This is a Tauri desktop app for personal finances with a Rust backend and a React + TypeScript frontend. The app works offline by default and persists data in a local SQLite `.db` file. All business logic lives in Rust; the frontend renders and manipulates data exposed by Tauri commands.

## Project Structure & Module Organization
- `src/`: React UI, routes, and client-side state.
- `src-tauri/src/`: Rust backend modules.
- `src-tauri/src/commands.rs`: Tauri command entry points (CRUD lives here).
- `src-tauri/src/services/`: backend service layer.
- `src-tauri/migrations/`: SQLx migrations for the SQLite database.
- `public/`: static assets served by Vite.
- `docs/`: project documentation and notes.

## Build, Test, and Development Commands
Frontend (Bun + Vite):
- `bun dev`: run the Vite dev server.
- `bun build`: typecheck and build the frontend bundle.
- `bun preview`: preview the production build.
- `bun typecheck`: TypeScript check only.
- `bun lint`: run ESLint with auto-fix on `src/`.
- `bun test`: run Vitest.
- `bun shadcn:add`: add shadcn/ui components.

Backend (Rust/Tauri):
- `cargo build`: build the Rust backend.
- `cargo check`: typecheck Rust only.
- `cargo clippy`: lint Rust.
- `cargo fmt`: format Rust code.
- `bun tauri dev`: run the full Tauri app in dev mode.

## Coding Style & Naming Conventions
- Rust uses `rustfmt` defaults; Tauri command names must be `snake_case`.
- TypeScript uses `camelCase` for variables and `PascalCase` for components.
- Prefer small, focused modules; keep services in `src-tauri/src/services` and UI logic in `src/`.

## Testing Guidelines
- Frontend tests use Vitest and should live near the code they cover under `src/`.
- Backend unit tests should live alongside Rust modules in `src-tauri/src`.
- Update or add tests for every behavior change.

## Commit & Pull Request Guidelines
- Use clear, imperative commit messages (Conventional Commits recommended, e.g., `feat: add budget editor`).
- PRs should include what changed, why, and screenshots for UI changes.
- Note any security-sensitive changes, especially around CSP and Tauri capabilities.

## Security & Configuration Notes
This app embeds external sites in webviews and injects scripts. Be cautious when updating:
- `src-tauri/tauri.conf.json` (CSP settings)
- `src-tauri/capabilities/default.json` (permissions)

## Architecture Tips
- Database access should use `sqlx` and migrate via `src-tauri/migrations`.
- Charts must use Chart.js via `react-chartjs-2`.
