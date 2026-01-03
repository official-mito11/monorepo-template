import { useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { QuickOpen } from "@/components/command-palette/QuickOpen";
import { useTheme, useProjectPath } from "@/stores/selectors";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useWorkspaceStore } from "@/stores/workspace";
import "./styles/globals.css";

function App() {
  const theme = useTheme();
  const projectPath = useProjectPath();
  const setProjectPath = useWorkspaceStore((state) => state.setProjectPath);

  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Set initial project path (for development)
  useEffect(() => {
    // In production, this would be set via Tauri file dialog
    // For now, we'll use the monorepo root as the default project
    const defaultPath = "/Users/sunwoo/work/monorepo-template";
    if (!projectPath && typeof window !== "undefined" && !("__TAURI__" in window)) {
      setProjectPath(defaultPath);
    }
  }, [projectPath, setProjectPath]);

  return (
    <>
      <Shell />
      <CommandPalette />
      <QuickOpen />
    </>
  );
}

export default App;
