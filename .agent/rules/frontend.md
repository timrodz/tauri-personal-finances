---
trigger: glob
description: When working on the frontend
globs: src/, *.ts, *.tsx
---

- This is a react 19 codebase
- Use `bun` and `bunx` commands to handle tests, builds, installs
- Styles are handled with shadcn, use the CLI `bunx shadcn@latest ...` to add new components
- Components should never define sub-components or custom functions inside, they should be placed in outside files
- Keep constants, types/interfaces, and utilities in separate files based on project context
- If you run `useMemo` and have a complex calculation there, split it to an outside function
- Never define magic numbers or strings, store them as variables
- Always use descriptive variable names
- When finishing a task check TASKS.md and check off what you have completed, ensuring you meet acceptance criteria as well
