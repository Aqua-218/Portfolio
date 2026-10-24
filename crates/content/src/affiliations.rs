//! 所属(`content/affiliations.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use toml::Spanned;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Group {
    /// 所属団体
    Org,
    /// コンテスト・キャンプ
    Contest,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Affiliation {
    pub group: Group,
    pub name: String,
    pub url: Option<String>,
    pub tag: String,
    pub description: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawAffiliation {
    group: Spanned<String>,
    name: Spanned<String>,
    url: Option<Spanned<String>>,
    tag: Spanned<String>,
    description: Spanned<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    affiliation: Vec<RawAffiliation>,
}

/// `affiliations.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Vec<Affiliation>, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut out = Vec::new();

    for a in raw.affiliation {
        let group = src
            .check_one_of(&mut problems, "group", &a.group, &["org", "contest"])
            .map(|g| {
                if g == "org" {
                    Group::Org
                } else {
                    Group::Contest
                }
            });
        src.check_text(&mut problems, "name", &a.name);
        if let Some(url) = &a.url {
            src.check_url(&mut problems, "url", url);
        }
        src.check_text(&mut problems, "tag", &a.tag);
        src.check_text(&mut problems, "description", &a.description);
        if let Some(group) = group {
            out.push(Affiliation {
                group,
                name: a.name.into_inner(),
                url: a.url.map(Spanned::into_inner),
                tag: a.tag.into_inner(),
                description: a.description.into_inner(),
            });
        }
    }

    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}
