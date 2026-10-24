//! 輪郭。塗りの外側1マスに輪郭をつける。

use crate::sprite::{Cell, Frame, MAX_H, MAX_W};

/// 輪郭の格子の幅の上限。コマの左右に1マスずつ足す。
pub const OUT_W: usize = MAX_W + 2;
/// 輪郭の格子の高さの上限。コマの上下に1マスずつ足す。
pub const OUT_H: usize = MAX_H + 2;

/// 輪郭。コマの周りに1マスずつ足した格子で持つ。格子の`(x, y)`はコマの`(x - 1, y - 1)`にあたる。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Outline {
    pub width: usize,
    pub height: usize,
    pub cells: [[bool; OUT_W]; OUT_H],
}

impl Outline {
    /// 格子の`(x, y)`が輪郭か。格子の外ならfalse。
    #[must_use]
    pub const fn get(&self, x: usize, y: usize) -> bool {
        x < self.width && y < self.height && self.cells[y][x]
    }
}

/// 格子の`(x, y)`が塗られているか。
const fn filled(frame: &Frame, x: usize, y: usize) -> bool {
    if x == 0 || y == 0 {
        return false;
    }
    !matches!(frame.get(x - 1, y - 1), Cell::Empty)
}

/// 塗られていないマスのうち、上下左右のどれかが塗られているマスを輪郭にする。
#[must_use]
pub const fn outline(frame: &Frame) -> Outline {
    let width = frame.width + 2;
    let height = frame.height + 2;
    let mut cells = [[false; OUT_W]; OUT_H];
    let mut y = 0;
    while y < height {
        let mut x = 0;
        while x < width {
            if !filled(frame, x, y)
                && ((x > 0 && filled(frame, x - 1, y))
                    || filled(frame, x + 1, y)
                    || (y > 0 && filled(frame, x, y - 1))
                    || filled(frame, x, y + 1))
            {
                cells[y][x] = true;
            }
            x += 1;
        }
        y += 1;
    }
    Outline {
        width,
        height,
        cells,
    }
}
