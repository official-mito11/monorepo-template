import type Elysia from "elysia";
import { resolve } from "node:path";

import { loadRoutes } from "./routes/_loader";

export const registerRoutes = async (app: Elysia): Promise<Elysia> => {
  const routesDir = resolve(import.meta.dir, "routes");
  await loadRoutes(app, routesDir);
  return app;
};
