import { GitBranch, AlertCircle, CheckCircle } from "lucide-react";
import { useEditorStore } from "@/stores/editor";
import { useWorkspaceStore } from "@/stores/workspace";

export function StatusBar() {
  const { tabs, activeTabId } = useEditorStore();
  const { projectPath } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const dirtyCount = tabs.filter((t) => t.isDirty).length;

  return (
    <div className="h-6 flex items-center justify-between px-2 bg-primary text-primary-foreground text-xs">
      <div className="flex items-center gap-4">
        {/* Git branch */}
        <div className="flex items-center gap-1">
          <GitBranch size={14} />
          <span>main</span>
        </div>

        {/* Errors/Warnings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <AlertCircle size={14} />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={14} />
            <span>0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dirty files indicator */}
        {dirtyCount > 0 && (
          <span>{dirtyCount} unsaved</span>
        )}

        {/* Language */}
        {activeTab && (
          <span className="capitalize">{activeTab.language}</span>
        )}

        {/* Encoding */}
        <span>UTF-8</span>

        {/* Line ending */}
        <span>LF</span>

        {/* Project path */}
        {projectPath && (
          <span className="truncate max-w-[200px]" title={projectPath}>
            {projectPath.split("/").pop()}
          </span>
        )}
      </div>
    </div>
  );
}
