import { create } from "zustand";

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  isDirty: boolean;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  openTab: (tab: Omit<EditorTab, "originalContent">) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabDirty: (id: string, isDirty: boolean) => void;
  markSaved: (id: string, content: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find((t) => t.path === tab.path);

    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTab: EditorTab = {
      ...tab,
      originalContent: tab.content,
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);

    let newActiveId = activeTabId;
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (tabIndex >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveId = newTabs[tabIndex].id;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  closeOtherTabs: (id) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      set({ tabs: [tab], activeTabId: id });
    }
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },

  updateTabContent: (id, content) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === id ? { ...t, content } : t
      ),
    });
  },

  markTabDirty: (id, isDirty) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === id ? { ...t, isDirty } : t
      ),
    });
  },

  markSaved: (id, content) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === id
          ? { ...t, content, originalContent: content, isDirty: false }
          : t
      ),
    });
  },

  reorderTabs: (fromIndex, toIndex) => {
    const { tabs } = get();
    const newTabs = [...tabs];
    const [removed] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, removed);
    set({ tabs: newTabs });
  },
}));
