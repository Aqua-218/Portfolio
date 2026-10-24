//! スキル(`content/skills.toml`)を読んで検証する。

use crate::problem::Problem;
use crate::toml_doc::{Source, check_icons};
use serde::Deserialize;
use std::collections::{BTreeSet, HashSet};
use toml::Spanned;

/// 使う頻度。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Level {
    Main,
    Often,
    Can,
    Touched,
}

impl Level {
    const NAMES: [&str; 4] = ["main", "often", "can", "touched"];

    fn from_name(name: &str) -> Option<Self> {
        match name {
            "main" => Some(Self::Main),
            "often" => Some(Self::Often),
            "can" => Some(Self::Can),
            "touched" => Some(Self::Touched),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Category {
    /// 言語
    Lang,
    /// 定理証明・形式手法
    Formal,
}

/// のぞく猫の毛色。
pub const COATS: [&str; 3] = ["kuro", "kiji", "mike"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Skill {
    /// 書いてある行。ほかのファイルと突き合わせるときのエラーで使う
    pub line: usize,
    pub name: String,
    pub category: Category,
    pub level: Level,
    pub icons: Vec<String>,
    pub coat: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tool {
    pub line: usize,
    pub group: String,
    pub name: String,
    pub icons: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Skills {
    pub skills: Vec<Skill>,
    pub tools: Vec<Tool>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawSkill {
    name: Spanned<String>,
    category: Spanned<String>,
    level: Spanned<String>,
    icons: Option<Spanned<Vec<String>>>,
    coat: Option<Spanned<String>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawTool {
    group: Spanned<String>,
    name: Spanned<String>,
    icons: Option<Spanned<Vec<String>>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Raw {
    skill: Vec<RawSkill>,
    #[serde(default)]
    tool: Vec<RawTool>,
}

/// `skills.toml`を読んで検証する。
///
/// # Errors
///
/// 間違いがあれば、見つかったものを全部返す。
pub fn parse(text: &str) -> Result<Skills, Vec<Problem>> {
    let src = Source::new(text);
    let raw: Raw = src.parse().map_err(|p| vec![p])?;
    let mut problems = Vec::new();
    let mut skills = Vec::new();
    let mut last_level: Vec<(Category, Level)> = Vec::new();
    let mut seen = HashSet::new();

    for s in &raw.skill {
        src.check_text(&mut problems, "name", &s.name);
        check_icons(&src, &mut problems, "icons", s.icons.as_ref());
        let category = src
            .check_one_of(&mut problems, "category", &s.category, &["lang", "formal"])
            .map(|c| {
                if c == "lang" {
                    Category::Lang
                } else {
                    Category::Formal
                }
            });
        let level = src
            .check_one_of(&mut problems, "level", &s.level, &Level::NAMES)
            .and_then(Level::from_name);
        if let Some(coat) = &s.coat {
            src.check_one_of(&mut problems, "coat", coat, &COATS);
        }
        match (level, &s.coat) {
            (Some(Level::Main), None) => problems.push(Problem::new(
                src.line(&s.level),
                "level が main のスキルには coat(のぞく猫の毛色)を書いてください",
            )),
            (Some(l), Some(coat)) if l != Level::Main => problems.push(Problem::new(
                src.line(coat),
                "coat は level が main のスキルにだけ書きます",
            )),
            _ => {}
        }
        let (Some(category), Some(level)) = (category, level) else {
            continue;
        };
        if let Some((_, prev)) = last_level.iter().rev().find(|(c, _)| *c == category)
            && level < *prev
        {
            problems.push(Problem::new(
                src.line(&s.level),
                "同じ category の中は、level の高い順(main→often→can→touched)に並べてください",
            ));
        }
        last_level.push((category, level));
        if !seen.insert((category == Category::Lang, s.name.get_ref().clone())) {
            problems.push(Problem::new(
                src.line(&s.name),
                format!("「{}」が同じ category にもうあります", s.name.get_ref()),
            ));
        }
        skills.push(Skill {
            line: src.line(&s.name).unwrap_or(1),
            name: s.name.get_ref().clone(),
            category,
            level,
            icons: s
                .icons
                .as_ref()
                .map(|i| i.get_ref().clone())
                .unwrap_or_default(),
            coat: s.coat.as_ref().map(|c| c.get_ref().clone()),
        });
    }

    let mut tools = Vec::new();
    let mut seen_tools = HashSet::new();
    for t in &raw.tool {
        src.check_text(&mut problems, "group", &t.group);
        src.check_text(&mut problems, "name", &t.name);
        check_icons(&src, &mut problems, "icons", t.icons.as_ref());
        if !seen_tools.insert((t.group.get_ref().clone(), t.name.get_ref().clone())) {
            problems.push(Problem::new(
                src.line(&t.name),
                format!("「{}」が同じ group にもうあります", t.name.get_ref()),
            ));
        }
        tools.push(Tool {
            line: src.line(&t.name).unwrap_or(1),
            group: t.group.get_ref().clone(),
            name: t.name.get_ref().clone(),
            icons: t
                .icons
                .as_ref()
                .map(|i| i.get_ref().clone())
                .unwrap_or_default(),
        });
    }

    if problems.is_empty() {
        Ok(Skills { skills, tools })
    } else {
        Err(problems)
    }
}

/// `local:`のアイコンのファイルがあり、`licenses.toml`に載っているか確かめる。
/// `icon_files`は`content/icons/`にあるSVGの名前(拡張子なし)。
#[must_use]
pub fn check_local_icons(
    skills: &Skills,
    licensed: &BTreeSet<String>,
    icon_files: &BTreeSet<String>,
) -> Vec<Problem> {
    let used = skills
        .skills
        .iter()
        .map(|s| (s.line, &s.icons))
        .chain(skills.tools.iter().map(|t| (t.line, &t.icons)));
    let mut problems = Vec::new();
    for (line, icons) in used {
        for name in icons.iter().filter_map(|i| i.strip_prefix("local:")) {
            if !icon_files.contains(name) {
                problems.push(Problem::new(
                    Some(line),
                    format!("content/icons/{name}.svg がありません"),
                ));
            }
            if !licensed.contains(name) {
                problems.push(Problem::new(
                    Some(line),
                    format!("アイコン「{name}」が licenses.toml の icons に載っていません"),
                ));
            }
        }
    }
    problems
}
