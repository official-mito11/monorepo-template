/**
 * Backend Entry Point
 *
 * Supports multiple process types, each running as a separate Elysia app:
 *
 * - PROCESS_TYPE=main (default): Main API server (port 8000)
 * - PROCESS_TYPE=admin: Admin server (port 8001)
 * - PROCESS_TYPE=worker: Background worker (no HTTP server)
 *
 * Usage:
 *   bun run dev                              # Main API (default)
 *   bun run dev:admin                        # Admin server
 *   PROCESS_TYPE=worker bun run src/index.ts # Worker
 *
 * Run multiple processes:
 *   bun run dev & bun run dev:admin
 */

import { createApp, startServer } from "./app";
import { getProcessConfig, PROCESS_TYPE } from "./config/process";

const config = getProcessConfig();

console.log(`Starting ${config.name} (type: ${PROCESS_TYPE})`);

const app = await createApp({ config });

startServer(app, config.port);

export { app };
