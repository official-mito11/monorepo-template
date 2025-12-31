import { t } from "elysia";
import type { RouteMethod, RouteOptions } from "../types";

export const method = "get" satisfies RouteMethod;

export const handler = () => ({
  message: "Admin Server",
  version: "1.0.0",
});

export const options = {
  tags: ["Admin"],
  summary: "Admin root endpoint",
  description: "Returns admin server information",
  response: {
    200: t.Object({
      message: t.String(),
      version: t.String(),
    }),
  },
} satisfies RouteOptions;
