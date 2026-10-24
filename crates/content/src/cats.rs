//! 猫の写真(`content/cats.toml`と`content/cats/*.jpg`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::Source;
use serde::Deserialize;
use serde::Serialize;
use std::collections::{BTreeMap, HashSet};
use toml::Spanned;
use ts_rs::TS;

/// 見出しの横に写真を置くページ。
pub const SECTIONS: [&str; 8] = [
    "about",
    "skills",
    "work",
    "affiliations",
    "events",
    "shelf",
    "stack",
    "license",
];

const COATS: [&str; 3] = ["kuro", "kiji", "mike"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Photo {
    pub id: String,
    pub alt: String,
    pub coats: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Cats {
    /// Homeのモザイクの4枚
    pub mosaic: Vec<String>,
    /// Homeのいちばん下の1枚
    pub goodnight: String,
    /// ページ → 見出しの横の写真
    pub sections: BTreeMap<String, String>,
    /// ギャラリーの順
    pub photos: Vec<Photo>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawPhoto {
    id: Spanned<String>,
    alt: Spanned<String>,
    coats: Spanned<Vec<String>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    mosaic: Spanned<Vec<String>>,
    goodnight: Spanned<String>,
    sections: Spanned<BTreeMap<String, String>>,
    photo: Vec<RawPhoto>,
}

/// `cats.toml`を読んで検証する。`files`は`content/cats/`にある写真のファイル名と中身。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。`cats.toml`の中の間違いには行番号が付き、
/// 写真のファイルの間違いには付かない(メッセージにファイル名を入れる)。
pub fn parse(text: &str, files: &[(String, Vec<u8>)]) -> Result<Cats, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let ids = check_photos(&src, &mut problems, &raw.photo, files);
    check_places(&src, &mut problems, &raw, &ids);
    check_files(&mut problems, files, &ids);
    if !problems.is_empty() {
        return Err(problems);
    }
    Ok(Cats {
        mosaic: raw.mosaic.into_inner(),
        goodnight: raw.goodnight.into_inner(),
        sections: raw.sections.into_inner(),
        photos: raw
            .photo
            .into_iter()
            .map(|p| Photo {
                id: p.id.into_inner(),
                alt: p.alt.into_inner(),
                coats: p.coats.into_inner(),
            })
            .collect(),
    })
}

/// 写真の一覧を確かめ、出てきたidを返す。
fn check_photos(
    src: &Source<'_>,
    problems: &mut Vec<Problem>,
    photos: &[RawPhoto],
    files: &[(String, Vec<u8>)],
) -> HashSet<String> {
    let mut ids = HashSet::new();
    for p in photos {
        src.check_text(problems, "alt", &p.alt);
        let id = p.id.get_ref();
        if !ids.insert(id.clone()) {
            problems.push(Problem::new(
                src.line(&p.id),
                format!("id「{id}」がもうあります"),
            ));
        }
        if p.coats.get_ref().is_empty() {
            problems.push(Problem::new(src.line(&p.coats), "coats が空です"));
        }
        if p.coats
            .get_ref()
            .iter()
            .any(|c| !COATS.contains(&c.as_str()))
        {
            problems.push(Problem::new(
                src.line(&p.coats),
                "coats は kuro・kiji・mike のどれかです",
            ));
        }
        if !files.iter().any(|(name, _)| *name == format!("{id}.jpg")) {
            problems.push(Problem::new(
                src.line(&p.id),
                format!("content/cats/{id}.jpg がありません"),
            ));
        }
    }
    ids
}

/// モザイク・いちばん下・各ページの写真が、一覧にあるか確かめる。
fn check_places(src: &Source<'_>, problems: &mut Vec<Problem>, raw: &Raw, ids: &HashSet<String>) {
    if raw.mosaic.get_ref().len() != 4 {
        problems.push(Problem::new(
            src.line(&raw.mosaic),
            "mosaic はちょうど4枚です",
        ));
    }
    for id in raw.mosaic.get_ref() {
        if !ids.contains(id) {
            problems.push(Problem::new(
                src.line(&raw.mosaic),
                format!("mosaic の「{id}」が photo にありません"),
            ));
        }
    }
    if !ids.contains(raw.goodnight.get_ref()) {
        problems.push(Problem::new(
            src.line(&raw.goodnight),
            format!(
                "goodnight の「{}」が photo にありません",
                raw.goodnight.get_ref()
            ),
        ));
    }
    for (page, id) in raw.sections.get_ref() {
        if !SECTIONS.contains(&page.as_str()) {
            problems.push(Problem::new(
                src.line(&raw.sections),
                format!("sections に知らないページ「{page}」があります"),
            ));
        }
        if !ids.contains(id) {
            problems.push(Problem::new(
                src.line(&raw.sections),
                format!("sections.{page} の「{id}」が photo にありません"),
            ));
        }
    }
    for page in SECTIONS {
        if !raw.sections.get_ref().contains_key(page) {
            problems.push(Problem::new(
                src.line(&raw.sections),
                format!("sections に {page} がありません"),
            ));
        }
    }
}

/// 写真のファイルが一覧に載っていて、メタデータが残っていないか確かめる。
fn check_files(problems: &mut Vec<Problem>, files: &[(String, Vec<u8>)], ids: &HashSet<String>) {
    for (name, bytes) in files {
        let Some(id) = name.strip_suffix(".jpg") else {
            problems.push(
                Problem::new(None, "写真は .jpg にしてください").in_file(format!("cats/{name}")),
            );
            continue;
        };
        if !ids.contains(id) {
            problems.push(
                Problem::new(None, "cats.toml に載っていません").in_file(format!("cats/{name}")),
            );
        }
        if let Some(kind) = metadata_in_jpeg(bytes) {
            problems.push(
                Problem::new(
                    None,
                    format!("{kind} が残っています。位置情報などのメタデータを消してください"),
                )
                .in_file(format!("cats/{name}")),
            );
        }
    }
}

/// JPEGに残っているメタデータの種類。なければ`None`。JPEGとして読めないときも知らせる。
#[must_use]
pub fn metadata_in_jpeg(bytes: &[u8]) -> Option<&'static str> {
    if bytes.get(..2) != Some(&[0xFF, 0xD8]) {
        return Some("JPEGではないデータ");
    }
    let mut i = 2;
    while i + 4 <= bytes.len() {
        if bytes[i] != 0xFF {
            return None;
        }
        let marker = bytes[i + 1];
        // SOS(画像のデータの始まり)まで来たら、もうメタデータはない
        if marker == 0xDA {
            return None;
        }
        let len = usize::from(u16::from_be_bytes([bytes[i + 2], bytes[i + 3]]));
        let body = bytes.get(i + 4..i + 2 + len).unwrap_or_default();
        match marker {
            0xE1 if body.starts_with(b"Exif\0") => return Some("EXIF"),
            0xE1 if body.starts_with(b"http://ns.adobe.com/xap/") => return Some("XMP"),
            0xED => return Some("IPTC"),
            _ => {}
        }
        i += 2 + len;
    }
    None
}
