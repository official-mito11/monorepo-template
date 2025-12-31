import { useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExplorerStore, type FileNode } from "@/stores/explorer";
import { useEditorStore } from "@/stores/editor";
import { useWorkspaceStore } from "@/stores/workspace";
import { tauri } from "@/lib/tauri";

function getFileIcon(name: string, isDir: boolean, isExpanded: boolean) {
  if (isDir) {
    return isExpanded ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500" />;
  }

  // File type icons based on extension
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
}

function FileTreeItem({ node, depth }: FileTreeItemProps) {
  const { expandedPaths, selectedPath, toggleExpand, setSelectedPath, setChildren } = useExplorerStore();
  const { openTab } = useEditorStore();

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = async () => {
    setSelectedPath(node.path);

    if (node.isDir) {
      toggleExpand(node.path);

      // Load children if not already loaded
      if (!isExpanded && (!node.children || node.children.length === 0)) {
        try {
          const children = await tauri.readDirectory(node.path);
          setChildren(node.path, children);
        } catch (err) {
          console.error("Failed to load directory:", err);
        }
      }
    } else {
      // Open file in editor
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

  return (
    <div>
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

      {node.isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child: FileNode) => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { projectPath } = useWorkspaceStore();
  const { rootNodes, setRootNodes } = useExplorerStore();

  useEffect(() => {
    async function loadRoot() {
      if (!projectPath) return;

      try {
        const nodes = await tauri.readDirectory(projectPath);
        setRootNodes(nodes);
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    }

    loadRoot();
  }, [projectPath, setRootNodes]);

  if (!projectPath) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p>No folder opened</p>
        <button
          className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
          onClick={async () => {
            // This will be implemented with Tauri dialog
            console.log("Open folder dialog");
          }}
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="py-1">
      {rootNodes.map((node: FileNode) => (
        <FileTreeItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
