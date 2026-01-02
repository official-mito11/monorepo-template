import { useComponentEditorStore, getComponentById } from "@/stores/component-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyInputProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type?: "text" | "number" | "select" | "textarea";
  options?: { value: string; label: string }[];
}

function PropertyInput({
  label,
  value,
  onChange,
  type = "text",
  options,
}: PropertyInputProps) {
  if (type === "select" && options) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <select
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <textarea
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <input
          type="number"
          value={Number(value) || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

const componentPropertyConfigs: Record<
  string,
  { label: string; key: string; type?: "text" | "number" | "select" | "textarea"; options?: { value: string; label: string }[] }[]
> = {
  div: [{ label: "Class Name", key: "className" }],
  flex: [{ label: "Class Name", key: "className" }],
  grid: [{ label: "Class Name", key: "className" }],
  card: [{ label: "Class Name", key: "className" }],
  button: [
    { label: "Text", key: "children" },
    {
      label: "Variant",
      key: "variant",
      type: "select",
      options: [
        { value: "default", label: "Default" },
        { value: "outline", label: "Outline" },
        { value: "ghost", label: "Ghost" },
        { value: "secondary", label: "Secondary" },
        { value: "destructive", label: "Destructive" },
      ],
    },
  ],
  input: [
    { label: "Placeholder", key: "placeholder" },
    {
      label: "Type",
      key: "type",
      type: "select",
      options: [
        { value: "text", label: "Text" },
        { value: "email", label: "Email" },
        { value: "password", label: "Password" },
        { value: "number", label: "Number" },
      ],
    },
  ],
  textarea: [
    { label: "Placeholder", key: "placeholder" },
    { label: "Rows", key: "rows", type: "number" },
  ],
  text: [
    { label: "Text", key: "children" },
    { label: "Class Name", key: "className" },
  ],
  heading: [
    { label: "Text", key: "children" },
    { label: "Class Name", key: "className" },
  ],
  image: [
    { label: "Source URL", key: "src" },
    { label: "Alt Text", key: "alt" },
    { label: "Class Name", key: "className" },
  ],
  badge: [
    { label: "Text", key: "children" },
    {
      label: "Variant",
      key: "variant",
      type: "select",
      options: [
        { value: "default", label: "Default" },
        { value: "secondary", label: "Secondary" },
        { value: "outline", label: "Outline" },
        { value: "destructive", label: "Destructive" },
      ],
    },
  ],
  separator: [{ label: "Class Name", key: "className" }],
};

export function PropertyPanel() {
  const { selectedComponentId, updateComponentProps, availableComponents } =
    useComponentEditorStore();

  // Use O(1) lookup instead of recursive search
  const selectedComponent = selectedComponentId ? getComponentById(selectedComponentId) : null;

  const componentDef = selectedComponent
    ? availableComponents.find((c) => c.id === selectedComponent.componentId)
    : null;

  const propertyConfig = selectedComponent
    ? componentPropertyConfigs[selectedComponent.componentId] || []
    : [];

  if (!selectedComponent) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a component to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Properties</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {selectedComponent.name}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Component info */}
          <div className="p-2 bg-muted rounded-md">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{componentDef?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-[10px] truncate max-w-[120px]">
                  {selectedComponent.id}
                </span>
              </div>
              {componentDef?.allowChildren && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Children</span>
                  <span>{selectedComponent.children.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-3">
            {propertyConfig.map((prop) => (
              <PropertyInput
                key={prop.key}
                label={prop.label}
                value={selectedComponent.props[prop.key]}
                onChange={(value) =>
                  updateComponentProps(selectedComponent.id, {
                    [prop.key]: value,
                  })
                }
                type={prop.type}
                options={prop.options}
              />
            ))}
          </div>

          {/* Raw props (for debugging) */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              All Props (JSON)
            </h4>
            <pre className="text-[10px] p-2 bg-muted rounded-md overflow-x-auto">
              {JSON.stringify(selectedComponent.props, null, 2)}
            </pre>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
