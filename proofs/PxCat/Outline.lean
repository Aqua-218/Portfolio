import PxCat.Funs

open Aeneas Aeneas.Std Result

-- step*のあとに<;>でまとめて片付けるので、1つしかゴールがないときの警告は出さない
set_option linter.unnecessarySeqFocus false
-- Aeneasの名前(outline.outlineなど)に合わせて定理の名前をつける
set_option linter.dupNamespace false

namespace pxcat_core

instance : Inhabited sprite.Cell := ⟨.Empty⟩
deriving instance DecidableEq for sprite.Cell

/-- コマの`(x, y)`のマス。範囲の外は`Empty` -/
def sprite.Frame.cell (f : sprite.Frame) (x y : Nat) : sprite.Cell :=
  if x < f.width.val ∧ y < f.height.val then (f.cells.val[y]!).val[x]! else .Empty

@[step]
theorem sprite.Frame.get.spec' (f : sprite.Frame)
    (hw : f.width.val ≤ 20) (hh : f.height.val ≤ 12) (x y : Std.Usize) :
    sprite.Frame.get f x y ⦃ c => c = f.cell x.val y.val ⦄ := by
  unfold sprite.Frame.get sprite.Frame.cell
  step* <;> simp_all <;> grind

/-- 輪郭の格子の`(x, y)`が塗られているか。Rustの`filled`と同じ。`cell`はコマのマス -/
def fill (cell : Nat → Nat → sprite.Cell) (x y : Nat) : Bool :=
  x ≠ 0 && y ≠ 0 && decide (cell (x - 1) (y - 1) ≠ .Empty)

@[step]
theorem outline.filled.spec' (f : sprite.Frame)
    (hw : f.width.val ≤ 20) (hh : f.height.val ≤ 12) (x y : Std.Usize) :
    outline.filled f x y ⦃ b => b = fill f.cell x.val y.val ⦄ := by
  unfold outline.filled fill
  step*
  all_goals (cases c <;> simp_all <;> grind)


/-- 輪郭の格子の`(x, y)`が輪郭になるか。Rustの`outline`の条件と同じ -/
def edge (cell : Nat → Nat → sprite.Cell) (x y : Nat) : Bool :=
  !fill cell x y &&
    ((x > 0 && fill cell (x - 1) y) || fill cell (x + 1) y ||
      (y > 0 && fill cell x (y - 1)) || fill cell x (y + 1))

/-- 輪郭の格子の`(x, y)`の値。範囲の外はfalse -/
def mark (c : Array (Array Bool 22#usize) 14#usize) (x y : Nat) : Bool :=
  (c.val[y]!).val[x]!

@[step]
theorem outline.is_edge.spec' (f : sprite.Frame)
    (hw : f.width.val ≤ 20) (hh : f.height.val ≤ 12) (x y : Std.Usize)
    (hx : x.val ≤ 21) (hy : y.val ≤ 13) :
    outline.is_edge f x y ⦃ b => b = edge f.cell x.val y.val ⦄ := by
  unfold outline.is_edge edge
  step*
  all_goals simp_all

/-- 輪郭を作るループの1マス分。`(x, y)`に`edge`を書いて、次のマスへ進む -/
theorem outline.outline_loop0_loop0.body.spec'
    (i i1 : Std.Usize) (a : Array (Array sprite.Cell 20#usize) 12#usize)
    (width y : Std.Usize) (cells : Array (Array Bool 22#usize) 14#usize) (x : Std.Usize)
    (hw : i.val ≤ 20) (hh : i1.val ≤ 12) (hwidth : width.val = i.val + 2)
    (hy : y.val < i1.val + 2) :
    outline.outline_loop0_loop0.body i i1 a width y cells x ⦃ r =>
      match r with
      | .done c => width.val ≤ x.val ∧ c = cells
      | .cont (c, x') => x.val < width.val ∧ x'.val = x.val + 1 ∧
          ∀ px py, mark c px py =
            if px = x.val ∧ py = y.val
            then edge (sprite.Frame.cell { width := i, height := i1, cells := a }) x.val y.val
            else mark cells px py ⦄ := by
  unfold outline.outline_loop0_loop0.body
  step*
  refine ⟨by scalar_tac, x1_post, fun px py => ?_⟩
  subst_vars
  unfold mark
  by_cases hp : px = x.val ∧ py = y.val
  · simp_lists [hp]
  · simp only [hp, if_false]
    by_cases hpy : py = y.val
    · have : px ≠ x.val := by tauto
      simp_lists [hpy, this]
    · simp_lists [hpy]

/-- 輪郭を作るループの1行分。`y`行の`x`から右に`edge`を書く -/
@[step]
theorem outline.outline_loop0_loop0.spec'
    (i i1 : Std.Usize) (a : Array (Array sprite.Cell 20#usize) 12#usize)
    (width : Std.Usize) (cells : Array (Array Bool 22#usize) 14#usize) (y x : Std.Usize)
    (hw : i.val ≤ 20) (hh : i1.val ≤ 12) (hwidth : width.val = i.val + 2)
    (hy : y.val < i1.val + 2) (hx : x.val ≤ width.val) :
    outline.outline_loop0_loop0 i i1 a width cells y x ⦃ c =>
      ∀ px py, mark c px py =
        if py = y.val ∧ x.val ≤ px ∧ px < width.val
        then edge (sprite.Frame.cell { width := i, height := i1, cells := a }) px py
        else mark cells px py ⦄ := by
  unfold outline.outline_loop0_loop0
  apply loop.spec_decr_nat
    (measure := fun p => width.val - p.2.val)
    (inv := fun p => x.val ≤ p.2.val ∧ p.2.val ≤ width.val ∧
      ∀ px py, mark p.1 px py =
        if py = y.val ∧ x.val ≤ px ∧ px < p.2.val
        then edge (sprite.Frame.cell { width := i, height := i1, cells := a }) px py
        else mark cells px py)
  · rintro ⟨c, x'⟩ ⟨h1, h2, h3⟩
    apply WP.spec_mono (outline.outline_loop0_loop0.body.spec' i i1 a width y c x'
      hw hh hwidth hy)
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

/-- 輪郭を作るループ全体。`y`行から下の各行に`edge`を書く -/
@[step]
theorem outline.outline_loop0.spec'
    (i i1 : Std.Usize) (a : Array (Array sprite.Cell 20#usize) 12#usize)
    (width height : Std.Usize) (cells : Array (Array Bool 22#usize) 14#usize) (y : Std.Usize)
    (hw : i.val ≤ 20) (hh : i1.val ≤ 12) (hwidth : width.val = i.val + 2)
    (hheight : height.val = i1.val + 2) (hy : y.val ≤ height.val) :
    outline.outline_loop0 i i1 a width height cells y ⦃ c =>
      ∀ px py, mark c px py =
        if y.val ≤ py ∧ py < height.val ∧ px < width.val
        then edge (sprite.Frame.cell { width := i, height := i1, cells := a }) px py
        else mark cells px py ⦄ := by
  unfold outline.outline_loop0
  apply loop.spec_decr_nat
    (measure := fun p => height.val - p.2.val)
    (inv := fun p => y.val ≤ p.2.val ∧ p.2.val ≤ height.val ∧
      ∀ px py, mark p.1 px py =
        if y.val ≤ py ∧ py < p.2.val ∧ px < width.val
        then edge (sprite.Frame.cell { width := i, height := i1, cells := a }) px py
        else mark cells px py)
  · rintro ⟨c, y'⟩ ⟨h1, h2, h3⟩
    unfold outline.outline_loop0.body
    step*
    all_goals grind
  · refine ⟨le_refl _, hy, fun px py => ?_⟩
    grind

/-- 輪郭は、格子の中で`edge`が成り立つマスちょうど -/
theorem outline.outline.spec' (f : sprite.Frame)
    (hw : f.width.val ≤ 20) (hh : f.height.val ≤ 12) :
    outline.outline f ⦃ o =>
      o.width.val = f.width.val + 2 ∧ o.height.val = f.height.val + 2 ∧
      ∀ px py, px < o.width.val → py < o.height.val → mark o.cells px py = edge f.cell px py ⦄ := by
  unfold outline.outline
  step*
  refine ⟨width_post, height_post, fun px py hpx hpy => ?_⟩
  rw [cells1_post, if_pos ⟨Nat.zero_le _, hpy, hpx⟩]

end pxcat_core
