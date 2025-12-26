# GUI editor dev guide (files/JSON/SWC routing)

This document is a practical guide for building a GUI editor that can:

- read/write files in a chosen project directory
- read/write JSON safely
- parse/transform TypeScript using SWC
- implement file-based routing (backend and frontend)

The examples focus on **Tauri (Rust backend + web UI)**, but most patterns are generic.

## Project root / CWD handling

In a GUI editor you usually want a "workspace root" selected by the user.

Recommended approach:

- do **NOT** rely on process CWD as the workspace
- store a user-selected `workspaceRoot` path in app state
- resolve all file operations relative to that root

Pseudo-flow:

- user picks folder (native dialog)
- store it in state
- read/write files using `root.join(relative_path)`

## Rust: safe path joining

Always prevent path traversal (e.g. `../../etc/passwd`).

```rust
use std::path::{Component, Path, PathBuf};

fn join_sandboxed(root: &Path, rel: &Path) -> Result<PathBuf, String> {
    if rel.is_absolute() {
        return Err("absolute paths are not allowed".to_string());
    }

    // Reject any ParentDir components to prevent escaping root.
    if rel.components().any(|c| matches!(c, Component::ParentDir)) {
        return Err("parent dir traversal is not allowed".to_string());
    }

    Ok(root.join(rel))
}
```

## Rust: read/write text files

```rust
use std::fs;
use std::path::Path;

fn read_text(path: &Path) -> Result<String, std::io::Error> {
    fs::read_to_string(path)
}

fn write_text(path: &Path, content: &str) -> Result<(), std::io::Error> {
    fs::write(path, content)
}
```

## Rust: read/write JSON (serde_json)

Prefer typed structs for known JSON formats.

```rust
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

#[derive(Debug, Serialize, Deserialize)]
struct Settings {
    theme: String,
    last_opened: Option<String>,
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, std::io::Error> {
    let s = fs::read_to_string(path)?;
    let v = serde_json::from_str(&s)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
    Ok(v)
}

fn write_json<T: Serialize>(path: &Path, value: &T) -> Result<(), std::io::Error> {
    let s = serde_json::to_string_pretty(value)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
    fs::write(path, s)
}
```

If the JSON schema is not fixed, use `serde_json::Value`:

```rust
fn read_json_value(path: &Path) -> Result<serde_json::Value, std::io::Error> {
    let s = std::fs::read_to_string(path)?;
    let v = serde_json::from_str(&s)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
    Ok(v)
}
```

## Tauri command pattern (Rust -> UI)

Tauri commands are just functions you expose to the frontend.

```rust
#[tauri::command]
fn read_file(root: String, rel: String) -> Result<String, String> {
    let root = std::path::PathBuf::from(root);
    let rel = std::path::PathBuf::from(rel);

    let path = join_sandboxed(&root, &rel)?;
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

Frontend usage:

```ts
import { invoke } from "@tauri-apps/api/core";

const content = await invoke<string>("read_file", {
  root: workspaceRoot,
  rel: "apps/be/src/index.ts",
});
```

## SWC: parse TypeScript / TSX

Use SWC to parse TS without running the TypeScript compiler.

Core steps:

- create a `SourceMap`
- create a `SourceFile`
- configure syntax as `Typescript` and optionally `tsx: true`
- parse into `Module`

```rust
use swc_common::{sync::Lrc, FileName, SourceMap};
use swc_ecma_ast::Module;
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax, TsSyntax};

fn parse_ts(source: &str, is_tsx: bool) -> Result<Module, String> {
    let cm: Lrc<SourceMap> = Default::default();
    let fm = cm.new_source_file(FileName::Custom("input.ts".into()), source.into());

    let syntax = Syntax::Typescript(TsSyntax {
        tsx: is_tsx,
        decorators: true,
        dts: false,
        no_early_errors: false,
        disallow_ambiguous_jsx_like: false,
    });

    let lexer = Lexer::new(
        syntax,
        Default::default(),
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);
    parser
        .parse_module()
        .map_err(|e| format!("parse error: {e:?}"))
}
```

### SWC: minimal AST inspection example

Example: list exported identifiers (naive).

```rust
use swc_ecma_ast::{Module, ModuleItem, ModuleDecl, Decl, ExportDecl, Pat};

fn list_exports(m: &Module) -> Vec<String> {
    let mut out = Vec::new();

    for item in &m.body {
        let ModuleItem::ModuleDecl(decl) = item else { continue };

        match decl {
            ModuleDecl::ExportDecl(ExportDecl { decl, .. }) => {
                if let Decl::Var(v) = decl {
                    for d in &v.decls {
                        if let Pat::Ident(i) = &d.name {
                            out.push(i.id.sym.to_string());
                        }
                    }
                }
            }
            _ => {}
        }
    }

    out
}
```

## File-based routing (BE/FE) – shared concept

A practical file-based routing system typically needs:

- **scan** a directory tree
- **map** file paths to route paths
- support **index routes** (`index.ts` => `/` or `/segment`)
- support **param routes** (`[id].ts` => `:id`)
- ignore private files (`_loader.ts`, `_middleware.ts`)

### Route mapping rules (recommended)

- `index` => empty segment
- `[param]` => `:param`
- `_name` => ignored file/dir

Example mapping:

- `routes/index.ts` => `/`
- `routes/health.ts` => `/health`
- `routes/users/index.ts` => `/users`
- `routes/users/[id].ts` => `/users/:id`

### Build a route manifest (JSON)

Instead of dynamic imports everywhere, many editors generate a manifest:

```json
{
  "routes": [
    { "file": "apps/be/src/routes/health.ts", "path": "/health", "method": "get" },
    { "file": "apps/be/src/routes/users/[id].ts", "path": "/users/:id", "method": "get" }
  ]
}
```

Then the runtime loads from the manifest.

### How SWC helps with routing

For BE/FE file-based routing, SWC is useful for:

- extracting `export const method = "get"`
- extracting `export const handler = ...` existence
- extracting metadata for docs
- auto-refactoring file names / exports

A simple approach:

- parse TS file via SWC
- search for `ExportDecl` of `method` and string literal initializer

## Notes for BE/FE handling in an editor

- **Backend (Elysia)**: route file exports are runtime evaluated.
  - your editor can validate shape (has `handler`, valid `method`)
  - your runtime loader can remain simple

- **Frontend (React/Vite)**: file-based routing often needs build-time tooling.
  - you can generate a route manifest and feed it to your router
  - or implement a Vite plugin (later)

## Recommended next steps

- Implement workspace selection and sandboxed path operations
- Add JSON helpers for editor settings
- Add SWC parsing utilities (parse, inspect exports)
- Add a route tree scanner + route manifest generator
