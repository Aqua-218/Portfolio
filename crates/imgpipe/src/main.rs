//! `imgpipe <写真のフォルダ> <出力のフォルダ>`

use std::path::PathBuf;
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<PathBuf> = std::env::args_os().skip(1).map(PathBuf::from).collect();
    let [in_dir, out_dir] = args.as_slice() else {
        eprintln!("使い方: imgpipe <写真のフォルダ> <出力のフォルダ>");
        return ExitCode::FAILURE;
    };
    match imgpipe::convert_dir(in_dir, out_dir) {
        Ok(done) => {
            let skipped = done.iter().filter(|c| c.skipped).count();
            println!(
                "{}枚を変換した({}枚は変換済みで飛ばした)",
                done.len() - skipped,
                skipped
            );
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}
