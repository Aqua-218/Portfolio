//! スプライトの形式。コマは固定サイズの配列で持つ。
//!
//! Aeneasで扱えるように、トレイトオブジェクト・クロージャ・内部可変性は使わない。

/// コマの幅の上限。
pub const MAX_W: usize = 20;
/// コマの高さの上限。
pub const MAX_H: usize = 12;

/// コマの1マス。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    /// 何もない
    Empty,
    /// 毛色
    Fur,
    /// 縞・ぶち
    Stripe,
    /// 白
    White,
    /// 目
    Eye,
    /// 鼻・肉球
    Nose,
    /// 閉じた目
    Closed,
}

impl Cell {
    /// スプライトの文字をマスにする。`#`=毛色 `s`=縞/ぶち `w`=白 `e`=目 `p`=鼻/肉球 `k`=閉じた目。
    /// それ以外(`.`など)は何もないマスにする。
    #[must_use]
    pub const fn from_byte(b: u8) -> Self {
        match b {
            b'#' => Self::Fur,
            b's' => Self::Stripe,
            b'w' => Self::White,
            b'e' => Self::Eye,
            b'p' => Self::Nose,
            b'k' => Self::Closed,
            _ => Self::Empty,
        }
    }
}

/// 1コマ。`width`×`height`の外は使わず、すべて`Cell::Empty`にしておく。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Frame {
    pub width: usize,
    pub height: usize,
    pub cells: [[Cell; MAX_W]; MAX_H],
}

impl Frame {
    /// `(x, y)`のマス。コマの外なら`Cell::Empty`。
    #[must_use]
    pub const fn get(&self, x: usize, y: usize) -> Cell {
        if x < self.width && y < self.height {
            self.cells[y][x]
        } else {
            Cell::Empty
        }
    }
}
