use content::date::Date;
use content::events::{Event, parse, sort};
use content::problem::Problem;

const OK: &str = "---
title: セキュリティ・キャンプ全国大会
date: 2026-08-10
end: 2026-08-15
venue: 多摩 LINK FOREST
tags: [Z1ゼミ]
---
いやぁ〜〜楽しかったですよ、ほんとに。

濃い6日間でした。
";

fn date(year: u16, month: u8, day: u8) -> Date {
    Date { year, month, day }
}

/// 間違いの(行, メッセージの一部)を確かめる。
fn assert_problems(problems: &[Problem], expected: &[(Option<usize>, &str)]) {
    assert_eq!(problems.len(), expected.len(), "{problems:#?}");
    for (p, (line, text)) in problems.iter().zip(expected) {
        assert_eq!(p.line, *line, "{p}");
        assert!(
            p.message.contains(text),
            "「{}」に「{text}」がない",
            p.message
        );
    }
}

#[test]
fn 正しいイベントを読める() {
    let ev = parse("2026-08-10-seccamp", OK).unwrap();
    assert_eq!(
        ev,
        Event {
            slug: "2026-08-10-seccamp".to_owned(),
            title: "セキュリティ・キャンプ全国大会".to_owned(),
            date: date(2026, 8, 10),
            end: Some(date(2026, 8, 15)),
            venue: "多摩 LINK FOREST".to_owned(),
            tags: vec!["Z1ゼミ".to_owned()],
            body: "いやぁ〜〜楽しかったですよ、ほんとに。\n\n濃い6日間でした。\n".to_owned(),
        }
    );
}

#[test]
fn endとtagsは省ける() {
    let src = "---\ntitle: 入学式特別観覧\ndate: 2026-04-07\nvenue: 角川の某スタジオ\n---\n配信に私いるよ〜\n";
    let ev = parse("2026-04-07-nyugaku", src).unwrap();
    assert_eq!(ev.end, None);
    assert_eq!(ev.tags, Vec::<String>::new());
}

#[test]
fn dateがない() {
    let src = "---\ntitle: x\nvenue: y\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    // 足りない項目には決まった行がないので、frontmatterの最後の行を指す
    assert_problems(&problems, &[(Some(3), "date")]);
}

#[test]
fn 実在しない日付() {
    let src = "---\ntitle: x\ndate: 2026-02-30\nvenue: y\n---\n本文\n";
    let problems = parse("2026-02-30-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(3), "実在する日付")]);
}

#[test]
fn 日付の形が違う() {
    let src = "---\ntitle: x\ndate: 2026/4/7\nvenue: y\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(3), "YYYY-MM-DD")]);
}

#[test]
fn endがdateより前() {
    let src = "---\ntitle: x\ndate: 2026-08-10\nend: 2026-08-09\nvenue: y\n---\n本文\n";
    let problems = parse("2026-08-10-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(4), "より後")]);
}

#[test]
fn ファイル名の日付がdateと違う() {
    let problems = parse("2026-08-11-seccamp", OK).unwrap_err();
    assert_problems(&problems, &[(Some(3), "2026-08-10-")]);
}

#[test]
fn venueに先頭の記号を書いた() {
    let src = "---\ntitle: x\ndate: 2026-04-07\nvenue: \"@ 会場\"\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(4), "@")]);
}

#[test]
fn tagsが2つ以上() {
    let src = "---\ntitle: x\ndate: 2026-04-07\nvenue: y\ntags: [LT, 受賞]\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(5), "1つまで")]);
}

#[test]
fn 本文が空() {
    let src = "---\ntitle: x\ndate: 2026-04-07\nvenue: y\n---\n\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(6), "本文が空")]);
}

#[test]
fn タイトルが空() {
    let src = "---\ntitle: \"\"\ndate: 2026-04-07\nvenue: y\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(2), "title が空")]);
}

#[test]
fn 知らない項目と型の違い() {
    let src = "---\ntitle: x\ndate: 2026-04-07\nvenu: y\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_problems(&problems, &[(Some(4), "venu")]);

    let src = "---\ntitle: x\ndate: 2026-04-07\nvenue: y\ntags: LT\n---\n本文\n";
    let problems = parse("2026-04-07-x", src).unwrap_err();
    assert_eq!(problems[0].line, Some(5));
}

#[test]
fn 間違いはまとめて出る() {
    let src =
        "---\ntitle: x\ndate: 2026-08-10\nend: 2026-08-01\nvenue: \"@会場\"\ntags: [a, b]\n---\n";
    let problems = parse("2026-08-10-x", src).unwrap_err();
    assert_eq!(problems.len(), 4, "{problems:#?}");
}

#[test]
fn 日付とファイル名の順に並ぶ() {
    let mk = |slug: &str, d: Date| Event {
        slug: slug.to_owned(),
        title: String::new(),
        date: d,
        end: None,
        venue: String::new(),
        tags: vec![],
        body: String::new(),
    };
    let mut events = vec![
        mk("2026-07-27-b", date(2026, 7, 27)),
        mk("2026-01-07-qiita", date(2026, 1, 7)),
        mk("2026-07-27-a", date(2026, 7, 27)),
        mk("2025-11-30-u22", date(2025, 11, 30)),
    ];
    sort(&mut events);
    let order: Vec<_> = events.iter().map(|e| e.slug.as_str()).collect();
    assert_eq!(
        order,
        [
            "2025-11-30-u22",
            "2026-01-07-qiita",
            "2026-07-27-a",
            "2026-07-27-b"
        ]
    );
}
