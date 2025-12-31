import type Elysia from "elysia";
import { accessSync, readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import type { MiddlewareModule, RouteMethod, RouteModule } from "../types";

const toSegment = (name: string) => {
  if (name === "index") return "";
  if (name.startsWith("[") && name.endsWith("]")) return `:${name.slice(1, -1)}`;
  return name;
};

const toRelativeRoutePath = (dir: string, filePath: string) => {
  const rel = relative(dir, filePath);
  const noExt = rel.replace(extname(rel), "");
  const parts = noExt.split(sep).filter(Boolean);
  const mapped = parts
    .map((p) => toSegment(p))
    .filter((p) => p !== "_")
    .filter((p) => p !== "");

  const path = "/" + mapped.join("/");
  return path === "/" ? "/" : path.replace(/\/+$/g, "");
};

const isRouteFile = (name: string) => {
  if (name.startsWith("_")) return false;
  return name.endsWith(".ts") || name.endsWith(".js");
};

const isMiddlewareFile = (name: string) => {
  return name === "_middleware.ts" || name === "_middleware.js";
};

const fileExistsSync = (filePath: string) => {
  try {
    accessSync(filePath);
    return true;
  } catch {
    return false;
  }
};

interface RouteEntry {
  urlPath: string;
  method: string;
  handler: (ctx: unknown) => unknown;
  options?: Record<string, unknown>;
}

interface SubdirEntry {
  segment: string;
  dir: string;
  basePath: string;
}

interface DirLoadResult {
  middlewarePath?: string;
  routes: RouteEntry[];
  subdirs: SubdirEntry[];
}

// Collect all route information from a directory (sync directory read, async imports)
const collectDir = async (dir: string, basePath: string): Promise<DirLoadResult> => {
  const entries = readdirSync(dir, { withFileTypes: true });

  // Find middleware file
  const middlewareTs = join(dir, "_middleware.ts");
  const middlewareJs = join(dir, "_middleware.js");
  const middlewarePath = fileExistsSync(middlewareTs)
    ? middlewareTs
    : fileExistsSync(middlewareJs)
      ? middlewareJs
      : undefined;

  const routes: RouteEntry[] = [];
  const subdirs: SubdirEntry[] = [];

  // Collect route files
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!isRouteFile(entry.name)) continue;
    if (isMiddlewareFile(entry.name)) continue;

    const filePath = join(dir, entry.name);
    const urlPath = toRelativeRoutePath(dir, filePath);
    const mod = (await import(filePath)) as Partial<RouteModule>;

    const method = ((mod.method ?? "get") as RouteMethod).toLowerCase();
    const handler = mod.handler;

    if (typeof handler !== "function") {
      throw new Error(`Route file must export handler function: ${filePath}`);
    }

    routes.push({
      urlPath,
      method,
      handler,
      options: mod.options as Record<string, unknown> | undefined,
    });
  }

  // Collect subdirectories
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;

    const segment = toSegment(entry.name);
    if (segment === "_") continue;

    const nextPrefix = segment ? `/${segment}` : "";
    const nextDir = join(dir, entry.name);

    subdirs.push({
      segment: nextPrefix,
      dir: nextDir,
      basePath: basePath + nextPrefix,
    });
  }

  return { middlewarePath, routes, subdirs };
};

// Recursively register routes using Elysia's group (synchronous registration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerDir = (app: any, result: DirLoadResult, allResults: Map<string, DirLoadResult>): any => {
  // Apply middleware if present
  if (result.middlewarePath) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mw = require(result.middlewarePath) as MiddlewareModule;
    const fn = mw.middleware ?? mw.default;
    if (typeof fn === "function") {
      app = fn(app) ?? app;
    }
  }

  // Register route files
  for (const route of result.routes) {
    const methodFn = app[route.method];
    if (typeof methodFn !== "function") {
      throw new Error(`Unsupported method: ${route.method}`);
    }
    methodFn.call(app, route.urlPath, route.handler, route.options);
  }

  // Register subdirectories using group
  for (const subdir of result.subdirs) {
    const subdirResult = allResults.get(subdir.dir);
    if (subdirResult) {
      const prefix = subdir.segment || "";
      if (prefix) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.group(prefix, (groupApp: any) => {
          return registerDir(groupApp, subdirResult, allResults);
        });
      } else {
        // No prefix, register directly
        registerDir(app, subdirResult, allResults);
      }
    }
  }

  return app;
};

// Collect all directories recursively (async)
const collectAllDirs = async (
  dir: string,
  basePath: string,
  results: Map<string, DirLoadResult>
): Promise<void> => {
  const result = await collectDir(dir, basePath);
  results.set(dir, result);

  for (const subdir of result.subdirs) {
    await collectAllDirs(subdir.dir, subdir.basePath, results);
  }
};

export const loadRoutes = async (app: Elysia, routesDir: string): Promise<Elysia> => {
  // Phase 1: Collect all route information asynchronously
  const allResults = new Map<string, DirLoadResult>();
  await collectAllDirs(routesDir, "", allResults);

  // Phase 2: Register routes synchronously
  const rootResult = allResults.get(routesDir);
  if (rootResult) {
    app = registerDir(app, rootResult, allResults);
  }

  return app;
};
