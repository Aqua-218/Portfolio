//! ライセンス・クレジット(`content/licenses.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use serde::Serialize;
use toml::Spanned;
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(rename = "LicenseGroup")]
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct License {
    pub group: Group,
    pub name: String,
    pub url: Option<String>,
    pub license: Option<String>,
    pub note: String,
    /// このライセンスで使っている`local:`のアイコン
    pub icons: Vec<String>,
    /// 原文(`content/licenses/<text>.txt`)
    pub text: Option<String>,
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
    text: Option<Spanned<String>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    license: Vec<RawLicense>,
}

/// 原文のid(`content/licenses/<id>.txt`のファイル名)に使える字。URL(`/license/<id>/`)にそのまま入る。
/// ドットは使わない(`4.0`のように拡張子に見えると、URLの終わりの`/`がつかない)
fn valid_text_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
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
        if let Some(text) = &l.text {
            if !valid_text_id(text.get_ref()) {
                problems.push(Problem::new(
                    src.line(text),
                    "text は英小文字・数字・ハイフンにしてください(content/licenses/<text>.txt を指します)",
                ));
            }
            if l.license.is_none() {
                problems.push(Problem::new(
                    src.line(text),
                    "text があるときは license も書いてください(原文へのリンクの名前になります)",
                ));
            }
        }
        if let Some(group) = group {
            out.push(License {
                group,
                name: l.name.into_inner(),
                url: l.url.map(Spanned::into_inner),
                license: l.license.map(Spanned::into_inner),
                note: l.note.into_inner(),
                icons: l.icons,
                text: l.text.map(Spanned::into_inner),
            });
        }
    }
    if problems.is_empty() {
        Ok(out)
    } else {
        Err(problems)
    }
}

/// `text`の原文のファイルが`content/licenses/`にあるか確かめる。`available`はあるファイルの名前(拡張子なし)
///
/// 行番号を出すため、`licenses.toml`の元の文字を受け取る。
#[must_use]
pub fn check_texts(text: &str, available: &std::collections::BTreeSet<String>) -> Vec<Problem> {
    let src = Source::new(text);
    let Ok(raw) = src.parse::<Raw>() else {
        return Vec::new();
    };
    raw.license
        .iter()
        .filter_map(|l| l.text.as_ref())
        .filter(|t| valid_text_id(t.get_ref()) && !available.contains(t.get_ref()))
        .map(|t| {
            Problem::new(
                src.line(t),
                format!(
                    "text の原文 content/licenses/{}.txt がありません",
                    t.get_ref()
                ),
            )
        })
        .collect()
}
