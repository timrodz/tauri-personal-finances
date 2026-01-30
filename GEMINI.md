# Gemini Project Context: Oink

This file serves as the primary context for AI agents working on this project.

## 1. Project Overview

**Goal:** A desktop-first personal finance application for tracking net worth and monthly balance sheets, specifically designed for users with assets/liabilities in multiple currencies (e.g., expats).

**Key Features:**

- Monthly balance sheets.
- Multi-currency support with "Home Currency" normalization.
- Net worth trend visualization.
- Privacy-focused (local SQLite database).

## 2. Technology Stack

### Frontend

- **Framework:** React 19 + TypeScript + Vite
- **UI Library:** shadcn/ui (Radix Primitives + Tailwind CSS)
- **Styling:** Tailwind CSS v4
- **State/Data Fetching:** React Hooks + Custom Query wrappers around Tauri commands (`src/hooks.ts`)
- **Routing:** React Router v7

### Backend (Tauri)

- **Core:** Tauri v2 (Rust)
- **Database:** SQLite (managed via `sqlx`)
- **Async Runtime:** Tokio

## 3. Architecture & Conventions

### Directory Structure

- `src/features/`: Feature-based modular architecture (e.g., `accounts`, `balance-sheet`). Contains components, logic, and types specific to a feature.
- `src/lib/`: Shared utilities, API definitions (`api.ts`), and global types (`types.ts`).
- `src-tauri/`: Rust backend code.
  - `src/services/`: Business logic separated by domain.
  - `src/commands.rs`: Interface between Frontend and Backend.
  - `migrations/`: SQL database migrations.

### Development Guidelines

- **Styling:** Use Tailwind utility classes. For complex components, leverage `shadcn/ui`.
- **State Management:**
  - Local state: `useState`, `useReducer`.
  - Server state: Custom hooks in `src/hooks.ts`.
- **API Communication:**
  - **Frontend:** All Tauri `invoke` calls must be wrapped in `src/lib/api.ts`.
  - **Backend:** Commands return `Result<T, String>` (or custom error types) and are defined in `src-tauri/src/commands.rs`.
- **Database:**
  - Use `sqlx` for all database interactions.
  - Run migrations via `sqlx-cli` or on app startup.

## 4. Build & Run Commands

**Prerequisites:**

- Node.js (via Bun)
- Rust (v1.90.0+)
- Tauri CLI

**Commands:**

- **Dev Server:** `cargo tauri dev` (Runs frontend and backend in dev mode)
- **Build:** `cargo tauri build`
- **Frontend Linting:** `bun run lint`
- **Backend Linting:** `cargo clippy --manifest-path src-tauri/Cargo.toml`

**Reference Documents:**

- `PRD.md`: Detailed product requirements.

## 5. Contributing

- Write conventional commits
- If the pre-commit hook fails, investigate and fix the issues, backend first then frontend if applicable.
