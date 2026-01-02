import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { useEditorStore } from "@/stores/editor";
import { tauri, type RouteAnalysis, deletePath, readFile } from "@/lib/tauri";
import { Button } from "@/components/ui/button";
import { NewRouteDialog } from "./NewRouteDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onOpenFile: (route: RouteAnalysis) => void;
  onDelete: (route: RouteAnalysis) => void;
  isSelected: boolean;
}

function RouteItem({ route, onSelect, onOpenFile, onDelete, isSelected }: RouteItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent",
            isSelected && "bg-accent"
          )}
          onClick={() => onSelect(route)}
          onDoubleClick={() => onOpenFile(route)}
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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onOpenFile(route)}>
          <ExternalLink size={14} className="mr-2" />
          Open in Editor
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(route)}
        >
          <Trash2 size={14} className="mr-2" />
          Delete Route
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface RouteFolderProps {
  name: string;
  routes: RouteAnalysis[];
  selectedRoute: RouteAnalysis | null;
  onSelect: (route: RouteAnalysis) => void;
  onOpenFile: (route: RouteAnalysis) => void;
  onDelete: (route: RouteAnalysis) => void;
  onNewRoute: () => void;
  defaultExpanded?: boolean;
}

function RouteFolder({
  name,
  routes,
  selectedRoute,
  onSelect,
  onOpenFile,
  onDelete,
  onNewRoute,
  defaultExpanded = false,
}: RouteFolderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onNewRoute}>
            <Plus size={14} className="mr-2" />
            New Route
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && (
        <div className="ml-4">
          {routes.map((route) => (
            <RouteItem
              key={route.filePath}
              route={route}
              onSelect={onSelect}
              onOpenFile={onOpenFile}
              onDelete={onDelete}
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
  const { openTab } = useEditorStore();

  const [mainRoutes, setMainRoutes] = useState<RouteAnalysis[]>([]);
  const [adminRoutes, setAdminRoutes] = useState<RouteAnalysis[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [newRouteDialogOpen, setNewRouteDialogOpen] = useState(false);
  const [newRouteTarget, setNewRouteTarget] = useState<"main" | "admin">("main");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RouteAnalysis | null>(null);

  const mainRoutesDir = projectPath ? `${projectPath}/apps/be/src/routes` : "";
  const adminRoutesDir = projectPath ? `${projectPath}/apps/be/src/routes-admin` : "";

  const loadRoutes = useCallback(async () => {
    if (!projectPath) return;

    setIsLoading(true);
    try {
      const main = await tauri.analyzeRoutesDirectory(mainRoutesDir);
      setMainRoutes(main);

      const admin = await tauri.analyzeRoutesDirectory(adminRoutesDir);
      setAdminRoutes(admin);
    } catch (err) {
      console.error("Failed to load routes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, mainRoutesDir, adminRoutesDir]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleOpenFile = async (route: RouteAnalysis) => {
    try {
      const content = await readFile(route.filePath);
      openTab({
        id: route.filePath,
        name: route.filePath.split("/").pop() || "route.ts",
        path: route.filePath,
        content,
        language: "typescript",
        isDirty: false,
      });
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleDeleteRoute = (route: RouteAnalysis) => {
    setDeleteTarget(route);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePath(deleteTarget.filePath);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadRoutes();
    } catch (err) {
      console.error("Failed to delete route:", err);
    }
  };

  const handleNewRoute = (target: "main" | "admin") => {
    setNewRouteTarget(target);
    setNewRouteDialogOpen(true);
  };

  if (!projectPath) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p>No project opened</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Routes</span>
        <button
          onClick={loadRoutes}
          className="p-1 hover:bg-accent rounded"
          title="Refresh"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 py-1 overflow-auto">
        {/* Actions */}
        <div className="px-2 py-1 mb-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleNewRoute("main")}
          >
            <Plus size={14} />
            <span>New Route</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            Loading routes...
          </div>
        ) : (
          <>
            {/* Main Routes */}
            {mainRoutes.length > 0 && (
              <RouteFolder
                name="Main API"
                routes={mainRoutes}
                selectedRoute={selectedRoute}
                onSelect={setSelectedRoute}
                onOpenFile={handleOpenFile}
                onDelete={handleDeleteRoute}
                onNewRoute={() => handleNewRoute("main")}
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
                onOpenFile={handleOpenFile}
                onDelete={handleDeleteRoute}
                onNewRoute={() => handleNewRoute("admin")}
                defaultExpanded
              />
            )}

            {/* No routes message */}
            {mainRoutes.length === 0 && adminRoutes.length === 0 && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                <p>No routes found</p>
                <p className="text-xs mt-1">Click "New Route" to create one</p>
              </div>
            )}
          </>
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
                <span className="font-mono truncate">
                  {selectedRoute.filePath.split("/").pop()}
                </span>
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
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => handleOpenFile(selectedRoute)}
            >
              <ExternalLink size={14} className="mr-2" />
              Open in Editor
            </Button>
          </div>
        )}
      </div>

      {/* New Route Dialog */}
      <NewRouteDialog
        open={newRouteDialogOpen}
        onOpenChange={setNewRouteDialogOpen}
        routesDir={newRouteTarget === "main" ? mainRoutesDir : adminRoutesDir}
        onCreated={loadRoutes}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the route "{deleteTarget?.urlPath}"?
              This will delete the file "{deleteTarget?.filePath.split("/").pop()}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
