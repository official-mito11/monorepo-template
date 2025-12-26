# Architecture

## Monorepo layout

- `apps/fe`: Frontend (Vite + React + TanStack Router/Query)
- `apps/be`: Backend (Bun + Elysia)
- `packages/shared`: Shared types/utilities (includes PrismaBox generated types)
- `packages/api-client`: OpenAPI-generated client used by the frontend

## Data / contract flow

- Backend exposes an OpenAPI spec (dev only by default).
- `apps/be/scripts/generate-spec.ts` fetches `/openapi/json` and writes `packages/api-client/openapi-spec.json`.
- `openapi-typescript-codegen` generates the client into `packages/api-client/generated`.
- A postprocess step normalizes the generated client to be browser-friendly.

## Environment & configuration

- Backend env: `apps/be/.env` (copy from `.env.example`)
- CORS, cookie behavior, DB URL, etc. are controlled by env vars.

## CI

GitHub Actions runs:

- format check
- lint
- typecheck
- tests (BE/FE)
