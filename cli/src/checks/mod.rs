pub mod build;
pub mod ci;
pub mod env;
pub mod nginx;
pub mod pm2;
pub mod runtime;

use crate::args::{CheckArgs, CheckTarget};
use crate::error::CliError;
use crate::report::{Report, Status};
use std::collections::BTreeMap;

pub fn run_checks(args: &CheckArgs) -> Result<Report, CliError> {
    let root = args.root.canonicalize().unwrap_or(args.root.clone());

    let targets: Vec<CheckTarget> = match args.target {
        CheckTarget::All => vec![
            CheckTarget::Nginx,
            CheckTarget::Pm2,
            CheckTarget::Build,
            CheckTarget::Env,
            CheckTarget::Ci,
            CheckTarget::Runtime,
        ],
        other => vec![other],
    };

    let mut findings = Vec::new();
    for t in targets {
        match t {
            CheckTarget::Nginx => findings.extend(nginx::check(&root)),
            CheckTarget::Pm2 => findings.extend(pm2::check(&root)),
            CheckTarget::Build => findings.extend(build::check(&root)),
            CheckTarget::Env => findings.extend(env::check(&root)),
            CheckTarget::Ci => findings.extend(ci::check(&root)),
            CheckTarget::Runtime => findings.extend(runtime::check()),
            CheckTarget::All => {}
        }
    }

    let mut counts: BTreeMap<String, usize> = BTreeMap::new();
    for s in [Status::Ok, Status::Warn, Status::Fail] {
        counts.insert(format!("{s:?}").to_lowercase(), 0);
    }
    for f in &findings {
        let k = format!("{:?}", f.status).to_lowercase();
        *counts.entry(k).or_insert(0) += 1;
    }

    Ok(Report {
        root: root.to_string_lossy().to_string(),
        counts,
        findings,
    })
}
