use serde::{Deserialize, Serialize};
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

/// Wrapper for io::Error that implements serde Serialize/Deserialize
#[derive(Debug, Serialize, Deserialize)]
pub struct IoErrorWrapper(pub String);

impl fmt::Display for IoErrorWrapper {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for IoErrorWrapper {}

#[derive(Debug, Error, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FsError {
    #[error("Path does not exist: {path}")]
    NotFound { path: String },

    #[error("Path is not a directory: {path}")]
    NotADirectory { path: String },

    #[error("Path is not a file: {path}")]
    NotAFile { path: String },

    #[error("Access denied: path '{path}' is outside the allowed project directory")]
    AccessDenied { path: String },

    #[error("File already exists: {path}")]
    FileExists { path: String },

    #[error("Directory already exists: {path}")]
    DirectoryExists { path: String },

    #[error("Failed to read directory: {source}")]
    ReadDirError { source: IoErrorWrapper },

    #[error("Failed to read file: {source}")]
    ReadFileError { source: IoErrorWrapper },

    #[error("Failed to write file: {source}")]
    WriteFileError { source: IoErrorWrapper },

    #[error("Failed to create directory: {source}")]
    CreateDirError { source: IoErrorWrapper },

    #[error("Failed to delete path: {source}")]
    DeleteError { source: IoErrorWrapper },

    #[error("Failed to rename: {source}")]
    RenameError { source: IoErrorWrapper },
}

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

/// Validates that the path is within the allowed project root.
/// Returns the canonicalized path on success, or an FsError on failure.
fn validate_path(path: &str, project_root: Option<&Path>) -> Result<PathBuf, FsError> {
    let canonical = PathBuf::from(path)
        .canonicalize()
        .map_err(|_| FsError::NotFound {
            path: path.to_string(),
        })?;

    if let Some(root) = project_root {
        let root = root.canonicalize().map_err(|_| FsError::NotFound {
            path: root.to_string_lossy().to_string(),
        })?;

        if !canonical.starts_with(&root) {
            return Err(FsError::AccessDenied {
                path: path.to_string(),
            });
        }
    }

    Ok(canonical)
}

fn create_file_node(entry: &std::fs::DirEntry, _project_root: &Path) -> Option<FileNode> {
    let name = entry.file_name().to_string_lossy().to_string();

    // Skip hidden files (except .env.example)
    if name.starts_with('.') && name != ".env.example" {
        return None;
    }

    let path = entry.path();
    let is_dir = path.is_dir();

    // Skip ignored directories
    if is_dir && should_ignore(&name) {
        return None;
    }

    let extension = if !is_dir {
        path.extension().map(|e| e.to_string_lossy().to_string())
    } else {
        None
    };

    Some(FileNode {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        children: None, // Lazy loading - children are loaded on demand
        extension,
    })
}

#[tauri::command]
pub fn read_directory(
    path: String,
    project_root: Option<String>,
) -> Result<Vec<FileNode>, FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    if !canonical.exists() {
        return Err(FsError::NotFound { path });
    }

    if !canonical.is_dir() {
        return Err(FsError::NotADirectory { path });
    }

    let mut entries: Vec<FileNode> = Vec::new();

    let read_dir = fs::read_dir(&canonical).map_err(|e| FsError::ReadDirError {
        source: IoErrorWrapper(e.to_string()),
    })?;

    for entry in read_dir.flatten() {
        if let Some(node) = create_file_node(&entry, &canonical) {
            entries.push(node);
        }
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
pub fn read_file(path: String, project_root: Option<String>) -> Result<String, FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    if !canonical.exists() {
        return Err(FsError::NotFound { path });
    }

    if !canonical.is_file() {
        return Err(FsError::NotAFile { path });
    }

    fs::read_to_string(&canonical).map_err(|e| FsError::ReadFileError {
        source: IoErrorWrapper(e.to_string()),
    })
}

#[tauri::command]
pub fn write_file(
    path: String,
    content: String,
    project_root: Option<String>,
) -> Result<(), FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    // Create parent directories if they don't exist
    if let Some(parent) = canonical.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| FsError::CreateDirError {
                source: IoErrorWrapper(e.to_string()),
            })?;
        }
    }

    fs::write(&canonical, content).map_err(|e| FsError::WriteFileError {
        source: IoErrorWrapper(e.to_string()),
    })
}

#[tauri::command]
pub fn create_file(
    path: String,
    content: Option<String>,
    project_root: Option<String>,
) -> Result<(), FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    if canonical.exists() {
        return Err(FsError::FileExists { path });
    }

    // Create parent directories if they don't exist
    if let Some(parent) = canonical.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| FsError::CreateDirError {
                source: IoErrorWrapper(e.to_string()),
            })?;
        }
    }

    let content = content.unwrap_or_default();
    fs::write(&canonical, content).map_err(|e| FsError::WriteFileError {
        source: IoErrorWrapper(e.to_string()),
    })
}

#[tauri::command]
pub fn create_directory(path: String, project_root: Option<String>) -> Result<(), FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    if canonical.exists() {
        return Err(FsError::DirectoryExists { path });
    }

    fs::create_dir_all(&canonical).map_err(|e| FsError::CreateDirError {
        source: IoErrorWrapper(e.to_string()),
    })
}

#[tauri::command]
pub fn delete_path(path: String, project_root: Option<String>) -> Result<(), FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical = validate_path(&path, root)?;

    if !canonical.exists() {
        return Err(FsError::NotFound { path });
    }

    if canonical.is_dir() {
        fs::remove_dir_all(&canonical).map_err(|e| FsError::DeleteError {
            source: IoErrorWrapper(e.to_string()),
        })
    } else {
        fs::remove_file(&canonical).map_err(|e| FsError::DeleteError {
            source: IoErrorWrapper(e.to_string()),
        })
    }
}

#[tauri::command]
pub fn rename_path(
    old_path: String,
    new_path: String,
    project_root: Option<String>,
) -> Result<(), FsError> {
    let root = project_root.as_deref().map(Path::new);
    let canonical_old = validate_path(&old_path, root)?;
    let canonical_new = validate_path(&new_path, root)?;

    if !canonical_old.exists() {
        return Err(FsError::NotFound { path: old_path });
    }

    if canonical_new.exists() {
        return Err(FsError::FileExists { path: new_path });
    }

    fs::rename(&canonical_old, &canonical_new).map_err(|e| FsError::RenameError {
        source: IoErrorWrapper(e.to_string()),
    })
}
