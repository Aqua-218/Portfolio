import PxCat.Funs

open Aeneas Aeneas.Std Result

set_option linter.unnecessarySeqFocus false
set_option linter.dupNamespace false

namespace pxcat_core

/-- 色を作るのは失敗しない -/
@[step]
theorem coat.rgb.spec' (hex : Std.U32) : coat.rgb hex ⦃ _ => True ⦄ := by
  unfold coat.rgb
  step*

/-- 三毛のぶちを決めるのは、マスの位置が小さければ失敗しない -/
@[step]
theorem coat.mike_patch.spec' (x y : Std.Usize) (hx : x.val ≤ 1000) (hy : y.val ≤ 1000) :
    coat.mike_patch x y ⦃ _ => True ⦄ := by
  unfold coat.mike_patch
  step*
  all_goals
    have hc : col.val ≤ 501 := by scalar_tac
    have hr : row.val ≤ 501 := by scalar_tac
    have := Nat.mul_le_mul hc hr
    scalar_tac

/-- 色が付くのは、`Empty`でないマスだけ。毛色によらない -/
@[step]
theorem coat.paint.spec' (fur : coat.Coat) (cell : sprite.Cell) (x y : Std.Usize)
    (hx : x.val ≤ 1000) (hy : y.val ≤ 1000) :
    coat.paint fur cell x y ⦃ r => (r.isSome = true ↔ cell ≠ .Empty) ⦄ := by
  unfold coat.paint
  cases fur <;> cases cell <;> step*

/-- 毛色を変えても形は変わらない。どの2つの毛色でも、色が付くマスは同じ -/
theorem paint_shape (fur₁ fur₂ : coat.Coat) (cell : sprite.Cell) (x y : Std.Usize)
    (hx : x.val ≤ 1000) (hy : y.val ≤ 1000) :
    coat.paint fur₁ cell x y ⦃ r₁ =>
      coat.paint fur₂ cell x y ⦃ r₂ => r₁.isSome = r₂.isSome ⦄ ⦄ := by
  apply WP.spec_mono (coat.paint.spec' fur₁ cell x y hx hy)
  intro r₁ h₁
  apply WP.spec_mono (coat.paint.spec' fur₂ cell x y hx hy)
  intro r₂ h₂
  cases h : r₁.isSome <;> cases h' : r₂.isSome <;> simp_all

end pxcat_core
