import { resolve } from "node:path";

import { loadRoutes } from "./routes/_loader";

export const registerRoutes = async (app: any) => {
  const routesDir = resolve(import.meta.dir, "routes");
  await loadRoutes(app, routesDir);
  return app;
};
