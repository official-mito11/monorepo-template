use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RouteAnalysis {
    pub file_path: String,
    pub url_path: String,
    pub method: String,
    pub has_handler: bool,
    pub has_options: bool,
    pub options: Option<RouteOptions>,
    pub exports: Vec<ExportInfo>,
    pub errors: Vec<ParseError>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RouteOptions {
    pub tags: Option<Vec<String>>,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub request_schema: Option<String>,
    pub response_schemas: Vec<ResponseSchema>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResponseSchema {
    pub status_code: i32,
    pub schema: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExportInfo {
    pub name: String,
    pub kind: String,
    pub value_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ParseError {
    pub message: String,
    pub line: Option<usize>,
    pub column: Option<usize>,
}

/// HTTP method names that indicate a route handler
const HTTP_METHODS: &[&str] = &["get", "post", "put", "patch", "delete", "head", "options"];

/// Converts file path to URL path
/// e.g., /routes/users/[id].ts -> /users/:id
fn file_path_to_url_path(file_path: &str, routes_dir: &str) -> String {
    let path = Path::new(file_path);

    // Get relative path from routes directory
    let relative = path
        .strip_prefix(routes_dir)
        .unwrap_or(path)
        .to_string_lossy();

    // Remove extension
    let without_ext = relative
        .strip_suffix(".ts")
        .or_else(|| relative.strip_suffix(".tsx"))
        .unwrap_or(&relative);

    // Convert to URL path
    let mut url_path = String::from("/");

    for segment in without_ext.split('/').filter(|s| !s.is_empty()) {
        // Skip index files
        if segment == "index" {
            continue;
        }

        // Convert [param] to :param
        if segment.starts_with('[') && segment.ends_with(']') {
            let param = &segment[1..segment.len() - 1];
            // Handle [...slug] -> *slug (catch-all)
            if param.starts_with("...") {
                url_path.push('*');
                url_path.push_str(&param[3..]);
            } else {
                url_path.push(':');
                url_path.push_str(param);
            }
        } else {
            url_path.push_str(segment);
        }

        url_path.push('/');
    }

    // Remove trailing slash except for root
    if url_path.len() > 1 && url_path.ends_with('/') {
        url_path.pop();
    }

    url_path
}

/// Analyzes a TypeScript route file and extracts route information using regex
pub fn analyze_route_file(file_path: &str, routes_dir: &str) -> RouteAnalysis {
    let mut analysis = RouteAnalysis {
        file_path: file_path.to_string(),
        url_path: file_path_to_url_path(file_path, routes_dir),
        method: String::new(),
        has_handler: false,
        has_options: false,
        options: None,
        exports: Vec::new(),
        errors: Vec::new(),
    };

    // Read file content
    let content = match std::fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(e) => {
            analysis.errors.push(ParseError {
                message: format!("Failed to read file: {}", e),
                line: None,
                column: None,
            });
            return analysis;
        }
    };

    // Regex patterns for exports
    // Match: export const get = ...
    let export_const_re =
        Regex::new(r"export\s+const\s+(\w+)\s*[=:]").expect("Invalid regex");

    // Match: export function get(...) or export async function get(...)
    let export_fn_re =
        Regex::new(r"export\s+(?:async\s+)?function\s+(\w+)\s*\(").expect("Invalid regex");

    // Match: export default
    let export_default_re = Regex::new(r"export\s+default\s+").expect("Invalid regex");

    // Match: export { ... }
    let export_named_re = Regex::new(r"export\s*\{\s*([^}]+)\s*\}").expect("Invalid regex");

    // Analyze export const
    for cap in export_const_re.captures_iter(&content) {
        let name = cap.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
        let name_lower = name.to_lowercase();

        if HTTP_METHODS.contains(&name_lower.as_str()) {
            analysis.method = name_lower.to_uppercase();
            analysis.has_handler = true;
            analysis.exports.push(ExportInfo {
                name,
                kind: "variable".to_string(),
                value_type: Some("handler".to_string()),
            });
        } else if name == "options" {
            analysis.has_options = true;
            analysis.exports.push(ExportInfo {
                name,
                kind: "variable".to_string(),
                value_type: Some("options".to_string()),
            });
        } else if name == "handler" {
            analysis.has_handler = true;
            if analysis.method.is_empty() {
                analysis.method = "GET".to_string();
            }
            analysis.exports.push(ExportInfo {
                name,
                kind: "variable".to_string(),
                value_type: Some("handler".to_string()),
            });
        } else {
            analysis.exports.push(ExportInfo {
                name,
                kind: "variable".to_string(),
                value_type: None,
            });
        }
    }

    // Analyze export function
    for cap in export_fn_re.captures_iter(&content) {
        let name = cap.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
        let name_lower = name.to_lowercase();

        if HTTP_METHODS.contains(&name_lower.as_str()) {
            analysis.method = name_lower.to_uppercase();
            analysis.has_handler = true;
        } else if name == "handler" {
            analysis.has_handler = true;
            if analysis.method.is_empty() {
                analysis.method = "GET".to_string();
            }
        }

        analysis.exports.push(ExportInfo {
            name,
            kind: "function".to_string(),
            value_type: Some("handler".to_string()),
        });
    }

    // Check for default export
    if export_default_re.is_match(&content) {
        analysis.exports.push(ExportInfo {
            name: "default".to_string(),
            kind: "default".to_string(),
            value_type: None,
        });

        // If there's a default export and no method found, assume it's a GET handler
        if !analysis.has_handler {
            analysis.has_handler = true;
            if analysis.method.is_empty() {
                analysis.method = "GET".to_string();
            }
        }
    }

    // Handle named exports (export { get, post, ... })
    for cap in export_named_re.captures_iter(&content) {
        if let Some(exports_str) = cap.get(1) {
            for export_name in exports_str.as_str().split(',') {
                let name = export_name.split(" as ").next().unwrap_or("").trim().to_string();
                if name.is_empty() {
                    continue;
                }

                let name_lower = name.to_lowercase();
                if HTTP_METHODS.contains(&name_lower.as_str()) {
                    analysis.method = name_lower.to_uppercase();
                    analysis.has_handler = true;
                    analysis.exports.push(ExportInfo {
                        name,
                        kind: "named".to_string(),
                        value_type: Some("handler".to_string()),
                    });
                } else if name == "options" {
                    analysis.has_options = true;
                    analysis.exports.push(ExportInfo {
                        name,
                        kind: "named".to_string(),
                        value_type: Some("options".to_string()),
                    });
                }
            }
        }
    }

    analysis
}

/// Analyzes all route files in a directory
pub fn analyze_routes_directory(routes_dir: &str) -> Vec<RouteAnalysis> {
    let mut analyses = Vec::new();
    let routes_path = Path::new(routes_dir);

    if !routes_path.exists() || !routes_path.is_dir() {
        return analyses;
    }

    fn collect_files(dir: &Path, files: &mut Vec<String>) {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();

                // Skip hidden files and directories
                if path
                    .file_name()
                    .map(|n| n.to_string_lossy().starts_with('.'))
                    .unwrap_or(false)
                {
                    continue;
                }

                // Skip middleware files
                if path
                    .file_name()
                    .map(|n| n.to_string_lossy().starts_with('_'))
                    .unwrap_or(false)
                {
                    continue;
                }

                if path.is_dir() {
                    collect_files(&path, files);
                } else if path
                    .extension()
                    .map(|e| e == "ts" || e == "tsx")
                    .unwrap_or(false)
                {
                    files.push(path.to_string_lossy().to_string());
                }
            }
        }
    }

    let mut files = Vec::new();
    collect_files(routes_path, &mut files);

    for file in files {
        analyses.push(analyze_route_file(&file, routes_dir));
    }

    // Sort by URL path
    analyses.sort_by(|a, b| a.url_path.cmp(&b.url_path));

    analyses
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_path_to_url_path() {
        assert_eq!(file_path_to_url_path("/routes/index.ts", "/routes"), "/");
        assert_eq!(
            file_path_to_url_path("/routes/users.ts", "/routes"),
            "/users"
        );
        assert_eq!(
            file_path_to_url_path("/routes/users/index.ts", "/routes"),
            "/users"
        );
        assert_eq!(
            file_path_to_url_path("/routes/users/[id].ts", "/routes"),
            "/users/:id"
        );
        assert_eq!(
            file_path_to_url_path("/routes/posts/[...slug].ts", "/routes"),
            "/posts/*slug"
        );
    }
}
