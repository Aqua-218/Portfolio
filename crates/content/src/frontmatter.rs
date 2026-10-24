//! Markdownのfrontmatterを読む。
//!
//! ファイルの1行目が`---`なら、次の`---`の行までをYAMLのfrontmatterとして読み、残りを本文にする。

use serde::de::DeserializeOwned;
use std::fmt;

/// frontmatterと本文。
#[derive(Debug, PartialEq, Eq)]
pub struct Document<T> {
    pub front: T,
    pub body: String,
    /// 本文がファイルの何行目から始まるか(1から数える)
    pub body_line: usize,
}

/// 読めなかったとき。行番号はファイル全体で数える。
#[derive(Debug, PartialEq, Eq)]
pub struct Error {
    pub line: Option<usize>,
    pub message: String,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.line {
            Some(line) => write!(f, "{line}: {}", self.message),
            None => f.write_str(&self.message),
        }
    }
}

impl std::error::Error for Error {}

/// frontmatterと本文に分ける。frontmatterのYAMLはまだ読まない。
///
/// # Errors
///
/// 1行目が`---`でないとき、閉じる`---`がないとき。
pub fn split(src: &str) -> Result<(&str, &str, usize), Error> {
    let src = src.strip_prefix('\u{feff}').unwrap_or(src);
    let Some(rest) = src
        .strip_prefix("---\n")
        .or_else(|| src.strip_prefix("---\r\n"))
    else {
        return Err(Error {
            line: Some(1),
            message: "1行目が---ではありません。frontmatterを---で囲んでください".to_owned(),
        });
    };

    let mut offset = 0;
    for (i, line) in rest.split_inclusive('\n').enumerate() {
        if line.trim_end_matches(['\n', '\r']) == "---" {
            let front = &rest[..offset];
            let body = &rest[offset + line.len()..];
            // 1行目の---、frontmatterのi行、閉じる---の次から本文
            return Ok((front, body, i + 3));
        }
        offset += line.len();
    }
    Err(Error {
        line: Some(1),
        message: "frontmatterを閉じる---がありません".to_owned(),
    })
}

/// frontmatterを`T`として読み、本文と一緒に返す。
///
/// # Errors
///
/// frontmatterを分けられないとき、YAMLとして読めないとき、`T`の形に合わないとき。
pub fn parse<T: DeserializeOwned>(src: &str) -> Result<Document<T>, Error> {
    let (front, body, body_line) = split(src)?;
    let front = serde_saphyr::from_str::<T>(front).map_err(|e| Error {
        // frontmatterは2行目から始まる
        line: e
            .location()
            .and_then(|l| usize::try_from(l.line()).ok())
            .map(|l| l + 1),
        message: crate::problem::translate(&message_of(&e)),
    })?;
    Ok(Document {
        front,
        body: body.to_owned(),
        body_line,
    })
}

/// serde-saphyrのエラーから、位置の入っていない1行目の説明だけを取り出す。
fn message_of(e: &serde_saphyr::Error) -> String {
    let text = e.to_string();
    let first = text.lines().next().unwrap_or_default();
    let first = first.strip_prefix("error: ").unwrap_or(first);
    // "line 2 column 1: missing field `date`" の位置の部分を落とす
    match first.split_once(": ") {
        Some((head, rest)) if head.starts_with("line ") => rest.to_owned(),
        _ => first.to_owned(),
    }
}
