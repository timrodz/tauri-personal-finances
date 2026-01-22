---
trigger: glob
description: When working on the frontend
globs: src/, *.ts, *.tsx
---

# Frontend

- Keep constants, types/interfaces, and utilities in separate files based on project context
- Never define magic numbers or strings, store them as variables
- Always use descriptive variable names
- Apply early return principles
- Reduce amount of nested logical checks
- Use absolute imports

## React

- If you run `useMemo` and have a complex calculation there, split it to an outside function
- Components should never define sub-components or custom functions inside, they should be placed in outside files
- Styles are handled with shadcn, use the CLI `bunx shadcn@latest ...` to add new components. Only use colors defined by the theme in src/index.css
- Any number field needs to be wrapped around the `<PrivateValue>` React component or `toPrivateValue` function
- For icons use lucide-react and import the name with the `Icon` suffix: `ArrowUpIcon` instead of `ArrowUp`

## TypeScript

- Never use `any` as a type
- Never use explicit type casts (`const a = "" as number`)
