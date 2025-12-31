import { create } from "zustand";
import type { FileNode } from "@/lib/tauri";

export type { FileNode };

export interface ExplorerState {
  rootNodes: FileNode[];
  expandedPaths: Set<string>;
  selectedPath: string | null;
  isLoading: boolean;
  error: string | null;

  setRootNodes: (nodes: FileNode[]) => void;
  toggleExpand: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  setSelectedPath: (path: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setChildren: (path: string, children: FileNode[]) => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  rootNodes: [],
  expandedPaths: new Set(),
  selectedPath: null,
  isLoading: false,
  error: null,

  setRootNodes: (nodes) => {
    set({ rootNodes: nodes, isLoading: false, error: null });
  },

  toggleExpand: (path) => {
    const { expandedPaths } = get();
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    set({ expandedPaths: newExpanded });
  },

  setExpanded: (path, expanded) => {
    const { expandedPaths } = get();
    const newExpanded = new Set(expandedPaths);
    if (expanded) {
      newExpanded.add(path);
    } else {
      newExpanded.delete(path);
    }
    set({ expandedPaths: newExpanded });
  },

  setSelectedPath: (path) => {
    set({ selectedPath: path });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  setChildren: (path, children) => {
    const { rootNodes, expandedPaths } = get();

    function updateChildren(nodes: FileNode[]): FileNode[] {
      return nodes.map((node) => {
        if (node.path === path) {
          return { ...node, children };
        }
        if (node.children) {
          return { ...node, children: updateChildren(node.children) };
        }
        return node;
      });
    }

    const newExpanded = new Set(expandedPaths);
    newExpanded.add(path);
    set({ rootNodes: updateChildren(rootNodes), expandedPaths: newExpanded });
  },
}));
