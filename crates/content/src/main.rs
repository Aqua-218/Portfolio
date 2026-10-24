//! `content-check [content/のフォルダ] [--out <JSONのファイル>]`
//!
//! content/を検証して、間違いを全部出す。`--out`を付けると、通ったときに中身をJSONで書き出す。

use std::path::PathBuf;
use std::process::ExitCode;

fn main() -> ExitCode {
    let mut dir = PathBuf::from("content");
    let mut out: Option<PathBuf> = None;
    let mut args = std::env::args_os().skip(1);
    while let Some(arg) = args.next() {
        if arg == "--out" {
            let Some(path) = args.next() else {
                eprintln!("--out のあとに書き出すファイルを書いてください");
                return ExitCode::FAILURE;
            };
            out = Some(PathBuf::from(path));
        } else {
            dir = PathBuf::from(arg);
        }
    }

    let site = match content::site::load(&dir) {
        Ok(site) => site,
        Err(problems) => {
            for p in &problems {
                eprintln!("{p}");
            }
            eprintln!("{}件の間違いがあります", problems.len());
            return ExitCode::FAILURE;
        }
    };
    println!("{}/ に間違いはありません", dir.display());

    if let Some(out) = out {
        let json = match serde_json::to_string_pretty(&site) {
            Ok(json) => json,
            Err(e) => {
                eprintln!("JSONにできません: {e}");
                return ExitCode::FAILURE;
            }
        };
        if let Some(parent) = out.parent()
            && let Err(e) = std::fs::create_dir_all(parent)
        {
            eprintln!("{}: フォルダを作れません({e})", parent.display());
            return ExitCode::FAILURE;
        }
        if let Err(e) = std::fs::write(&out, json + "\n") {
            eprintln!("{}: 書けません({e})", out.display());
            return ExitCode::FAILURE;
        }
        println!("{} に書き出した", out.display());
    }
    ExitCode::SUCCESS
}
