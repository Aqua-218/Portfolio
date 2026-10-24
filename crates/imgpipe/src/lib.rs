//! 写真をWebPとAVIFにする。
//!
//! 一度ピクセルに戻してから書き出すので、位置情報を含むEXIFやXMPは出力に残らない。
//! 向き(EXIFのOrientation)だけは先にピクセルに当ててから捨てる。

use image::imageops::FilterType;
use image::{DynamicImage, ImageDecoder, ImageReader, RgbaImage};
use sha2::{Digest, Sha256};
use std::fmt::Write as _;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

/// 書き出す幅。元の写真より大きくはしない。
pub const WIDTHS: [u32; 3] = [480, 960, 1440];

const WEBP_QUALITY: f32 = 80.0;
const AVIF_QUALITY: f32 = 70.0;
const AVIF_SPEED: u8 = 6;

/// 書き出した1枚。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Output {
    pub path: PathBuf,
    pub width: u32,
    pub height: u32,
}

/// 1枚の写真を変換した結果。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Converted {
    pub source: PathBuf,
    pub outputs: Vec<Output>,
    /// すでに変換済みで飛ばしたか
    pub skipped: bool,
}

/// 変換できなかったとき。
#[derive(Debug)]
pub struct Error {
    pub path: PathBuf,
    pub message: String,
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.path.display(), self.message)
    }
}

impl std::error::Error for Error {}

fn err(path: &Path, message: &impl ToString) -> Error {
    Error {
        path: path.to_owned(),
        message: message.to_string(),
    }
}

/// 元の幅に合わせて、書き出す幅を決める。元のほうが狭ければ、元の幅も足す。
#[must_use]
pub fn widths_for(original: u32) -> Vec<u32> {
    let mut widths: Vec<u32> = WIDTHS.into_iter().filter(|&w| w < original).collect();
    if original <= WIDTHS[WIDTHS.len() - 1] {
        widths.push(original);
    }
    widths
}

/// 中身のハッシュの先頭8文字。中身が変われば出力の名前も変わる。
fn short_hash(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    let mut out = String::with_capacity(8);
    for b in &digest[..4] {
        let _ = write!(out, "{b:02x}");
    }
    out
}

fn decode(path: &Path, bytes: &[u8]) -> Result<DynamicImage, Error> {
    let reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|e| err(path, &e))?;
    let mut decoder = reader.into_decoder().map_err(|e| err(path, &e))?;
    let orientation = decoder.orientation().map_err(|e| err(path, &e))?;
    let mut img = DynamicImage::from_decoder(decoder).map_err(|e| err(path, &e))?;
    img.apply_orientation(orientation);
    Ok(img)
}

fn encode_webp(img: &RgbaImage) -> Vec<u8> {
    webp::Encoder::from_rgba(img.as_raw(), img.width(), img.height())
        .encode(WEBP_QUALITY)
        .to_vec()
}

fn encode_avif(path: &Path, img: &RgbaImage) -> Result<Vec<u8>, Error> {
    let pixels: Vec<ravif::RGBA8> = img
        .pixels()
        .map(|p| ravif::RGBA8::new(p[0], p[1], p[2], p[3]))
        .collect();
    let width = usize::try_from(img.width()).map_err(|e| err(path, &e))?;
    let height = usize::try_from(img.height()).map_err(|e| err(path, &e))?;
    let encoded = ravif::Encoder::new()
        .with_quality(AVIF_QUALITY)
        .with_speed(AVIF_SPEED)
        .encode_rgba(ravif::Img::new(pixels.as_slice(), width, height))
        .map_err(|e| err(path, &e))?;
    Ok(encoded.avif_file)
}

/// 1枚の写真を`out_dir`にWebPとAVIFで書き出す。名前は`<元の名前>-<ハッシュ>-<幅>.<拡張子>`。
/// 全部の出力がもうあれば、何もせずに飛ばす。
///
/// # Errors
///
/// 読めない・書けないとき、写真として開けないとき。
pub fn convert(source: &Path, out_dir: &Path) -> Result<Converted, Error> {
    let bytes = fs::read(source).map_err(|e| err(source, &e))?;
    let stem = source
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| err(source, &"ファイル名が読めません"))?;
    let hash = short_hash(&bytes);
    let name = |w: u32, ext: &str| out_dir.join(format!("{stem}-{hash}-{w}.{ext}"));

    // 大きさだけ先に見て、出力がそろっているか確かめる
    let (orig_w, orig_h) = {
        let img = decode(source, &bytes)?;
        (img.width(), img.height())
    };
    let plan: Vec<(u32, u32)> = widths_for(orig_w)
        .into_iter()
        .map(|w| (w, scaled_height(orig_w, orig_h, w)))
        .collect();
    let outputs: Vec<Output> = plan
        .iter()
        .flat_map(|&(w, h)| {
            ["webp", "avif"].map(|ext| Output {
                path: name(w, ext),
                width: w,
                height: h,
            })
        })
        .collect();
    if outputs.iter().all(|o| o.path.exists()) {
        return Ok(Converted {
            source: source.to_owned(),
            outputs,
            skipped: true,
        });
    }

    fs::create_dir_all(out_dir).map_err(|e| err(out_dir, &e))?;
    let img = decode(source, &bytes)?;
    for &(w, h) in &plan {
        let resized = if w == orig_w {
            img.to_rgba8()
        } else {
            img.resize_exact(w, h, FilterType::Lanczos3).to_rgba8()
        };
        fs::write(name(w, "webp"), encode_webp(&resized)).map_err(|e| err(&name(w, "webp"), &e))?;
        fs::write(name(w, "avif"), encode_avif(source, &resized)?)
            .map_err(|e| err(&name(w, "avif"), &e))?;
    }
    Ok(Converted {
        source: source.to_owned(),
        outputs,
        skipped: false,
    })
}

/// 縦横比を保ったまま、幅`w`のときの高さ。
#[must_use]
pub fn scaled_height(orig_w: u32, orig_h: u32, w: u32) -> u32 {
    let h = (u64::from(orig_h) * u64::from(w) + u64::from(orig_w) / 2) / u64::from(orig_w);
    u32::try_from(h.max(1)).unwrap_or(u32::MAX)
}

/// `in_dir`のJPEGとPNGを全部変換する。名前の順に並べて返す。
///
/// # Errors
///
/// どれか1枚でも変換できなかったとき。
pub fn convert_dir(in_dir: &Path, out_dir: &Path) -> Result<Vec<Converted>, Error> {
    let mut sources: Vec<PathBuf> = fs::read_dir(in_dir)
        .map_err(|e| err(in_dir, &e))?
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| {
            p.extension()
                .and_then(|e| e.to_str())
                .is_some_and(|e| matches!(e.to_ascii_lowercase().as_str(), "jpg" | "jpeg" | "png"))
        })
        .collect();
    sources.sort();
    sources.iter().map(|s| convert(s, out_dir)).collect()
}

/// `srcset`の1つ。`<url> <幅>w`を幅の小さい順に、カンマでつなぐ。
fn srcset(outputs: &[&Output], url_prefix: &str) -> String {
    let mut sorted: Vec<&&Output> = outputs.iter().collect();
    sorted.sort_by_key(|o| o.width);
    sorted
        .iter()
        .filter_map(|o| {
            let file = o.path.file_name()?.to_str()?;
            Some(format!(
                "{}/{file} {}w",
                url_prefix.trim_end_matches('/'),
                o.width
            ))
        })
        .collect::<Vec<_>>()
        .join(", ")
}

/// 変換した結果から、ページが読む`srcset`・幅・高さを作る。`url_prefix`は出力のフォルダのURL。
#[must_use]
pub fn manifest(done: &[Converted], url_prefix: &str) -> content::images::Images {
    let mut images = content::images::Images::new();
    for c in done {
        let Some(id) = c.source.file_stem().and_then(|s| s.to_str()) else {
            continue;
        };
        let by_ext = |ext: &str| -> Vec<&Output> {
            c.outputs
                .iter()
                .filter(|o| o.path.extension().is_some_and(|e| e == ext))
                .collect()
        };
        let webp = by_ext("webp");
        let avif = by_ext("avif");
        let Some(largest) = webp.iter().max_by_key(|o| o.width) else {
            continue;
        };
        let src = srcset(&[*largest], url_prefix)
            .rsplit_once(' ')
            .map(|(url, _)| url.to_owned())
            .unwrap_or_default();
        images.insert(
            id.to_owned(),
            content::images::Image {
                width: largest.width,
                height: largest.height,
                avif: srcset(&avif, url_prefix),
                webp: srcset(&webp, url_prefix),
                src,
            },
        );
    }
    images
}
