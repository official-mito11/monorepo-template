import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { PackageJson, readPackageJson, writePackageJson } from "@/lib/tauri";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageJsonEditorProps {
  path: string;
}

interface DependencyRowProps {
  name: string;
  version: string;
  onVersionChange: (version: string) => void;
  onRemove: () => void;
}

function DependencyRow({ name, version, onVersionChange, onRemove }: DependencyRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 text-sm font-mono truncate" title={name}>
        {name}
      </span>
      <input
        type="text"
        value={version}
        onChange={(e) => onVersionChange(e.target.value)}
        className="w-32 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

interface AddDependencyFormProps {
  onAdd: (name: string, version: string) => void;
  onCancel: () => void;
}

function AddDependencyForm({ onAdd, onCancel }: AddDependencyFormProps) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("^1.0.0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), version);
      setName("");
      setVersion("^1.0.0");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="package-name"
        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        autoFocus
      />
      <input
        type="text"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="^1.0.0"
        className="w-32 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button type="submit" variant="ghost" size="sm" className="h-7 px-2">
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </form>
  );
}

interface ScriptRowProps {
  name: string;
  command: string;
  onCommandChange: (command: string) => void;
  onRemove: () => void;
}

function ScriptRow({ name, command, onCommandChange, onRemove }: ScriptRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-24 text-sm font-medium truncate" title={name}>
        {name}
      </span>
      <input
        type="text"
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function PackageJsonEditor({ path }: PackageJsonEditorProps) {
  const [packageJson, setPackageJson] = useState<PackageJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showAddDep, setShowAddDep] = useState(false);
  const [showAddDevDep, setShowAddDevDep] = useState(false);
  const [showAddScript, setShowAddScript] = useState(false);

  const loadPackageJson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readPackageJson(path);
      setPackageJson(data);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load package.json");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadPackageJson();
  }, [loadPackageJson]);

  const handleSave = async () => {
    if (!packageJson) return;
    setSaving(true);
    try {
      await writePackageJson(path, packageJson);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save package.json");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PackageJson, value: unknown) => {
    if (!packageJson) return;
    setPackageJson({ ...packageJson, [field]: value });
    setIsDirty(true);
  };

  const updateDependency = (isDev: boolean, name: string, version: string) => {
    if (!packageJson) return;
    const field = isDev ? "devDependencies" : "dependencies";
    const deps = { ...packageJson[field], [name]: version };
    updateField(field, deps);
  };

  const removeDependency = (isDev: boolean, name: string) => {
    if (!packageJson) return;
    const field = isDev ? "devDependencies" : "dependencies";
    const deps = { ...packageJson[field] };
    delete deps[name];
    updateField(field, deps);
  };

  const addDependency = (isDev: boolean, name: string, version: string) => {
    updateDependency(isDev, name, version);
    if (isDev) {
      setShowAddDevDep(false);
    } else {
      setShowAddDep(false);
    }
  };

  const updateScript = (name: string, command: string) => {
    if (!packageJson) return;
    const scripts = { ...packageJson.scripts, [name]: command };
    updateField("scripts", scripts);
  };

  const removeScript = (name: string) => {
    if (!packageJson) return;
    const scripts = { ...packageJson.scripts };
    delete scripts[name];
    updateField("scripts", scripts);
  };

  const addScript = (name: string, command: string) => {
    updateScript(name, command);
    setShowAddScript(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={loadPackageJson}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!packageJson) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">package.json</span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-primary" title="Unsaved changes" />
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={loadPackageJson}
            title="Reload"
          >
            <RefreshCw size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleSave}
            disabled={!isDirty || saving}
            title="Save"
          >
            <Save size={14} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Basic Info</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    value={packageJson.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Version
                  </label>
                  <input
                    type="text"
                    value={packageJson.version}
                    onChange={(e) => updateField("version", e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Scripts */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Scripts</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowAddScript(true)}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {Object.entries(packageJson.scripts || {}).map(([name, command]) => (
                <ScriptRow
                  key={name}
                  name={name}
                  command={command}
                  onCommandChange={(cmd) => updateScript(name, cmd)}
                  onRemove={() => removeScript(name)}
                />
              ))}
              {showAddScript && (
                <AddDependencyForm
                  onAdd={addScript}
                  onCancel={() => setShowAddScript(false)}
                />
              )}
            </div>
          </section>

          {/* Dependencies */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Dependencies</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowAddDep(true)}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {Object.entries(packageJson.dependencies || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, version]) => (
                  <DependencyRow
                    key={name}
                    name={name}
                    version={version}
                    onVersionChange={(v) => updateDependency(false, name, v)}
                    onRemove={() => removeDependency(false, name)}
                  />
                ))}
              {showAddDep && (
                <AddDependencyForm
                  onAdd={(name, version) => addDependency(false, name, version)}
                  onCancel={() => setShowAddDep(false)}
                />
              )}
            </div>
          </section>

          {/* Dev Dependencies */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Dev Dependencies</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowAddDevDep(true)}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {Object.entries(packageJson.devDependencies || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, version]) => (
                  <DependencyRow
                    key={name}
                    name={name}
                    version={version}
                    onVersionChange={(v) => updateDependency(true, name, v)}
                    onRemove={() => removeDependency(true, name)}
                  />
                ))}
              {showAddDevDep && (
                <AddDependencyForm
                  onAdd={(name, version) => addDependency(true, name, version)}
                  onCancel={() => setShowAddDevDep(false)}
                />
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
