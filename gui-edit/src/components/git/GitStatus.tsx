import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  Edit3,
  FileQuestion,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { gitStatus, gitDiff, GitStatus as GitStatusType } from "@/lib/tauri";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileItemProps {
  path: string;
  status: string;
  onClick?: () => void;
  isSelected?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "added":
    case "new file":
      return <Plus size={14} className="text-green-500" />;
    case "deleted":
      return <Minus size={14} className="text-red-500" />;
    case "modified":
      return <Edit3 size={14} className="text-yellow-500" />;
    case "renamed":
      return <GitCommit size={14} className="text-blue-500" />;
    default:
      return <FileQuestion size={14} className="text-muted-foreground" />;
  }
}

function FileItem({ path, status, onClick, isSelected }: FileItemProps) {
  const fileName = path.split("/").pop() || path;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      {getStatusIcon(status)}
      <span className="truncate flex-1 text-left" title={path}>
        {fileName}
      </span>
      <span className="text-xs text-muted-foreground">{status[0].toUpperCase()}</span>
    </button>
  );
}

interface SectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, count, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent rounded"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
        <span className="ml-auto">{count}</span>
      </button>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  );
}

export function GitStatusPanel() {
  const { projectPath } = useWorkspaceStore();
  const [status, setStatus] = useState<GitStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!projectPath) return;
    setLoading(true);
    setError(null);
    try {
      const result = await gitStatus(projectPath);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get git status");
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const loadDiff = useCallback(
    async (filePath: string) => {
      if (!projectPath) return;
      setLoadingDiff(true);
      setSelectedFile(filePath);
      try {
        const diff = await gitDiff(projectPath, filePath);
        setDiffContent(diff);
      } catch (err) {
        setDiffContent(`Error loading diff: ${err}`);
      } finally {
        setLoadingDiff(false);
      }
    },
    [projectPath]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7"
            onClick={loadStatus}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Not a git repository
      </div>
    );
  }

  const totalChanges =
    status.staged.length + status.unstaged.length + status.untracked.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-primary" />
            <span className="text-sm font-medium">{status.branch}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={loadStatus}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
        {(status.ahead > 0 || status.behind > 0) && (
          <div className="text-xs text-muted-foreground">
            {status.ahead > 0 && <span className="mr-2">{status.ahead} ahead</span>}
            {status.behind > 0 && <span>{status.behind} behind</span>}
          </div>
        )}
      </div>

      {/* File list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {totalChanges === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No changes
            </div>
          ) : (
            <>
              {status.staged.length > 0 && (
                <Section title="Staged Changes" count={status.staged.length}>
                  {status.staged.map((file) => (
                    <FileItem
                      key={file.path}
                      path={file.path}
                      status={file.status}
                      onClick={() => loadDiff(file.path)}
                      isSelected={selectedFile === file.path}
                    />
                  ))}
                </Section>
              )}

              {status.unstaged.length > 0 && (
                <Section title="Changes" count={status.unstaged.length}>
                  {status.unstaged.map((file) => (
                    <FileItem
                      key={file.path}
                      path={file.path}
                      status={file.status}
                      onClick={() => loadDiff(file.path)}
                      isSelected={selectedFile === file.path}
                    />
                  ))}
                </Section>
              )}

              {status.untracked.length > 0 && (
                <Section title="Untracked Files" count={status.untracked.length}>
                  {status.untracked.map((path) => (
                    <FileItem
                      key={path}
                      path={path}
                      status="untracked"
                      onClick={() => setSelectedFile(path)}
                      isSelected={selectedFile === path}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Diff preview */}
      {selectedFile && (
        <div className="border-t border-border">
          <div className="h-8 flex items-center justify-between px-3 bg-muted/50">
            <span className="text-xs font-medium truncate">{selectedFile}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                setDiffContent(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <ScrollArea className="h-[150px]">
            <pre className="p-2 text-xs font-mono whitespace-pre-wrap">
              {loadingDiff ? (
                <span className="text-muted-foreground">Loading diff...</span>
              ) : (
                diffContent?.split("\n").map((line, i) => {
                  let className = "";
                  if (line.startsWith("+") && !line.startsWith("+++")) {
                    className = "text-green-500";
                  } else if (line.startsWith("-") && !line.startsWith("---")) {
                    className = "text-red-500";
                  } else if (line.startsWith("@@")) {
                    className = "text-cyan-500";
                  }
                  return (
                    <div key={i} className={className}>
                      {line}
                    </div>
                  );
                })
              )}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
