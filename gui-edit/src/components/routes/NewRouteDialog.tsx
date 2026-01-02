import { useState } from "react";
import { Route, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFile } from "@/lib/tauri";

interface NewRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routesDir: string;
  onCreated: () => void;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function generateRouteCode(methods: string[], urlPath: string): string {
  const hasOptions = methods.length > 0;
  const hasParams = urlPath.includes("[") || urlPath.includes(":");

  let code = `import type { Elysia } from "elysia";\n\n`;

  // Add options if there are multiple methods
  if (hasOptions) {
    code += `export const options = {\n`;
    code += `  tags: ["${urlPath.split("/")[1] || "api"}"],\n`;
    code += `  summary: "${urlPath}",\n`;
    code += `};\n\n`;
  }

  // Generate handler for each method
  for (const method of methods) {
    const methodLower = method.toLowerCase();

    if (hasParams) {
      code += `export const ${methodLower} = (app: Elysia) =>\n`;
      code += `  app.${methodLower}("${urlPath}", ({ params }) => {\n`;
      code += `    return { message: "${method} ${urlPath}", params };\n`;
      code += `  });\n\n`;
    } else if (method === "POST" || method === "PUT" || method === "PATCH") {
      code += `export const ${methodLower} = (app: Elysia) =>\n`;
      code += `  app.${methodLower}("${urlPath}", ({ body }) => {\n`;
      code += `    return { message: "${method} ${urlPath}", body };\n`;
      code += `  });\n\n`;
    } else {
      code += `export const ${methodLower} = (app: Elysia) =>\n`;
      code += `  app.${methodLower}("${urlPath}", () => {\n`;
      code += `    return { message: "${method} ${urlPath}" };\n`;
      code += `  });\n\n`;
    }
  }

  return code.trim() + "\n";
}

function urlToFilePath(urlPath: string): string {
  // /users/:id -> users/[id].ts
  // /users -> users/index.ts
  // / -> index.ts

  if (urlPath === "/" || urlPath === "") {
    return "index.ts";
  }

  const parts = urlPath.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];

  // Check if last part is a parameter
  if (lastPart.startsWith(":")) {
    // /users/:id -> users/[id].ts
    const paramName = lastPart.slice(1);
    parts[parts.length - 1] = `[${paramName}]`;
    return parts.join("/") + ".ts";
  } else if (lastPart.startsWith("[") && lastPart.endsWith("]")) {
    // Already in bracket format
    return parts.join("/") + ".ts";
  } else {
    // /users -> users/index.ts
    return parts.join("/") + "/index.ts";
  }
}

export function NewRouteDialog({ open, onOpenChange, routesDir, onCreated }: NewRouteDialogProps) {
  const [urlPath, setUrlPath] = useState("/");
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["GET"]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const filePath = urlToFilePath(urlPath);
  const fullPath = `${routesDir}/${filePath}`;

  const handleCreate = async () => {
    if (!urlPath.trim() || selectedMethods.length === 0) {
      setError("URL path and at least one method are required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const code = generateRouteCode(selectedMethods, urlPath);
      await createFile(fullPath, code);
      onCreated();
      onOpenChange(false);
      // Reset form
      setUrlPath("/");
      setSelectedMethods(["GET"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create route");
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-popover border border-border rounded-lg shadow-lg w-[500px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-primary" />
            <h2 className="text-sm font-semibold">New Route</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-accent rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* URL Path */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              URL Path
            </label>
            <input
              type="text"
              value={urlPath}
              onChange={(e) => setUrlPath(e.target.value)}
              placeholder="/users/:id"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded outline-none focus:ring-1 focus:ring-ring font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use :param or [param] for dynamic segments
            </p>
          </div>

          {/* HTTP Methods */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              HTTP Methods
            </label>
            <div className="flex flex-wrap gap-2">
              {HTTP_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    selectedMethods.includes(method)
                      ? method === "GET"
                        ? "bg-green-500 text-white"
                        : method === "POST"
                          ? "bg-blue-500 text-white"
                          : method === "PUT"
                            ? "bg-yellow-500 text-white"
                            : method === "PATCH"
                              ? "bg-orange-500 text-white"
                              : "bg-red-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* File Path Preview */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              File Path
            </label>
            <div className="px-3 py-2 text-sm bg-muted rounded font-mono text-muted-foreground truncate">
              {routesDir.split("/").slice(-3).join("/")}/{filePath}
            </div>
          </div>

          {/* Code Preview */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Generated Code
            </label>
            <pre className="px-3 py-2 text-xs bg-muted rounded font-mono text-muted-foreground max-h-[150px] overflow-auto">
              {generateRouteCode(selectedMethods, urlPath)}
            </pre>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-xs bg-destructive/10 border border-destructive/20 rounded text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating || selectedMethods.length === 0}
          >
            {isCreating ? "Creating..." : "Create Route"}
          </Button>
        </div>
      </div>
    </div>
  );
}
