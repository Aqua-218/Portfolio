use content::problem::Problem;
use content::{affiliations, shelf, skills, work};

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

const SKILLS: &str = r#"
[[skill]]
name = "Rust"
category = "lang"
level = "main"
icons = ["simpleicons:rust"]
coat = "mike"

[[skill]]
name = "TypeScript / JavaScript"
category = "lang"
level = "often"
icons = ["simpleicons:typescript", "simpleicons:javascript"]

[[skill]]
name = "Lean"
category = "formal"
level = "main"
icons = ["local:lean"]
coat = "kiji"

[[skill]]
name = "アセンブリ"
category = "lang"
level = "can"

[[tool]]
group = "分野"
name = "形式検証"
"#;

#[test]
fn スキルを読める() {
    let s = skills::parse(SKILLS).unwrap();
    assert_eq!(s.skills.len(), 4);
    assert_eq!(s.skills[0].level, skills::Level::Main);
    assert_eq!(s.skills[0].coat.as_deref(), Some("mike"));
    assert_eq!(s.skills[2].category, skills::Category::Formal);
    assert_eq!(s.skills[3].icons, Vec::<String>::new());
    assert_eq!(s.tools[0].group, "分野");
}

#[test]
fn レベルは4つしか通さない() {
    let src = "[[skill]]\nname = \"Go\"\ncategory = \"lang\"\nlevel = \"expert\"\n";
    let problems = skills::parse(src).unwrap_err();
    assert_problems(&problems, &[(Some(4), "main・often・can・touched")]);
}

#[test]
fn レベルの高い順に並べる() {
    let src = r#"
[[skill]]
name = "Go"
category = "lang"
level = "can"

[[skill]]
name = "Python"
category = "lang"
level = "often"
"#;
    let problems = skills::parse(src).unwrap_err();
    assert_problems(&problems, &[(Some(10), "高い順")]);
}

#[test]
fn categoryが違えば順は別に数える() {
    let src = r#"
[[skill]]
name = "Go"
category = "lang"
level = "can"

[[skill]]
name = "Lean"
category = "formal"
level = "main"
coat = "kiji"
"#;
    assert!(skills::parse(src).is_ok());
}

#[test]
fn mainにはcoatがいりそれ以外にはいらない() {
    let src = r#"
[[skill]]
name = "Rust"
category = "lang"
level = "main"

[[skill]]
name = "Go"
category = "lang"
level = "can"
coat = "kuro"
"#;
    let problems = skills::parse(src).unwrap_err();
    assert_problems(
        &problems,
        &[(Some(5), "coat"), (Some(11), "main のスキルにだけ")],
    );
}

#[test]
fn アイコンの形() {
    let src = r#"
[[skill]]
name = "Go"
category = "lang"
level = "can"
icons = ["go", "simpleicons:", "local:A"]
"#;
    let problems = skills::parse(src).unwrap_err();
    assert_eq!(problems.len(), 4, "{problems:#?}");
    assert!(problems.iter().all(|p| p.line == Some(6)));
}

#[test]
fn 同じ名前のスキル() {
    let src = r#"
[[skill]]
name = "Go"
category = "lang"
level = "can"

[[skill]]
name = "Go"
category = "lang"
level = "can"
"#;
    let problems = skills::parse(src).unwrap_err();
    assert_problems(&problems, &[(Some(8), "もうあります")]);
}

#[test]
fn 知らない項目はtomlのエラーで止める() {
    let src = "[[skill]]\nname = \"Go\"\ncategory = \"lang\"\nlevl = \"can\"\n";
    let problems = skills::parse(src).unwrap_err();
    assert_eq!(problems.len(), 1);
    assert_eq!(problems[0].line, Some(4), "{problems:#?}");
}

const WORK: &str = r#"
[[company]]
slug = "transwith"
prefix = "株式会社"
name = "TransWith"
url = "https://transwith.jp/"
description = "中小企業向けに、SES、IT顧問（CIO代行・情シス支援）、システム開発やプロダクト導入の支援をしている会社です。"
tagline = "中小企業のDXを、AIとプロフェッショナル人材で実現する。"
founded = "2022-11"
location = "東京都港区"

[[company]]
slug = "epicai"
prefix = "株式会社"
name = "EpicAI"
url = "https://epicai.co.jp/"
description = "建設・製造・インフラ産業を中心に、AIエージェントを実際の業務に組み込むチームです。"
founded = "2023-12"
location = "東京都文京区"
"#;

#[test]
fn 会社を読める() {
    let c = work::parse(WORK).unwrap();
    assert_eq!(c.len(), 2);
    assert_eq!(c[0].founded.year, 2022);
    assert_eq!(c[0].founded.month, 11);
    assert_eq!(c[1].tagline, None);
}

#[test]
fn 会社の間違い() {
    let src = r#"
[[company]]
slug = "Trans With"
name = "TransWith"
url = "http://transwith.jp/"
description = "説明"
founded = "2022-13"
location = ""
"#;
    let problems = work::parse(src).unwrap_err();
    assert_problems(
        &problems,
        &[
            (Some(3), "slug"),
            (Some(5), "https://"),
            (Some(8), "location が空"),
            (Some(7), "YYYY-MM"),
        ],
    );
}

#[test]
fn slugが重なる() {
    let src = WORK.replace("slug = \"epicai\"", "slug = \"transwith\"");
    let problems = work::parse(&src).unwrap_err();
    assert_problems(&problems, &[(Some(13), "もうあります")]);
}

#[test]
fn 所属を読める() {
    let src = r#"
[[affiliation]]
group = "org"
name = "情報処理学会"
tag = "会員"
description = "情報処理の分野を扱う学会です。"

[[affiliation]]
group = "contest"
name = "セキュリティ・キャンプ全国大会 2026"
tag = "Z1ゼミ 修了生"
description = "若い世代向けの情報セキュリティの合宿です。"
"#;
    let a = affiliations::parse(src).unwrap();
    assert_eq!(a[0].group, affiliations::Group::Org);
    assert_eq!(a[1].group, affiliations::Group::Contest);
    assert_eq!(a[0].url, None);
}

#[test]
fn 所属の間違い() {
    let src = r#"
[[affiliation]]
group = "club"
name = "研究部"
url = "nnn.ed.jp"
tag = "6期生"
description = "説明"
"#;
    let problems = affiliations::parse(src).unwrap_err();
    assert_problems(
        &problems,
        &[(Some(3), "org・contest"), (Some(5), "https://")],
    );
}

#[test]
fn 作品棚はkindが違えば同じ名前でもよい() {
    let src = r#"
[[work]]
kind = "anime"
title = "本好きの下剋上"
pick = true

[[work]]
kind = "book"
title = "本好きの下剋上"

[[work]]
kind = "anime"
title = "夏目友人帳"
note = "今出てるやつは全部"
"#;
    let w = shelf::parse(src).unwrap();
    assert_eq!(w.len(), 3);
    assert!(w[0].pick);
    assert!(!w[1].pick);
    assert_eq!(w[2].note.as_deref(), Some("今出てるやつは全部"));
}

#[test]
fn 作品棚の間違い() {
    let src = r#"
[[work]]
kind = "movie"
title = "SPEC"

[[work]]
kind = "drama"
title = "JIN-仁-"

[[work]]
kind = "drama"
title = "JIN-仁-"
"#;
    let problems = shelf::parse(src).unwrap_err();
    assert_problems(
        &problems,
        &[(Some(3), "drama・anime・book"), (Some(12), "もうあります")],
    );
}
