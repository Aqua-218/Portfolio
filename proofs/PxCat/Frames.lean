import PxCat.Outline

open Aeneas Aeneas.Std Result

set_option linter.unnecessarySeqFocus false
set_option linter.dupNamespace false

namespace pxcat_core

/-- 文字からマスにする。Rustの`Cell::from_byte`と同じ -/
def fromByte (b : Std.U8) : sprite.Cell :=
  match b with
  | 35#uscalar => .Fur
  | 115#uscalar => .Stripe
  | 119#uscalar => .White
  | 101#uscalar => .Eye
  | 112#uscalar => .Nose
  | 107#uscalar => .Closed
  | _ => .Empty

theorem sprite.Cell.from_byte_eq (b : Std.U8) : sprite.Cell.from_byte b = ok (fromByte b) := by
  unfold sprite.Cell.from_byte fromByte
  split <;> first | rfl | (split <;> simp_all)

@[step]
theorem sprite.Cell.from_byte.spec' (b : Std.U8) :
    sprite.Cell.from_byte b ⦃ c => c = fromByte b ⦄ := by
  rw [sprite.Cell.from_byte_eq]
  simp

/-- コマのマスの格子の`(x, y)`。範囲の外は`Empty` -/
def cellAt (c : Array (Array sprite.Cell 20#usize) 12#usize) (x y : Nat) : sprite.Cell :=
  (c.val[y]!).val[x]!

/-- 絵の文字の並びの`(x, y)` -/
def byteAt (rows : Array (Array Std.U8 20#usize) 12#usize) (x y : Nat) : Std.U8 :=
  (rows.val[y]!).val[x]!

theorem frames.build_loop0_loop0.body.spec'
    (rows : Array (Array Std.U8 20#usize) 12#usize) (width y : Std.Usize)
    (cells : Array (Array sprite.Cell 20#usize) 12#usize) (x : Std.Usize)
    (hw : width.val ≤ 20) (hy : y.val < 12) :
    frames.build_loop0_loop0.body rows width y cells x ⦃ r =>
      match r with
      | .done c => width.val ≤ x.val ∧ c = cells
      | .cont (c, x') => x.val < width.val ∧ x'.val = x.val + 1 ∧
          ∀ px py, cellAt c px py =
            if px = x.val ∧ py = y.val then fromByte (byteAt rows x.val y.val)
            else cellAt cells px py ⦄ := by
  unfold frames.build_loop0_loop0.body
  step*
  refine ⟨by scalar_tac, x1_post, fun px py => ?_⟩
  subst_vars
  unfold cellAt byteAt
  by_cases hp : px = x.val ∧ py = y.val
  · simp_lists [hp]
  · simp only [hp, if_false]
    by_cases hpy : py = y.val
    · have : px ≠ x.val := by tauto
      simp_lists [hpy, this]
    · simp_lists [hpy]

@[step]
theorem frames.build_loop0_loop0.spec'
    (rows : Array (Array Std.U8 20#usize) 12#usize) (width : Std.Usize)
    (cells : Array (Array sprite.Cell 20#usize) 12#usize) (y x : Std.Usize)
    (hw : width.val ≤ 20) (hy : y.val < 12) (hx : x.val ≤ width.val) :
    frames.build_loop0_loop0 rows width cells y x ⦃ c =>
      ∀ px py, cellAt c px py =
        if py = y.val ∧ x.val ≤ px ∧ px < width.val then fromByte (byteAt rows px py)
        else cellAt cells px py ⦄ := by
  unfold frames.build_loop0_loop0
  apply loop.spec_decr_nat
    (measure := fun p => width.val - p.2.val)
    (inv := fun p => x.val ≤ p.2.val ∧ p.2.val ≤ width.val ∧
      ∀ px py, cellAt p.1 px py =
        if py = y.val ∧ x.val ≤ px ∧ px < p.2.val then fromByte (byteAt rows px py)
        else cellAt cells px py)
  · rintro ⟨c, x'⟩ ⟨h1, h2, h3⟩
    apply WP.spec_mono (frames.build_loop0_loop0.body.spec' rows width y c x' hw hy)
    intro r hr
    cases r with
    | done c' =>
      obtain ⟨hle, rfl⟩ := hr
      have : x'.val = width.val := by scalar_tac
      intro px py
      rw [h3, this]
    | cont p =>
      obtain ⟨c', x''⟩ := p
      obtain ⟨hlt, hx'', hc⟩ := hr
      refine ⟨⟨by scalar_tac, by scalar_tac, fun px py => ?_⟩, by scalar_tac⟩
      rw [hc, h3]
      grind
  · refine ⟨le_refl _, hx, fun px py => ?_⟩
    grind

@[step]
theorem frames.build_loop0.spec'
    (rows : Array (Array Std.U8 20#usize) 12#usize) (width height : Std.Usize)
    (cells : Array (Array sprite.Cell 20#usize) 12#usize) (y : Std.Usize)
    (hw : width.val ≤ 20) (hh : height.val ≤ 12) (hy : y.val ≤ height.val) :
    frames.build_loop0 rows width height cells y ⦃ c =>
      ∀ px py, cellAt c px py =
        if y.val ≤ py ∧ py < height.val ∧ px < width.val then fromByte (byteAt rows px py)
        else cellAt cells px py ⦄ := by
  unfold frames.build_loop0
  apply loop.spec_decr_nat
    (measure := fun p => height.val - p.2.val)
    (inv := fun p => y.val ≤ p.2.val ∧ p.2.val ≤ height.val ∧
      ∀ px py, cellAt p.1 px py =
        if y.val ≤ py ∧ py < p.2.val ∧ px < width.val then fromByte (byteAt rows px py)
        else cellAt cells px py)
  · rintro ⟨c, y'⟩ ⟨h1, h2, h3⟩
    unfold frames.build_loop0.body
    step*
    all_goals grind
  · refine ⟨le_refl _, hy, fun px py => ?_⟩
    grind

/-- コマのマスは、幅と高さの中では絵の文字のとおり、外は`Empty` -/
@[step]
theorem frames.build.spec'
    (rows : Array (Array Std.U8 20#usize) 12#usize) (width height : Std.Usize)
    (hw : width.val ≤ 20) (hh : height.val ≤ 12) :
    frames.build rows width height ⦃ f =>
      f.width = width ∧ f.height = height ∧
      ∀ px py, f.cell px py =
        if px < width.val ∧ py < height.val then fromByte (byteAt rows px py) else .Empty ⦄ := by
  unfold frames.build
  step*
  intro px py
  unfold sprite.Frame.cell
  by_cases hin : px < width.val ∧ py < height.val
  · simp only [hin, and_self, if_true]
    have := cells1_post px py
    simp only [cellAt] at this
    rw [this, if_pos ⟨Nat.zero_le _, hin.2, hin.1⟩]
  · simp only [hin, if_false]

end pxcat_core
