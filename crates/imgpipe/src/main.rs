//! `imgpipe <写真のフォルダ> <出力のフォルダ> [--url-prefix <URL>] [--manifest <JSONのファイル>]`
//!
//! `--manifest`を付けると、写真ごとの`srcset`・幅・高さをJSONで書き出す。
//! `--url-prefix`は出力のフォルダのURL(省くと`/img`)。

use std::path::PathBuf;
use std::process::ExitCode;

fn main() -> ExitCode {
    let mut positional = Vec::new();
    let mut url_prefix = String::from("/img");
    let mut manifest: Option<PathBuf> = None;
    let mut args = std::env::args_os().skip(1);
    while let Some(arg) = args.next() {
        match arg.to_str() {
            Some("--url-prefix") => {
                let Some(v) = args.next().and_then(|a| a.into_string().ok()) else {
                    eprintln!("--url-prefix のあとにURLを書いてください");
                    return ExitCode::FAILURE;
                };
                url_prefix = v;
            }
            Some("--manifest") => {
                let Some(v) = args.next() else {
                    eprintln!("--manifest のあとに書き出すファイルを書いてください");
                    return ExitCode::FAILURE;
                };
                manifest = Some(PathBuf::from(v));
            }
            _ => positional.push(PathBuf::from(arg)),
        }
    }
    let [in_dir, out_dir] = positional.as_slice() else {
        eprintln!(
            "使い方: imgpipe <写真のフォルダ> <出力のフォルダ> [--url-prefix <URL>] [--manifest <JSONのファイル>]"
        );
        return ExitCode::FAILURE;
    };

    let done = match imgpipe::convert_dir(in_dir, out_dir) {
        Ok(done) => done,
        Err(e) => {
            eprintln!("{e}");
            return ExitCode::FAILURE;
        }
    };
    let skipped = done.iter().filter(|c| c.skipped).count();
    println!(
        "{}枚を変換した({}枚は変換済みで飛ばした)",
        done.len() - skipped,
        skipped
    );

    if let Some(path) = manifest {
        let images = imgpipe::manifest(&done, &url_prefix);
        let json = match serde_json::to_string_pretty(&images) {
            Ok(json) => json,
            Err(e) => {
                eprintln!("JSONにできません: {e}");
                return ExitCode::FAILURE;
            }
        };
        if let Some(parent) = path.parent()
            && let Err(e) = std::fs::create_dir_all(parent)
        {
            eprintln!("{}: フォルダを作れません({e})", parent.display());
            return ExitCode::FAILURE;
        }
        if let Err(e) = std::fs::write(&path, json + "\n") {
            eprintln!("{}: 書けません({e})", path.display());
            return ExitCode::FAILURE;
        }
        println!("{} に書き出した", path.display());
    }
    ExitCode::SUCCESS
}
