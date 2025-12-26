import type Elysia from "elysia";
import { access, readdir } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import type { MiddlewareModule, RouteMethod, RouteModule } from "../types";

const toUrlPath = (routesDir: string, filePath: string) => {
  const rel = relative(routesDir, filePath);
  const noExt = rel.replace(extname(rel), "");
  const parts = noExt.split(sep).filter(Boolean);

  const mapped = parts
    .map((p) => {
      if (p === "index") return "";
      if (p.startsWith("[") && p.endsWith("]")) return `:${p.slice(1, -1)}`;
      return p;
    })
    .filter((p) => p !== "_");

  const path = "/" + mapped.filter((p) => p.length > 0).join("/");
  return path === "/" ? "/" : path.replace(/\/+$/g, "");
};

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

const fileExists = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const loadRoutes = async (app: Elysia, routesDir: string) => {
  const loadDir = async (dirApp: any, dir: string, basePath: string) => {
    const entries = await readdir(dir, { withFileTypes: true });

    // Optional directory-scoped middleware
    const middlewareTs = join(dir, "_middleware.ts");
    const middlewareJs = join(dir, "_middleware.js");
    const middlewarePath = (await fileExists(middlewareTs))
      ? middlewareTs
      : (await fileExists(middlewareJs))
        ? middlewareJs
        : undefined;

    if (middlewarePath) {
      const mw = (await import(pathToFileURL(middlewarePath).href)) as MiddlewareModule;
      const fn = mw.middleware ?? mw.default;
      if (typeof fn === "function") {
        dirApp = fn(dirApp) ?? dirApp;
      }
    }

    // 1) Register route files directly under this directory
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isRouteFile(entry.name)) continue;
      if (isMiddlewareFile(entry.name)) continue;

      const filePath = join(dir, entry.name);
      const urlPath = toRelativeRoutePath(dir, filePath);
      const mod = (await import(pathToFileURL(filePath).href)) as Partial<RouteModule>;

      const method = ((mod.method ?? "get") as RouteMethod).toLowerCase();
      const handler = mod.handler;

      if (typeof (dirApp as any)[method] !== "function") {
        throw new Error(`Unsupported method: ${method} (${filePath})`);
      }
      if (typeof handler !== "function") {
        throw new Error(`Route file must export handler function: ${filePath}`);
      }

      (dirApp as any)[method](urlPath, handler, mod.options);
    }

    // 2) Recurse into subdirectories with proper scoping
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("_")) continue;

      const segment = toSegment(entry.name);
      if (segment === "_") continue;

      const nextPrefix = segment ? `/${segment}` : "/";
      const nextDir = join(dir, entry.name);
      await dirApp.group(nextPrefix, async (groupApp: any) => {
        await loadDir(groupApp, nextDir, basePath + nextPrefix);
      });
    }
  };

  await loadDir(app, routesDir, "");
  return app;
};
