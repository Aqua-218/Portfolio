# TLA+の規約

## 全体

- 仕様は`specs/`に置く。PlusCalで書き、TLAに変換したものも一緒にコミットする
- TLCのモデルの設定(`.cfg`)は、仕様と同じ名前で横に置く
- `sh specs/tlc.sh`でPlusCalをTLAに変換し直し、TLCで検査する。CIでも同じものを回す

## 検査

- 守りたい性質は不変条件として名前をつけ、`.cfg`の`INVARIANT`に並べる
- 定数は、TLCが現実的な時間で回りきる大きさにする
- わざと壊した設定(`CurtainBroken.cfg`など)も置き、検査がちゃんと落ちることを確かめる
- TLCが出した実行例は、実装のテスト(Vitest)で再生できる形で残す。`CurtainTrace*.cfg`の条件を破るまでの最短の実行例を`specs/tlc.sh`が`specs/traces/`に書き出し、`apps/web/src/components/curtain/machine.test.ts`が再生する
