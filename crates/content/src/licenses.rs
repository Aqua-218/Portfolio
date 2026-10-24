//! ライセンス・クレジット(`content/licenses.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use toml::Spanned;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Group {
    /// アイコン
    Icons,
    /// フォント
    Fonts,
    /// このサイトのもの
    Site,
    /// そのほか
    Others,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct License {
    pub group: Group,
    pub name: String,
    pub url: Option<String>,
    pub license: Option<String>,
    pub note: String,
    /// このライセンスで使っている`local:`のアイコン
    pub icons: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawLicense {
    group: Spanned<String>,
    name: Spanned<String>,
    url: Option<Spanned<String>>,
    license: Option<Spanned<String>>,
    note: Spanned<String>,
    #[serde(default)]
    icons: Vec<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    license: Vec<RawLicense>,
}

/// `licenses.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Vec<License>, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut out = Vec::new();
    for l in raw.license {
        let group = src
            .check_one_of(
                &mut problems,
                "group",
                &l.group,
                &["icons", "fonts", "site", "others"],
            )
            .map(|g| match g {
                "icons" => Group::Icons,
                "fonts" => Group::Fonts,
                "site" => Group::Site,
                _ => Group::Others,
            });
        src.check_text(&mut problems, "name", &l.name);
        if let Some(url) = &l.url {
            src.check_url(&mut problems, "url", url);
        }
        src.check_opt_text(&mut problems, "license", l.license.as_ref());
        src.check_text(&mut problems, "note", &l.note);
        if let Some(group) = group {
            out.push(License {
                group,
                name: l.name.into_inner(),
                url: l.url.map(Spanned::into_inner),
                license: l.license.map(Spanned::into_inner),
                note: l.note.into_inner(),
                icons: l.icons,
            });
        }
    }
    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}
