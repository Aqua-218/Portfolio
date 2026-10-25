use content::blog::parse;
use content::problem::Problem;

/// Qiita CLI(`npx qiita new`)が作るのと同じ形
const NEW: &str = "---
title: Rustで猫を描く
tags:
  - Rust
  - WebAssembly
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---
# はじめに

ドット絵の猫をRustで描きます。
";

/// Qiitaに出したあと(Qiita CLIがidとupdated_atを書き戻したもの)
const PUBLISHED: &str = "---
title: Rustで猫を描く
tags:
  - Rust
private: false
updated_at: '2026-10-25T13:00:00+09:00'
id: 0123456789abcdef0123
organization_url_name: null
slide: false
ignorePublish: false
---
本文
";

fn messages(problems: &[Problem]) -> Vec<String> {
    problems.iter().map(|p| p.message.clone()).collect()
}

#[test]
fn qiita_cliが作る形をそのまま読む() {
    let post = parse("rust-cat", NEW).unwrap();
    assert_eq!(post.slug, "rust-cat");
    assert_eq!(post.title, "Rustで猫を描く");
    assert_eq!(post.tags, ["Rust", "WebAssembly"]);
    assert_eq!(post.updated_at, None);
    assert_eq!(post.id, None);
    assert!(!post.private && !post.slide && !post.ignore_publish);
    assert_eq!(post.body, "# はじめに\n\nドット絵の猫をRustで描きます。\n");
}

#[test]
fn qiitaに出したあとのidと日時を読む() {
    let post = parse("rust-cat", PUBLISHED).unwrap();
    assert_eq!(post.id.as_deref(), Some("0123456789abcdef0123"));
    assert_eq!(
        post.updated_at.as_deref(),
        Some("2026-10-25T13:00:00+09:00")
    );
}

#[test]
fn titleとtagsだけでも読む() {
    let post = parse("a", "---\ntitle: t\ntags: [Rust]\n---\n本文\n").unwrap();
    assert!(!post.private && !post.ignore_publish);
}

#[test]
fn タグはqiitaと同じく1から5個() {
    let none = parse(
        "a",
        &NEW.replace("  - Rust\n  - WebAssembly\n", "  []\n")
            .replace("tags:\n  []", "tags: []"),
    )
    .unwrap_err();
    assert!(
        messages(&none).iter().any(|m| m.contains("1〜5個")),
        "{none:?}"
    );
    let six = NEW.replace(
        "  - Rust\n",
        "  - A\n  - B\n  - C\n  - D\n  - E\n  - Rust\n",
    );
    assert!(
        messages(&parse("a", &six).unwrap_err())
            .iter()
            .any(|m| m.contains("1〜5個"))
    );
}

#[test]
fn タグの空白と重なりを断る() {
    let space = parse("a", &NEW.replace("  - Rust\n", "  - VS Code\n")).unwrap_err();
    assert!(messages(&space).iter().any(|m| m.contains("空白")));
    let twice = parse("a", &NEW.replace("  - WebAssembly\n", "  - rust\n")).unwrap_err();
    assert!(messages(&twice).iter().any(|m| m.contains("2つあります")));
}

#[test]
fn idと日時の形を確かめる() {
    let id = parse("a", &PUBLISHED.replace("0123456789abcdef0123", "xyz")).unwrap_err();
    assert!(messages(&id).iter().any(|m| m.starts_with("id ")));
    let at = parse(
        "a",
        &PUBLISHED.replace("2026-10-25T13:00:00+09:00", "2026/10/25"),
    )
    .unwrap_err();
    assert!(messages(&at).iter().any(|m| m.starts_with("updated_at ")));
}

#[test]
fn ファイル名はurlに使える字だけ() {
    let err = parse("猫の記事", NEW).unwrap_err();
    assert!(messages(&err).iter().any(|m| m.contains("ファイル名")));
    assert!(parse("Rust_cat-01", NEW).is_ok());
}

#[test]
fn 知らない項目と空の本文を断る() {
    let unknown = parse(
        "a",
        &NEW.replace("slide: false", "slide: false\ndate: 2026-10-25"),
    )
    .unwrap_err();
    assert_eq!(unknown.len(), 1, "{unknown:?}");
    let empty = parse("a", "---\ntitle: t\ntags: [Rust]\n---\n\n").unwrap_err();
    assert!(messages(&empty).iter().any(|m| m.contains("本文が空")));
}
