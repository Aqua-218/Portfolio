import PxCat.Closed

open Aeneas Aeneas.Std Result

set_option linter.dupNamespace false

namespace pxcat_core

/-- 輪郭は塗りと重ならない。どんなコマでも、輪郭のマスは塗られていない -/
theorem outline_disjoint (f : sprite.Frame)
    (hw : f.width.val ≤ 20) (hh : f.height.val ≤ 12) :
    outline.outline f ⦃ o => ∀ x y, outlineAt o x y = true → fill f.cell x y = false ⦄ := by
  apply WP.spec_mono (outline.outline.spec' f hw hh)
  rintro o ⟨-, -, hm⟩ x y h
  unfold outlineAt at h
  simp only [Bool.and_eq_true, decide_eq_true_eq] at h
  obtain ⟨⟨hx, hy⟩, hmark⟩ := h
  rw [hm x y hx hy] at hmark
  unfold edge at hmark
  simp_all

end pxcat_core
