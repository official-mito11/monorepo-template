import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExplorerStore, type FileNode } from "@/stores/explorer";
import { useEditorStore } from "@/stores/editor";
import { useWorkspaceStore } from "@/stores/workspace";
import { tauri, createFile, createDirectory, deletePath, renamePath } from "@/lib/tauri";
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

function getFileIcon(name: string, isDir: boolean, isExpanded: boolean) {
  if (isDir) {
    return isExpanded ? (
      <FolderOpen size={16} className="text-yellow-500" />
    ) : (
      <Folder size={16} className="text-yellow-500" />
    );
  }

  const ext = name.split(".").pop()?.toLowerCase();
  let color = "text-muted-foreground";

  switch (ext) {
    case "ts":
    case "tsx":
      color = "text-blue-400";
      break;
    case "js":
    case "jsx":
      color = "text-yellow-400";
      break;
    case "json":
      color = "text-green-400";
      break;
    case "css":
    case "scss":
      color = "text-pink-400";
      break;
    case "md":
      color = "text-cyan-400";
      break;
    case "rs":
      color = "text-orange-400";
      break;
    case "toml":
      color = "text-purple-400";
      break;
  }

  return <File size={16} className={color} />;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescriptreact";
    case "js":
      return "javascript";
    case "jsx":
      return "javascriptreact";
    case "json":
      return "json";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "html":
      return "html";
    case "md":
      return "markdown";
    case "rs":
      return "rust";
    case "toml":
      return "toml";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "plaintext";
  }
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRename: (path: string) => void;
  onDelete: (path: string, isDir: boolean) => void;
}

function FileTreeItem({
  node,
  depth,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: FileTreeItemProps) {
  const { expandedPaths, selectedPath, toggleExpand, setSelectedPath, setChildren } =
    useExplorerStore();
  const { openTab } = useEditorStore();

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = async () => {
    setSelectedPath(node.path);

    if (node.isDir) {
      toggleExpand(node.path);

      if (!isExpanded && (!node.children || node.children.length === 0)) {
        try {
          const children = await tauri.readDirectory(node.path);
          setChildren(node.path, children);
        } catch (err) {
          console.error("Failed to load directory:", err);
        }
      }
    } else {
      try {
        const content = await tauri.readFile(node.path);
        openTab({
          id: node.path,
          name: node.name,
          path: node.path,
          content,
          language: getLanguageFromPath(node.path),
          isDirty: false,
        });
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    }
  };

  const parentPath = node.isDir ? node.path : node.path.substring(0, node.path.lastIndexOf("/"));

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn("file-tree-item", isSelected && "selected")}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
          >
            {node.isDir ? (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span className="w-4" />
            )}
            {getFileIcon(node.name, node.isDir, isExpanded)}
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onCreateFile(parentPath)}>
            <FilePlus size={14} className="mr-2" />
            New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateFolder(parentPath)}>
            <FolderPlus size={14} className="mr-2" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onRename(node.path)}>
            <Pencil size={14} className="mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => navigator.clipboard.writeText(node.path)}>
            <Copy size={14} className="mr-2" />
            Copy Path
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(node.path, node.isDir)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {node.isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child: FileNode) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { projectPath } = useWorkspaceStore();
  const { rootNodes, setRootNodes } = useExplorerStore();

  // Dialog states
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [inputDialogMode, setInputDialogMode] = useState<"file" | "folder" | "rename">("file");
  const [inputDialogPath, setInputDialogPath] = useState("");
  const [inputValue, setInputValue] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ path: "", isDir: false });

  const [isLoading, setIsLoading] = useState(false);

  const loadRoot = useCallback(async () => {
    if (!projectPath) return;
    setIsLoading(true);
    try {
      const nodes = await tauri.readDirectory(projectPath);
      setRootNodes(nodes);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, setRootNodes]);

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  const handleCreateFile = (parentPath: string) => {
    setInputDialogMode("file");
    setInputDialogPath(parentPath);
    setInputValue("");
    setInputDialogOpen(true);
  };

  const handleCreateFolder = (parentPath: string) => {
    setInputDialogMode("folder");
    setInputDialogPath(parentPath);
    setInputValue("");
    setInputDialogOpen(true);
  };

  const handleRename = (path: string) => {
    setInputDialogMode("rename");
    setInputDialogPath(path);
    setInputValue(path.split("/").pop() || "");
    setInputDialogOpen(true);
  };

  const handleDelete = (path: string, isDirectory: boolean) => {
    setDeleteTarget({ path, isDir: isDirectory });
    setDeleteDialogOpen(true);
  };

  const confirmInput = async () => {
    if (!inputValue.trim()) return;

    try {
      if (inputDialogMode === "file") {
        const newPath = `${inputDialogPath}/${inputValue}`;
        await createFile(newPath, "");
      } else if (inputDialogMode === "folder") {
        const newPath = `${inputDialogPath}/${inputValue}`;
        await createDirectory(newPath);
      } else if (inputDialogMode === "rename") {
        const parentPath = inputDialogPath.substring(0, inputDialogPath.lastIndexOf("/"));
        const newPath = `${parentPath}/${inputValue}`;
        await renamePath(inputDialogPath, newPath);
      }

      setInputDialogOpen(false);
      loadRoot();
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePath(deleteTarget.path);
      setDeleteDialogOpen(false);
      loadRoot();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!projectPath) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p>No folder opened</p>
        <button
          className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
          onClick={() => {
            // For now, use a fixed path. In production, use Tauri file dialog
            console.log("Open folder dialog - will be implemented with Tauri");
          }}
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Explorer</span>
        <button
          onClick={loadRoot}
          className="p-1 hover:bg-accent rounded"
          title="Refresh"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Context menu for root area */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 py-1 overflow-auto">
            {rootNodes.map((node: FileNode) => (
              <FileTreeItem
                key={node.path}
                node={node}
                depth={0}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => handleCreateFile(projectPath)}>
            <FilePlus size={14} className="mr-2" />
            New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCreateFolder(projectPath)}>
            <FolderPlus size={14} className="mr-2" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={loadRoot}>
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Input Dialog (File/Folder/Rename) */}
      {inputDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setInputDialogOpen(false)} />
          <div className="relative bg-popover border border-border rounded-lg shadow-lg p-4 w-[400px]">
            <h3 className="text-sm font-semibold mb-3">
              {inputDialogMode === "file"
                ? "New File"
                : inputDialogMode === "folder"
                  ? "New Folder"
                  : "Rename"}
            </h3>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmInput();
                if (e.key === "Escape") setInputDialogOpen(false);
              }}
              placeholder={
                inputDialogMode === "file"
                  ? "filename.ts"
                  : inputDialogMode === "folder"
                    ? "folder-name"
                    : "new-name"
              }
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setInputDialogOpen(false)}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={confirmInput}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {inputDialogMode === "rename" ? "Rename" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget.isDir ? "Folder" : "File"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget.path.split("/").pop()}"?
              {deleteTarget.isDir && " This will delete all contents inside."}
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
