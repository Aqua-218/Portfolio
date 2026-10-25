//! ドット猫をSVGにして、wasm-bindgenでJavaScriptに渡す。

use std::fmt::Write;

use pxcat_core::coat::{Coat, Rgb, paint};
use pxcat_core::frames::{FrameName, frame};
use pxcat_core::outline::outline;
use wasm_bindgen::prelude::*;

/// コマ名をコマにする。名前はモックと同じ(`runA`・`peekBlink`など)。
#[must_use]
pub fn parse_frame(name: &str) -> Option<FrameName> {
    match name {
        "runA" => Some(FrameName::RunA),
        "runB" => Some(FrameName::RunB),
        "sleep" => Some(FrameName::Sleep),
        "sitA" => Some(FrameName::SitA),
        "sitB" => Some(FrameName::SitB),
        "tailA" => Some(FrameName::TailA),
        "tailB" => Some(FrameName::TailB),
        "peek" => Some(FrameName::Peek),
        "peekBlink" => Some(FrameName::PeekBlink),
        "groomA" => Some(FrameName::GroomA),
        "groomB" => Some(FrameName::GroomB),
        "loaf" => Some(FrameName::Loaf),
        "stretch" => Some(FrameName::Stretch),
        "rollA" => Some(FrameName::RollA),
        "rollB" => Some(FrameName::RollB),
        "pounceA" => Some(FrameName::PounceA),
        "pounceB" => Some(FrameName::PounceB),
        _ => None,
    }
}

/// 毛色の名前を毛色にする。
#[must_use]
pub fn parse_coat(name: &str) -> Option<Coat> {
    match name {
        "kuro" => Some(Coat::Kuro),
        "kiji" => Some(Coat::Kiji),
        "mike" => Some(Coat::Mike),
        "chatora" => Some(Coat::Chatora),
        "shiro" => Some(Coat::Shiro),
        _ => None,
    }
}

fn rect(out: &mut String, x: usize, y: usize, pixel: usize, fill: &str) {
    let _ = write!(
        out,
        r#"<rect x="{}" y="{}" width="{pixel}" height="{pixel}" fill="{fill}"/>"#,
        x * pixel,
        y * pixel
    );
}

fn hex(c: Rgb) -> String {
    format!("#{:02x}{:02x}{:02x}", c.r, c.g, c.b)
}

/// 1コマの`<rect>`を並べる。先に輪郭、次に塗り。幅と高さ(ピクセル)も返す。
fn frame_rects(name: FrameName, coat: Coat, pixel: usize) -> (String, usize, usize) {
    let f = frame(name);
    let out_line = outline(&f);
    let mut out = String::new();
    for y in 0..out_line.height {
        for x in 0..out_line.width {
            if out_line.get(x, y) {
                rect(&mut out, x, y, pixel, "currentColor");
            }
        }
    }
    for y in 0..f.height {
        for x in 0..f.width {
            if let Some(color) = paint(coat, f.get(x, y), x, y) {
                rect(&mut out, x + 1, y + 1, pixel, &hex(color));
            }
        }
    }
    (out, out_line.width * pixel, out_line.height * pixel)
}

/// コマを重ねたSVG。最初のコマだけ見せ、ほかは`display:none`にしておく。
#[must_use]
pub fn render(frames: &[FrameName], coat: Coat, pixel: usize) -> String {
    let mut width = 0;
    let mut height = 0;
    let mut groups = String::new();
    for (i, &name) in frames.iter().enumerate() {
        let (rects, w, h) = frame_rects(name, coat, pixel);
        width = width.max(w);
        height = height.max(h);
        let hidden = if i == 0 {
            ""
        } else {
            r#" style="display:none""#
        };
        let _ = write!(groups, r#"<g class="fr"{hidden}>{rects}</g>"#);
    }
    format!(
        r#"<svg class="px-svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">{groups}</svg>"#
    )
}

/// コマ名・毛色・1マスの大きさを受け取って、SVGの文字列を返す。
///
/// # Errors
///
/// 知らないコマ名か毛色を渡したとき、コマが1つもないとき、1マスの大きさが0のとき。
// wasm-bindgenは&[String]を受け取れないので、Vecで受け取る
#[allow(clippy::needless_pass_by_value)]
#[wasm_bindgen]
pub fn svg(frames: Vec<String>, coat: &str, pixel: u32) -> Result<String, JsError> {
    let mut names = Vec::with_capacity(frames.len());
    for f in &frames {
        let name = parse_frame(f).ok_or_else(|| JsError::new(&format!("知らないコマ: {f}")))?;
        names.push(name);
    }
    if names.is_empty() {
        return Err(JsError::new("コマが1つもない"));
    }
    let coat = parse_coat(coat).ok_or_else(|| JsError::new(&format!("知らない毛色: {coat}")))?;
    if pixel == 0 {
        return Err(JsError::new("1マスの大きさが0"));
    }
    Ok(render(&names, coat, pixel as usize))
}
