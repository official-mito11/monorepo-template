import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/stores/editor";
import { useWorkspaceStore } from "@/stores/workspace";

interface MonacoEditorProps {
  tabId: string;
  path: string;
  content: string;
  language: string;
}

export function MonacoEditor({ tabId, path, content, language }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { updateTabContent, markTabDirty } = useEditorStore();
  const { theme } = useWorkspaceStore();

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco
    monaco.editor.defineTheme("gui-edit-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a0a0b",
        "editor.foreground": "#fafafa",
        "editorLineNumber.foreground": "#525252",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.selectionBackground": "#3f3f46",
        "editor.lineHighlightBackground": "#18181b",
        "editorCursor.foreground": "#fafafa",
        "editorWhitespace.foreground": "#3f3f46",
      },
    });

    monaco.editor.defineTheme("gui-edit-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#0a0a0b",
        "editorLineNumber.foreground": "#a1a1aa",
        "editorLineNumber.activeForeground": "#525252",
        "editor.selectionBackground": "#e4e4e7",
        "editor.lineHighlightBackground": "#f4f4f5",
        "editorCursor.foreground": "#0a0a0b",
        "editorWhitespace.foreground": "#d4d4d8",
      },
    });

    // Set theme
    monaco.editor.setTheme(theme === "dark" ? "gui-edit-dark" : "gui-edit-light");

    // Add keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file - will be implemented with Tauri
      console.log("Save file:", path);
    });

    // Focus editor
    editor.focus();
  }, [path, theme]);

  const handleEditorChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      updateTabContent(tabId, value);
      markTabDirty(tabId, true);
    }
  }, [tabId, updateTabContent, markTabDirty]);

  return (
    <div className="monaco-container">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme={theme === "dark" ? "gui-edit-dark" : "gui-edit-light"}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80 },
          scrollBeyondLastLine: false,
          wordWrap: "off",
          lineNumbers: "on",
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 8 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
