//! ブログの記事(`content/blog/*.md`)を読んで検証する。
//!
//! frontmatterはQiita CLI(`npx qiita`)と同じ形にする。同じファイルをQiita CLIにもそのまま使える。
//! <https://github.com/increments/qiita-cli>

use crate::frontmatter;
use crate::problem::Problem;
use serde::Deserialize;
use serde::Serialize;
use serde_saphyr::Spanned;
use ts_rs::TS;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Front {
    title: Spanned<String>,
    tags: Spanned<Vec<String>>,
    #[serde(default)]
    private: bool,
    /// Qiitaで最後に更新した日時。まだ出していなければ空
    #[serde(default)]
    updated_at: Option<Spanned<String>>,
    /// Qiitaの記事のid。まだ出していなければnull
    #[serde(default)]
    id: Option<Spanned<String>>,
    #[serde(default)]
    organization_url_name: Option<String>,
    #[serde(default)]
    slide: bool,
    /// trueならQiitaには出さない(サイトだけ)
    #[serde(default, rename = "ignorePublish")]
    ignore_publish: bool,
}

/// 検証した記事。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Post {
    /// ファイル名(拡張子なし)。URLに使う
    pub slug: String,
    pub title: String,
    pub tags: Vec<String>,
    /// Qiitaの限定公開。サイトには出さない
    pub private: bool,
    /// Qiitaで最後に更新した日時(ISO 8601)。まだ出していなければNone
    pub updated_at: Option<String>,
    /// Qiitaの記事のid。まだ出していなければNone
    pub id: Option<String>,
    pub organization_url_name: Option<String>,
    pub slide: bool,
    /// Qiitaには出さない
    pub ignore_publish: bool,
    /// 本文のMarkdown(Qiitaの記法)
    pub body: String,
}

/// 記法の見本のページ(`/blog/sample/`)のURL。記事のファイル名には使えない
pub const SAMPLE: &str = "sample";

/// Qiitaのタグは1〜5個
const MAX_TAGS: usize = 5;

fn line_of<T>(s: &Spanned<T>) -> Option<usize> {
    // frontmatterは2行目から始まる
    usize::try_from(s.referenced.line()).ok().map(|l| l + 1)
}

/// ファイル名に使える字(URLにそのまま入る)
fn valid_slug(slug: &str) -> bool {
    !slug.is_empty()
        && slug
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// Qiitaの記事のid(16進の20字)
fn valid_id(id: &str) -> bool {
    id.len() == 20 && id.bytes().all(|b| b.is_ascii_hexdigit())
}

/// `2024-01-02T03:04:05+09:00`の形(Qiitaが返すもの)
fn valid_datetime(s: &str) -> bool {
    let b = s.as_bytes();
    let digits =
        |r: std::ops::Range<usize>| b.get(r).is_some_and(|x| x.iter().all(u8::is_ascii_digit));
    b.len() == 25
        && digits(0..4)
        && b[4] == b'-'
        && digits(5..7)
        && b[7] == b'-'
        && digits(8..10)
        && b[10] == b'T'
        && digits(11..13)
        && b[13] == b':'
        && digits(14..16)
        && b[16] == b':'
        && digits(17..19)
        && (b[19] == b'+' || b[19] == b'-')
        && digits(20..22)
        && b[22] == b':'
        && digits(23..25)
}

fn check_tags(problems: &mut Vec<Problem>, tags: &Spanned<Vec<String>>) {
    let line = line_of(tags);
    let list = &tags.value;
    if list.is_empty() || list.len() > MAX_TAGS {
        problems.push(Problem::new(line, "tags は1〜5個です(Qiitaと同じ)"));
    }
    if list.iter().any(|t| t.trim().is_empty()) {
        problems.push(Problem::new(line, "tags に空のものがあります"));
    }
    if list.iter().any(|t| t.chars().any(char::is_whitespace)) {
        problems.push(Problem::new(line, "tags の名前に空白は入れられません"));
    }
    let mut seen: Vec<String> = Vec::new();
    for t in list {
        let key = t.to_lowercase();
        if seen.contains(&key) {
            problems.push(Problem::new(line, format!("tags の「{t}」が2つあります")));
        }
        seen.push(key);
    }
}

/// 1つの記事のファイルを読んで検証する。`slug`はファイル名(拡張子なし)。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(slug: &str, src: &str) -> Result<Post, Vec<Problem>> {
    let doc =
        frontmatter::parse::<Front>(src).map_err(|e| vec![Problem::new(e.line, e.message)])?;
    let front = doc.front;
    let mut problems = Vec::new();

    if slug == SAMPLE {
        problems.push(Problem::new(
            None,
            "ファイル名 sample は、記法の見本のページ(/blog/sample/)で使うので使えません",
        ));
    }
    if !valid_slug(slug) {
        problems.push(Problem::new(
            None,
            "ファイル名は英数字・ハイフン・アンダースコアにしてください(URLに使います)",
        ));
    }
    if front.title.value.trim().is_empty() {
        problems.push(Problem::new(line_of(&front.title), "title が空です"));
    } else if front.title.value.trim() != front.title.value {
        problems.push(Problem::new(
            line_of(&front.title),
            "title の前後に空白があります",
        ));
    }
    check_tags(&mut problems, &front.tags);

    // Qiita CLIは、まだ出していない記事では updated_at を '' にする
    let updated_at = front.updated_at.filter(|u| !u.value.is_empty());
    if let Some(u) = &updated_at
        && !valid_datetime(&u.value)
    {
        problems.push(Problem::new(
            line_of(u),
            format!(
                "updated_at は 2024-01-02T03:04:05+09:00 の形にしてください(「{}」になっています)",
                u.value
            ),
        ));
    }
    if let Some(id) = &front.id
        && !valid_id(&id.value)
    {
        problems.push(Problem::new(
            line_of(id),
            "id はQiitaの記事のid(16進の20字)か null にしてください",
        ));
    }
    if doc.body.trim().is_empty() {
        problems.push(Problem::new(Some(doc.body_line), "本文が空です"));
    }

    if !problems.is_empty() {
        return Err(problems);
    }
    Ok(Post {
        slug: slug.to_owned(),
        title: front.title.value,
        tags: front.tags.value,
        private: front.private,
        updated_at: updated_at.map(|u| u.value),
        id: front.id.map(|i| i.value),
        organization_url_name: front.organization_url_name,
        slide: front.slide,
        ignore_publish: front.ignore_publish,
        body: doc.body,
    })
}
