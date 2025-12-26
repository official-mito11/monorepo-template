mod args;
mod checks;
mod error;
mod report;
mod util;

use clap::Parser;

use args::{Cli, Commands};
use report::{exit_code, print_human_report};

fn main() -> Result<(), error::CliError> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Check(args) => {
            let report = checks::run_checks(&args)?;

            if args.json {
                println!("{}", serde_json::to_string_pretty(&report).unwrap());
            } else {
                print_human_report(&report);
            }

            let exit = exit_code(&report, args.strict);
            std::process::exit(exit);
        }
    }
}
