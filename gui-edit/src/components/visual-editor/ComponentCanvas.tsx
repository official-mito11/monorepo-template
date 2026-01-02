import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useComponentEditorStore,
  DroppedComponent,
  ComponentDefinition,
} from "@/stores/component-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CanvasComponentProps {
  component: DroppedComponent;
  depth: number;
}

function CanvasComponent({ component, depth }: CanvasComponentProps) {
  const {
    selectedComponentId,
    hoveredComponentId,
    selectComponent,
    setHoveredComponent,
    removeComponent,
    addComponent,
    availableComponents,
  } = useComponentEditorStore();

  const isSelected = selectedComponentId === component.id;
  const isHovered = hoveredComponentId === component.id;
  const componentDef = availableComponents.find(
    (c) => c.id === component.componentId
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const data = e.dataTransfer.getData("component");
      if (data && componentDef?.allowChildren) {
        const comp = JSON.parse(data) as ComponentDefinition;
        addComponent(comp, component.id);
      }
    },
    [addComponent, component.id, componentDef]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (componentDef?.allowChildren) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [componentDef]
  );

  const renderContent = () => {
    const { children, className, variant, placeholder, src, alt, rows, type } =
      component.props as Record<string, unknown>;

    switch (component.componentId) {
      case "div":
      case "flex":
      case "grid":
      case "card":
        return (
          <div className={cn(className as string)}>
            {component.children.length > 0 ? (
              component.children.map((child) => (
                <CanvasComponent
                  key={child.id}
                  component={child}
                  depth={depth + 1}
                />
              ))
            ) : (
              <div className="min-h-[40px] border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        );
      case "button":
        return (
          <button
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium",
              variant === "outline"
                ? "border border-border hover:bg-accent"
                : variant === "ghost"
                  ? "hover:bg-accent"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {children as string}
          </button>
        );
      case "input":
        return (
          <input
            type={(type as string) || "text"}
            placeholder={placeholder as string}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            readOnly
          />
        );
      case "textarea":
        return (
          <textarea
            placeholder={placeholder as string}
            rows={(rows as number) || 3}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
            readOnly
          />
        );
      case "text":
        return <p className={cn(className as string)}>{children as string}</p>;
      case "heading":
        return (
          <h2 className={cn(className as string)}>{children as string}</h2>
        );
      case "image":
        return (
          <img
            src={src as string}
            alt={alt as string}
            className={cn("max-w-full", className as string)}
          />
        );
      case "badge":
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              variant === "outline"
                ? "border border-border"
                : variant === "secondary"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
            )}
          >
            {children as string}
          </span>
        );
      case "separator":
        return <hr className={cn("border-border", className as string)} />;
      default:
        return <div>Unknown component</div>;
    }
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

      {renderContent()}
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
                <CanvasComponent key={comp.id} component={comp} depth={0} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
