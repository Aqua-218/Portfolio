# Rustの規約

## 全体

- editionは2024。各クレートは`edition.workspace = true`と`[lints] workspace = true`を書いて、ルートの設定を継ぐ
- `clippy::pedantic`は警告ゼロに保つ。`#[allow(...)]`で黙らせるときは、その場所だけにかけて理由を書く
- `unsafe`は使わない(`unsafe_code = "forbid"`)。例外は`pxcat-wasm`だけで、そのクレートは自分の`[lints]`を持つ
- 整形はrustfmt(`style_edition = "2024"`)に任せる

## pxcat-core

`pxcat-core`はAeneasでLeanに落として証明するので、Aeneasが扱える書き方にとどめる。

- コマは固定サイズの配列で持つ
- トレイトオブジェクト・クロージャ・内部可変性(`Cell`・`RefCell`など)は使わない

## 確かめ方

PRを出す前に、次がすべて通ることを確かめる。

```sh
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```
