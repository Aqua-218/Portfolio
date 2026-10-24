use pxcat_core::coat::{Coat, Rgb, paint};
use pxcat_core::frames::{FrameName, frame};
use pxcat_core::sprite::Cell;

const fn rgb(r: u8, g: u8, b: u8) -> Rgb {
    Rgb { r, g, b }
}

#[test]
fn 三色で塗れる() {
    assert_eq!(
        paint(Coat::Kuro, Cell::Fur, 0, 0),
        Some(rgb(0x21, 0x1d, 0x1a))
    );
    assert_eq!(
        paint(Coat::Kiji, Cell::Fur, 0, 0),
        Some(rgb(0x8a, 0x79, 0x66))
    );
    assert_eq!(
        paint(Coat::Kuro, Cell::Eye, 0, 0),
        Some(rgb(0xe9, 0xc4, 0x4a))
    );
    assert_eq!(
        paint(Coat::Kiji, Cell::Stripe, 0, 0),
        Some(rgb(0x46, 0x3c, 0x32))
    );
    assert_eq!(
        paint(Coat::Mike, Cell::Nose, 0, 0),
        Some(rgb(0xe8, 0xa0, 0xa0))
    );
}

#[test]
fn 何もないマスは塗らない() {
    for coat in [Coat::Kuro, Coat::Kiji, Coat::Mike] {
        assert_eq!(paint(coat, Cell::Empty, 3, 3), None);
    }
}

#[test]
fn 三毛のぶちはモックと同じ位置に出る() {
    // モックのpxcats.jsで、のぞく三毛を描いた結果。#=白 o=茶 s=黒 e=目 p=鼻
    let expected = [
        "o.....#", //
        "os...##", //
        "oss####", //
        "oe###eo", //
        "o##p#oo", //
        "oooss##", //
    ];
    let f = frame(FrameName::Peek);
    for (y, row) in expected.iter().enumerate() {
        for (x, ch) in row.bytes().enumerate() {
            let want = match ch {
                b'.' => None,
                b'#' => Some(rgb(0xf7, 0xf4, 0xee)),
                b'o' => Some(rgb(0xd9, 0x8a, 0x3d)),
                b's' => Some(rgb(0x2b, 0x24, 0x20)),
                b'e' => Some(rgb(0x8f, 0x9e, 0x3c)),
                b'p' => Some(rgb(0xe8, 0xa0, 0xa0)),
                _ => unreachable!(),
            };
            assert_eq!(paint(Coat::Mike, f.get(x, y), x, y), want, "({x}, {y})");
        }
    }
}

#[test]
fn 三毛のぶちは何度塗っても同じ() {
    let f = frame(FrameName::SitA);
    for y in 0..f.height {
        for x in 0..f.width {
            let c = f.get(x, y);
            assert_eq!(paint(Coat::Mike, c, x, y), paint(Coat::Mike, c, x, y));
        }
    }
}
