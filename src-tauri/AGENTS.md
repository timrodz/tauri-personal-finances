# Repository Guidelines

## Project Overview
This directory contains the Rust backend for a Tauri personal-finances desktop app, plus Tauri configuration and database migrations. All business logic lives in Rust and persists data to a local SQLite `.db` file.

## Project Structure & Module Organization
- `src-tauri/src/`: Rust backend modules.
- `src-tauri/src/commands.rs`: Tauri command entry points (CRUD and IPC).
- `src-tauri/src/services/`: backend service layer and business logic.
- `src-tauri/migrations/`: SQLx migrations for SQLite.
- `src-tauri/tauri.conf.json`: Tauri app config (CSP, windows, bundling).
- `src-tauri/capabilities/`: Tauri permission definitions.
- `src-tauri/icons/`: app icons.

## Build, Test, and Development Commands
- `cargo build`: build the Rust backend.
- `cargo check`: typecheck Rust only.
- `cargo clippy`: lint Rust.
- `cargo fmt`: format Rust.
- `cargo test`: run Rust unit tests.

## Coding Style & Naming Conventions
- Rust uses `rustfmt` defaults; run `cargo fmt` before committing.
- Tauri command names must be `snake_case`.
- Prefer small, focused modules and keep service logic in `src/services/`.

## Testing Guidelines
- Unit tests live alongside Rust modules in `src-tauri/src/` and run with `cargo test`.
- Add or update tests for every behavior change; focus on service logic and command handlers.

## Commit & Pull Request Guidelines
- Use clear, imperative commit messages; Conventional Commits are recommended (e.g., `feat: add budget editor`).
- PRs should explain what changed and why; call out any data model or migration changes.
- Note any security-sensitive changes, especially around CSP and Tauri capabilities.

## Security & Configuration Tips
- Be cautious when updating `tauri.conf.json` (CSP settings).
- Review `capabilities/` changes for permission scope and least-privilege.
- Keep embedded webviews and injected scripts isolated and well-audited.
