//! `content/`の検証を、管理画面(ブラウザ)で動かす。ビルドの`content-check`と同じ検証で、同じエラー文を出す。

use std::collections::BTreeMap;

use content::site::{Memory, Site, load_from};
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

#[cfg(test)]
mod tests {
    use super::*;

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
