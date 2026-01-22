# Personal Finances

A personal finance application built with Tauri, React and Typescript in Vite.

## Setup

### Requirements

- `rust` version 1.90.0

Cargo containers:

- `tauri`
- `trunk`
- `sqlx-cli`

### Development

From root:

```shell
cargo tauri dev
```

From `src-tauri`:

```shell
cargo test
```

### Database notes

- Retirement planner data is stored in the `retirement_plans` table (see `src-tauri/migrations`).

### VS Code Extensions

- [VS Code](https://code.visualstudio.com/)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Progress screenshots

### 20/01/2026

Dashboard 

Net worth section w/ privacy mode and time series charts

<img width="1676" height="760" alt="image" src="https://github.com/user-attachments/assets/5f8b5cc0-6271-4ba7-9057-b642df4c56b0" />

Balance sheets overview

<img width="1543" height="372" alt="image" src="https://github.com/user-attachments/assets/994952ea-34eb-4e76-bc11-0f40323698a8" />

Balance sheet page: overview + account entries

<img width="1962" height="1064" alt="image" src="https://github.com/user-attachments/assets/909d6476-ccff-4264-ad86-c966c1dcc97c" />

Balance sheet page: foreign exchange rates + totals

<img width="1959" height="360" alt="image" src="https://github.com/user-attachments/assets/4a6eb210-ad94-447b-bdbd-2476b7873a7f" />

### 16/01/2026

Dashboard

<img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/4db1874e-ee63-49da-b15b-ec98552fc336" />

Account creation form

<img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/3a80ca30-5726-4f79-81cb-02bfaa05c6bb" />

### 14/01/2026

Dashboard

<img width="3304" height="2400" alt="image" src="https://github.com/user-attachments/assets/4a884ce7-89cf-4e9a-9452-d20fbdc6b3d2" />

User settings form

<img width="3304" height="2400" alt="image" src="https://github.com/user-attachments/assets/b512bbf4-d6f6-4430-8437-ff3edfe4acf6" />
