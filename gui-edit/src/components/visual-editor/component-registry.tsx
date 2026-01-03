import { cn } from "@/lib/utils";
import { DroppedComponent } from "@/stores/component-editor";
import React from "react";

// Type for component renderer function
type ComponentRenderer = (component: DroppedComponent) => React.ReactNode;

// Registry entry for component rendering
interface RegistryEntry {
  // Render the component's visual representation
  render: ComponentRenderer;
  // Whether this component can have children
  allowChildren: boolean;
  // Default props for new instances
  defaultProps?: Record<string, unknown>;
}

// Component Registry - allows extending components without modifying CanvasComponent
const componentRegistry: Record<string, RegistryEntry> = {
  // Layout components
  div: {
    render: (component) => {
      const { className } = component.props as Record<string, unknown>;
      return <div className={cn(className as string)}>{renderChildren(component)}</div>;
    },
    allowChildren: true,
    defaultProps: { className: "p-4" },
  },
  flex: {
    render: (component) => {
      const { className } = component.props as Record<string, unknown>;
      return <div className={cn("flex", className as string)}>{renderChildren(component)}</div>;
    },
    allowChildren: true,
    defaultProps: { className: "gap-4" },
  },
  grid: {
    render: (component) => {
      const { className } = component.props as Record<string, unknown>;
      return <div className={cn("grid", className as string)}>{renderChildren(component)}</div>;
    },
    allowChildren: true,
    defaultProps: { className: "grid-cols-2 gap-4" },
  },
  card: {
    render: (component) => {
      const { className } = component.props as Record<string, unknown>;
      return (
        <div className={cn("border rounded-lg", className as string)}>
          {renderChildren(component)}
        </div>
      );
    },
    allowChildren: true,
    defaultProps: { className: "p-4" },
  },
  // Form components
  button: {
    render: (component) => {
      const { className, variant, children } = component.props as Record<string, unknown>;
      return (
        <button
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium",
            variant === "outline"
              ? "border border-border hover:bg-accent"
              : variant === "ghost"
                ? "hover:bg-accent"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            className as string
          )}
        >
          {children as string}
        </button>
      );
    },
    allowChildren: false,
    defaultProps: { variant: "default", children: "Button" },
  },
  input: {
    render: (component) => {
      const { className, placeholder, type } = component.props as Record<string, unknown>;
      return (
        <input
          type={(type as string) || "text"}
          placeholder={placeholder as string}
          className={cn(
            "w-full px-3 py-2 rounded-md border border-border bg-background text-sm",
            className as string
          )}
          readOnly
        />
      );
    },
    allowChildren: false,
    defaultProps: { placeholder: "Enter text...", type: "text" },
  },
  textarea: {
    render: (component) => {
      const { className, placeholder, rows } = component.props as Record<string, unknown>;
      return (
        <textarea
          placeholder={placeholder as string}
          rows={(rows as number) || 3}
          className={cn(
            "w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none",
            className as string
          )}
          readOnly
        />
      );
    },
    allowChildren: false,
    defaultProps: { placeholder: "Enter text...", rows: 3 },
  },
  // Display components
  text: {
    render: (component) => {
      const { className, children } = component.props as Record<string, unknown>;
      return <p className={cn(className as string)}>{children as string}</p>;
    },
    allowChildren: false,
    defaultProps: { className: "text-base", children: "Text" },
  },
  heading: {
    render: (component) => {
      const { className, children } = component.props as Record<string, unknown>;
      return <h2 className={cn(className as string)}>{children as string}</h2>;
    },
    allowChildren: false,
    defaultProps: { className: "text-2xl font-bold", children: "Heading" },
  },
  image: {
    render: (component) => {
      const { className, src, alt } = component.props as Record<string, unknown>;
      return (
        <img
          src={src as string}
          alt={alt as string}
          className={cn("max-w-full", className as string)}
        />
      );
    },
    allowChildren: false,
    defaultProps: {
      src: "https://via.placeholder.com/150",
      alt: "placeholder",
      className: "rounded",
    },
  },
  badge: {
    render: (component) => {
      const { className, variant, children } = component.props as Record<string, unknown>;
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            variant === "outline"
              ? "border border-border"
              : variant === "secondary"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground",
            className as string
          )}
        >
          {children as string}
        </span>
      );
    },
    allowChildren: false,
    defaultProps: { variant: "default", children: "Badge" },
  },
  separator: {
    render: (component) => {
      const { className } = component.props as Record<string, unknown>;
      return <hr className={cn("border-border", className as string)} />;
    },
    allowChildren: false,
    defaultProps: { className: "my-4" },
  },
};

// Helper to render children recursively
function renderChildren(component: DroppedComponent): React.ReactNode {
  if (component.children.length > 0) {
    return component.children.map((child) => (
      <RenderedComponent key={child.id} component={child} />
    ));
  }
  return (
    <div className="min-h-[40px] border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground">
      Drop here
    </div>
  );
}

// Render a single component from the registry
export function RenderedComponent({ component }: { component: DroppedComponent }) {
  const entry = componentRegistry[component.componentId];

  if (!entry) {
    return (
      <div className="p-2 border border-red-500 rounded text-red-500">
        Unknown: {component.componentId}
      </div>
    );
  }

  return entry.render(component);
}

// Get a component's registry entry
export function getRegistryEntry(componentId: string): RegistryEntry | undefined {
  return componentRegistry[componentId];
}

// Check if a component ID is registered
export function isRegistered(componentId: string): boolean {
  return componentId in componentRegistry;
}

// Get all registered component IDs
export function getRegisteredComponentIds(): string[] {
  return Object.keys(componentRegistry);
}

// Add a new component to the registry (for extensibility)
export function registerComponent(componentId: string, entry: RegistryEntry): void {
  componentRegistry[componentId] = entry;
}

// Remove a component from the registry
export function unregisterComponent(componentId: string): void {
  delete componentRegistry[componentId];
}
