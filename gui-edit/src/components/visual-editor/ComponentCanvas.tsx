import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useComponentEditorStore,
  DroppedComponent,
  ComponentDefinition,
} from "@/stores/component-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RenderedComponent, getRegistryEntry } from "./component-registry";

interface CanvasComponentProps {
  component: DroppedComponent;
}

function CanvasComponent({ component }: CanvasComponentProps) {
  const {
    selectedComponentId,
    hoveredComponentId,
    selectComponent,
    setHoveredComponent,
    removeComponent,
    addComponent,
  } = useComponentEditorStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;

  const registryEntry = getRegistryEntry(component.componentId);
  const allowChildren = registryEntry?.allowChildren ?? false;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const data = e.dataTransfer.getData("component");
      if (data && allowChildren) {
        const comp = JSON.parse(data) as ComponentDefinition;
        addComponent(comp, component.id);
      }
    },
    [addComponent, component.id, allowChildren]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (allowChildren) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [allowChildren]
  );

  // For container components, render drop zone if no children
  const renderDropZone = () => {
    if (component.children.length === 0 && allowChildren) {
      return (
        <div className="min-h-[40px] border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground">
          Drop here
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-offset-1",
        isHovered && !isSelected && "ring-1 ring-primary/50"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      onMouseEnter={() => setHoveredComponent(component.id)}
      onMouseLeave={() => setHoveredComponent(null)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Component label */}
      {(isSelected || isHovered) && (
        <div className="absolute -top-5 left-0 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-t z-10">
          {component.name}
        </div>
      )}

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(component.id);
          }}
          className="absolute -top-5 right-0 p-0.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 z-10"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Render component from registry */}
      <RenderedComponent component={component} />

      {/* Drop zone for container components */}
      {renderDropZone()}
    </div>
  );
}

export function ComponentCanvas() {
  const { components, addComponent, selectComponent } = useComponentEditorStore();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("component");
      if (data) {
        const comp = JSON.parse(data) as ComponentDefinition;
        addComponent(comp, null);
      }
    },
    [addComponent]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-10 flex items-center justify-between px-4 border-b border-border">
        <span className="text-sm font-medium">Canvas</span>
        <span className="text-xs text-muted-foreground">
          {components.length} component{components.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div
          className="min-h-full p-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => selectComponent(null)}
        >
          {components.length === 0 ? (
            <div className="h-[400px] border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Drag components here or click them in the toolbox
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4 border border-border rounded-lg min-h-[400px]">
              {components.map((comp) => (
                <CanvasComponent key={comp.id} component={comp} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
