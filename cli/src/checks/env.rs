use crate::report::{finding, Finding, Status};
use crate::util::env::missing_env_keys;
use std::fs;
use std::path::Path;

pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();

    let env_example = root.join("apps/be/.env.example");
    let env_file = root.join("apps/be/.env");

    out.push(path_exists(
        "env.be_example",
        "Backend env example exists (apps/be/.env.example)",
        &env_example,
        Status::Fail,
    ));

    out.push(path_exists(
        "env.be",
        "Backend env file exists (apps/be/.env)",
        &env_file,
        Status::Warn,
    ));

    if env_example.exists() && env_file.exists() {
        let example = fs::read_to_string(&env_example).unwrap_or_default();
        let actual = fs::read_to_string(&env_file).unwrap_or_default();
        let missing = missing_env_keys(&example, &actual);

        if missing.is_empty() {
            out.push(finding(
                "env.required_keys",
                "Backend .env contains all keys from .env.example",
                Status::Ok,
                "No missing keys",
            ));
        } else {
            let mut f = finding(
                "env.required_keys",
                "Backend .env contains all keys from .env.example",
                Status::Warn,
                format!("Missing keys: {}", missing.join(", ")),
            );
            f.meta
                .insert("count".to_string(), missing.len().to_string());
            out.push(f);
        }
    }

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
