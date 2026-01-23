# Backend rules

- Keep database transactions ACID-compliant
- Never define magic numbers or strings, store them as variables
- Always use descriptive variable names
- Use early return pattern
- Big chunks of code need to be split into separate functions with single responsibility principle

## Rust

- After editing a file always run `cargo fmt` and `cargo clippy`
- Use variables directly in the `format!` string
- Avoid mutability, `let value` over `let mut value`
- Avoid `unwrap`, use its alternatives instead
