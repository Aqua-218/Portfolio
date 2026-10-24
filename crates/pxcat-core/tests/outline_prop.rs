//! 輪郭をランダムな形で確かめる。

use proptest::prelude::*;
use pxcat_core::outline::outline;
use pxcat_core::sprite::{Cell, Frame, MAX_H, MAX_W};

const CELLS: [Cell; 7] = [
    Cell::Empty,
    Cell::Fur,
    Cell::Stripe,
    Cell::White,
    Cell::Eye,
    Cell::Nose,
    Cell::Closed,
];

/// 幅と高さがランダムで、中身もランダムなコマ。何もないマスが半分くらいになるようにする。
fn any_frame() -> impl Strategy<Value = Frame> {
    (
        1..=MAX_W,
        1..=MAX_H,
        prop::collection::vec(0..12usize, MAX_W * MAX_H),
    )
        .prop_map(|(width, height, picks)| {
            let mut cells = [[Cell::Empty; MAX_W]; MAX_H];
            for y in 0..height {
                for x in 0..width {
                    let pick = picks[y * MAX_W + x];
                    cells[y][x] = if pick < 6 {
                        Cell::Empty
                    } else {
                        CELLS[pick - 5]
                    };
                }
            }
            Frame {
                width,
                height,
                cells,
            }
        })
}

/// 輪郭の格子の`(x, y)`が塗られているか。
fn filled(frame: &Frame, x: usize, y: usize) -> bool {
    x >= 1 && y >= 1 && frame.get(x - 1, y - 1) != Cell::Empty
}

proptest! {
    #[test]
    fn 輪郭が塗りと重ならない(frame in any_frame()) {
        let out = outline(&frame);
        for y in 0..out.height {
            for x in 0..out.width {
                prop_assert!(!(out.get(x, y) && filled(&frame, x, y)), "({x}, {y})");
            }
        }
    }

    #[test]
    fn 輪郭に切れ目がない(frame in any_frame()) {
        // 塗られたマスの上下左右は、塗られているか輪郭のどちらか
        let out = outline(&frame);
        for y in 0..out.height {
            for x in 0..out.width {
                if !filled(&frame, x, y) {
                    continue;
                }
                for (nx, ny) in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)] {
                    prop_assert!(
                        filled(&frame, nx, ny) || out.get(nx, ny),
                        "({x}, {y})の隣({nx}, {ny})"
                    );
                }
            }
        }
    }

    #[test]
    fn 輪郭は塗りに接している(frame in any_frame()) {
        let out = outline(&frame);
        for y in 0..out.height {
            for x in 0..out.width {
                if !out.get(x, y) {
                    continue;
                }
                let touches = (x > 0 && filled(&frame, x - 1, y))
                    || filled(&frame, x + 1, y)
                    || (y > 0 && filled(&frame, x, y - 1))
                    || filled(&frame, x, y + 1);
                prop_assert!(touches, "({x}, {y})");
            }
        }
    }
}
