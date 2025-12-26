export const NODE_ENV = process.env.NODE_ENV || "development";

export const isProd = NODE_ENV === "production";
export const isDev = !isProd;

const parseBoolean = (value: string | undefined) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
};

export const COOKIE_SECURE = parseBoolean(process.env.COOKIE_SECURE) ?? isProd;
export const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE ?? (isDev ? "lax" : "none");
