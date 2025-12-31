import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkspaceState {
  projectPath: string | null;
  recentProjects: string[];
  theme: "light" | "dark" | "system";

  setProjectPath: (path: string | null) => void;
  addRecentProject: (path: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      projectPath: null,
      recentProjects: [],
      theme: "dark",

      setProjectPath: (path) => {
        set({ projectPath: path });
        if (path) {
          get().addRecentProject(path);
        }
      },

      addRecentProject: (path) => {
        const { recentProjects } = get();
        const filtered = recentProjects.filter((p) => p !== path);
        set({ recentProjects: [path, ...filtered].slice(0, 10) });
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.add(prefersDark ? "dark" : "light");
        } else {
          root.classList.add(theme);
        }
      },
    }),
    {
      name: "gui-edit-workspace",
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        theme: state.theme,
      }),
    }
  )
);
