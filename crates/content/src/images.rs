//! 写真を変換した結果(`imgpipe`が書き出す)の形。ページはこれを読んで`<picture>`を組む。

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use ts_rs::TS;

/// 1枚の写真。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    /// 元の写真の幅と高さ。`<img>`の`width`・`height`に入れて、読み込み中もレイアウトがずれないようにする
    pub width: u32,
    pub height: u32,
    /// `<source type="image/avif">`の`srcset`
    pub avif: String,
    /// `<source type="image/webp">`の`srcset`
    pub webp: String,
    /// `<img>`の`src`。いちばん大きいWebP
    pub src: String,
}

/// 写真のid(ファイル名から拡張子を除いたもの) → 写真。
pub type Images = BTreeMap<String, Image>;

/// TSに書き出すための入れ物。`Images`の型をTSでも使えるようにする。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct ImageManifest {
    pub images: Images,
}
