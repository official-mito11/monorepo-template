import cookie from "@elysiajs/cookie";
import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import swagger from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import openapi from "@elysiajs/openapi";
import Elysia from "elysia";
import pretty from "pino-pretty";
import { t } from "elysia";
import packageJson from "../package.json" assert { type: "json" };
import { isDev } from "./config/env";

const PORT = process.env.PORT || 8000;

const API_SPEC = {
  info: {
    title: "Chiup Max Level API",
    version: (packageJson as { version?: string }).version || "0.0.1",
    description: "API Server for Chiup Max Level",
  },
  servers: [
    {
      url: process.env.SERVER_URL || "http://localhost:8000",
      description: isDev ? "Local development server" : "Production server",
    },
  ],
};

const app = new Elysia()
  // Plugins
  .use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    })
  )
  .use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        `http://localhost:${PORT}`,
      ],
      credentials: true,
    })
  )
  .use(
    cookie({
      httpOnly: true,
      secure: !isDev,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
  )
  // Dev test environment
  .use(isDev ? openapi({ documentation: API_SPEC }) : undefined)
  .use(isDev ? swagger({ documentation: API_SPEC }) : undefined)
  .use(
    logger({
      stream: pretty({
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        messageFormat: "{msg} {request}",
        customColors: "info:blue,warn:yellow,error:red,debug:gray",
      }),
    })
  )
  .get("/", ({ redirect }) => redirect("/health"))
  .get("/health", () => "OK", {
    tags: ["Health"],
    summary: "Health check",
    description: "Check if the server is running",
    response: {
      200: t.String({ example: "OK" }),
    },
    responseDescription: "OK",
  })
  // Start server
  .listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

export { app };
