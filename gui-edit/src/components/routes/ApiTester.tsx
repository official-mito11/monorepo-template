import { useState } from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-500",
  POST: "text-blue-500",
  PUT: "text-yellow-500",
  PATCH: "text-orange-500",
  DELETE: "text-red-500",
  HEAD: "text-purple-500",
  OPTIONS: "text-gray-500",
};

export function ApiTester() {
  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState<string>("http://localhost:8000/");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");

  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const sendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      const requestHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key) {
          requestHeaders[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const endTime = performance.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await res.text();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Request bar */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={cn(
            "px-3 py-2 text-sm font-bold bg-muted rounded border-none outline-none",
            METHOD_COLORS[method]
          )}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} className={METHOD_COLORS[m]}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          className="flex-1 px-3 py-2 text-sm bg-muted rounded border-none outline-none focus:ring-2 focus:ring-primary"
        />

        <Button onClick={sendRequest} disabled={isLoading} className="gap-2">
          <Play size={16} />
          <span>{isLoading ? "Sending..." : "Send"}</span>
        </Button>
      </div>

      {/* Request options */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("headers")}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === "headers"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Headers ({headers.filter((h) => h.enabled).length})
            </button>
            <button
              onClick={() => setActiveTab("body")}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === "body"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Body
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "headers" && (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, "enabled", e.target.checked)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                      placeholder="Header"
                      className="flex-1 px-2 py-1 text-sm bg-muted rounded border-none outline-none"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2 py-1 text-sm bg-muted rounded border-none outline-none"
                    />
                    <button
                      onClick={() => removeHeader(index)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Plus size={14} />
                  <span>Add Header</span>
                </button>
              </div>
            )}

            {activeTab === "body" && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-full min-h-[200px] px-3 py-2 text-sm font-mono bg-muted rounded border-none outline-none resize-none"
              />
            )}
          </div>
        </div>

        {/* Response */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-sm font-medium">Response</span>
            {response && (
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={cn(
                    "font-bold",
                    response.status >= 200 && response.status < 300
                      ? "text-green-500"
                      : response.status >= 400
                      ? "text-red-500"
                      : "text-yellow-500"
                  )}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-muted-foreground">{response.time}ms</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Response headers */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">HEADERS</h4>
                  <div className="text-xs font-mono space-y-1">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-blue-400">{key}:</span>{" "}
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response body */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">BODY</h4>
                  <pre className="p-3 text-xs font-mono bg-muted rounded overflow-auto max-h-[400px]">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(response.body), null, 2);
                      } catch {
                        return response.body;
                      }
                    })()}
                  </pre>
                </div>
              </div>
            )}

            {!response && !error && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Send a request to see the response
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
