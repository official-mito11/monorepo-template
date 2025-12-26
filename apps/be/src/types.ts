import type { DocumentDecoration, MaybeArray } from "elysia";
import type { BodyHandler, ContentType, IntersectIfObjectSchema, UnwrapRoute } from "elysia/types";

export type RouteMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

export type RouteOptions = {
  detail?: DocumentDecoration;
  parse?: MaybeArray<
    ContentType | BodyHandler<IntersectIfObjectSchema<UnwrapRoute<{}, {}, "/">, {}>>
  >;

  tags?: DocumentDecoration["tags"];
  summary?: DocumentDecoration["summary"];
  description?: DocumentDecoration["description"];

  response?: Record<number, unknown>;
  responseDescription?: string;
};

export type RouteHandler = (ctx: any) => any;

export type RouteMiddleware = (app: any) => any;

export type MiddlewareModule = {
  default?: RouteMiddleware;
  middleware?: RouteMiddleware;
};

export type RouteModule = {
  method?: RouteMethod;
  handler: RouteHandler;
  options?: RouteOptions;
};
