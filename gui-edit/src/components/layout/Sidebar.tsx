import { useUIStore } from "@/stores/ui";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { RouteExplorer } from "@/components/routes/RouteExplorer";
import { ComponentToolbox } from "@/components/visual-editor/ComponentToolbox";
import { GitStatusPanel } from "@/components/git/GitStatus";
import { SearchPanel } from "@/components/search/SearchPanel";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  const { sidebarView, sidebarVisible } = useUIStore();

  if (!sidebarVisible) {
    return null;
  }

  const renderContent = () => {
    switch (sidebarView) {
      case "explorer":
        return <FileExplorer />;
      case "routes":
        return <RouteExplorer />;
      case "components":
        return <ComponentToolbox />;
      case "search":
        return <SearchPanel />;
      case "git":
        return <GitStatusPanel />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (sidebarView) {
      case "explorer":
        return "EXPLORER";
      case "routes":
        return "ROUTES";
      case "components":
        return "COMPONENTS";
      case "search":
        return "SEARCH";
      case "git":
        return "SOURCE CONTROL";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="h-9 flex items-center px-4 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
        {getTitle()}
      </div>
      <ScrollArea className="flex-1">
        {renderContent()}
      </ScrollArea>
    </div>
  );
}
