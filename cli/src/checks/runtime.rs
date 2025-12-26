use crate::report::{finding, Finding, Status};
use crate::util::command::command_exists;

pub fn check() -> Vec<Finding> {
    let mut out = Vec::new();

    let bun = command_exists("bun");
    out.push(finding(
        "runtime.bun",
        "bun is available in PATH",
        if bun { Status::Ok } else { Status::Fail },
        if bun { "bun command found" } else { "bun command not found" },
    ));

    let node = command_exists("node");
    out.push(finding(
        "runtime.node",
        "node is available in PATH (often needed for pm2/npm workflows)",
        if node { Status::Ok } else { Status::Warn },
        if node {
            "node command found"
        } else {
            "node command not found"
        },
    ));

    out
}
