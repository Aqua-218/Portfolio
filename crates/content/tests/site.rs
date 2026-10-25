use content::site::load;
use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};

/// 正しい中身を一式そろえた`content/`を作る。
fn fixture(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("content-site-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    let dir = root.join("content");
    for sub in ["events", "cats", "icons"] {
        fs::create_dir_all(dir.join(sub)).unwrap();
    }
    let w = |rel: &str, text: &str| fs::write(dir.join(rel), text).unwrap();
    w(
        "profile.toml",
        "name = \"小峯 圭也\"\nromaji = \"Komine Keiya\"\nlocation = \"Tochigi, JP\"\ntimezone = \"Asia/Tokyo\"\n\n[[fact]]\nlabel = \"名前\"\nvalue = \"小峯 圭也\"\n\n[[career]]\nyear = 2026\ntitle = \"N高等学校に入学\"\n",
    );
    w(
        "skills.toml",
        "[[skill]]\nname = \"Lean\"\ncategory = \"formal\"\nlevel = \"main\"\nicons = [\"local:lean\"]\ncoat = \"kiji\"\n",
    );
    w(
        "work.toml",
        "[[company]]\nslug = \"epicai\"\nname = \"EpicAI\"\nurl = \"https://epicai.co.jp/\"\ndescription = \"説明\"\nfounded = \"2023-12\"\nlocation = \"東京都文京区\"\n",
    );
    w(
        "affiliations.toml",
        "[[affiliation]]\ngroup = \"org\"\nname = \"情報処理学会\"\ntag = \"会員\"\ndescription = \"説明\"\n",
    );
    w(
        "events/2026-08-10-seccamp.md",
        "---\ntitle: セキュリティ・キャンプ全国大会\ndate: 2026-08-10\nvenue: 多摩 LINK FOREST\n---\n楽しかった\n",
    );
    w("events.toml", "[[year]]\nyear = 2026\nnote = \"高校生\"\n");
    w(
        "shelf.toml",
        "[[work]]\nkind = \"drama\"\ntitle = \"SPEC\"\npick = true\n",
    );
    let mut cats =
        String::from("mosaic = [\"a\", \"a\", \"a\", \"a\"]\ngoodnight = \"a\"\n\n[sections]\n");
    for page in [
        "about",
        "skills",
        "work",
        "affiliations",
        "events",
        "shelf",
        "stack",
        "license",
        "blog",
    ] {
        let _ = writeln!(cats, "{page} = \"a\"");
    }
    cats.push_str("\n[[photo]]\nid = \"a\"\nalt = \"三毛猫\"\ncoats = [\"mike\"]\n");
    w("cats.toml", &cats);
    fs::write(
        dir.join("cats/a.jpg"),
        [0xFF, 0xD8, 0xFF, 0xDA, 0x00, 0x02, 0xFF, 0xD9],
    )
    .unwrap();
    w("icons/lean.svg", "<svg/>");
    w(
        "licenses.toml",
        "[[license]]\ngroup = \"icons\"\nname = \"Lean のロゴ\"\nnote = \"説明\"\nicons = [\"lean\"]\n",
    );
    dir
}

/// 間違いを`content/...`から始まる形で返す。
fn report(dir: &Path) -> Vec<String> {
    let prefix = format!("{}/", dir.parent().unwrap().display());
    load(dir)
        .unwrap_err()
        .iter()
        .map(|p| p.to_string().replacen(&prefix, "", 1))
        .collect()
}

#[test]
fn 正しい中身を読める() {
    let dir = fixture("ok");
    let site = load(&dir).unwrap();
    assert_eq!(site.events.len(), 1);
    assert_eq!(site.cats.photos[0].id, "a");
    assert_eq!(site.skills.skills[0].name, "Lean");
    let _ = fs::remove_dir_all(dir.parent().unwrap());
}

#[test]
fn 間違いをファイル名と行番号でまとめて出す() {
    let dir = fixture("ng");
    // dateを消す
    fs::write(
        dir.join("events/2026-08-10-seccamp.md"),
        "---\ntitle: セキュリティ・キャンプ全国大会\nvenue: 多摩 LINK FOREST\n---\n楽しかった\n",
    )
    .unwrap();
    // レベルを書き間違える
    let skills = fs::read_to_string(dir.join("skills.toml")).unwrap();
    fs::write(
        dir.join("skills.toml"),
        skills.replace("\"main\"", "\"expert\""),
    )
    .unwrap();
    // 位置情報の残った写真
    fs::write(
        dir.join("cats/a.jpg"),
        [
            &[0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x08][..],
            b"Exif\0\0",
            &[0xFF, 0xDA, 0x00, 0x02],
        ]
        .concat(),
    )
    .unwrap();
    // ファイルを1つ消す
    fs::remove_file(dir.join("shelf.toml")).unwrap();

    let lines = report(&dir);
    assert_eq!(
        lines,
        [
            "content/skills.toml:4: level は main・often・can・touched のどれかです",
            "content/events/2026-08-10-seccamp.md:3: date がありません",
            "content/shelf.toml: ファイルがありません",
            "content/cats/a.jpg: EXIF が残っています。位置情報などのメタデータを消してください",
        ],
        "{lines:#?}"
    );
    let _ = fs::remove_dir_all(dir.parent().unwrap());
}

#[test]
fn 年度にイベントがないことも見つける() {
    let dir = fixture("years");
    fs::write(
        dir.join("events.toml"),
        "[[year]]\nyear = 2026\nnote = \"高校生\"\n\n[[year]]\nyear = 2025\nnote = \"中学生\"\n",
    )
    .unwrap();
    assert_eq!(
        report(&dir),
        ["content/events.toml:6: 2025年度のイベントがありません"]
    );
    let _ = fs::remove_dir_all(dir.parent().unwrap());
}
