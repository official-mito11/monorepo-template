use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Ok,
    Warn,
    Fail,
}

#[derive(Debug, Serialize)]
pub struct Finding {
    pub id: String,
    pub title: String,
    pub status: Status,
    pub details: String,
    pub meta: BTreeMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct Report {
    pub root: String,
    pub counts: BTreeMap<String, usize>,
    pub findings: Vec<Finding>,
}

pub fn finding(id: &str, title: &str, status: Status, details: impl Into<String>) -> Finding {
    Finding {
        id: id.to_string(),
        title: title.to_string(),
        status,
        details: details.into(),
        meta: BTreeMap::new(),
    }
}

pub fn print_human_report(report: &Report) {
    println!("Root: {}", report.root);
    println!(
        "Counts: ok={} warn={} fail={}",
        report.counts.get("ok").copied().unwrap_or(0),
        report.counts.get("warn").copied().unwrap_or(0),
        report.counts.get("fail").copied().unwrap_or(0)
    );
    println!();

    for f in &report.findings {
        println!("[{:?}] {} ({})", f.status, f.title, f.id);
        println!("  {}", f.details);
        if !f.meta.is_empty() {
            for (k, v) in &f.meta {
                println!("  - {}: {}", k, v);
            }
        }
        println!();
    }
}

pub fn exit_code(report: &Report, strict: bool) -> i32 {
    let has_fail = report.findings.iter().any(|f| f.status == Status::Fail);
    let has_warn = report.findings.iter().any(|f| f.status == Status::Warn);

    if has_fail {
        return 2;
    }
    if strict && has_warn {
        return 2;
    }
    if has_warn {
        return 1;
    }
    0
}
