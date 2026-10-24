//! 見たもの・読んだもの(`content/shelf.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use serde::Serialize;
use std::collections::HashSet;
use toml::Spanned;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(rename = "ShelfKind")]
pub enum Kind {
    Drama,
    Anime,
    /// 漫画・小説
    Book,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename = "ShelfWork")]
pub struct Work {
    pub kind: Kind,
    pub title: String,
    pub note: Option<String>,
    pub pick: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawWork {
    kind: Spanned<String>,
    title: Spanned<String>,
    note: Option<Spanned<String>>,
    #[serde(default)]
    pick: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    work: Vec<RawWork>,
}

/// `shelf.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Vec<Work>, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut out = Vec::new();
    let mut seen = HashSet::new();

    for w in raw.work {
        let kind = src
            .check_one_of(&mut problems, "kind", &w.kind, &["drama", "anime", "book"])
            .map(|k| match k {
                "drama" => Kind::Drama,
                "anime" => Kind::Anime,
                _ => Kind::Book,
            });
        src.check_text(&mut problems, "title", &w.title);
        src.check_opt_text(&mut problems, "note", w.note.as_ref());
        let Some(kind) = kind else { continue };
        if !seen.insert((kind, w.title.get_ref().clone())) {
            problems.push(Problem::new(
                src.line(&w.title),
                format!("「{}」が同じ kind にもうあります", w.title.get_ref()),
            ));
        }
        out.push(Work {
            kind,
            title: w.title.into_inner(),
            note: w.note.map(Spanned::into_inner),
            pick: w.pick,
        });
    }

    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}
