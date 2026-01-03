import { useWorkspaceStore, WorkspaceState } from "./workspace";
import { useEditorStore, EditorState } from "./editor";
import { useUIStore, UIState } from "./ui";
import { useExplorerStore, ExplorerState } from "./explorer";
import { useComponentEditorStore, ComponentEditorState } from "./component-editor";

// Re-export all stores
export { useWorkspaceStore, useEditorStore, useUIStore, useExplorerStore, useComponentEditorStore };

// Workspace store selectors
export const useWorkspace = () => useWorkspaceStore((state: WorkspaceState) => state);
export const useProjectPath = () => useWorkspaceStore((state: WorkspaceState) => state.projectPath);
export const useTheme = () => useWorkspaceStore((state: WorkspaceState) => state.theme);
export const useRecentProjects = () =>
  useWorkspaceStore((state: WorkspaceState) => state.recentProjects);
export const useSetProjectPath = () =>
  useWorkspaceStore((state: WorkspaceState) => state.setProjectPath);
export const useSetTheme = () => useWorkspaceStore((state: WorkspaceState) => state.setTheme);

// Editor store selectors
export const useEditor = () => useEditorStore((state: EditorState) => state);
export const useTabs = () => useEditorStore((state: EditorState) => state.tabs);
export const useActiveTabId = () => useEditorStore((state: EditorState) => state.activeTabId);
export const useActiveTab = () =>
  useEditorStore((state: EditorState) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab || null;
  });

// UI store individual property selectors
export const useSidebarVisible = () => useUIStore((state: UIState) => state.sidebarVisible);
export const useSidebarView = () => useUIStore((state: UIState) => state.sidebarView);
export const useSidebarWidth = () => useUIStore((state: UIState) => state.sidebarWidth);
export const usePanelVisible = () => useUIStore((state: UIState) => state.panelVisible);
export const usePanelView = () => useUIStore((state: UIState) => state.panelView);
export const usePanelHeight = () => useUIStore((state: UIState) => state.panelHeight);
export const useCommandPaletteOpen = () => useUIStore((state: UIState) => state.commandPaletteOpen);
export const useQuickOpenOpen = () => useUIStore((state: UIState) => state.quickOpenOpen);

// UI store action selectors
export const useToggleSidebar = () => useUIStore((state: UIState) => state.toggleSidebar);
export const useSetSidebarView = () => useUIStore((state: UIState) => state.setSidebarView);
export const useSetSidebarWidth = () => useUIStore((state: UIState) => state.setSidebarWidth);
export const useTogglePanel = () => useUIStore((state: UIState) => state.togglePanel);
export const useSetPanelView = () => useUIStore((state: UIState) => state.setPanelView);
export const useSetPanelHeight = () => useUIStore((state: UIState) => state.setPanelHeight);
export const useOpenCommandPalette = () => useUIStore((state: UIState) => state.openCommandPalette);
export const useCloseCommandPalette = () =>
  useUIStore((state: UIState) => state.closeCommandPalette);
export const useOpenQuickOpen = () => useUIStore((state: UIState) => state.openQuickOpen);
export const useCloseQuickOpen = () => useUIStore((state: UIState) => state.closeQuickOpen);

// Explorer store selectors
export const useExplorer = () => useExplorerStore((state: ExplorerState) => state);
export const useRootNodes = () => useExplorerStore((state: ExplorerState) => state.rootNodes);
export const useExpandedPaths = () =>
  useExplorerStore((state: ExplorerState) => state.expandedPaths);
export const useSelectedPath = () => useExplorerStore((state: ExplorerState) => state.selectedPath);
export const useExplorerLoading = () => useExplorerStore((state: ExplorerState) => state.isLoading);

// Component editor store selectors
export const useComponentEditor = () =>
  useComponentEditorStore((state: ComponentEditorState) => state);
export const useCanvasComponents = () =>
  useComponentEditorStore((state: ComponentEditorState) => state.components);
export const useSelectedComponentId = () =>
  useComponentEditorStore((state: ComponentEditorState) => state.selectedComponentId);
export const useHoveredComponentId = () =>
  useComponentEditorStore((state: ComponentEditorState) => state.hoveredComponentId);
export const useAvailableComponents = () =>
  useComponentEditorStore((state: ComponentEditorState) => state.availableComponents);
