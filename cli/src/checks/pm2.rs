use crate::report::{finding, Finding, Status};
use crate::util::command::command_exists;
use crate::util::repo::has_pm2_ecosystem;
use std::path::Path;

pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();

    let exists = command_exists("pm2");
    out.push(finding(
        "pm2.command",
        "pm2 is available in PATH",
        if exists { Status::Ok } else { Status::Warn },
        if exists {
            "pm2 command found"
        } else {
            "pm2 command not found (install with: npm i -g pm2)"
        },
    ));

    let has_ecosystem = has_pm2_ecosystem(root);
    out.push(finding(
        "pm2.ecosystem",
        "pm2 ecosystem config exists in repo",
        if has_ecosystem { Status::Ok } else { Status::Warn },
        if has_ecosystem {
            "Found ecosystem.config.*"
        } else {
            "No ecosystem.config.* detected"
        },
    ));

    out
}
