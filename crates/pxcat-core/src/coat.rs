//! 毛色。黒・キジ・三毛で塗り分ける。色はデザインのモック(pxcats.js)から写した。

use crate::sprite::Cell;

/// 色。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

const fn rgb(hex: u32) -> Rgb {
    Rgb {
        r: ((hex >> 16) & 0xff) as u8,
        g: ((hex >> 8) & 0xff) as u8,
        b: (hex & 0xff) as u8,
    }
}

/// 毛色。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Coat {
    /// 黒猫
    Kuro,
    /// キジ
    Kiji,
    /// 三毛
    Mike,
}

/// 三毛のぶち。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Patch {
    /// 白
    White,
    /// 茶
    Orange,
    /// 黒
    Black,
}

/// 三毛のぶちの位置。`(x, y)`はコマの中の位置で、同じ位置にはいつも同じぶちが出る。
///
/// モックはコマの周りに輪郭の1マスを足してから数えているので、ここでも1ずつずらして数える。
// Aeneasで扱いやすいように、div_ceilではなく割り算で書く
#[allow(clippy::manual_div_ceil)]
#[must_use]
pub const fn mike_patch(x: usize, y: usize) -> Patch {
    let col = (x + 1) / 2;
    let row = (y + 1) / 2;
    let seed = (col * 13 + row * 7 + col * row * 3) % 7;
    if seed < 2 {
        Patch::Orange
    } else if seed == 2 {
        Patch::Black
    } else {
        Patch::White
    }
}

/// `(x, y)`のマスの色。何もないマスなら`None`。
///
/// 引数を`coat`にすると、Aeneasが作るLeanでモジュールの`coat`と名前がぶつかるので`fur`にする。
#[must_use]
pub const fn paint(fur: Coat, cell: Cell, x: usize, y: usize) -> Option<Rgb> {
    match fur {
        Coat::Kuro => match cell {
            Cell::Empty => None,
            Cell::Fur => Some(rgb(0x21_1d1a)),
            Cell::Stripe => Some(rgb(0x2e_2925)),
            Cell::White => Some(rgb(0xf3_f0ea)),
            Cell::Eye => Some(rgb(0xe9_c44a)),
            Cell::Nose => Some(rgb(0xd9_8d8d)),
            Cell::Closed => Some(rgb(0x5a_524b)),
        },
        Coat::Kiji => match cell {
            Cell::Empty => None,
            Cell::Fur => Some(rgb(0x8a_7966)),
            Cell::Stripe => Some(rgb(0x46_3c32)),
            Cell::White => Some(rgb(0xf6_f3ed)),
            Cell::Eye => Some(rgb(0xb8_c84d)),
            Cell::Nose => Some(rgb(0xd9_9382)),
            Cell::Closed => Some(rgb(0x2b_241e)),
        },
        Coat::Mike => match cell {
            Cell::Empty => None,
            Cell::Fur => match mike_patch(x, y) {
                Patch::White => Some(rgb(0xf7_f4ee)),
                Patch::Orange => Some(rgb(0xd9_8a3d)),
                Patch::Black => Some(rgb(0x2b_2420)),
            },
            Cell::Stripe => Some(rgb(0x2b_2420)),
            Cell::White => Some(rgb(0xf7_f4ee)),
            Cell::Eye => Some(rgb(0x8f_9e3c)),
            Cell::Nose => Some(rgb(0xe8_a0a0)),
            Cell::Closed => Some(rgb(0x3a_302a)),
        },
    }
}
