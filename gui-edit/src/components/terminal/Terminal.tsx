import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { runCommand } from "@/lib/tauri";
import { useWorkspaceStore } from "@/stores/workspace";
import "xterm/css/xterm.css";

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const historyIndexRef = useRef(-1);
  const currentInputRef = useRef("");
  const { projectPath } = useWorkspaceStore();

  const writePrompt = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    const cwd = projectPath?.split("/").pop() || "~";
    term.write(`\r\n\x1b[36m${cwd}\x1b[0m $ `);
  }, [projectPath]);

  const executeCommand = useCallback(
    async (command: string) => {
      const term = xtermRef.current;
      if (!term || !command.trim()) {
        writePrompt();
        return;
      }

      const trimmedCmd = command.trim();

      // Add to history
      setCommandHistory((prev) => [...prev.filter((c) => c !== trimmedCmd), trimmedCmd]);
      historyIndexRef.current = -1;

      // Handle built-in commands
      if (trimmedCmd === "clear") {
        term.clear();
        writePrompt();
        return;
      }

      if (trimmedCmd === "help") {
        term.writeln("\r\n\x1b[33mAvailable commands:\x1b[0m");
        term.writeln("  clear    - Clear terminal");
        term.writeln("  help     - Show this help");
        term.writeln("  Any other command will be executed in the shell");
        writePrompt();
        return;
      }

      // Parse command and args
      const parts = trimmedCmd.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      term.writeln("");

      try {
        const result = await runCommand(cmd, args, projectPath || undefined);
        if (result.stdout) {
          term.writeln(result.stdout.replace(/\n/g, "\r\n"));
        }
        if (result.stderr) {
          term.writeln(`\x1b[31m${result.stderr.replace(/\n/g, "\r\n")}\x1b[0m`);
        }
        if (result.exit_code !== undefined && result.exit_code !== 0) {
          term.writeln(`\x1b[31mProcess exited with code ${result.exit_code}\x1b[0m`);
        }
      } catch (err) {
        term.writeln(
          `\x1b[31mError: ${err instanceof Error ? err.message : "Command failed"}\x1b[0m`
        );
      }

      writePrompt();
    },
    [projectPath, writePrompt]
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
        selectionBackground: "#264f78",
        black: "#1e1e1e",
        red: "#f44747",
        green: "#6a9955",
        yellow: "#dcdcaa",
        blue: "#569cd6",
        magenta: "#c586c0",
        cyan: "#4ec9b0",
        white: "#d4d4d4",
        brightBlack: "#808080",
        brightRed: "#f44747",
        brightGreen: "#6a9955",
        brightYellow: "#dcdcaa",
        brightBlue: "#569cd6",
        brightMagenta: "#c586c0",
        brightCyan: "#4ec9b0",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln("\x1b[36m=== GUI Edit Terminal ===\x1b[0m");
    term.writeln('Type "help" for available commands');
    writePrompt();

    // Handle keyboard input
    term.onKey(({ key, domEvent }) => {
      const printable =
        !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === "Enter") {
        executeCommand(currentInputRef.current);
        currentInputRef.current = "";
      } else if (domEvent.key === "Backspace") {
        if (currentInputRef.current.length > 0) {
          currentInputRef.current = currentInputRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (domEvent.key === "ArrowUp") {
        // Navigate history up
        const newIndex = Math.min(historyIndexRef.current + 1, commandHistory.length - 1);
        if (newIndex >= 0 && commandHistory[commandHistory.length - 1 - newIndex]) {
          const cmd = commandHistory[commandHistory.length - 1 - newIndex];
          // Clear current line
          term.write("\r\x1b[K");
          const cwd = projectPath?.split("/").pop() || "~";
          term.write(`\x1b[36m${cwd}\x1b[0m $ ${cmd}`);
          currentInputRef.current = cmd;
          historyIndexRef.current = newIndex;
        }
      } else if (domEvent.key === "ArrowDown") {
        // Navigate history down
        const newIndex = Math.max(historyIndexRef.current - 1, -1);
        // Clear current line
        term.write("\r\x1b[K");
        const cwd = projectPath?.split("/").pop() || "~";
        if (newIndex >= 0 && commandHistory[commandHistory.length - 1 - newIndex]) {
          const cmd = commandHistory[commandHistory.length - 1 - newIndex];
          term.write(`\x1b[36m${cwd}\x1b[0m $ ${cmd}`);
          currentInputRef.current = cmd;
        } else {
          term.write(`\x1b[36m${cwd}\x1b[0m $ `);
          currentInputRef.current = "";
        }
        historyIndexRef.current = newIndex;
      } else if (domEvent.ctrlKey && domEvent.key === "c") {
        term.write("^C");
        currentInputRef.current = "";
        writePrompt();
      } else if (domEvent.ctrlKey && domEvent.key === "l") {
        term.clear();
        writePrompt();
      } else if (printable) {
        currentInputRef.current += key;
        term.write(key);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    // ResizeObserver for container resizes
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [executeCommand, writePrompt, commandHistory, projectPath]);

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={terminalRef} className="h-full w-full p-2" />
    </div>
  );
}
