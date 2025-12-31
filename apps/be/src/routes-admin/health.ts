import { t } from "elysia";
import type { RouteMethod, RouteOptions } from "../types";

export const method = "get" satisfies RouteMethod;

export const handler = () => "OK";

export const options = {
  tags: ["Admin", "Health"],
  summary: "Admin health check",
  description: "Check if the admin server is running",
  response: {
    200: t.String({ example: "OK" }),
  },
} satisfies RouteOptions;
