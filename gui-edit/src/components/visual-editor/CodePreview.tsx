import { useMemo } from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import { useComponentEditorStore, generateTSXCode } from "@/stores/component-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function CodePreview() {
  const { components, clearCanvas } = useComponentEditorStore();

  const generatedCode = useMemo(() => {
    if (components.length === 0) {
      return "// Add components to generate code";
    }

    const imports = new Set<string>();

    // Collect imports based on used components
    const collectImports = (comps: typeof components) => {
      for (const comp of comps) {
        switch (comp.componentId) {
          case "button":
            imports.add('import { Button } from "@/components/ui/button";');
            break;
          case "input":
            imports.add('import { Input } from "@/components/ui/input";');
            break;
          case "textarea":
            imports.add('import { Textarea } from "@/components/ui/textarea";');
            break;
          case "badge":
            imports.add('import { Badge } from "@/components/ui/badge";');
            break;
          case "separator":
            imports.add('import { Separator } from "@/components/ui/separator";');
            break;
        }
        collectImports(comp.children);
      }
    };

    collectImports(components);

    const importsStr = Array.from(imports).sort().join("\n");
    const componentCode = generateTSXCode(components, 2);

    return `${importsStr}${importsStr ? "\n\n" : ""}export default function Component() {
  return (
${componentCode}
  );
}`;
  }, [components]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Component.tsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-10 flex items-center justify-between px-4 border-b border-border">
        <span className="text-sm font-medium">Generated Code</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleCopy}
            title="Copy code"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleDownload}
            title="Download file"
          >
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={clearCanvas}
            title="Clear canvas"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-xs font-mono leading-relaxed">
          <code>{generatedCode}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
