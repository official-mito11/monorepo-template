import { invoke } from "@tauri-apps/api/core";

// File System Types
export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  extension?: string;
}

// Tauri namespace for convenience
export const tauri = {
  readDirectory,
  readFile,
  writeFile,
  createFile,
  createDirectory,
  deletePath,
  renamePath,
  analyzeRouteFile,
  analyzeRoutesDirectory,
  sendHttpRequest,
  gitStatus,
  gitDiff,
  runCommand,
  readPackageJson,
  writePackageJson,
  readCargoToml,
  writeCargoToml,
};

// File System Commands
export async function readDirectory(path: string): Promise<FileNode[]> {
  // For development without Tauri backend, use mock data
  if (typeof window !== "undefined" && !("__TAURI__" in window)) {
    return mockReadDirectory(path);
  }
  return invoke<FileNode[]>("read_directory", { path });
}

// Mock implementation for development
function mockReadDirectory(path: string): Promise<FileNode[]> {
  // Return mock file tree for development
  const mockTree: FileNode[] = [
    {
      name: "apps",
      path: `${path}/apps`,
      isDir: true,
      children: [
        { name: "be", path: `${path}/apps/be`, isDir: true },
        { name: "fe", path: `${path}/apps/fe`, isDir: true },
      ],
    },
    {
      name: "packages",
      path: `${path}/packages`,
      isDir: true,
      children: [
        { name: "shared", path: `${path}/packages/shared`, isDir: true },
      ],
    },
    { name: "package.json", path: `${path}/package.json`, isDir: false },
    { name: "README.md", path: `${path}/README.md`, isDir: false },
  ];
  return Promise.resolve(mockTree);
}

export async function readFile(path: string): Promise<string> {
  if (typeof window !== "undefined" && !("__TAURI__" in window)) {
    return `// Mock content for ${path}\n\nexport default function Example() {\n  return <div>Hello World</div>;\n}\n`;
  }
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_file", { path, content });
}

export async function createFile(path: string, content?: string): Promise<void> {
  return invoke<void>("create_file", { path, content });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke<void>("create_directory", { path });
}

export async function deletePath(path: string): Promise<void> {
  return invoke<void>("delete_path", { path });
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  return invoke<void>("rename_path", { oldPath, newPath });
}

// Route Analysis Types
export interface RouteAnalysis {
  filePath: string;
  urlPath: string;
  method: string;
  hasHandler: boolean;
  hasOptions: boolean;
  options?: RouteOptions;
  exports: ExportInfo[];
  errors: ParseError[];
}

export interface RouteOptions {
  tags?: string[];
  summary?: string;
  description?: string;
  requestSchema?: string;
  responseSchemas: ResponseSchema[];
}

export interface ResponseSchema {
  statusCode: number;
  schema: string;
  description?: string;
}

export interface ExportInfo {
  name: string;
  kind: string;
  valueType?: string;
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

// Route Analysis Commands
export async function analyzeRouteFile(path: string): Promise<RouteAnalysis> {
  if (typeof window !== "undefined" && !("__TAURI__" in window)) {
    return mockAnalyzeRouteFile(path);
  }
  return invoke<RouteAnalysis>("analyze_route_file", { path });
}

export async function analyzeRoutesDirectory(dir: string): Promise<RouteAnalysis[]> {
  if (typeof window !== "undefined" && !("__TAURI__" in window)) {
    return mockAnalyzeRoutesDirectory(dir);
  }
  return invoke<RouteAnalysis[]>("analyze_routes_directory", { dir });
}

// Mock implementations for development
function mockAnalyzeRouteFile(path: string): RouteAnalysis {
  return {
    filePath: path,
    urlPath: path.replace(/.*\/routes/, "").replace(/\.ts$/, "").replace(/\/index$/, "") || "/",
    method: "GET",
    hasHandler: true,
    hasOptions: false,
    exports: [{ name: "get", kind: "function", valueType: "handler" }],
    errors: [],
  };
}

function mockAnalyzeRoutesDirectory(dir: string): RouteAnalysis[] {
  const isAdmin = dir.includes("routes-admin");
  const mockRoutes: RouteAnalysis[] = isAdmin
    ? [
        {
          filePath: `${dir}/index.ts`,
          urlPath: "/",
          method: "GET",
          hasHandler: true,
          hasOptions: false,
          exports: [{ name: "get", kind: "function", valueType: "handler" }],
          errors: [],
        },
        {
          filePath: `${dir}/users/index.ts`,
          urlPath: "/users",
          method: "GET",
          hasHandler: true,
          hasOptions: true,
          exports: [
            { name: "get", kind: "function", valueType: "handler" },
            { name: "options", kind: "variable", valueType: "options" },
          ],
          errors: [],
        },
      ]
    : [
        {
          filePath: `${dir}/index.ts`,
          urlPath: "/",
          method: "GET",
          hasHandler: true,
          hasOptions: false,
          exports: [{ name: "get", kind: "function", valueType: "handler" }],
          errors: [],
        },
        {
          filePath: `${dir}/health.ts`,
          urlPath: "/health",
          method: "GET",
          hasHandler: true,
          hasOptions: false,
          exports: [{ name: "get", kind: "function", valueType: "handler" }],
          errors: [],
        },
        {
          filePath: `${dir}/users/index.ts`,
          urlPath: "/users",
          method: "GET",
          hasHandler: true,
          hasOptions: true,
          exports: [
            { name: "get", kind: "function", valueType: "handler" },
            { name: "post", kind: "function", valueType: "handler" },
            { name: "options", kind: "variable", valueType: "options" },
          ],
          errors: [],
        },
        {
          filePath: `${dir}/users/[id].ts`,
          urlPath: "/users/:id",
          method: "GET",
          hasHandler: true,
          hasOptions: false,
          exports: [
            { name: "get", kind: "function", valueType: "handler" },
            { name: "put", kind: "function", valueType: "handler" },
            { name: "delete", kind: "function", valueType: "handler" },
          ],
          errors: [],
        },
      ];
  return mockRoutes;
}

// HTTP Request Types
export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  time_ms: number;
}

// HTTP Commands
export async function sendHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  return invoke<HttpResponse>("send_http_request", { request });
}

// Git Types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
}

export interface FileChange {
  path: string;
  status: string;
}

// Git Commands
export async function gitStatus(repoPath: string): Promise<GitStatus> {
  return invoke<GitStatus>("git_status", { repoPath });
}

export async function gitDiff(repoPath: string, filePath?: string): Promise<string> {
  return invoke<string>("git_diff", { repoPath, filePath });
}

// Process Commands
export interface ProcessOutput {
  stdout: string;
  stderr: string;
  exit_code?: number;
}

export async function runCommand(
  command: string,
  args: string[],
  cwd?: string
): Promise<ProcessOutput> {
  return invoke<ProcessOutput>("run_command", { command, args, cwd });
}

// Manifest Types
export interface PackageJson {
  name: string;
  version: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface CargoToml {
  package: {
    name: string;
    version: string;
    edition?: string;
    [key: string]: unknown;
  };
  dependencies?: Record<string, string | { version: string; features?: string[] }>;
  [key: string]: unknown;
}

// Manifest Commands
export async function readPackageJson(path: string): Promise<PackageJson> {
  return invoke<PackageJson>("read_package_json", { path });
}

export async function writePackageJson(path: string, data: PackageJson): Promise<void> {
  return invoke<void>("write_package_json", { path, data });
}

export async function readCargoToml(path: string): Promise<CargoToml> {
  return invoke<CargoToml>("read_cargo_toml", { path });
}

export async function writeCargoToml(path: string, data: CargoToml): Promise<void> {
  return invoke<void>("write_cargo_toml", { path, data });
}
