/**
 * Admin Middleware
 *
 * This middleware is applied to all admin routes.
 * Add authentication, authorization, and other admin-specific
 * middleware here.
 *
 * Example with JWT authentication:
 *
 *   import jwt from "@elysiajs/jwt";
 *
 *   export default (app: Elysia) =>
 *     app
 *       .use(jwt({ name: "adminJwt", secret: process.env.ADMIN_JWT_SECRET! }))
 *       .derive(async ({ adminJwt, headers }) => {
 *         const token = headers.authorization?.split(" ")[1];
 *         if (!token) throw new Error("Unauthorized");
 *         const payload = await adminJwt.verify(token);
 *         if (payload?.role !== "admin") throw new Error("Forbidden");
 *         return { admin: payload };
 *       });
 */

import type Elysia from "elysia";

export default (app: Elysia): Elysia => {
  // Add admin-specific middleware here
  // For now, just pass through
  return app;
};
