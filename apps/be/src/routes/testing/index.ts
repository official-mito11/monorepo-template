import type { Elysia } from "elysia";

export const options = {
  tags: ["testing"],
  summary: "/testing",
};

export const get = (app: Elysia) =>
  app.get("/testing", () => {
    return { message: "GET /testing" };
  });
