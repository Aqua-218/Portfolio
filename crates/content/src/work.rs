//! 働いている会社(`content/work.toml`)を読んで検証する。

use crate::date::YearMonth;
use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use std::collections::HashSet;
use toml::Spanned;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Company {
    pub slug: String,
    pub prefix: Option<String>,
    pub name: String,
    pub url: String,
    pub description: String,
    pub tagline: Option<String>,
    pub founded: YearMonth,
    pub location: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawCompany {
    slug: Spanned<String>,
    prefix: Option<Spanned<String>>,
    name: Spanned<String>,
    url: Spanned<String>,
    description: Spanned<String>,
    tagline: Option<Spanned<String>>,
    founded: Spanned<String>,
    location: Spanned<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    company: Vec<RawCompany>,
}

/// `work.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Vec<Company>, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut out = Vec::new();
    let mut slugs = HashSet::new();

    for c in raw.company {
        let slug = c.slug.get_ref();
        let slug_ok = !slug.is_empty()
            && slug
                .bytes()
                .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-');
        if !slug_ok {
            problems.push(Problem::new(
                src.line(&c.slug),
                "slug は小文字の英数字とハイフンで書いてください",
            ));
        } else if !slugs.insert(slug.clone()) {
            problems.push(Problem::new(
                src.line(&c.slug),
                format!("slug「{slug}」がもうあります"),
            ));
        }
        src.check_opt_text(&mut problems, "prefix", c.prefix.as_ref());
        src.check_text(&mut problems, "name", &c.name);
        src.check_url(&mut problems, "url", &c.url);
        src.check_text(&mut problems, "description", &c.description);
        src.check_opt_text(&mut problems, "tagline", c.tagline.as_ref());
        src.check_text(&mut problems, "location", &c.location);
        let founded = YearMonth::parse(c.founded.get_ref());
        if founded.is_none() {
            problems.push(Problem::new(
                src.line(&c.founded),
                "founded は YYYY-MM の形の、実在する年月にしてください",
            ));
        }
        if let Some(founded) = founded {
            out.push(Company {
                slug: c.slug.into_inner(),
                prefix: c.prefix.map(Spanned::into_inner),
                name: c.name.into_inner(),
                url: c.url.into_inner(),
                description: c.description.into_inner(),
                tagline: c.tagline.map(Spanned::into_inner),
                founded,
                location: c.location.into_inner(),
            });
        }
    }

    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}
