# Leanの規約

## 全体

- 証明は`proofs/`に置き、`lake build`で通す
- Leanのバージョンは`proofs/lean-toolchain`で決める。Mathlibもそれに合う版に固定する
- Lean・Mathlib・Aeneas・CharonはRenovateで自動では上げない。上げるときはDependency Dashboardで承認し、証明が通ることを確かめる

## Aeneasが作るファイル

- `proofs/PxCat/Funs.lean`は`pxcat-core`からCharonとAeneasで作る。手で直さない
- `pxcat-core`を変えたら`sh proofs/extract.sh`で作り直し、差分ごとコミットする。CIでも作り直して、差分がないか見る
- CharonとAeneasの版は`proofs/aeneas.env`で決める。Aeneasは`lakefile.toml`と同じコミットにする
- Aeneasが作るLeanでは、Rustのモジュール名がそのまま名前空間になる。引数にモジュールと同じ名前(`coat`など)を付けると名前がぶつかるので避ける

## 証明

- mainに入る証明に`sorry`を残さない
- 定理の名前は、何を示すかがわかるようにつける
