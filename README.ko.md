# monorepo-template

## 사전 준비

- Bun >= 1.3

## 설치

```bash
bun install
```

## 개발

### 백엔드

```bash
cp apps/be/.env.example apps/be/.env
bun run dev:be
```

### 프론트엔드

```bash
bun run dev:fe
```

## 코드 생성(Codegen)

Prisma client + OpenAPI client 생성:

```bash
bun run generate
```

## 데이터베이스(백엔드)

```bash
bun run --cwd apps/be db:push
bun run --cwd apps/be db:migrate
bun run --cwd apps/be db:studio
```

## 품질(Quality)

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test:be
bun run test:fe
```

## CLI

리포에는 Rust 기반 프로덕션 준비 상태 점검 CLI가 포함되어 있습니다.

```bash
cd cli
cargo run -- check
```

## GUI (Tauri)

`gui-edit/`는 Tauri 앱입니다. CI에서는 현재 프론트 빌드까지를 검증합니다.

```bash
cd gui-edit
bun install
bun run build
```

## 문서

- `docs/architecture.ko.md`
- `docs/backend-routing.ko.md`
- `docs/codegen.ko.md`
- `docs/contributing.ko.md`
