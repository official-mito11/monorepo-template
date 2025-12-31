# Backend routing (file tree based)

This backend uses a simple file-tree router.

## Process types

The backend supports multiple process types, each with its own routes directory:

| Process Type | Routes Directory | Port |
|-------------|-----------------|------|
| `main` | `src/routes/` | 8000 |
| `admin` | `src/routes-admin/` | 8001 |

See [Architecture](./architecture.md) for more details on running different process types.

## Where routes live

- Main API: `apps/be/src/routes/**`
- Admin: `apps/be/src/routes-admin/**`

## File-to-path mapping

- `routes/index.ts` -> `/`
- `routes/health.ts` -> `/health`
- `routes/users/index.ts` -> `/users`
- `routes/users/[id].ts` -> `/users/:id`

Notes:

- Files starting with `_` are ignored (e.g. `_loader.ts`).

## Directory-scoped middleware

You can scope middleware (e.g. `jwt()`, `cookie()`, auth plugins) to a route subtree by adding:

- `apps/be/src/routes/**/_middleware.ts`
- `apps/be/src/routes-admin/**/_middleware.ts`

The middleware in that directory will be applied to the directory and all nested routes.

Module shape:

```ts
export default (app: any) => app.use(/* plugin */);
// or
export const middleware = (app: any) => app.use(/* plugin */);
```

## Route module shape

Each route file should export:

- `method` (optional): HTTP method (default: `get`)
- `handler` (required): the Elysia handler function
- `options` (optional): route options/schema

Example:

```ts
export const method = "get";

export const handler = () => "OK";
```

## Implementation

- Loader: `apps/be/src/routes/_loader.ts`
- App factory: `apps/be/src/app.ts`
- Process config: `apps/be/src/config/process.ts`
- Entry point: `apps/be/src/index.ts`
