use crate::report::{finding, Finding, Status};
use crate::util::command::command_exists;
use crate::util::repo::has_repo_nginx_config;
use std::path::Path;

pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();

    let exists = command_exists("nginx");
    out.push(finding(
        "nginx.command",
        "nginx is available in PATH",
        if exists { Status::Ok } else { Status::Warn },
        if exists {
            "nginx command found"
        } else {
            "nginx command not found (install via apt/brew or ensure PATH is set)"
        },
    ));

    let has_cfg = has_repo_nginx_config(root);
    out.push(finding(
        "nginx.config_repo",
        "nginx config exists in repo",
        if has_cfg { Status::Ok } else { Status::Warn },
        if has_cfg {
            "Found nginx-related config file(s)"
        } else {
            "No nginx config detected (consider adding an nginx/ folder or *.conf)"
        },
    ));

    out
}
