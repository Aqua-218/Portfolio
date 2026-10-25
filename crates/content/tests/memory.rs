//! 手元のファイルの中身から読んでも(管理画面のWasm)、ディスクから読むのと同じになるか。

use content::site::{Disk, Memory, Source, load, load_from};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

/// `content/`のファイルを全部メモリに読む
fn memory(dir: &Path) -> Memory {
    fn walk(dir: &Path, base: &Path, files: &mut BTreeMap<String, Vec<u8>>) {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(&path, base, files);
            } else {
                let rel = path
                    .strip_prefix(base)
                    .unwrap()
                    .to_string_lossy()
                    .into_owned();
                files.insert(rel, fs::read(&path).unwrap());
            }
        }
    }
    let mut files = BTreeMap::new();
    walk(dir, dir, &mut files);
    Memory {
        root: "content".to_owned(),
        files,
    }
}

fn content() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/../../content"))
}

#[test]
fn いまのcontentを同じように読める() {
    let disk = load(content()).expect("ディスクから読めない");
    let mem = load_from(&memory(content())).expect("メモリから読めない");
    assert_eq!(disk, mem);
}

#[test]
fn 間違いは同じ文で出る() {
    let mut mem = memory(content());
    let rel = "events/2026-08-10-seccamp.md";
    let text = String::from_utf8(mem.files[rel].clone()).unwrap();
    mem.files.insert(
        rel.to_owned(),
        text.replace("date: 2026-08-10", "date: 2026-02-30")
            .into_bytes(),
    );
    let problems: Vec<String> = load_from(&mem)
        .unwrap_err()
        .iter()
        .map(ToString::to_string)
        .collect();
    assert_eq!(problems.len(), 1, "{problems:?}");
    assert!(
        problems[0].starts_with("content/events/2026-08-10-seccamp.md:"),
        "{problems:?}"
    );
}

#[test]
fn ないファイルとフォルダはディスクと同じ文になる() {
    let mem = Memory {
        root: "content".to_owned(),
        files: BTreeMap::new(),
    };
    assert_eq!(
        mem.read("profile.toml").unwrap_err(),
        "ファイルがありません"
    );
    assert!(mem.list("events").is_none());
    let disk = Disk(Path::new("/nai"));
    assert_eq!(
        disk.read("profile.toml").unwrap_err(),
        "ファイルがありません"
    );
}

#[test]
fn ブログの記事を読み間違いはファイルの場所つきで出す() {
    let mut mem = memory(content());
    mem.files.insert(
        "blog/rust-cat.md".to_owned(),
        "---\ntitle: Rustで猫\ntags: [Rust]\n---\n本文\n"
            .as_bytes()
            .to_vec(),
    );
    let site = load_from(&mem).expect("読めない");
    assert_eq!(site.blog.len(), 1);
    assert_eq!(site.blog[0].slug, "rust-cat");

    mem.files.insert(
        "blog/bad.md".to_owned(),
        b"---\ntitle: t\ntags: []\n---\nx\n".to_vec(),
    );
    let problems: Vec<String> = load_from(&mem)
        .unwrap_err()
        .iter()
        .map(ToString::to_string)
        .collect();
    assert_eq!(problems.len(), 1, "{problems:?}");
    assert!(
        problems[0].starts_with("content/blog/bad.md:3: tags は1〜5個"),
        "{problems:?}"
    );
}
