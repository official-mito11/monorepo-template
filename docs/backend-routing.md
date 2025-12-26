# Backend routing (file tree based)

This backend uses a simple file-tree router.

## Where routes live

- `apps/be/src/routes/**`

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
- Registration entry: `apps/be/src/routes.ts` and `apps/be/src/index.ts`
