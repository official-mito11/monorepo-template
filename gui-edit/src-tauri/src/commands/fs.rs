use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extension: Option<String>,
}

fn should_ignore(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | ".git"
            | "target"
            | "dist"
            | ".next"
            | ".turbo"
            | ".cache"
            | ".output"
            | ".nuxt"
    )
}

#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }

    let mut entries: Vec<FileNode> = Vec::new();

    let read_dir = fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        let name = entry
            .file_name()
            .to_string_lossy()
            .to_string();

        // Skip hidden files and ignored directories
        if name.starts_with('.') && name != ".env.example" {
            continue;
        }

        let is_dir = entry_path.is_dir();

        if is_dir && should_ignore(&name) {
            continue;
        }

        let extension = if !is_dir {
            entry_path
                .extension()
                .map(|e| e.to_string_lossy().to_string())
        } else {
            None
        };

        entries.push(FileNode {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            children: None, // Lazy loading - children are loaded on demand
            extension,
        });
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    let path = Path::new(&path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", path.display()));
    }

    if !path.is_file() {
        return Err(format!("Path is not a file: {}", path.display()));
    }

    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    let path = Path::new(&path);

    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directories: {}", e))?;
        }
    }

    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn create_file(path: String, content: Option<String>) -> Result<(), String> {
    let path = Path::new(&path);

    if path.exists() {
        return Err(format!("File already exists: {}", path.display()));
    }

    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directories: {}", e))?;
        }
    }

    let content = content.unwrap_or_default();
    fs::write(path, content).map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let path = Path::new(&path);

    if path.exists() {
        return Err(format!("Directory already exists: {}", path.display()));
    }

    fs::create_dir_all(path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub fn delete_path(path: String) -> Result<(), String> {
    let path = Path::new(&path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    let old_path = Path::new(&old_path);
    let new_path = Path::new(&new_path);

    if !old_path.exists() {
        return Err(format!("Source path does not exist: {}", old_path.display()));
    }

    if new_path.exists() {
        return Err(format!("Target path already exists: {}", new_path.display()));
    }

    fs::rename(old_path, new_path).map_err(|e| format!("Failed to rename: {}", e))
}
