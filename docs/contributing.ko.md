# 기여 가이드

## 리포 스크립트

리포 루트에서:

- `bun run format` / `bun run format:check`
- `bun run lint`
- `bun run typecheck`
- `bun run test:be`
- `bun run test:fe`

CLI(Rust) `cli/`에서:

- `cargo fmt --check`
- `cargo test`

GUI(Tauri 프론트) `gui-edit/`에서:

- `bun install`
- `bun run build`

## 린트

이 리포는 ESLint(flat config)를 사용합니다.

- `eslint.config.js`

생성 코드(`**/generated/**`)는 기본적으로 lint 대상에서 제외됩니다.

## CI

GitHub Actions에서 CI를 실행합니다.

- `.github/workflows/ci.yml`

의존성 설치 후 아래를 수행합니다.

- format check
- lint
- typecheck
- 테스트(BE/FE)
- Rust CLI 검사(`cargo fmt --check`, `cargo test`)
- `gui-edit` 프론트 빌드(`bun install`, `bun run build`)
