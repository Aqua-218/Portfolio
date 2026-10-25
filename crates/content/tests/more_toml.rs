use content::cats::{self, metadata_in_jpeg};
use content::events;
use content::problem::Problem;
use content::{event_years, licenses, profile, skills};
use std::collections::BTreeSet;

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

/// マーカーだけを並べたJPEG。`segments`は(マーカー, 中身)。
fn jpeg(segments: &[(u8, &[u8])]) -> Vec<u8> {
    let mut out = vec![0xFF, 0xD8];
    for (marker, body) in segments {
        out.extend_from_slice(&[0xFF, *marker]);
        out.extend_from_slice(&u16::try_from(body.len() + 2).unwrap().to_be_bytes());
        out.extend_from_slice(body);
    }
    out.extend_from_slice(&[0xFF, 0xDA, 0x00, 0x02, 0x12, 0x34, 0xFF, 0xD9]);
    out
}

fn clean_jpeg() -> Vec<u8> {
    jpeg(&[(0xE0, b"JFIF\0\x01\x01\0\0\x01\0\x01\0\0")])
}

const PROFILE: &str = r#"
name = "小峯 圭也"
romaji = "Komine Keiya"
location = "Tochigi, JP"
timezone = "Asia/Tokyo"

[[fact]]
label = "名前"
value = "小峯 圭也"
sub = "Komine Keiya"
wide = true

[[fact]]
label = "部活"
value = "研究部"
sub = "6期生・情報科学グループ"
sub_short = "6期生"

[[career]]
year = 2025
title = "U-22 プログラミング・コンテスト 2025"
note = "経済産業省商務情報政策局長賞を受賞"

[[career]]
year = 2026
title = "N高等学校に入学"
"#;

#[test]
fn プロフィールを読める() {
    let p = profile::parse(PROFILE).unwrap();
    assert_eq!(p.name, "小峯 圭也");
    assert!(p.facts[0].wide);
    assert!(!p.facts[1].wide);
    assert_eq!(p.facts[1].sub_short.as_deref(), Some("6期生"));
    assert_eq!(p.career[1].note, None);
}

#[test]
fn 経歴は古い順() {
    let src = PROFILE.replace("year = 2026", "year = 2024");
    let problems = profile::parse(&src).unwrap_err();
    assert_problems(&problems, &[(Some(25), "古い順")]);
}

#[test]
fn subなしのsub_short() {
    let src = PROFILE.replace("sub = \"6期生・情報科学グループ\"\n", "");
    let problems = profile::parse(&src).unwrap_err();
    assert_problems(&problems, &[(Some(16), "sub があるときだけ")]);
}

#[test]
fn タイムゾーンの形() {
    let src = PROFILE.replace("Asia/Tokyo", "JST");
    let problems = profile::parse(&src).unwrap_err();
    assert_problems(&problems, &[(Some(5), "IANA")]);
}

fn event(slug: &str, date: &str) -> events::Event {
    let src = format!("---\ntitle: x\ndate: {date}\nvenue: y\n---\n本文\n");
    events::parse(slug, &src).unwrap()
}

#[test]
fn 年度の添え書き() {
    let notes = event_years::parse(
        "[[year]]\nyear = 2025\nnote = \"中学生のころ（N中等部ではなかったです）\"\n",
    )
    .unwrap();
    // 2026年1月のイベントは2025年度
    let events = [event("2026-01-07-qiita", "2026-01-07")];
    assert_eq!(event_years::check_against(&notes, &events), vec![]);

    let events = [event("2026-04-07-x", "2026-04-07")];
    let problems = event_years::check_against(&notes, &events);
    assert_problems(&problems, &[(Some(2), "2025年度のイベントがありません")]);
}

#[test]
fn 同じ年度が2つ() {
    let src = "[[year]]\nyear = 2025\nnote = \"a\"\n\n[[year]]\nyear = 2025\nnote = \"b\"\n";
    let problems = event_years::parse(src).unwrap_err();
    assert_problems(&problems, &[(Some(6), "もうあります")]);
}

const LICENSES: &str = r#"
[[license]]
group = "icons"
name = "Lean のロゴ"
url = "https://github.com/leanprover/lean4"
license = "Apache-2.0"
note = "Skills ページの Lean のアイコンに使っています。"
icons = ["lean"]

[[license]]
group = "others"
name = "猫の写真"
note = "サイト内の写真は、すべて本人が用意した猫の写真です。"
"#;

#[test]
fn ライセンスを読める() {
    let l = licenses::parse(LICENSES).unwrap();
    assert_eq!(l[0].group, licenses::Group::Icons);
    assert_eq!(l[0].icons, ["lean"]);
    assert_eq!(l[1].license, None);
}

#[test]
fn ライセンスの間違い() {
    let src = LICENSES.replace("group = \"others\"", "group = \"photos\"");
    let problems = licenses::parse(&src).unwrap_err();
    assert_problems(&problems, &[(Some(11), "icons・fonts・site・others")]);
}

#[test]
fn ライセンスの原文を結びつける() {
    let src = LICENSES.replace(
        "icons = [\"lean\"]",
        "icons = [\"lean\"]\ntext = \"apache-2\"",
    );
    let l = licenses::parse(&src).unwrap();
    assert_eq!(l[0].text.as_deref(), Some("apache-2"));
    assert_eq!(l[1].text, None);
    // 原文のファイルがあればよい
    let have = BTreeSet::from(["apache-2".to_owned()]);
    assert_eq!(licenses::check_texts(&src, &have), Vec::<Problem>::new());
    assert_problems(
        &licenses::check_texts(&src, &BTreeSet::new()),
        &[(Some(9), "content/licenses/apache-2.txt")],
    );
}

#[test]
fn ライセンスの原文のidとlicenseの名前() {
    // URLやパスをずらす字・ドット・大文字は使えない
    for id in ["../secret", "CC-BY-4.0", "a/b", ""] {
        let bad = LICENSES.replace(
            "icons = [\"lean\"]",
            &format!("icons = [\"lean\"]\ntext = \"{id}\""),
        );
        assert_problems(
            &licenses::parse(&bad).unwrap_err(),
            &[(Some(9), "英小文字・数字・ハイフン")],
        );
    }
    // 原文があるなら、リンクの名前(license)もいる
    let no_name = LICENSES.replace(
        "note = \"サイト内の写真は、すべて本人が用意した猫の写真です。\"",
        "note = \"サイト内の写真は、すべて本人が用意した猫の写真です。\"\ntext = \"mit\"",
    );
    assert_problems(
        &licenses::parse(&no_name).unwrap_err(),
        &[(Some(14), "license も書いてください")],
    );
}

#[test]
fn localのアイコンはファイルとライセンスがいる() {
    let s = skills::parse(
        r#"
[[skill]]
name = "Lean"
category = "formal"
level = "main"
icons = ["local:lean"]
coat = "kiji"

[[tool]]
group = "ツール"
name = "VS Code"
icons = ["local:vscode"]
"#,
    )
    .unwrap();
    let licensed = BTreeSet::from(["lean".to_owned()]);
    let files = BTreeSet::from(["lean".to_owned(), "vscode".to_owned()]);
    let problems = skills::check_local_icons(&s, &licensed, &files);
    assert_problems(&problems, &[(Some(11), "licenses.toml")]);

    let files = BTreeSet::from(["vscode".to_owned()]);
    let licensed = BTreeSet::from(["lean".to_owned(), "vscode".to_owned()]);
    let problems = skills::check_local_icons(&s, &licensed, &files);
    assert_problems(&problems, &[(Some(3), "lean.svg がありません")]);
}

const CATS: &str = r#"
mosaic = ["a", "b", "c", "d"]
goodnight = "d"

[sections]
about = "a"
skills = "b"
work = "c"
affiliations = "d"
events = "a"
shelf = "b"
stack = "c"
license = "d"
blog = "a"

[[photo]]
id = "a"
alt = "三毛の子猫"
coats = ["mike", "kuro"]

[[photo]]
id = "b"
alt = "黒猫"
coats = ["kuro"]

[[photo]]
id = "c"
alt = "キジ白"
coats = ["kiji"]

[[photo]]
id = "d"
alt = "三毛猫"
coats = ["mike"]
"#;

fn files(names: &[&str]) -> Vec<(String, Vec<u8>)> {
    names
        .iter()
        .map(|n| ((*n).to_owned(), clean_jpeg()))
        .collect()
}

#[test]
fn 写真を読める() {
    let c = cats::parse(CATS, &files(&["a.jpg", "b.jpg", "c.jpg", "d.jpg"])).unwrap();
    assert_eq!(c.photos.len(), 4);
    assert_eq!(c.sections["about"], "a");
}

#[test]
fn 写真のファイルが足りないか余っている() {
    let problems = cats::parse(CATS, &files(&["a.jpg", "b.jpg", "c.jpg", "e.jpg"])).unwrap_err();
    assert_problems(
        &problems,
        &[
            (Some(32), "d.jpg がありません"),
            (None, "cats.toml に載っていません"),
        ],
    );
}

#[test]
fn モザイクは4枚で載っている写真だけ() {
    let src = CATS.replace(
        "mosaic = [\"a\", \"b\", \"c\", \"d\"]",
        "mosaic = [\"a\", \"b\", \"x\"]",
    );
    let problems = cats::parse(&src, &files(&["a.jpg", "b.jpg", "c.jpg", "d.jpg"])).unwrap_err();
    assert_problems(&problems, &[(Some(2), "ちょうど4枚"), (Some(2), "「x」")]);
}

#[test]
fn ページの写真が足りない() {
    let src = CATS.replace("license = \"d\"\n", "");
    let problems = cats::parse(&src, &files(&["a.jpg", "b.jpg", "c.jpg", "d.jpg"])).unwrap_err();
    assert_problems(&problems, &[(Some(5), "license がありません")]);
}

#[test]
fn 位置情報が残った写真は通さない() {
    let mut f = files(&["a.jpg", "b.jpg", "c.jpg"]);
    f.push((
        "d.jpg".to_owned(),
        jpeg(&[(0xE1, b"Exif\0\0MM\0*GPSLatitude")]),
    ));
    let problems = cats::parse(CATS, &f).unwrap_err();
    assert_problems(&problems, &[(None, "EXIF が残っています")]);
    assert_eq!(problems[0].file.as_deref(), Some("cats/d.jpg"));
}

#[test]
fn メタデータの見分け() {
    assert_eq!(metadata_in_jpeg(&clean_jpeg()), None);
    assert_eq!(
        metadata_in_jpeg(&jpeg(&[(0xE1, b"Exif\0\0data")])),
        Some("EXIF")
    );
    assert_eq!(
        metadata_in_jpeg(&jpeg(&[(0xE1, b"http://ns.adobe.com/xap/1.0/\0<x/>")])),
        Some("XMP")
    );
    assert_eq!(
        metadata_in_jpeg(&jpeg(&[(0xED, b"Photoshop 3.0\0")])),
        Some("IPTC")
    );
    assert_eq!(metadata_in_jpeg(b"\x89PNG"), Some("JPEGではないデータ"));
}
