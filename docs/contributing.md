# Contributing

## Repository scripts

From repo root:

- `bun run format` / `bun run format:check`
- `bun run lint`
- `bun run typecheck`
- `bun run test:be`
- `bun run test:fe`

CLI (Rust) from `cli/`:

- `cargo fmt --check`
- `cargo test`

GUI (Tauri frontend) from `gui-edit/`:

- `bun install`
- `bun run build`

## Linting

This repo uses ESLint (flat config):

- `eslint.config.js`

Generated code is ignored by default (`**/generated/**`).

## CI

CI runs on GitHub Actions:

- `.github/workflows/ci.yml`

It installs dependencies and runs:

- format check
- lint
- typecheck
- tests (BE/FE)
- Rust CLI checks (`cargo fmt --check`, `cargo test`)
- `gui-edit` frontend build (`bun install`, `bun run build`)
