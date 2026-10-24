//! `gen-types <出力のフォルダ>`: content/のJSONの型をTypeScriptで書き出す。
//!
//! 型ごとに`<名前>.ts`を書き、全部をまとめて読める`index.ts`も書く。

use content::site::Site;
use std::fmt::Write as _;
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;
use ts_rs::TS;

fn main() -> ExitCode {
    let Some(dir) = std::env::args_os().nth(1).map(PathBuf::from) else {
        eprintln!("使い方: gen-types <出力のフォルダ>");
        return ExitCode::FAILURE;
    };
    // 前に書いた型が残らないよう、いったん消してから書く
    if dir.exists()
        && let Err(e) = fs::remove_dir_all(&dir)
    {
        eprintln!("{}: 消せません({e})", dir.display());
        return ExitCode::FAILURE;
    }
    let cfg = ts_rs::Config::new().with_out_dir(&dir);
    if let Err(e) = Site::export_all(&cfg) {
        eprintln!("型を書き出せません: {e}");
        return ExitCode::FAILURE;
    }

    let mut names: Vec<String> = match fs::read_dir(&dir) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .filter_map(|e| e.file_name().into_string().ok())
            .filter_map(|n| n.strip_suffix(".ts").map(str::to_owned))
            .collect(),
        Err(e) => {
            eprintln!("{}: 読めません({e})", dir.display());
            return ExitCode::FAILURE;
        }
    };
    names.sort();
    let mut index = String::from("// gen-typesが書き出した。手で直さない\n");
    for name in &names {
        let _ = writeln!(index, "export type {{ {name} }} from \"./{name}\";");
    }
    if let Err(e) = fs::write(dir.join("index.ts"), index) {
        eprintln!("index.tsを書けません: {e}");
        return ExitCode::FAILURE;
    }
    println!("{}個の型を{}に書き出した", names.len(), dir.display());
    ExitCode::SUCCESS
}
