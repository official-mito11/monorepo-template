use std::fs;
use std::path::{Path, PathBuf};

pub fn walk_files(root: &Path, max_files: usize) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];

    while let Some(dir) = stack.pop() {
        if out.len() >= max_files {
            break;
        }

        let entries = match fs::read_dir(&dir) {
            Ok(v) => v,
            Err(_) => continue,
        };

        for e in entries.flatten() {
            if out.len() >= max_files {
                break;
            }
            let path = e.path();
            let name = e.file_name();
            let name = name.to_string_lossy();

            if name == "node_modules" || name == "target" || name == ".git" {
                continue;
            }

            if path.is_dir() {
                stack.push(path);
            } else {
                out.push(path);
            }
        }
    }

    out
}
