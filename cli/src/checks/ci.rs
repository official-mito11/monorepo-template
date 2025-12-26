use crate::report::{finding, Finding, Status};
use std::path::Path;

pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();

    let ci = root.join(".github/workflows/ci.yml");
    out.push(path_exists(
        "ci.workflow",
        "GitHub Actions workflow exists (.github/workflows/ci.yml)",
        &ci,
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
