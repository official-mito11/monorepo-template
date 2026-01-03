import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarView = "explorer" | "routes" | "components" | "git" | "search";
export type PanelView = "terminal" | "problems" | "output" | "api-tester";

export interface UIState {
  // Sidebar
  sidebarVisible: boolean;
  sidebarView: SidebarView;
  sidebarWidth: number;

  // Panel (bottom)
  panelVisible: boolean;
  panelView: PanelView;
  panelHeight: number;

  // Command palette
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarView: (view: SidebarView) => void;
  setSidebarWidth: (width: number) => void;
  togglePanel: () => void;
  setPanelView: (view: PanelView) => void;
  setPanelHeight: (height: number) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openQuickOpen: () => void;
  closeQuickOpen: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarVisible: true,
      sidebarView: "explorer",
      sidebarWidth: 260,
      panelVisible: false,
      panelView: "terminal",
      panelHeight: 200,
      commandPaletteOpen: false,
      quickOpenOpen: false,

      toggleSidebar: () => {
        set({ sidebarVisible: !get().sidebarVisible });
      },

      setSidebarView: (view) => {
        const { sidebarVisible, sidebarView } = get();
        if (sidebarVisible && sidebarView === view) {
          set({ sidebarVisible: false });
        } else {
          set({ sidebarVisible: true, sidebarView: view });
        }
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(200, Math.min(500, width)) });
      },

      togglePanel: () => {
        set({ panelVisible: !get().panelVisible });
      },

      setPanelView: (view) => {
        const { panelVisible, panelView } = get();
        if (panelVisible && panelView === view) {
          set({ panelVisible: false });
        } else {
          set({ panelVisible: true, panelView: view });
        }
      },

      setPanelHeight: (height) => {
        set({ panelHeight: Math.max(100, Math.min(500, height)) });
      },

      openCommandPalette: () => {
        set({ commandPaletteOpen: true, quickOpenOpen: false });
      },

      closeCommandPalette: () => {
        set({ commandPaletteOpen: false });
      },

      openQuickOpen: () => {
        set({ quickOpenOpen: true, commandPaletteOpen: false });
      },

      closeQuickOpen: () => {
        set({ quickOpenOpen: false });
      },
    }),
    {
      name: "gui-edit-ui",
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        panelHeight: state.panelHeight,
      }),
    }
  )
);
