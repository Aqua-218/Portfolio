use image::{ImageFormat, RgbImage};
use imgpipe::{convert, convert_dir, scaled_height, widths_for};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

/// テストごとの作業フォルダ。
fn workdir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("imgpipe-test-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// 位置情報入りのEXIFとXMPを埋め込んだJPEGを作る。
fn jpeg_with_metadata(width: u32, height: u32) -> Vec<u8> {
    let img = RgbImage::from_fn(width, height, |x, y| {
        image::Rgb([
            u8::try_from(x % 256).unwrap(),
            u8::try_from(y % 256).unwrap(),
            128,
        ])
    });
    let mut plain = Vec::new();
    img.write_to(&mut Cursor::new(&mut plain), ImageFormat::Jpeg)
        .unwrap();

    // SOIの直後にAPP1(EXIF)とAPP1(XMP)を差し込む
    let exif = b"Exif\0\0MM\0*\0\0\0\x08GPSLatitude 36.5551N GPSLongitude 139.8828E";
    let xmp = b"http://ns.adobe.com/xap/1.0/\0<x:xmpmeta><exif:GPSLatitude>36,33.3N</exif:GPSLatitude></x:xmpmeta>";
    let mut out = plain[..2].to_vec();
    for seg in [exif.as_slice(), xmp.as_slice()] {
        out.extend_from_slice(&[0xFF, 0xE1]);
        out.extend_from_slice(&u16::try_from(seg.len() + 2).unwrap().to_be_bytes());
        out.extend_from_slice(seg);
    }
    out.extend_from_slice(&plain[2..]);
    out
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

fn has_metadata(bytes: &[u8]) -> bool {
    [b"Exif".as_slice(), b"GPS", b"xmpmeta", b"ns.adobe.com/xap"]
        .iter()
        .any(|n| contains(bytes, n))
}

fn size_of(path: &Path) -> (u32, u32) {
    image::image_dimensions(path).unwrap_or_else(|_| {
        // image(このクレートの設定)はWebP・AVIFを読めないので、WebPだけ自分で読む
        let b = fs::read(path).unwrap();
        assert_eq!(&b[12..16], b"VP8 ", "{}", path.display());
        let w = u32::from(u16::from_le_bytes([b[26], b[27]]) & 0x3fff);
        let h = u32::from(u16::from_le_bytes([b[28], b[29]]) & 0x3fff);
        (w, h)
    })
}

#[test]
fn 元より大きい幅には引き伸ばさない() {
    assert_eq!(widths_for(4000), vec![480, 960, 1440]);
    assert_eq!(widths_for(1440), vec![480, 960, 1440]);
    assert_eq!(widths_for(1000), vec![480, 960, 1000]);
    assert_eq!(widths_for(750), vec![480, 750]);
    assert_eq!(widths_for(300), vec![300]);
}

#[test]
fn 縦横比を保つ() {
    assert_eq!(scaled_height(750, 1000, 480), 640);
    assert_eq!(scaled_height(1000, 750, 480), 360);
    assert_eq!(scaled_height(1000, 1000, 960), 960);
}

#[test]
fn 幅ごとにwebpとavifを書き出し位置情報を残さない() {
    let dir = workdir("convert");
    let src = dir.join("kuro.jpg");
    let bytes = jpeg_with_metadata(1000, 750);
    assert!(
        has_metadata(&bytes),
        "テストの写真にメタデータが入っていない"
    );
    fs::write(&src, &bytes).unwrap();

    let out = dir.join("out");
    let done = convert(&src, &out).unwrap();
    assert!(!done.skipped);
    // 480・960・1000 × webp・avif
    assert_eq!(done.outputs.len(), 6);
    for o in &done.outputs {
        let written = fs::read(&o.path).unwrap();
        assert!(
            !has_metadata(&written),
            "{}にメタデータが残っている",
            o.path.display()
        );
        let name = o.path.file_name().unwrap().to_str().unwrap();
        assert!(name.starts_with("kuro-"), "{name}");
        assert!(
            name.ends_with(&format!("-{}.webp", o.width))
                || name.ends_with(&format!("-{}.avif", o.width)),
            "{name}"
        );
        assert_eq!(o.height, scaled_height(1000, 750, o.width));
        if o.path.extension().is_some_and(|e| e == "webp") {
            assert_eq!(size_of(&o.path), (o.width, o.height), "{name}");
        } else {
            assert_eq!(&written[4..12], b"ftypavif", "{name}");
        }
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn 変換済みは飛ばし中身が変われば作り直す() {
    let dir = workdir("skip");
    let src_dir = dir.join("src");
    fs::create_dir_all(&src_dir).unwrap();
    fs::write(src_dir.join("a.jpg"), jpeg_with_metadata(600, 400)).unwrap();
    fs::write(src_dir.join("b.png"), {
        let mut v = Vec::new();
        RgbImage::new(500, 500)
            .write_to(&mut Cursor::new(&mut v), ImageFormat::Png)
            .unwrap();
        v
    })
    .unwrap();
    fs::write(src_dir.join("memo.txt"), "写真ではない").unwrap();
    let out = dir.join("out");

    let first = convert_dir(&src_dir, &out).unwrap();
    assert_eq!(first.len(), 2, "写真だけを変換する");
    assert!(first.iter().all(|c| !c.skipped));

    let second = convert_dir(&src_dir, &out).unwrap();
    assert!(second.iter().all(|c| c.skipped));

    // 中身が変わると名前のハッシュが変わり、作り直す
    fs::write(src_dir.join("a.jpg"), jpeg_with_metadata(600, 401)).unwrap();
    let third = convert_dir(&src_dir, &out).unwrap();
    assert!(!third[0].skipped);
    assert!(third[1].skipped);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn srcsetと幅と高さを出す() {
    let dir = workdir("manifest");
    let src_dir = dir.join("src");
    fs::create_dir_all(&src_dir).unwrap();
    fs::write(src_dir.join("kuro.jpg"), jpeg_with_metadata(750, 1000)).unwrap();
    let done = convert_dir(&src_dir, &dir.join("out")).unwrap();
    let images = imgpipe::manifest(&done, "/img/cats/");
    let kuro = &images["kuro"];
    assert_eq!((kuro.width, kuro.height), (750, 1000));

    let hash = done[0].outputs[0]
        .path
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .split('-')
        .nth(1)
        .unwrap()
        .to_owned();
    assert_eq!(
        kuro.webp,
        format!("/img/cats/kuro-{hash}-480.webp 480w, /img/cats/kuro-{hash}-750.webp 750w")
    );
    assert_eq!(
        kuro.avif,
        format!("/img/cats/kuro-{hash}-480.avif 480w, /img/cats/kuro-{hash}-750.avif 750w")
    );
    assert_eq!(kuro.src, format!("/img/cats/kuro-{hash}-750.webp"));
    let _ = fs::remove_dir_all(&dir);
}
