import { useState, useCallback, useEffect } from "react";
import { Search, X, File, ChevronDown, ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useEditorStore } from "@/stores/editor";
import { searchInFiles, readFile, SearchResult } from "@/lib/tauri";
import { ScrollArea } from "@/components/ui/scroll-area";

function getLanguageFromExtension(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    rs: "rust",
    py: "python",
    go: "go",
  };
  return map[ext] || "plaintext";
}

interface GroupedResults {
  [filePath: string]: SearchResult[];
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const { projectPath } = useWorkspaceStore();
  const { openTab } = useEditorStore();

  const doSearch = useCallback(async () => {
    if (!query.trim() || !projectPath) return;

    setIsSearching(true);
    try {
      const searchResults = await searchInFiles(projectPath, query, {
        regex: isRegex,
        caseSensitive,
        includePatterns: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json", "**/*.md", "**/*.css", "**/*.rs", "**/*.toml"],
        excludePatterns: ["**/node_modules/**", "**/target/**", "**/dist/**", "**/.git/**"],
      });

      setResults(searchResults);

      // Group by file
      const grouped: GroupedResults = {};
      for (const result of searchResults) {
        if (!grouped[result.filePath]) {
          grouped[result.filePath] = [];
        }
        grouped[result.filePath].push(result);
      }
      setGroupedResults(grouped);

      // Expand all files by default
      setExpandedFiles(new Set(Object.keys(grouped)));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, [query, projectPath, isRegex, caseSensitive]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setGroupedResults({});
      return;
    }

    const timer = setTimeout(() => {
      doSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const openResult = async (result: SearchResult) => {
    try {
      const content = await readFile(result.filePath);
      const name = result.filePath.split("/").pop() || result.filePath;
      const ext = name.split(".").pop() || "";

      openTab({
        id: result.filePath,
        path: result.filePath,
        name,
        content,
        language: getLanguageFromExtension(ext),
        isDirty: false,
      });

      // TODO: Navigate to line number in editor
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const getRelativePath = (filePath: string) => {
    if (!projectPath) return filePath;
    return filePath.replace(projectPath + "/", "");
  };

  const highlightMatch = (text: string, matchStart: number, matchEnd: number) => {
    const before = text.slice(0, matchStart);
    const match = text.slice(matchStart, matchEnd);
    const after = text.slice(matchEnd);

    return (
      <>
        {before}
        <span className="bg-yellow-500/30 text-yellow-200">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 bg-input rounded px-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="flex-1 py-1.5 text-sm bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-0.5 hover:bg-accent rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-2 mt-2 text-xs">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded"
            />
            <span>Aa</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
              className="rounded"
            />
            <span>.*</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isSearching && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Searching...
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No results found
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="text-xs text-muted-foreground mb-2">
              {results.length} results in {Object.keys(groupedResults).length} files
            </div>
          )}

          {Object.entries(groupedResults).map(([filePath, fileResults]) => (
            <div key={filePath} className="mb-1">
              {/* File header */}
              <button
                onClick={() => toggleFile(filePath)}
                className="flex items-center gap-1 w-full text-left py-1 px-1 hover:bg-accent rounded text-sm"
              >
                {expandedFiles.has(filePath) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <File size={14} className="text-muted-foreground" />
                <span className="truncate flex-1">{getRelativePath(filePath)}</span>
                <span className="text-xs text-muted-foreground">
                  {fileResults.length}
                </span>
              </button>

              {/* Results in file */}
              {expandedFiles.has(filePath) && (
                <div className="ml-5 border-l border-border pl-2">
                  {fileResults.map((result, idx) => (
                    <button
                      key={`${result.lineNumber}-${idx}`}
                      onClick={() => openResult(result)}
                      className="block w-full text-left py-0.5 px-1 hover:bg-accent rounded text-xs font-mono truncate"
                    >
                      <span className="text-muted-foreground mr-2">
                        {result.lineNumber}
                      </span>
                      {result.matchStart !== undefined && result.matchEnd !== undefined
                        ? highlightMatch(result.lineContent.trim(), result.matchStart, result.matchEnd)
                        : result.lineContent.trim()
                      }
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
