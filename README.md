# monorepo-template

## Prerequisites

- Bun >= 1.3

## Install

```bash
bun install
```

## Development

### Backend

```bash
cp apps/be/.env.example apps/be/.env
bun run dev:be
```

### Frontend

```bash
bun run dev:fe
```

## Codegen

Generate Prisma client + OpenAPI client:

```bash
bun run generate
```

## Database (Backend)

```bash
bun run --cwd apps/be db:push
bun run --cwd apps/be db:migrate
bun run --cwd apps/be db:studio
```

## Quality

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test:be
bun run test:fe
```

## CLI

The repository includes a Rust-based production readiness checker.

```bash
cd cli
cargo run -- check
```

## GUI (Tauri)

`gui-edit/` is a Tauri app. CI currently validates the frontend build.

```bash
cd gui-edit
bun install
bun run build
```

## Documentation

- `docs/architecture.md`
- `docs/backend-routing.md`
- `docs/codegen.md`
- `docs/contributing.md`
