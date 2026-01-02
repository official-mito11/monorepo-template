import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/ui";
import { useEditorStore } from "@/stores/editor";
import { writeFile } from "@/lib/tauri";

export function useKeyboardShortcuts() {
  const {
    openCommandPalette,
    openQuickOpen,
    toggleSidebar,
    togglePanel,
    setSidebarView,
  } = useUIStore();

  const { tabs, activeTabId, markSaved } = useEditorStore();

  const saveCurrentFile = useCallback(async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeTab.isDirty) return;
    try {
      await writeFile(activeTab.path, activeTab.content);
      markSaved(activeTab.id, activeTab.content);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }, [tabs, activeTabId, markSaved]);

  const saveAllFiles = useCallback(async () => {
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    for (const tab of dirtyTabs) {
      try {
        await writeFile(tab.path, tab.content);
        markSaved(tab.id, tab.content);
      } catch (err) {
        console.error("Failed to save file:", tab.path, err);
      }
    }
  }, [tabs, markSaved]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Command Palette: Ctrl+Shift+P (or Cmd+Shift+P on Mac)
      if (modifier && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Quick Open: Ctrl+P (or Cmd+P on Mac)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        openQuickOpen();
        return;
      }

      // Toggle Sidebar: Ctrl+B (or Cmd+B on Mac)
      if (modifier && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle Panel: Ctrl+J (or Cmd+J on Mac)
      if (modifier && e.key.toLowerCase() === "j") {
        e.preventDefault();
        togglePanel();
        return;
      }

      // Save: Ctrl+S (or Cmd+S on Mac)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentFile();
        return;
      }

      // Save All: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
      if (modifier && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveAllFiles();
        return;
      }

      // Search in Files: Ctrl+Shift+F (or Cmd+Shift+F on Mac)
      if (modifier && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSidebarView("search");
        return;
      }

      // Explorer: Ctrl+Shift+E (or Cmd+Shift+E on Mac)
      if (modifier && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setSidebarView("explorer");
        return;
      }

      // Source Control: Ctrl+Shift+G (or Cmd+Shift+G on Mac)
      if (modifier && e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setSidebarView("git");
        return;
      }

      // Toggle Terminal: Ctrl+` (or Cmd+` on Mac)
      if (modifier && e.key === "`") {
        e.preventDefault();
        togglePanel();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    openCommandPalette,
    openQuickOpen,
    toggleSidebar,
    togglePanel,
    setSidebarView,
    saveCurrentFile,
    saveAllFiles,
  ]);
}
