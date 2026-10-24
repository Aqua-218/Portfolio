//! 検証で見つかった間違い。

use std::fmt;

/// 1つの間違い。行番号はファイル全体で数える(わからなければ`None`)。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    /// 間違いのあるファイル(`content/`からの道)。`None`なら、いま読んでいるファイル
    pub file: Option<String>,
    pub line: Option<usize>,
    pub message: String,
}

impl Problem {
    #[must_use]
    pub fn new(line: Option<usize>, message: impl Into<String>) -> Self {
        Self {
            file: None,
            line,
            message: message.into(),
        }
    }

    /// 読んでいるファイルとは別のファイルの間違いにする。
    #[must_use]
    pub fn in_file(mut self, file: impl Into<String>) -> Self {
        self.file = Some(file.into());
        self
    }
}

impl fmt::Display for Problem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.line {
            Some(line) => write!(f, "{line}: {}", self.message),
            None => f.write_str(&self.message),
        }
    }
}

/// `` `name` ``のように囲まれた最初の名前。
fn quoted(s: &str) -> Option<&str> {
    let start = s.find('`')? + 1;
    let len = s[start..].find('`')?;
    Some(&s[start..start + len])
}

/// serdeやTOMLの英語のメッセージを、よく出るものだけ日本語にする。知らないものはそのまま返す。
#[must_use]
pub fn translate(message: &str) -> String {
    let m = message.trim();
    if m.starts_with("missing field")
        && let Some(name) = quoted(m)
    {
        return format!("{name} がありません");
    }
    if m.starts_with("unknown field")
        && let Some(name) = quoted(m)
    {
        return format!("知らない項目 {name} があります。書き間違いかもしれません");
    }
    if m.starts_with("duplicate field")
        && let Some(name) = quoted(m)
    {
        return format!("{name} が2回書かれています");
    }
    if let Some(rest) = m.strip_prefix("invalid type: ") {
        return format!("型が違います({rest})");
    }
    m.to_owned()
}
