use crate::report::{finding, Finding, Status};
use std::path::Path;

pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();

    let be_dist = root.join("apps/be/dist/index.js");
    out.push(path_exists(
        "build.be_dist",
        "Backend build output exists (apps/be/dist/index.js)",
        &be_dist,
        Status::Warn,
    ));

    let fe_dist = root.join("apps/fe/dist");
    out.push(dir_exists(
        "build.fe_dist",
        "Frontend build output exists (apps/fe/dist)",
        &fe_dist,
        Status::Warn,
    ));

    out
}

fn path_exists(id: &str, title: &str, p: &Path, missing_status: Status) -> Finding {
    if p.exists() {
        let mut f = finding(id, title, Status::Ok, "Found");
        f.meta
            .insert("path".to_string(), p.to_string_lossy().to_string());
        f
    } else {
        let mut f = finding(id, title, missing_status, "Not found");
        f.meta
            .insert("path".to_string(), p.to_string_lossy().to_string());
        f
    }
}

fn dir_exists(id: &str, title: &str, p: &Path, missing_status: Status) -> Finding {
    if p.is_dir() {
        let mut f = finding(id, title, Status::Ok, "Found");
        f.meta
            .insert("path".to_string(), p.to_string_lossy().to_string());
        f
    } else {
        let mut f = finding(id, title, missing_status, "Not found");
        f.meta
            .insert("path".to_string(), p.to_string_lossy().to_string());
        f
    }
}
