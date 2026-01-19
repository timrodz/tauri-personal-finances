---
trigger: glob
description: When working with backend or rust files
globs: *.rs, *.sql
---

- Use clean code practices
- Keep database transactions ACID-compliant
- Add or update unit tests for every piece of code, even if not asked
- After editing a file always run `cargo check` to verify and fix errors
