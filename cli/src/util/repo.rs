use std::path::Path;

use super::walk::walk_files;

pub fn has_repo_nginx_config(root: &Path) -> bool {
    let files = walk_files(root, 5_000);
    files.iter().any(|p| {
        let file_name = p
            .file_name()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        if file_name.ends_with(".conf") && file_name.contains("nginx") {
            return true;
        }

        p.components().any(|c| c.as_os_str().to_string_lossy().to_lowercase() == "nginx")
    })
}

pub fn has_pm2_ecosystem(root: &Path) -> bool {
    let candidates = [
        root.join("ecosystem.config.js"),
        root.join("ecosystem.config.cjs"),
        root.join("ecosystem.config.json"),
        root.join("ecosystem.config.yml"),
        root.join("ecosystem.config.yaml"),
    ];
    candidates.iter().any(|p| p.exists())
}
