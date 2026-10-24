import PxCat.Closed

/-!
# ドット猫の証明

`pxcat-core`をAeneasでLeanにしたもの(`PxCat/Types.lean`・`PxCat/Funs.lean`)と、その証明を置く。

- `PxCat/Outline.lean`: `outline`が、格子の各マスに`edge`(輪郭になる条件)を書くこと
- `PxCat/Frames.lean`: `frame`が、絵の文字のとおりのマスを作ること
- `PxCat/Closed.lean`: どのコマでも輪郭が閉じていること(`outline_closed`)
-/
