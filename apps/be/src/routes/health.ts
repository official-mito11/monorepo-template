import { t } from "elysia";
import type { RouteMethod, RouteOptions } from "../types";

export const method = "get" satisfies RouteMethod;

export const handler = () => "OK";

export const options = {
  tags: ["Health"],
  summary: "Health check",
  description: "Check if the server is running",
  response: {
    200: t.String({ example: "OK" }),
  },
  responseDescription: "OK",
} satisfies RouteOptions;
