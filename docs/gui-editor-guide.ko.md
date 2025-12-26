# GUI editor 개발 가이드 (파일/JSON/SWC 라우팅)

이 문서는 GUI 에디터를 만들 때 자주 필요한 기능을 빠르게 구현할 수 있도록 정리한 실전 가이드입니다.

- 선택한 프로젝트 디렉터리에서 파일 읽기/쓰기
- JSON 읽기/쓰기
- SWC로 TypeScript 파싱/변환
- 파일 기반 라우팅 구현(백엔드/프론트 공통 개념)

예시는 **Tauri(Rust 백엔드 + Web UI)** 기준이지만, 핵심 패턴은 범용입니다.

## 프로젝트 루트 / CWD 처리

GUI 에디터에서는 보통 "워크스페이스 루트"를 유저가 선택합니다.

권장 방식:

- 프로세스 CWD에 의존하지 말고
- 유저가 선택한 `workspaceRoot`를 상태로 저장하고
- 모든 파일 I/O를 그 루트 기준으로 상대 경로로 처리

흐름 예시:

- 폴더 선택(native dialog)
- 상태에 저장
- `root.join(relative_path)`로 파일 접근

## Rust: 안전한 경로 join

`../../etc/passwd` 같은 경로 탈출(path traversal)을 막아야 합니다.

```rust
use std::path::{Component, Path, PathBuf};

fn join_sandboxed(root: &Path, rel: &Path) -> Result<PathBuf, String> {
    if rel.is_absolute() {
        return Err("절대 경로는 허용되지 않습니다".to_string());
    }

    // ParentDir(..)가 있으면 루트를 탈출할 수 있으므로 차단
    if rel.components().any(|c| matches!(c, Component::ParentDir)) {
        return Err("상위 디렉터리(..) 이동은 허용되지 않습니다".to_string());
    }

    Ok(root.join(rel))
}
```

## Rust: 텍스트 파일 읽기/쓰기

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

## Rust: JSON 읽기/쓰기 (serde_json)

스키마가 고정된 JSON은 struct로 처리하는 게 안전합니다.

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

스키마가 유동적이면 `serde_json::Value`를 사용합니다.

```rust
fn read_json_value(path: &Path) -> Result<serde_json::Value, std::io::Error> {
    let s = std::fs::read_to_string(path)?;
    let v = serde_json::from_str(&s)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
    Ok(v)
}
```

## Tauri command 패턴 (Rust -> UI)

Tauri command는 프론트에서 `invoke()`로 호출할 수 있는 Rust 함수입니다.

```rust
#[tauri::command]
fn read_file(root: String, rel: String) -> Result<String, String> {
    let root = std::path::PathBuf::from(root);
    let rel = std::path::PathBuf::from(rel);

    let path = join_sandboxed(&root, &rel)?;
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

프론트 호출 예시:

```ts
import { invoke } from "@tauri-apps/api/core";

const content = await invoke<string>("read_file", {
  root: workspaceRoot,
  rel: "apps/be/src/index.ts",
});
```

## SWC: TypeScript / TSX 파싱

SWC를 사용하면 TypeScript 컴파일러 없이도 TS를 빠르게 파싱할 수 있습니다.

핵심 단계:

- `SourceMap` 생성
- `SourceFile` 생성
- `Syntax::Typescript` 설정(필요 시 `tsx: true`)
- `Module` AST로 파싱

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

### SWC: 최소 AST 분석 예시

예시: export 된 식별자 이름을 수집(단순 버전)

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

## 파일 기반 라우팅(BE/FE) – 공통 개념

파일 기반 라우팅을 만들 때 보통 필요한 것:

- 디렉터리 트리 **스캔**
- 파일 경로를 URL 경로로 **매핑**
- `index` 라우트 처리(`index.ts` => `/` 또는 `/segment`)
- 파라미터 라우트 처리(`[id].ts` => `:id`)
- private 파일 무시(`_loader.ts`, `_middleware.ts`)

### 라우트 매핑 규칙(권장)

- `index` => 빈 segment
- `[param]` => `:param`
- `_name` => 무시(file/dir)

매핑 예시:

- `routes/index.ts` => `/`
- `routes/health.ts` => `/health`
- `routes/users/index.ts` => `/users`
- `routes/users/[id].ts` => `/users/:id`

### 라우트 매니페스트(JSON) 생성

에디터에서 동적 import를 과도하게 쓰는 대신, 매니페스트를 만들어 두면 관리가 쉬워집니다.

```json
{
  "routes": [
    { "file": "apps/be/src/routes/health.ts", "path": "/health", "method": "get" },
    { "file": "apps/be/src/routes/users/[id].ts", "path": "/users/:id", "method": "get" }
  ]
}
```

런타임은 이 매니페스트를 읽어서 로드하도록 구성할 수 있습니다.

### SWC가 라우팅에 도움 되는 지점

BE/FE 파일 기반 라우팅에서 SWC는 아래에 유용합니다.

- `export const method = "get"` 같은 스펙 추출
- `export const handler = ...` 존재 여부 검증
- 문서/도구용 메타데이터 생성
- 파일명/exports 자동 리팩터링 지원

간단한 전략:

- SWC로 TS 파싱
- `ExportDecl`에서 `method` 변수 선언 + string literal initializer 찾기

## 에디터에서 BE/FE를 다룰 때 팁

- **Backend(Elysia)**: 라우트 파일이 런타임 평가됩니다.
  - 에디터는 shape 검증(핸들러 존재, method 유효)만 해도 생산성이 큼

- **Frontend(React/Vite)**: 라우팅은 보통 빌드 타임 도구가 필요합니다.
  - 매니페스트 생성 후 라우터에 주입
  - 또는 Vite 플러그인으로 확장(추후)

## 추천 진행 순서

- 워크스페이스 선택 + sandbox path join
- settings JSON helpers
- SWC parsing utilities(parse, export 추출)
- route tree scanner + manifest generator
