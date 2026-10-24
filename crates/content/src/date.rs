//! 日付。`YYYY-MM-DD`と`YYYY-MM`を読む。

use std::fmt;

/// 実在する日付。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Date {
    pub year: u16,
    pub month: u8,
    pub day: u8,
}

const fn is_leap(year: u16) -> bool {
    (year.is_multiple_of(4) && !year.is_multiple_of(100)) || year.is_multiple_of(400)
}

/// その月の日数。
#[must_use]
pub const fn days_in_month(year: u16, month: u8) -> u8 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if is_leap(year) => 29,
        2 => 28,
        _ => 0,
    }
}

fn digits<T: std::str::FromStr>(s: &str, len: usize) -> Option<T> {
    (s.len() == len && s.bytes().all(|b| b.is_ascii_digit()))
        .then(|| s.parse().ok())
        .flatten()
}

impl Date {
    /// `YYYY-MM-DD`を読む。形が違うか、実在しない日付なら`None`。
    #[must_use]
    pub fn parse(s: &str) -> Option<Self> {
        let mut parts = s.split('-');
        let (Some(y), Some(m), Some(d), None) =
            (parts.next(), parts.next(), parts.next(), parts.next())
        else {
            return None;
        };
        let year = digits::<u16>(y, 4)?;
        let month = digits::<u8>(m, 2)?;
        let day = digits::<u8>(d, 2)?;
        (day >= 1 && day <= days_in_month(year, month)).then_some(Self { year, month, day })
    }

    /// 年度(4月に始まる年)。
    #[must_use]
    pub const fn fiscal_year(self) -> u16 {
        if self.month >= 4 {
            self.year
        } else {
            self.year - 1
        }
    }
}

impl fmt::Display for Date {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

/// 実在する年月。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct YearMonth {
    pub year: u16,
    pub month: u8,
}

impl YearMonth {
    /// `YYYY-MM`を読む。
    #[must_use]
    pub fn parse(s: &str) -> Option<Self> {
        let (y, m) = s.split_once('-')?;
        let year = digits::<u16>(y, 4)?;
        let month = digits::<u8>(m, 2)?;
        (1..=12).contains(&month).then_some(Self { year, month })
    }
}
