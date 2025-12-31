import type { RouteMethod } from "../types";

export const method = "get" satisfies RouteMethod;

export const handler = ({ redirect }: { redirect: (to: string) => Response }) => redirect("/health");
