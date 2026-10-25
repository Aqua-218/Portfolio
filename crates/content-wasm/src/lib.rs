//! `content/`の検証を、管理画面(ブラウザ)で動かす。ビルドの`content-check`と同じ検証で、同じエラー文を出す。

use std::collections::BTreeMap;

use content::problem::Problem;
use content::site::{Memory, Site, load_from};
use content::{affiliations, event_years, events, licenses, profile, shelf, skills, work};
use serde::Serialize;
use wasm_bindgen::prelude::*;

/// 検証の結果。間違いがなければ`site`に中身が入る
#[derive(Debug, Serialize)]
pub struct Checked {
    /// `content/events/x.md:3: date がありません`の形の間違い
    pub problems: Vec<String>,
    pub site: Option<Site>,
}

/// ファイルの中身から検証する。`files`のキーは`content/`からの相対パス
#[must_use]
pub fn check_files(files: BTreeMap<String, Vec<u8>>) -> Checked {
    let source = Memory {
        root: "content".to_owned(),
        files,
    };
    match load_from(&source) {
        Ok(site) => Checked {
            problems: Vec::new(),
            site: Some(site),
        },
        Err(problems) => Checked {
            problems: problems.iter().map(ToString::to_string).collect(),
            site: None,
        },
    }
}

/// JavaScriptから呼ぶ。ファイルの中身は`data`につなげて渡し、`sizes`でそれぞれの長さを渡す。
/// 結果は[`Checked`]のJSON。
///
/// # Errors
///
/// `paths`と`sizes`の数が合わないとき、長さの合計が`data`と合わないとき。
#[wasm_bindgen]
pub fn check(paths: Vec<String>, sizes: Vec<u32>, data: &[u8]) -> Result<String, JsError> {
    if paths.len() != sizes.len() {
        return Err(JsError::new("pathsとsizesの数が合いません"));
    }
    let mut files = BTreeMap::new();
    let mut rest = data;
    for (path, size) in paths.into_iter().zip(sizes) {
        let size = size as usize;
        if size > rest.len() {
            return Err(JsError::new("dataが足りません"));
        }
        let (head, tail) = rest.split_at(size);
        files.insert(path, head.to_vec());
        rest = tail;
    }
    if !rest.is_empty() {
        return Err(JsError::new("dataが余っています"));
    }
    serde_json::to_string(&check_files(files)).map_err(|e| JsError::new(&e.to_string()))
}

/// 1つのファイルの間違い
#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct FileProblem {
    pub line: Option<usize>,
    pub message: String,
    /// `content/events/x.md:3: date がありません`の形。ビルドと同じ文
    pub text: String,
}

/// 1つのファイルだけの検証の結果
#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct FileChecked {
    /// このファイルを1つだけで検証できたか。できないもの(猫の写真の説明など)は、PRのCIで確かめる
    pub supported: bool,
    pub problems: Vec<FileProblem>,
}

/// `content/`からの相対パスのファイル1つを、ビルドと同じ関数で検証する。
/// ファイルをまたいだ確かめ(年度とイベントの突き合わせなど)はしない
#[must_use]
pub fn check_one(path: &str, text: &str) -> FileChecked {
    fn problems<T>(r: Result<T, Vec<Problem>>) -> Vec<Problem> {
        r.err().unwrap_or_default()
    }
    let found = if let Some(slug) = path
        .strip_prefix("events/")
        .and_then(|n| n.strip_suffix(".md"))
    {
        Some(problems(events::parse(slug, text)))
    } else {
        match path {
            "profile.toml" => Some(problems(profile::parse(text))),
            "skills.toml" => Some(problems(skills::parse(text))),
            "work.toml" => Some(problems(work::parse(text))),
            "affiliations.toml" => Some(problems(affiliations::parse(text))),
            "events.toml" => Some(problems(event_years::parse(text))),
            "shelf.toml" => Some(problems(shelf::parse(text))),
            "licenses.toml" => Some(problems(licenses::parse(text))),
            _ => None,
        }
    };
    let Some(found) = found else {
        return FileChecked {
            supported: false,
            problems: Vec::new(),
        };
    };
    FileChecked {
        supported: true,
        problems: found
            .into_iter()
            .map(|p| {
                let file = p.file.clone().unwrap_or_else(|| path.to_owned());
                let text = match p.line {
                    Some(line) => format!("content/{file}:{line}: {}", p.message),
                    None => format!("content/{file}: {}", p.message),
                };
                FileProblem {
                    line: p.line,
                    message: p.message,
                    text,
                }
            })
            .collect(),
    }
}

/// JavaScriptから呼ぶ。結果は[`FileChecked`]のJSON
///
/// # Errors
///
/// JSONにできなかったとき。
#[wasm_bindgen]
pub fn check_file(path: &str, text: &str) -> Result<String, JsError> {
    serde_json::to_string(&check_one(path, text)).map_err(|e| JsError::new(&e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn イベント1つの間違いをビルドと同じ文で出す() {
        let checked = check_one(
            "events/2026-08-10-seccamp.md",
            "---\ntitle: a\ndate: 2026-02-30\nvenue: b\n---\n\nほんぶん\n",
        );
        assert!(checked.supported);
        assert_eq!(checked.problems.len(), 1, "{checked:?}");
        assert_eq!(checked.problems[0].line, Some(3));
        assert!(checked.problems[0].message.starts_with("date "));
        assert!(
            checked
                .problems
                .iter()
                .all(|p| p.text.starts_with("content/events/2026-08-10-seccamp.md:"))
        );
    }

    #[test]
    fn 正しいファイルには何も言わない() {
        let text = std::fs::read_to_string(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../content/events/2026-08-10-seccamp.md"
        ))
        .unwrap();
        assert_eq!(
            check_one("events/2026-08-10-seccamp.md", &text),
            FileChecked {
                supported: true,
                problems: Vec::new()
            }
        );
    }

    #[test]
    fn 一つだけでは確かめられないものはそう返す() {
        assert!(!check_one("cats.toml", "").supported);
        assert!(!check_one("icons/lean.svg", "").supported);
    }

    #[test]
    fn 空ならファイルがないと言う() {
        let checked = check_files(BTreeMap::new());
        assert!(checked.site.is_none());
        assert!(
            checked
                .problems
                .contains(&"content/profile.toml: ファイルがありません".to_owned())
        );
    }
}
