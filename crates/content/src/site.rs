//! `content/`を丸ごと読んで検証する。

use crate::affiliations::{self, Affiliation};
use crate::cats::{self, Cats};
use crate::event_years::{self, YearNote};
use crate::events::{self, Event};
use crate::licenses::{self, License};
use crate::problem::Problem;
use crate::profile::{self, Profile};
use crate::shelf::{self, Work};
use crate::skills::{self, Skills};
use crate::work::{self, Company};
use serde::Serialize;
use std::collections::BTreeSet;
use std::fmt;
use std::fs;
use std::path::Path;
use ts_rs::TS;

/// 検証の済んだ中身。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Site {
    pub profile: Profile,
    pub skills: Skills,
    pub work: Vec<Company>,
    pub affiliations: Vec<Affiliation>,
    /// 日付の古い順
    pub events: Vec<Event>,
    pub event_years: Vec<YearNote>,
    pub shelf: Vec<Work>,
    pub cats: Cats,
    pub licenses: Vec<License>,
}

/// どのファイルの間違いか。`content/events/x.md:3: date がありません`の形で出す。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileProblem {
    pub path: String,
    pub problem: Problem,
}

impl fmt::Display for FileProblem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.problem.line {
            Some(line) => write!(f, "{}:{line}: {}", self.path, self.problem.message),
            None => write!(f, "{}: {}", self.path, self.problem.message),
        }
    }
}

struct Loader<'a> {
    dir: &'a Path,
    problems: Vec<FileProblem>,
}

impl Loader<'_> {
    fn path(&self, rel: &str) -> String {
        format!("{}/{rel}", self.dir.display())
    }

    fn report(&mut self, rel: &str, problems: Vec<Problem>) {
        for p in problems {
            let path = self.path(p.file.as_deref().unwrap_or(rel));
            self.problems.push(FileProblem { path, problem: p });
        }
    }

    fn read(&mut self, rel: &str) -> Option<String> {
        match fs::read_to_string(self.dir.join(rel)) {
            Ok(text) => Some(text),
            Err(e) => {
                let message = if e.kind() == std::io::ErrorKind::NotFound {
                    "ファイルがありません".to_owned()
                } else {
                    format!("読めません({e})")
                };
                self.report(rel, vec![Problem::new(None, message)]);
                None
            }
        }
    }

    fn take<T>(&mut self, rel: &str, result: Result<T, Vec<Problem>>) -> Option<T> {
        result.map_err(|p| self.report(rel, p)).ok()
    }

    fn toml<T>(&mut self, rel: &str, parse: fn(&str) -> Result<T, Vec<Problem>>) -> Option<T> {
        let text = self.read(rel)?;
        self.take(rel, parse(&text))
    }

    /// フォルダの中の、拡張子が`ext`のファイルの名前(拡張子なし)を名前の順に返す。
    fn names(&mut self, rel: &str, ext: Option<&str>) -> Vec<String> {
        let Ok(entries) = fs::read_dir(self.dir.join(rel)) else {
            self.report(rel, vec![Problem::new(None, "フォルダがありません")]);
            return Vec::new();
        };
        let mut names: Vec<String> = entries
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_ok_and(|t| t.is_file()))
            .filter_map(|e| e.file_name().into_string().ok())
            .filter(|n| !n.starts_with('.'))
            .filter_map(|n| match ext {
                Some(ext) => n.strip_suffix(&format!(".{ext}")).map(str::to_owned),
                None => Some(n),
            })
            .collect();
        names.sort();
        names
    }

    fn events(&mut self) -> Vec<Event> {
        let mut out = Vec::new();
        for slug in self.names("events", Some("md")) {
            let rel = format!("events/{slug}.md");
            if let Some(text) = self.read(&rel)
                && let Some(ev) = self.take(&rel, events::parse(&slug, &text))
            {
                out.push(ev);
            }
        }
        events::sort(&mut out);
        out
    }

    fn cats(&mut self) -> Option<Cats> {
        let text = self.read("cats.toml")?;
        let mut files = Vec::new();
        for name in self.names("cats", None) {
            match fs::read(self.dir.join("cats").join(&name)) {
                Ok(bytes) => files.push((name, bytes)),
                Err(e) => self.report(
                    &format!("cats/{name}"),
                    vec![Problem::new(None, format!("読めません({e})"))],
                ),
            }
        }
        self.take("cats.toml", cats::parse(&text, &files))
    }
}

/// `dir`(ふつうは`content/`)を丸ごと読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、全部のファイルの間違いをまとめて返す。
pub fn load(dir: &Path) -> Result<Site, Vec<FileProblem>> {
    let mut l = Loader {
        dir,
        problems: Vec::new(),
    };
    let profile = l.toml("profile.toml", profile::parse);
    let skills = l.toml("skills.toml", skills::parse);
    let work = l.toml("work.toml", work::parse);
    let affiliations = l.toml("affiliations.toml", affiliations::parse);
    let before = l.problems.len();
    let events = l.events();
    let events_ok = l.problems.len() == before;
    let event_years = l.toml("events.toml", event_years::parse);
    let shelf = l.toml("shelf.toml", shelf::parse);
    let cats = l.cats();
    let licenses = l.toml("licenses.toml", licenses::parse);

    // ファイルをまたいで突き合わせる
    // イベントのファイルが読めなかったときは、年度にイベントがないと言っても紛らわしいので見ない
    if let Some(years) = &event_years
        && events_ok
    {
        let p = event_years::check_against(years, &events);
        l.report("events.toml", p);
    }
    if let (Some(skills), Some(licenses)) = (&skills, &licenses) {
        let with_license: BTreeSet<String> =
            licenses.iter().flat_map(|x| x.icons.clone()).collect();
        let icon_files: BTreeSet<String> = l.names("icons", Some("svg")).into_iter().collect();
        let p = skills::check_local_icons(skills, &with_license, &icon_files);
        l.report("skills.toml", p);
    }

    match (
        profile,
        skills,
        work,
        affiliations,
        event_years,
        shelf,
        cats,
        licenses,
    ) {
        (
            Some(profile),
            Some(skills),
            Some(work),
            Some(affiliations),
            Some(event_years),
            Some(shelf),
            Some(cats),
            Some(licenses),
        ) if l.problems.is_empty() => Ok(Site {
            profile,
            skills,
            work,
            affiliations,
            events,
            event_years,
            shelf,
            cats,
            licenses,
        }),
        _ => Err(l.problems),
    }
}
