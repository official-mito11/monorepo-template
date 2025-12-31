import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { tauri, type RouteAnalysis } from "@/lib/tauri";
import { Button } from "@/components/ui/button";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500",
  POST: "bg-blue-500",
  PUT: "bg-yellow-500",
  PATCH: "bg-orange-500",
  DELETE: "bg-red-500",
  HEAD: "bg-purple-500",
  OPTIONS: "bg-gray-500",
};

interface RouteItemProps {
  route: RouteAnalysis;
  onSelect: (route: RouteAnalysis) => void;
  isSelected: boolean;
}

function RouteItem({ route, onSelect, isSelected }: RouteItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onClick={() => onSelect(route)}
    >
      <FileCode size={16} className="text-muted-foreground shrink-0" />
      <span
        className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0",
          METHOD_COLORS[route.method] || "bg-gray-500"
        )}
      >
        {route.method || "?"}
      </span>
      <span className="truncate text-muted-foreground">{route.urlPath}</span>
    </div>
  );
}

interface RouteFolderProps {
  name: string;
  routes: RouteAnalysis[];
  selectedRoute: RouteAnalysis | null;
  onSelect: (route: RouteAnalysis) => void;
  defaultExpanded?: boolean;
}

function RouteFolder({ name, routes, selectedRoute, onSelect, defaultExpanded = false }: RouteFolderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="w-4 h-4 flex items-center justify-center">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {isExpanded ? (
          <FolderOpen size={16} className="text-yellow-500" />
        ) : (
          <Folder size={16} className="text-yellow-500" />
        )}
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground ml-auto">{routes.length}</span>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {routes.map((route) => (
            <RouteItem
              key={route.filePath}
              route={route}
              onSelect={onSelect}
              isSelected={selectedRoute?.filePath === route.filePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteExplorer() {
  const { projectPath } = useWorkspaceStore();
  const [mainRoutes, setMainRoutes] = useState<RouteAnalysis[]>([]);
  const [adminRoutes, setAdminRoutes] = useState<RouteAnalysis[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadRoutes() {
      if (!projectPath) return;

      setIsLoading(true);
      try {
        // Load main routes
        const mainRoutesDir = `${projectPath}/apps/be/src/routes`;
        const main = await tauri.analyzeRoutesDirectory(mainRoutesDir);
        setMainRoutes(main);

        // Load admin routes
        const adminRoutesDir = `${projectPath}/apps/be/src/routes-admin`;
        const admin = await tauri.analyzeRoutesDirectory(adminRoutesDir);
        setAdminRoutes(admin);
      } catch (err) {
        console.error("Failed to load routes:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoutes();
  }, [projectPath]);

  if (!projectPath) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p>No project opened</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p>Loading routes...</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {/* Actions */}
      <div className="px-2 py-1 mb-2">
        <Button size="sm" variant="outline" className="w-full gap-2">
          <Plus size={14} />
          <span>New Route</span>
        </Button>
      </div>

      {/* Main Routes */}
      {mainRoutes.length > 0 && (
        <RouteFolder
          name="Main API"
          routes={mainRoutes}
          selectedRoute={selectedRoute}
          onSelect={setSelectedRoute}
          defaultExpanded
        />
      )}

      {/* Admin Routes */}
      {adminRoutes.length > 0 && (
        <RouteFolder
          name="Admin API"
          routes={adminRoutes}
          selectedRoute={selectedRoute}
          onSelect={setSelectedRoute}
          defaultExpanded
        />
      )}

      {/* No routes message */}
      {mainRoutes.length === 0 && adminRoutes.length === 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          <p>No routes found</p>
          <p className="text-xs mt-1">
            Create route files in apps/be/src/routes/
          </p>
        </div>
      )}

      {/* Selected route details */}
      {selectedRoute && (
        <div className="mt-4 px-2 py-2 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">ROUTE DETAILS</h3>
          <div className="text-xs space-y-1">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Method:</span>
              <span className="font-medium">{selectedRoute.method}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">URL:</span>
              <span className="font-medium">{selectedRoute.urlPath}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">File:</span>
              <span className="font-mono truncate">{selectedRoute.filePath.split("/").pop()}</span>
            </div>
            {selectedRoute.exports.length > 0 && (
              <div>
                <span className="text-muted-foreground">Exports:</span>
                <div className="ml-2 mt-1">
                  {selectedRoute.exports.map((exp, i) => (
                    <div key={i} className="flex gap-1">
                      <span className="text-blue-400">{exp.name}</span>
                      <span className="text-muted-foreground">({exp.kind})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
