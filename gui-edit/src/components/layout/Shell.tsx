import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { StatusBar } from "./StatusBar";
import { ApiTester } from "@/components/routes/ApiTester";
import { Terminal } from "@/components/terminal/Terminal";
import {
  usePanelVisible,
  usePanelView,
  useSetPanelView,
  useSidebarVisible,
} from "@/stores/selectors";

function ResizeHandle({ className = "" }: { className?: string }) {
  return (
    <PanelResizeHandle className={`group relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 group-hover:bg-primary/20 group-active:bg-primary/30 transition-colors" />
    </PanelResizeHandle>
  );
}

function BottomPanel() {
  const panelView = usePanelView();
  const setPanelView = useSetPanelView();

  const tabs = [
    { id: "terminal" as const, label: "Terminal" },
    { id: "problems" as const, label: "Problems" },
    { id: "output" as const, label: "Output" },
    { id: "api-tester" as const, label: "API Tester" },
  ];

  return (
    <div className="h-full flex flex-col bg-background border-t border-border">
      {/* Tab bar */}
      <div className="h-8 flex items-center px-2 border-b border-border gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPanelView(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-sm ${
              panelView === tab.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {panelView === "terminal" && <Terminal />}
        {panelView === "problems" && (
          <div className="p-4 text-sm text-muted-foreground">No problems detected</div>
        )}
        {panelView === "output" && (
          <div className="p-4 text-sm text-muted-foreground">No output</div>
        )}
        {panelView === "api-tester" && <ApiTester />}
      </div>
    </div>
  );
}

export function Shell() {
  const sidebarVisible = useSidebarVisible();
  const bottomPanelVisible = usePanelVisible();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Activity bar */}
          <ActivityBar />

          {/* Main panels */}
          <PanelGroup direction="horizontal" className="flex-1">
            {/* Sidebar */}
            {sidebarVisible && (
              <>
                <Panel defaultSize={20} minSize={15} maxSize={40} className="bg-sidebar">
                  <Sidebar />
                </Panel>
                <ResizeHandle />
              </>
            )}

            {/* Editor and bottom panel */}
            <Panel defaultSize={80} minSize={40}>
              <PanelGroup direction="vertical">
                {/* Editor area */}
                <Panel defaultSize={bottomPanelVisible ? 70 : 100} minSize={30}>
                  <EditorArea />
                </Panel>

                {/* Bottom panel (terminal, output, api-tester, etc.) */}
                {bottomPanelVisible && (
                  <>
                    <ResizeHandle />
                    <Panel defaultSize={30} minSize={10} maxSize={70}>
                      <BottomPanel />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>
    </TooltipProvider>
  );
}
