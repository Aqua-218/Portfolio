//! イベント(`content/events/*.md`)を読んで検証する。

use crate::date::Date;
use crate::frontmatter;
use crate::problem::Problem;
use serde::Deserialize;
use serde_saphyr::Spanned;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Front {
    title: Spanned<String>,
    date: Spanned<String>,
    end: Option<Spanned<String>>,
    venue: Spanned<String>,
    tags: Option<Spanned<Vec<String>>>,
}

/// 検証したイベント。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Event {
    /// ファイル名(拡張子なし)
    pub slug: String,
    pub title: String,
    pub date: Date,
    pub end: Option<Date>,
    pub venue: String,
    pub tags: Vec<String>,
    /// 本文のMarkdown
    pub body: String,
}

fn line_of<T>(s: &Spanned<T>) -> Option<usize> {
    // frontmatterは2行目から始まる
    usize::try_from(s.referenced.line()).ok().map(|l| l + 1)
}

fn check_text(problems: &mut Vec<Problem>, field: &str, value: &Spanned<String>) {
    if value.value.trim().is_empty() {
        problems.push(Problem::new(line_of(value), format!("{field} が空です")));
    } else if value.value.trim() != value.value {
        problems.push(Problem::new(
            line_of(value),
            format!("{field} の前後に空白があります"),
        ));
    }
}

fn parse_date(problems: &mut Vec<Problem>, field: &str, value: &Spanned<String>) -> Option<Date> {
    let date = Date::parse(&value.value);
    if date.is_none() {
        problems.push(Problem::new(
            line_of(value),
            format!(
                "{field} は YYYY-MM-DD の形の、実在する日付にしてください(「{}」になっています)",
                value.value
            ),
        ));
    }
    date
}

/// 1つのイベントのファイルを読んで検証する。`slug`はファイル名(拡張子なし)。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(slug: &str, src: &str) -> Result<Event, Vec<Problem>> {
    let doc =
        frontmatter::parse::<Front>(src).map_err(|e| vec![Problem::new(e.line, e.message)])?;
    let front = doc.front;
    let mut problems = Vec::new();

    check_text(&mut problems, "title", &front.title);
    check_text(&mut problems, "venue", &front.venue);
    if front.venue.value.starts_with('@') || front.venue.value.starts_with('＠') {
        problems.push(Problem::new(
            line_of(&front.venue),
            "venue の先頭に「@」は書きません。ページで付けます",
        ));
    }

    let date = parse_date(&mut problems, "date", &front.date);
    let end = front
        .end
        .as_ref()
        .and_then(|end| parse_date(&mut problems, "end", end).map(|d| (d, end)));
    if let (Some(date), Some((end, at))) = (date, end)
        && end <= date
    {
        problems.push(Problem::new(
            line_of(at),
            format!("end({end})は date({date})より後の日付にしてください"),
        ));
    }
    if let Some(date) = date
        && !slug.starts_with(&format!("{date}-"))
    {
        problems.push(Problem::new(
            line_of(&front.date),
            format!("ファイル名を {date}- で始めてください(date と同じ日付)"),
        ));
    }

    let tags = front.tags.map(|t| (line_of(&t), t.value));
    if let Some((line, tags)) = &tags {
        if tags.len() > 1 {
            problems.push(Problem::new(*line, "tags は1つまでです"));
        }
        if tags.iter().any(|t| t.trim().is_empty()) {
            problems.push(Problem::new(*line, "tags に空のものがあります"));
        }
    }

    if doc.body.trim().is_empty() {
        problems.push(Problem::new(Some(doc.body_line), "本文が空です"));
    }

    match (problems.is_empty(), date) {
        (true, Some(date)) => Ok(Event {
            slug: slug.to_owned(),
            title: front.title.value,
            date,
            end: end.map(|(d, _)| d),
            venue: front.venue.value,
            tags: tags.map(|(_, t)| t).unwrap_or_default(),
            body: doc.body,
        }),
        _ => Err(problems),
    }
}

/// イベントを年度ごとにまとめる順(年度、日付、ファイル名の順)に並べる。
pub fn sort(events: &mut [Event]) {
    events.sort_by(|a, b| a.date.cmp(&b.date).then_with(|| a.slug.cmp(&b.slug)));
}
