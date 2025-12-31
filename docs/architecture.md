# Architecture

## Monorepo layout

- `apps/fe`: Frontend (Vite + React + TanStack Router/Query)
- `apps/be`: Backend (Bun + Elysia)
- `packages/shared`: Shared types/utilities (includes PrismaBox generated types)
- `packages/api-client`: OpenAPI-generated client used by the frontend

## Backend process types

The backend supports multiple process types, each running as a separate Elysia app:

| Process Type | Port | Description |
|-------------|------|-------------|
| `main` | 8000 | Main API server (default) |
| `admin` | 8001 | Admin server with separate routes |
| `worker` | - | Background job processor (no HTTP) |

### Running different process types

```bash
# Main API server (default)
bun run dev

# Admin server
bun run dev:admin

# Run both simultaneously
bun run dev & bun run dev:admin
```

### Directory structure

```
apps/be/src/
├── routes/        # Main API routes (port 8000)
├── routes-admin/  # Admin routes (port 8001)
├── config/
│   ├── env.ts     # Environment config
│   └── process.ts # Process type config
├── app.ts         # App factory
└── index.ts       # Entry point
```

## Data / contract flow

- Backend exposes an OpenAPI spec (dev only by default).
- `apps/be/scripts/generate-spec.ts` fetches `/openapi/json` and writes `packages/api-client/openapi-spec.json`.
- `openapi-typescript-codegen` generates the client into `packages/api-client/generated`.
- A postprocess step normalizes the generated client to be browser-friendly.

## Environment & configuration

- Backend env: `apps/be/.env` (copy from `.env.example`)
- CORS, cookie behavior, DB URL, etc. are controlled by env vars.
- Process type is controlled by `PROCESS_TYPE` env var.

## CI

GitHub Actions runs:

- format check
- lint
- typecheck
- tests (BE/FE)
