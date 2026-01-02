import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ComponentToolbox } from "./ComponentToolbox";
import { ComponentCanvas } from "./ComponentCanvas";
import { PropertyPanel } from "./PropertyPanel";
import { CodePreview } from "./CodePreview";

function ResizeHandle({ className = "" }: { className?: string }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center bg-border ${className}`}
    >
      <div className="absolute inset-0 group-hover:bg-primary/20 group-active:bg-primary/30 transition-colors" />
    </PanelResizeHandle>
  );
}

export function VisualEditor() {
  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Component Toolbox */}
        <Panel defaultSize={15} minSize={10} maxSize={25}>
          <ComponentToolbox />
        </Panel>

        <ResizeHandle className="w-px" />

        {/* Canvas */}
        <Panel defaultSize={45} minSize={30}>
          <ComponentCanvas />
        </Panel>

        <ResizeHandle className="w-px" />

        {/* Right side: Properties + Code Preview */}
        <Panel defaultSize={40} minSize={25}>
          <PanelGroup direction="vertical">
            {/* Property Panel */}
            <Panel defaultSize={50} minSize={20}>
              <PropertyPanel />
            </Panel>

            <ResizeHandle className="h-px" />

            {/* Code Preview */}
            <Panel defaultSize={50} minSize={20}>
              <CodePreview />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
