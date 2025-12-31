/**
 * Process Configuration
 *
 * This module provides configuration for running multiple backend processes.
 * Each process runs as a separate Elysia app on its own port.
 *
 * Process Types:
 * - "main": Main API server (default, port 8000)
 * - "admin": Admin server (port 8001) - separate app with admin-only routes
 * - "worker": Background job processor (no HTTP server)
 *
 * Usage:
 *   bun run dev                     # Main API (default)
 *   bun run dev:admin               # Admin server
 *   PROCESS_TYPE=worker bun run src/index.ts  # Worker
 *
 * For running multiple processes simultaneously:
 *   bun run dev & bun run dev:admin
 */

export type ProcessType = "main" | "admin" | "worker";

export const PROCESS_TYPE = (process.env.PROCESS_TYPE || "main") as ProcessType;

export const isMainProcess = PROCESS_TYPE === "main";
export const isAdminProcess = PROCESS_TYPE === "admin";
export const isWorkerProcess = PROCESS_TYPE === "worker";

export interface ProcessConfig {
  type: ProcessType;
  name: string;
  port: number;
  enableSwagger: boolean;
  enableStatic: boolean;
  routesDir: string;
}

const MAIN_PORT = Number(process.env.PORT) || 8000;
const ADMIN_PORT = Number(process.env.ADMIN_PORT) || 8001;

export const processConfigs: Record<ProcessType, ProcessConfig> = {
  main: {
    type: "main",
    name: "Main API Server",
    port: MAIN_PORT,
    enableSwagger: true,
    enableStatic: true,
    routesDir: "routes",
  },
  admin: {
    type: "admin",
    name: "Admin Server",
    port: ADMIN_PORT,
    enableSwagger: true,
    enableStatic: false,
    routesDir: "routes-admin",
  },
  worker: {
    type: "worker",
    name: "Worker Process",
    port: 0, // No HTTP server
    enableSwagger: false,
    enableStatic: false,
    routesDir: "",
  },
};

export const getProcessConfig = (): ProcessConfig => {
  const config = processConfigs[PROCESS_TYPE];
  if (!config) {
    throw new Error(`Unknown PROCESS_TYPE: ${PROCESS_TYPE}`);
  }
  return config;
};
