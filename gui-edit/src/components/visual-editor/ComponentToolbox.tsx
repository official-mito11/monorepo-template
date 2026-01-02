import {
  Square,
  LayoutList,
  Grid3x3,
  MousePointer2,
  TextCursorInput,
  AlignLeft,
  RectangleHorizontal,
  Type,
  Heading,
  Image,
  Tag,
  Minus,
} from "lucide-react";
import { useComponentEditorStore, ComponentDefinition } from "@/stores/component-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Square,
  LayoutList,
  Grid3x3,
  MousePointer2,
  TextCursorInput,
  AlignLeft,
  RectangleHorizontal,
  Type,
  Heading,
  Image,
  Tag,
  Minus,
};

interface ComponentItemProps {
  component: ComponentDefinition;
  onDragStart: (component: ComponentDefinition) => void;
}

function ComponentItem({ component, onDragStart }: ComponentItemProps) {
  const Icon = iconMap[component.icon] || Square;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("component", JSON.stringify(component));
        onDragStart(component);
      }}
      className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
    >
      <Icon size={20} className="text-muted-foreground mb-1" />
      <span className="text-xs text-center">{component.name}</span>
    </div>
  );
}

export function ComponentToolbox() {
  const { availableComponents, addComponent } = useComponentEditorStore();

  // Group components by category
  const categories = availableComponents.reduce<Record<string, ComponentDefinition[]>>(
    (acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    },
    {}
  );

  const handleDragStart = () => {
    // Just for visual feedback - component data is set in dataTransfer
  };

  const handleClick = (component: ComponentDefinition) => {
    addComponent(component, null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Components</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag or click to add
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(categories).map(([category, components]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {components.map((comp) => (
                  <div key={comp.id} onClick={() => handleClick(comp)}>
                    <ComponentItem
                      component={comp}
                      onDragStart={handleDragStart}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
