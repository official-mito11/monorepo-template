use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(name = "monorepo-cli")]
#[command(about = "Monorepo production readiness checker", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Debug, Subcommand)]
pub enum Commands {
    Check(CheckArgs),
}

#[derive(Debug, Parser)]
pub struct CheckArgs {
    #[arg(value_enum, default_value = "all")]
    pub target: CheckTarget,

    #[arg(long, default_value = "..")]
    pub root: PathBuf,

    #[arg(long)]
    pub json: bool,

    #[arg(long)]
    pub strict: bool,
}

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum CheckTarget {
    All,
    Nginx,
    Pm2,
    Build,
    Env,
    Ci,
    Runtime,
}
