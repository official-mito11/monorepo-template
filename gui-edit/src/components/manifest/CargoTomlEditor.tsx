import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { CargoToml, readCargoToml, writeCargoToml } from "@/lib/tauri";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CargoTomlEditorProps {
  path: string;
}

interface DependencyValue {
  version: string;
  features?: string[];
}

type RawDependencyValue = string | { version: string; features?: string[] };

function parseDependency(value: RawDependencyValue): DependencyValue {
  if (typeof value === "string") {
    return { version: value };
  }
  return value;
}

interface DependencyRowProps {
  name: string;
  value: RawDependencyValue;
  onVersionChange: (version: string) => void;
  onFeaturesChange: (features: string[]) => void;
  onRemove: () => void;
}

function DependencyRow({
  name,
  value,
  onVersionChange,
  onFeaturesChange,
  onRemove,
}: DependencyRowProps) {
  const parsed = parseDependency(value);
  const [showFeatures, setShowFeatures] = useState(!!parsed.features?.length);

  return (
    <div className="py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-mono truncate" title={name}>
          {name}
        </span>
        <input
          type="text"
          value={parsed.version}
          onChange={(e) => onVersionChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowFeatures(!showFeatures)}
        >
          Features
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 size={14} />
        </Button>
      </div>
      {showFeatures && (
        <div className="mt-2 pl-4">
          <label className="text-xs text-muted-foreground">
            Features (comma-separated)
          </label>
          <input
            type="text"
            value={(parsed.features || []).join(", ")}
            onChange={(e) =>
              onFeaturesChange(
                e.target.value
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean)
              )
            }
            placeholder="feature1, feature2"
            className="w-full mt-1 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}

interface AddDependencyFormProps {
  onAdd: (name: string, version: string) => void;
  onCancel: () => void;
}

function AddDependencyForm({ onAdd, onCancel }: AddDependencyFormProps) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), version);
      setName("");
      setVersion("1.0");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="crate-name"
        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        autoFocus
      />
      <input
        type="text"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="1.0"
        className="w-24 px-2 py-1 text-xs font-mono rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
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

export function CargoTomlEditor({ path }: CargoTomlEditorProps) {
  const [cargoToml, setCargoToml] = useState<CargoToml | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showAddDep, setShowAddDep] = useState(false);

  const loadCargoToml = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readCargoToml(path);
      setCargoToml(data);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Cargo.toml");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadCargoToml();
  }, [loadCargoToml]);

  const handleSave = async () => {
    if (!cargoToml) return;
    setSaving(true);
    try {
      await writeCargoToml(path, cargoToml);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Cargo.toml");
    } finally {
      setSaving(false);
    }
  };

  const updatePackageField = (field: string, value: string) => {
    if (!cargoToml) return;
    setCargoToml({
      ...cargoToml,
      package: { ...cargoToml.package, [field]: value },
    });
    setIsDirty(true);
  };

  const updateDependency = (
    name: string,
    version: string,
    features?: string[]
  ) => {
    if (!cargoToml) return;
    const deps = { ...cargoToml.dependencies };
    if (features && features.length > 0) {
      deps[name] = { version, features };
    } else {
      deps[name] = version;
    }
    setCargoToml({ ...cargoToml, dependencies: deps });
    setIsDirty(true);
  };

  const removeDependency = (name: string) => {
    if (!cargoToml) return;
    const deps = { ...cargoToml.dependencies };
    delete deps[name];
    setCargoToml({ ...cargoToml, dependencies: deps });
    setIsDirty(true);
  };

  const addDependency = (name: string, version: string) => {
    updateDependency(name, version);
    setShowAddDep(false);
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
            onClick={loadCargoToml}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!cargoToml) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cargo.toml</span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-primary" title="Unsaved changes" />
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={loadCargoToml}
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
          {/* Package Info */}
          <section>
            <h3 className="text-sm font-semibold mb-3">[package]</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    name
                  </label>
                  <input
                    type="text"
                    value={cargoToml.package.name}
                    onChange={(e) => updatePackageField("name", e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    version
                  </label>
                  <input
                    type="text"
                    value={cargoToml.package.version}
                    onChange={(e) => updatePackageField("version", e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  edition
                </label>
                <select
                  value={cargoToml.package.edition || "2021"}
                  onChange={(e) => updatePackageField("edition", e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="2015">2015</option>
                  <option value="2018">2018</option>
                  <option value="2021">2021</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
          </section>

          {/* Dependencies */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">[dependencies]</h3>
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
            <div>
              {Object.entries(cargoToml.dependencies || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, value]) => (
                  <DependencyRow
                    key={name}
                    name={name}
                    value={value}
                    onVersionChange={(version) => {
                      const parsed = parseDependency(value);
                      updateDependency(name, version, parsed.features);
                    }}
                    onFeaturesChange={(features) => {
                      const parsed = parseDependency(value);
                      updateDependency(name, parsed.version, features);
                    }}
                    onRemove={() => removeDependency(name)}
                  />
                ))}
              {showAddDep && (
                <AddDependencyForm
                  onAdd={addDependency}
                  onCancel={() => setShowAddDep(false)}
                />
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
