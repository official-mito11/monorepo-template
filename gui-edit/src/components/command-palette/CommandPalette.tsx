import { useEffect, useState, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import {
  Files,
  GitBranch,
  Search,
  Terminal,
  Settings,
  PanelBottom,
  PanelLeft,
  Save,
  FileCode,
  Route,
  Palette,
  Component,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useEditorStore } from "@/stores/editor";
import { writeFile } from "@/lib/tauri";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [search, setSearch] = useState("");
  const {
    commandPaletteOpen,
    closeCommandPalette,
    toggleSidebar,
    setSidebarView,
    togglePanel,
    setPanelView,
  } = useUIStore();
  const { tabs, activeTabId, markSaved } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const saveCurrentFile = useCallback(async () => {
    if (!activeTab || !activeTab.isDirty) return;
    try {
      await writeFile(activeTab.path, activeTab.content);
      markSaved(activeTab.id, activeTab.content);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }, [activeTab, markSaved]);

  const commands: CommandItem[] = useMemo(
    () => [
      // View commands
      {
        id: "toggle-sidebar",
        label: "Toggle Sidebar",
        shortcut: "Ctrl+B",
        icon: <PanelLeft size={16} />,
        action: toggleSidebar,
        category: "View",
      },
      {
        id: "toggle-panel",
        label: "Toggle Panel",
        shortcut: "Ctrl+J",
        icon: <PanelBottom size={16} />,
        action: togglePanel,
        category: "View",
      },
      {
        id: "show-explorer",
        label: "Show Explorer",
        icon: <Files size={16} />,
        action: () => setSidebarView("explorer"),
        category: "View",
      },
      {
        id: "show-routes",
        label: "Show Routes",
        icon: <Route size={16} />,
        action: () => setSidebarView("routes"),
        category: "View",
      },
      {
        id: "show-components",
        label: "Show Components",
        icon: <Component size={16} />,
        action: () => setSidebarView("components"),
        category: "View",
      },
      {
        id: "show-git",
        label: "Show Source Control",
        icon: <GitBranch size={16} />,
        action: () => setSidebarView("git"),
        category: "View",
      },
      {
        id: "show-search",
        label: "Show Search",
        shortcut: "Ctrl+Shift+F",
        icon: <Search size={16} />,
        action: () => setSidebarView("search"),
        category: "View",
      },

      // Panel commands
      {
        id: "show-terminal",
        label: "Show Terminal",
        shortcut: "Ctrl+`",
        icon: <Terminal size={16} />,
        action: () => {
          setPanelView("terminal");
          if (!useUIStore.getState().panelVisible) {
            togglePanel();
          }
        },
        category: "Terminal",
      },
      {
        id: "show-problems",
        label: "Show Problems",
        icon: <FileCode size={16} />,
        action: () => {
          setPanelView("problems");
          if (!useUIStore.getState().panelVisible) {
            togglePanel();
          }
        },
        category: "View",
      },
      {
        id: "show-api-tester",
        label: "Show API Tester",
        icon: <Route size={16} />,
        action: () => {
          setPanelView("api-tester");
          if (!useUIStore.getState().panelVisible) {
            togglePanel();
          }
        },
        category: "View",
      },

      // File commands
      {
        id: "save-file",
        label: "Save File",
        shortcut: "Ctrl+S",
        icon: <Save size={16} />,
        action: saveCurrentFile,
        category: "File",
      },

      // Other
      {
        id: "open-settings",
        label: "Open Settings",
        shortcut: "Ctrl+,",
        icon: <Settings size={16} />,
        action: () => {
          // TODO: Implement settings panel
          console.debug("Open Settings requested");
        },
        category: "Preferences",
      },
    ],
    [toggleSidebar, togglePanel, setSidebarView, setPanelView, saveCurrentFile]
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lowerSearch = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.category.toLowerCase().includes(lowerSearch)
    );
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  const handleSelect = useCallback(
    (commandId: string) => {
      const command = commands.find((c) => c.id === commandId);
      if (command) {
        command.action();
        closeCommandPalette();
      }
    },
    [commands, closeCommandPalette]
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && commandPaletteOpen) {
        closeCommandPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, closeCommandPalette]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeCommandPalette} />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw]">
        <Command className="rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center border-b border-border px-3">
            <Palette size={16} className="text-muted-foreground mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No commands found
            </Command.Empty>

            {Object.entries(groupedCommands).map(([category, items]) => (
              <Command.Group key={category} heading={category}>
                {items.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={handleSelect}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer aria-selected:bg-accent"
                  >
                    <span className="text-muted-foreground">{cmd.icon}</span>
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
