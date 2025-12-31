import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MonacoEditor } from "@/components/editor/MonacoEditor";

function EditorTab({
  name,
  isDirty,
  isActive,
  onClick,
  onClose,
}: {
  name: string;
  isDirty: boolean;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-3 h-9 text-sm cursor-pointer border-r border-border",
        isActive
          ? "bg-background text-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      <span className="truncate max-w-[120px]">{name}</span>
      {isDirty && (
        <span className="w-2 h-2 rounded-full bg-primary group-hover:hidden" />
      )}
      <button
        onClick={onClose}
        className={cn(
          "p-0.5 rounded hover:bg-accent",
          isDirty ? "group-hover:block hidden" : ""
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function WelcomePage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">GUI Edit</h1>
        <p className="text-muted-foreground mb-8">
          Monorepo Management IDE
        </p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+P</kbd>
            {" "}Quick Open
          </p>
          <p>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+P</kbd>
            {" "}Command Palette
          </p>
          <p>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd>
            {" "}Toggle Sidebar
          </p>
        </div>
      </div>
    </div>
  );
}

export function EditorArea() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (tabs.length === 0) {
    return <WelcomePage />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab bar */}
      <div className="flex h-9 bg-muted/30 border-b border-border overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="flex h-9">
            {tabs.map((tab) => (
              <EditorTab
                key={tab.id}
                name={tab.name}
                isDirty={tab.isDirty}
                isActive={tab.id === activeTabId}
                onClick={() => setActiveTab(tab.id)}
                onClose={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <MonacoEditor
            key={activeTab.id}
            tabId={activeTab.id}
            path={activeTab.path}
            content={activeTab.content}
            language={activeTab.language}
          />
        )}
      </div>
    </div>
  );
}
