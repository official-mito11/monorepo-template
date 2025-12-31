import {
  Files,
  GitBranch,
  Layers,
  Route,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, type SidebarView } from "@/stores/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityBarItemProps {
  icon: React.ReactNode;
  label: string;
  view: SidebarView;
  isActive: boolean;
  onClick: () => void;
}

function ActivityBarItem({
  icon,
  label,
  isActive,
  onClick,
}: ActivityBarItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "activity-bar-item",
            isActive && "active"
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ActivityBar() {
  const { sidebarView, sidebarVisible, setSidebarView } = useUIStore();

  const items: { icon: React.ReactNode; label: string; view: SidebarView }[] = [
    { icon: <Files size={24} />, label: "Explorer", view: "explorer" },
    { icon: <Route size={24} />, label: "Routes", view: "routes" },
    { icon: <Layers size={24} />, label: "Components", view: "components" },
    { icon: <Search size={24} />, label: "Search", view: "search" },
    { icon: <GitBranch size={24} />, label: "Source Control", view: "git" },
  ];

  return (
    <div className="flex flex-col h-full w-12 bg-sidebar border-r border-sidebar-border">
      <div className="flex-1 flex flex-col">
        {items.map((item) => (
          <ActivityBarItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            view={item.view}
            isActive={sidebarVisible && sidebarView === item.view}
            onClick={() => setSidebarView(item.view)}
          />
        ))}
      </div>
      <div className="flex flex-col">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="activity-bar-item">
              <Settings size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
