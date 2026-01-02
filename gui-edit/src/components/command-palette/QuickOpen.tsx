import { useEffect, useState, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { File, FileCode, FileJson, FileText, Image } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useEditorStore } from "@/stores/editor";
import { useWorkspaceStore } from "@/stores/workspace";
import { useExplorerStore } from "@/stores/explorer";
import { readFile, FileNode } from "@/lib/tauri";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return <FileCode size={16} className="text-blue-500" />;
    case "json":
      return <FileJson size={16} className="text-yellow-500" />;
    case "md":
    case "txt":
      return <FileText size={16} className="text-gray-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <Image size={16} className="text-purple-500" />;
    default:
      return <File size={16} className="text-muted-foreground" />;
  }
}

function getLanguageFromExtension(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    rs: "rust",
    py: "python",
    go: "go",
  };
  return map[ext] || "plaintext";
}

function flattenFiles(nodes: FileNode[], rootPath: string): { name: string; path: string; relativePath: string }[] {
  const files: { name: string; path: string; relativePath: string }[] = [];

  const traverse = (node: FileNode) => {
    if (!node.isDir) {
      const relativePath = node.path.replace(rootPath + "/", "");
      files.push({
        name: node.name,
        path: node.path,
        relativePath,
      });
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };

  for (const node of nodes) {
    traverse(node);
  }

  return files;
}

export function QuickOpen() {
  const [search, setSearch] = useState("");
  const { quickOpenOpen, closeQuickOpen } = useUIStore();
  const { openTab } = useEditorStore();
  const { projectPath } = useWorkspaceStore();
  const { rootNodes } = useExplorerStore();

  const allFiles = useMemo(() => {
    if (!projectPath) return [];
    return flattenFiles(rootNodes, projectPath);
  }, [rootNodes, projectPath]);

  const filteredFiles = useMemo(() => {
    if (!search) return allFiles.slice(0, 20);
    const lowerSearch = search.toLowerCase();
    return allFiles
      .filter((f) => f.relativePath.toLowerCase().includes(lowerSearch))
      .slice(0, 20);
  }, [allFiles, search]);

  const handleSelect = useCallback(
    async (filePath: string) => {
      const file = allFiles.find((f) => f.path === filePath);
      if (!file) return;

      try {
        const content = await readFile(filePath);
        const ext = file.name.split(".").pop() || "";
        openTab({
          id: filePath,
          path: filePath,
          name: file.name,
          content,
          language: getLanguageFromExtension(ext),
          isDirty: false,
        });
        closeQuickOpen();
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    },
    [allFiles, openTab, closeQuickOpen]
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && quickOpenOpen) {
        closeQuickOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickOpenOpen, closeQuickOpen]);

  if (!quickOpenOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeQuickOpen}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw]">
        <Command className="rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center border-b border-border px-3">
            <File size={16} className="text-muted-foreground mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Go to file..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No files found
            </Command.Empty>

            {filteredFiles.map((file) => (
              <Command.Item
                key={file.path}
                value={file.path}
                onSelect={handleSelect}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer aria-selected:bg-accent"
              >
                {getFileIcon(file.name)}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {file.relativePath}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
