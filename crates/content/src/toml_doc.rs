//! TOMLのファイルを読む。行番号を出すための道具もここに置く。

use crate::problem::Problem;
use serde::de::DeserializeOwned;
use toml::Spanned;

/// 読んでいるTOMLの元の文字列。位置から行番号を数えるのに使う。
pub struct Source<'a> {
    src: &'a str,
}

impl<'a> Source<'a> {
    #[must_use]
    pub const fn new(src: &'a str) -> Self {
        Self { src }
    }

    /// バイト位置が何行目か(1から数える)。
    #[must_use]
    pub fn line_at(&self, offset: usize) -> usize {
        let end = offset.min(self.src.len());
        // 改行で区切った数が、そのまま行番号になる
        self.src.as_bytes()[..end].split(|&b| b == b'\n').count()
    }

    /// 値の行。
    #[must_use]
    pub fn line<T>(&self, value: &Spanned<T>) -> Option<usize> {
        Some(self.line_at(value.span().start))
    }

    /// TOMLを`T`として読む。
    ///
    /// # Errors
    ///
    /// TOMLとして読めないとき、`T`の形に合わないとき。
    pub fn parse<T: DeserializeOwned>(&self) -> Result<T, Problem> {
        toml::from_str(self.src).map_err(|e| {
            Problem::new(
                e.span().map(|s| self.line_at(s.start)),
                e.message().trim().to_owned(),
            )
        })
    }

    /// 文字列が空でなく、前後に空白がないか確かめる。
    pub fn check_text(&self, problems: &mut Vec<Problem>, field: &str, value: &Spanned<String>) {
        let v = value.get_ref();
        if v.trim().is_empty() {
            problems.push(Problem::new(self.line(value), format!("{field} が空です")));
        } else if v.trim() != v {
            problems.push(Problem::new(
                self.line(value),
                format!("{field} の前後に空白があります"),
            ));
        }
    }

    /// 省ける文字列。あれば`check_text`と同じことを確かめる。
    pub fn check_opt_text(
        &self,
        problems: &mut Vec<Problem>,
        field: &str,
        value: Option<&Spanned<String>>,
    ) {
        if let Some(v) = value {
            self.check_text(problems, field, v);
        }
    }

    /// `https://`で始まるURLか確かめる。
    pub fn check_url(&self, problems: &mut Vec<Problem>, field: &str, value: &Spanned<String>) {
        let v = value.get_ref();
        let ok = v
            .strip_prefix("https://")
            .is_some_and(|rest| !rest.is_empty() && !rest.contains(char::is_whitespace));
        if !ok {
            problems.push(Problem::new(
                self.line(value),
                format!("{field} は https:// で始まるURLにしてください"),
            ));
        }
    }

    /// 決まった値のどれかか確かめ、合っていればその値を返す。
    pub fn check_one_of<'v>(
        &self,
        problems: &mut Vec<Problem>,
        field: &str,
        value: &Spanned<String>,
        allowed: &[&'v str],
    ) -> Option<&'v str> {
        let found = allowed.iter().find(|a| **a == value.get_ref()).copied();
        if found.is_none() {
            problems.push(Problem::new(
                self.line(value),
                format!("{field} は {} のどれかです", allowed.join("・")),
            ));
        }
        found
    }
}

/// `simpleicons:<slug>`か`local:<名前>`か確かめる。
pub fn check_icons(
    src: &Source<'_>,
    problems: &mut Vec<Problem>,
    field: &str,
    icons: Option<&Spanned<Vec<String>>>,
) {
    let Some(icons) = icons else { return };
    if icons.get_ref().len() > 2 {
        problems.push(Problem::new(
            src.line(icons),
            format!("{field} は2つまでです"),
        ));
    }
    for icon in icons.get_ref() {
        let ok = icon
            .strip_prefix("simpleicons:")
            .or_else(|| icon.strip_prefix("local:"))
            .is_some_and(|name| {
                !name.is_empty()
                    && name
                        .bytes()
                        .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
            });
        if !ok {
            problems.push(Problem::new(
                src.line(icons),
                format!(
                    "{field} の「{icon}」は simpleicons:<slug> か local:<名前> の形にしてください"
                ),
            ));
        }
    }
}
