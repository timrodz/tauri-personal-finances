# Repository Guidelines

## Project Overview

This guide is **frontend-specific**. Files under `src/` are the React + TypeScript UI for a Tauri desktop app. Backend logic lives in `src-tauri/` and is out of scope for changes here unless explicitly requested.

## Project Structure & Module Organization

- `src/`: React UI, routes, and client-side state (frontend-only).
- `src/pages/`: page entrypoints, named like `src/pages/<name>-page.tsx`.
- `src/components/`: multipurpose components
- `src/features/`: feature modules and components (e.g., `src/features/<name>/<name>-feature.tsx`).
- `src/hooks/`, `src/providers/`, `src/lib/`: shared hooks, providers, and utilities/types/constants.
- `public/`: static assets served by Vite.
  Backend reference: `src-tauri/` contains Rust services and Tauri commands; avoid edits there unless needed.

## Build, Test, and Development Commands

Bun + Vite:

- `bun dev`: run the Vite dev server.
- `bun build`: typecheck and build the frontend bundle.
- `bun preview`: preview the production build.
- `bun typecheck`: TypeScript check only.
- `bun lint`: run ESLint with auto-fix on `src/`.
- `bun test`: run Vitest.
- `bun shadcn:add`: add shadcn/ui components.

## Coding Style & Naming Conventions

- TypeScript: `camelCase` variables, `PascalCase` components; avoid `any` and explicit type casts.
- Use absolute imports and keep files focused (target 150–200 lines).
- Number fields must be wrapped around `<PrivateValue>` (component) or `toPrivateValue` (function).
- Define shared constants and types in `src/lib`

## Testing Guidelines

- Vitest tests should live near the code they cover under `src/`.
- Update or add tests for any behavior change; run `bun test`.

## Commit & Pull Request Guidelines

- Use clear, imperative commit messages (Conventional Commits recommended, e.g., `feat: add budget editor`).
- PRs should include: what changed, why, and screenshots for UI changes.
- Call out security-sensitive changes (CSP or capabilities updates).

## Frontend Architecture Notes

- The UI should only call Tauri commands; avoid duplicating business logic.
- Charts must use Chart.js via `react-chartjs-2`.
