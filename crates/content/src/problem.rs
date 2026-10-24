//! 検証で見つかった間違い。

use std::fmt;

/// 1つの間違い。行番号はファイル全体で数える(わからなければ`None`)。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    pub line: Option<usize>,
    pub message: String,
}

impl Problem {
    #[must_use]
    pub fn new(line: Option<usize>, message: impl Into<String>) -> Self {
        Self {
            line,
            message: message.into(),
        }
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
