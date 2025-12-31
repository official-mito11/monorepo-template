/**
 * App Factory
 *
 * Creates an Elysia app instance with the appropriate configuration
 * based on the process type.
 */

import cookie from "@elysiajs/cookie";
import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import swagger from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import openapi from "@elysiajs/openapi";
import Elysia from "elysia";
import pretty from "pino-pretty";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import packageJson from "../package.json" assert { type: "json" };
import { COOKIE_SAMESITE, COOKIE_SECURE, isDev } from "./config/env";
import { type ProcessConfig, getProcessConfig } from "./config/process";
import { loadRoutes } from "./routes/_loader";

const getApiSpec = (config: ProcessConfig) => ({
  info: {
    title: `${config.name} API`,
    version: (packageJson as { version?: string }).version || "0.0.1",
    description: `${config.name} - ${config.type} process`,
  },
  servers: [
    {
      url: process.env.SERVER_URL || `http://localhost:${config.port}`,
      description: isDev ? "Local development server" : "Production server",
    },
  ],
});

export interface CreateAppOptions {
  config?: ProcessConfig;
}

export const createApp = async (options?: CreateAppOptions): Promise<Elysia> => {
  const config = options?.config ?? getProcessConfig();
  const apiSpec = getApiSpec(config);

  const app = new Elysia({ name: config.name });

  // Static files (only for processes that need it)
  if (config.enableStatic) {
    app.use(
      staticPlugin({
        assets: "public",
        prefix: "/",
      })
    );
  }

  // CORS
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        `http://localhost:${config.port}`,
      ],
      credentials: true,
    })
  );

  // Cookie
  app.use(
    cookie({
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE as "strict" | "lax" | "none",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
  );

  // OpenAPI & Swagger (only in dev and if enabled)
  if (isDev && config.enableSwagger) {
    app.use(openapi({ documentation: apiSpec }));
    app.use(swagger({ documentation: apiSpec }));
  }

  // Logger
  app.use(
    logger({
      stream: pretty({
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        messageFormat: `[${config.type}] {msg} {request}`,
        customColors: "info:blue,warn:yellow,error:red,debug:gray",
      }),
    })
  );

  // Load routes if routesDir is specified and exists
  if (config.routesDir) {
    const fullPath = resolve(import.meta.dir, config.routesDir);
    if (existsSync(fullPath)) {
      await loadRoutes(app, fullPath);
    }
  }

  return app;
};

export const startServer = (app: Elysia, port: number): void => {
  if (port <= 0) {
    console.log(`[Worker] Process started (no HTTP server)`);
    return;
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};
