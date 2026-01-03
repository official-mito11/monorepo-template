import { create } from "zustand";

export interface ComponentDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultProps: Record<string, unknown>;
  allowChildren: boolean;
}

export interface DroppedComponent {
  id: string;
  componentId: string;
  name: string;
  props: Record<string, unknown>;
  children: DroppedComponent[];
  parentId: string | null;
}

export interface ComponentEditorState {
  // Canvas state
  components: DroppedComponent[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;

  // Component library
  availableComponents: ComponentDefinition[];

  // Actions
  addComponent: (componentDef: ComponentDefinition, parentId?: string | null) => void;
  removeComponent: (id: string) => void;
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  selectComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  moveComponent: (id: string, newParentId: string | null, newIndex: number) => void;
  clearCanvas: () => void;
  setComponents: (components: DroppedComponent[]) => void;

  // Selector for O(1) component lookup
  getComponentById: (id: string) => DroppedComponent | null;
}

// Default shadcn components
const defaultComponents: ComponentDefinition[] = [
  {
    id: "div",
    name: "Container",
    category: "Layout",
    icon: "Square",
    defaultProps: { className: "p-4" },
    allowChildren: true,
  },
  {
    id: "flex",
    name: "Flex",
    category: "Layout",
    icon: "LayoutList",
    defaultProps: { className: "flex gap-4" },
    allowChildren: true,
  },
  {
    id: "grid",
    name: "Grid",
    category: "Layout",
    icon: "Grid3x3",
    defaultProps: { className: "grid grid-cols-2 gap-4" },
    allowChildren: true,
  },
  {
    id: "button",
    name: "Button",
    category: "Form",
    icon: "MousePointer2",
    defaultProps: { variant: "default", children: "Button" },
    allowChildren: false,
  },
  {
    id: "input",
    name: "Input",
    category: "Form",
    icon: "TextCursorInput",
    defaultProps: { placeholder: "Enter text...", type: "text" },
    allowChildren: false,
  },
  {
    id: "textarea",
    name: "Textarea",
    category: "Form",
    icon: "AlignLeft",
    defaultProps: { placeholder: "Enter text...", rows: 3 },
    allowChildren: false,
  },
  {
    id: "card",
    name: "Card",
    category: "Display",
    icon: "RectangleHorizontal",
    defaultProps: { className: "p-4 border rounded-lg" },
    allowChildren: true,
  },
  {
    id: "text",
    name: "Text",
    category: "Typography",
    icon: "Type",
    defaultProps: { className: "text-base", children: "Text" },
    allowChildren: false,
  },
  {
    id: "heading",
    name: "Heading",
    category: "Typography",
    icon: "Heading",
    defaultProps: { className: "text-2xl font-bold", children: "Heading" },
    allowChildren: false,
  },
  {
    id: "image",
    name: "Image",
    category: "Media",
    icon: "Image",
    defaultProps: {
      src: "https://via.placeholder.com/150",
      alt: "placeholder",
      className: "rounded",
    },
    allowChildren: false,
  },
  {
    id: "badge",
    name: "Badge",
    category: "Display",
    icon: "Tag",
    defaultProps: { variant: "default", children: "Badge" },
    allowChildren: false,
  },
  {
    id: "separator",
    name: "Separator",
    category: "Layout",
    icon: "Minus",
    defaultProps: { className: "my-4" },
    allowChildren: false,
  },
];

function generateId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Recursive helper functions - these are pure and don't mutate external state
function findComponentRecursive(
  components: DroppedComponent[],
  id: string
): DroppedComponent | null {
  for (const comp of components) {
    if (comp.id === id) return comp;
    const found = findComponentRecursive(comp.children, id);
    if (found) return found;
  }
  return null;
}

export const useComponentEditorStore = create<ComponentEditorState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  hoveredComponentId: null,
  availableComponents: defaultComponents,

  addComponent: (componentDef, parentId = null) => {
    const newComponent: DroppedComponent = {
      id: generateId(),
      componentId: componentDef.id,
      name: componentDef.name,
      props: { ...componentDef.defaultProps },
      children: [],
      parentId,
    };

    set((state) => {
      // Add component to parent or root
      const addToParent = (comps: DroppedComponent[]): DroppedComponent[] => {
        if (parentId === null) {
          return [...comps, newComponent];
        }
        return comps.map((c) => {
          if (c.id === parentId) {
            return { ...c, children: [...c.children, newComponent] };
          }
          return { ...c, children: addToParent(c.children) };
        });
      };

      return {
        components: addToParent(state.components),
        selectedComponentId: newComponent.id,
      };
    });
  },

  removeComponent: (id) => {
    set((state) => {
      // Remove component and its children from tree
      const removeFromTree = (comps: DroppedComponent[]): DroppedComponent[] => {
        return comps
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            children: removeFromTree(c.children),
          }));
      };

      return {
        components: removeFromTree(state.components),
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      };
    });
  },

  updateComponentProps: (id, props) => {
    set((state) => {
      // Update props in tree
      const updateInTree = (comps: DroppedComponent[]): DroppedComponent[] => {
        return comps.map((c) => {
          if (c.id === id) {
            return { ...c, props: { ...c.props, ...props } };
          }
          return { ...c, children: updateInTree(c.children) };
        });
      };

      return { components: updateInTree(state.components) };
    });
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  setHoveredComponent: (id) => {
    set({ hoveredComponentId: id });
  },

  moveComponent: (id, newParentId, newIndex) => {
    set((state) => {
      // Find the component to move
      const compToMove = findComponentRecursive(state.components, id);
      if (!compToMove) return state;

      // Remove from current position
      const removeFromTree = (comps: DroppedComponent[]): DroppedComponent[] => {
        return comps
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            children: removeFromTree(c.children),
          }));
      };

      // Add to new position
      const addToTree = (comps: DroppedComponent[]): DroppedComponent[] => {
        if (newParentId === null) {
          const newComps = [...comps];
          newComps.splice(newIndex, 0, { ...compToMove, parentId: null });
          return newComps;
        }
        return comps.map((c) => {
          if (c.id === newParentId) {
            const newChildren = [...c.children];
            newChildren.splice(newIndex, 0, { ...compToMove, parentId: newParentId });
            return { ...c, children: newChildren };
          }
          return { ...c, children: addToTree(c.children) };
        });
      };

      return { components: addToTree(removeFromTree(state.components)) };
    });
  },

  clearCanvas: () => {
    set({ components: [], selectedComponentId: null });
  },

  setComponents: (components) => {
    set({ components });
  },

  // Reactive component lookup using current store state
  getComponentById: (id) => {
    const state = get();
    return findComponentRecursive(state.components, id);
  },
}));

// Escape string for JSX attribute
function escapeJSXString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

// Format prop value for JSX
function formatPropValue(key: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return `${key}="${escapeJSXString(value)}"`;
  }

  if (typeof value === "boolean") {
    return value ? key : null;
  }

  if (typeof value === "number") {
    return `${key}={${value}}`;
  }

  return `${key}={${JSON.stringify(value)}}`;
}

// Code generation utility
export function generateTSXCode(components: DroppedComponent[], indent: number = 0): string {
  const spaces = "  ".repeat(indent);

  return components
    .map((comp) => {
      const propsArr = Object.entries(comp.props)
        .filter(([key]) => key !== "children")
        .map(([key, value]) => formatPropValue(key, value))
        .filter((p): p is string => p !== null);

      const propsStr = propsArr.join(" ");

      const childrenProp = comp.props.children as string | undefined;
      const hasNestedChildren = comp.children.length > 0;

      const tagName = getTagName(comp.componentId);

      if (!hasNestedChildren && !childrenProp) {
        return `${spaces}<${tagName}${propsStr ? ` ${propsStr}` : ""} />`;
      }

      const childrenContent = hasNestedChildren
        ? `\n${generateTSXCode(comp.children, indent + 1)}\n${spaces}`
        : escapeJSXString(childrenProp || "");

      return `${spaces}<${tagName}${propsStr ? ` ${propsStr}` : ""}>${childrenContent}</${tagName}>`;
    })
    .join("\n");
}

function getTagName(componentId: string): string {
  switch (componentId) {
    case "div":
    case "flex":
    case "grid":
    case "card":
      return "div";
    case "button":
      return "Button";
    case "input":
      return "Input";
    case "textarea":
      return "Textarea";
    case "text":
      return "p";
    case "heading":
      return "h2";
    case "image":
      return "img";
    case "badge":
      return "Badge";
    case "separator":
      return "Separator";
    default:
      return "div";
  }
}
