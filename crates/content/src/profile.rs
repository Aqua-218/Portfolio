//! 名前・基本情報・経歴(`content/profile.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use toml::Spanned;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fact {
    pub label: String,
    pub value: String,
    pub sub: Option<String>,
    /// Homeでだけ使う短い`sub`
    pub sub_short: Option<String>,
    pub wide: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Career {
    pub year: u16,
    pub title: String,
    pub note: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    pub name: String,
    pub romaji: String,
    pub location: String,
    pub timezone: String,
    pub facts: Vec<Fact>,
    pub career: Vec<Career>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawFact {
    label: Spanned<String>,
    value: Spanned<String>,
    sub: Option<Spanned<String>>,
    sub_short: Option<Spanned<String>>,
    #[serde(default)]
    wide: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawCareer {
    year: Spanned<u16>,
    title: Spanned<String>,
    note: Option<Spanned<String>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    name: Spanned<String>,
    romaji: Spanned<String>,
    location: Spanned<String>,
    timezone: Spanned<String>,
    fact: Vec<RawFact>,
    career: Vec<RawCareer>,
}

/// `profile.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Profile, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();

    src.check_text(&mut problems, "name", &raw.name);
    src.check_text(&mut problems, "romaji", &raw.romaji);
    src.check_text(&mut problems, "location", &raw.location);
    // IANAのタイムゾーンの名前は「地域/都市」の形
    let tz = raw.timezone.get_ref();
    if !tz.contains('/') || tz.contains(char::is_whitespace) {
        problems.push(Problem::new(
            src.line(&raw.timezone),
            "timezone は Asia/Tokyo のような IANA の名前にしてください",
        ));
    }

    for f in &raw.fact {
        src.check_text(&mut problems, "label", &f.label);
        src.check_text(&mut problems, "value", &f.value);
        src.check_opt_text(&mut problems, "sub", f.sub.as_ref());
        src.check_opt_text(&mut problems, "sub_short", f.sub_short.as_ref());
        if let (Some(short), None) = (&f.sub_short, &f.sub) {
            problems.push(Problem::new(
                src.line(short),
                "sub_short は sub があるときだけ書きます",
            ));
        }
    }

    let mut prev_year = 0;
    for c in &raw.career {
        src.check_text(&mut problems, "title", &c.title);
        src.check_opt_text(&mut problems, "note", c.note.as_ref());
        let year = *c.year.get_ref();
        if !(1900..=2999).contains(&year) {
            problems.push(Problem::new(
                src.line(&c.year),
                "year は4桁の年にしてください",
            ));
        } else if year < prev_year {
            problems.push(Problem::new(
                src.line(&c.year),
                "career は古い順に並べてください",
            ));
        }
        prev_year = prev_year.max(year);
    }

    if !problems.is_empty() {
        return Err(problems);
    }
    Ok(Profile {
        name: raw.name.into_inner(),
        romaji: raw.romaji.into_inner(),
        location: raw.location.into_inner(),
        timezone: raw.timezone.into_inner(),
        facts: raw
            .fact
            .into_iter()
            .map(|f| Fact {
                label: f.label.into_inner(),
                value: f.value.into_inner(),
                sub: f.sub.map(Spanned::into_inner),
                sub_short: f.sub_short.map(Spanned::into_inner),
                wide: f.wide,
            })
            .collect(),
        career: raw
            .career
            .into_iter()
            .map(|c| Career {
                year: c.year.into_inner(),
                title: c.title.into_inner(),
                note: c.note.map(Spanned::into_inner),
            })
            .collect(),
    })
}
