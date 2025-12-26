import cookie from "@elysiajs/cookie";
import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import swagger from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import openapi from "@elysiajs/openapi";
import Elysia from "elysia";
import pretty from "pino-pretty";
import packageJson from "../package.json" assert { type: "json" };
import { COOKIE_SAMESITE, COOKIE_SECURE, isDev } from "./config/env";
import { registerRoutes } from "./routes";

const PORT = process.env.PORT || 8000;

const API_SPEC = {
  info: {
    title: "App API",
    version: (packageJson as { version?: string }).version || "0.0.1",
    description: "API Server for App",
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
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE as any,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
  );

if (isDev) {
  app.use(openapi({ documentation: API_SPEC }));
  app.use(swagger({ documentation: API_SPEC }));
}

app.use(
  logger({
    stream: pretty({
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
      messageFormat: "{msg} {request}",
      customColors: "info:blue,warn:yellow,error:red,debug:gray",
    }),
  })
);

await registerRoutes(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export { app };
