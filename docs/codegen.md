# Code generation (Prisma + OpenAPI client)

## Overview

This template keeps the backend contract and the frontend client in sync via code generation.

## Commands

From repo root:

```bash
bun run generate
```

This runs:

- `generate:prisma` -> Prisma generate (backend)
- `generate:client` -> OpenAPI spec + OpenAPI client generation (backend)

## OpenAPI generation pipeline

Backend scripts:

- `apps/be/scripts/generate-spec.ts`
  - Calls `app.handle(new Request("http://localhost/openapi/json"))`
  - Writes `packages/api-client/openapi-spec.json`

- `apps/be` script `generate:openapi`
  - Runs `openapi-typescript-codegen` into `packages/api-client/generated`

- `apps/be/scripts/postprocess-openapi.ts`
  - Patches the generated client so it works in browser environments (no Node-only `form-data` import)

## Notes

- The OpenAPI endpoints are enabled in dev by default.
- If you change backend routes/schemas, re-run `bun run generate`.
