//! 年度の添え書き(`content/events.toml`)を読んで検証する。

use crate::events::Event;
use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use std::collections::HashSet;
use toml::Spanned;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct YearNote {
    /// 年度(4月に始まる年)
    pub year: u16,
    pub note: String,
    /// 書いてある行。ほかのファイルと突き合わせるときのエラーで使う
    pub line: usize,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawYear {
    year: Spanned<u16>,
    note: Spanned<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    #[serde(default)]
    year: Vec<RawYear>,
}

/// `events.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Vec<YearNote>, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for y in raw.year {
        src.check_text(&mut problems, "note", &y.note);
        let line = src.line(&y.year).unwrap_or(1);
        if !seen.insert(*y.year.get_ref()) {
            problems.push(Problem::new(
                Some(line),
                format!("{}年度がもうあります", y.year.get_ref()),
            ));
        }
        out.push(YearNote {
            year: y.year.into_inner(),
            note: y.note.into_inner(),
            line,
        });
    }
    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}

/// 添え書きのある年度に、イベントが1つ以上あるか確かめる。
#[must_use]
pub fn check_against(notes: &[YearNote], events: &[Event]) -> Vec<Problem> {
    let years: HashSet<u16> = events.iter().map(|e| e.date.fiscal_year()).collect();
    notes
        .iter()
        .filter(|n| !years.contains(&n.year))
        .map(|n| {
            Problem::new(
                Some(n.line),
                format!("{}年度のイベントがありません", n.year),
            )
        })
        .collect()
}
