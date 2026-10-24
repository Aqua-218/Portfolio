import PxCat.Closed
import PxCat.Coat
import PxCat.Disjoint

/-!
# ドット猫の証明

`pxcat-core`をAeneasでLeanにしたもの(`PxCat/Types.lean`・`PxCat/Funs.lean`)と、その証明を置く。

- `PxCat/Outline.lean`: `outline`が、格子の各マスに`edge`(輪郭になる条件)を書くこと
- `PxCat/Frames.lean`: `frame`が、絵の文字のとおりのマスを作ること
- `PxCat/Closed.lean`: どのコマでも輪郭が閉じていること(`outline_closed`)
- `PxCat/Disjoint.lean`: 輪郭が塗りと重ならないこと(`outline_disjoint`)
- `PxCat/Coat.lean`: 毛色を変えても形が変わらないこと(`paint_shape`)
-/
