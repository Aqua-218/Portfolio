use content::frontmatter::{Error, parse, split};
use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
struct Front {
    title: String,
    tags: Option<Vec<String>>,
}

#[test]
fn frontmatterと本文を分けて読める() {
    let src = "---\ntitle: ねこ\ntags: [黒, 三毛]\n---\n本文の1行目\n本文の2行目\n";
    let doc = parse::<Front>(src).unwrap();
    assert_eq!(
        doc.front,
        Front {
            title: "ねこ".to_owned(),
            tags: Some(vec!["黒".to_owned(), "三毛".to_owned()]),
        }
    );
    assert_eq!(doc.body, "本文の1行目\n本文の2行目\n");
    assert_eq!(doc.body_line, 5);
}

#[test]
fn 本文がなくてもよい() {
    let doc = parse::<Front>("---\ntitle: ねこ\n---\n").unwrap();
    assert_eq!(doc.body, "");
}

#[test]
fn crlfとbomも読める() {
    let src = "\u{feff}---\r\ntitle: ねこ\r\n---\r\n本文\r\n";
    let doc = parse::<Front>(src).unwrap();
    assert_eq!(doc.front.title, "ねこ");
    assert_eq!(doc.body, "本文\r\n");
}

#[test]
fn 本文の中の区切り線はそのまま残す() {
    let src = "---\ntitle: ねこ\n---\n上\n---\n下\n";
    let (front, body, line) = split(src).unwrap();
    assert_eq!(front, "title: ねこ\n");
    assert_eq!(body, "上\n---\n下\n");
    assert_eq!(line, 4);
}

#[test]
fn frontmatterがなければエラー() {
    let err = parse::<Front>("title: ねこ\n").unwrap_err();
    assert_eq!(err.line, Some(1));
}

#[test]
fn 閉じていなければエラー() {
    let err = parse::<Front>("---\ntitle: ねこ\n").unwrap_err();
    assert!(err.message.contains("閉じる"), "{err}");
}

#[test]
fn 足りない項目はファイル全体の行番号で出る() {
    // titleがない。frontmatterの1行目=ファイルの2行目
    let err = parse::<Front>("---\ntags: [黒]\n---\n").unwrap_err();
    assert_eq!(
        err,
        Error {
            line: Some(2),
            message: "missing field `title`".to_owned(),
        }
    );
}

#[test]
fn 知らない項目と型の違いもファイル全体の行番号で出る() {
    let err = parse::<Front>("---\ntitle: ねこ\ntag: [黒]\n---\n").unwrap_err();
    assert_eq!(err.line, Some(3));
    assert!(err.message.contains("unknown field `tag`"), "{err}");

    let err = parse::<Front>("---\ntitle: ねこ\ntags: 3\n---\n").unwrap_err();
    assert_eq!(err.line, Some(3));
}

#[test]
fn noは真偽値にならない() {
    // YAML 1.1だとnoがfalseになってしまう(ノルウェー問題)
    let doc = parse::<Front>("---\ntitle: no\n---\n").unwrap();
    assert_eq!(doc.front.title, "no");
}
