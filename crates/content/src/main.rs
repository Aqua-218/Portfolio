//! `content-check [content/のフォルダ]`: content/を検証して、間違いを全部出す。

use std::path::PathBuf;
use std::process::ExitCode;

fn main() -> ExitCode {
    let dir = std::env::args_os()
        .nth(1)
        .map_or_else(|| PathBuf::from("content"), PathBuf::from);
    match content::site::load(&dir) {
        Ok(_) => {
            println!("{}/ に間違いはありません", dir.display());
            ExitCode::SUCCESS
        }
        Err(problems) => {
            for p in &problems {
                eprintln!("{p}");
            }
            eprintln!("{}件の間違いがあります", problems.len());
            ExitCode::FAILURE
        }
    }
}
