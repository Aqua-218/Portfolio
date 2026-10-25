import PxCat.Frames

open Aeneas Aeneas.Std Result

set_option linter.unnecessarySeqFocus false
set_option linter.dupNamespace false

namespace pxcat_core

/-- コマの絵と幅と高さ。Rustの`frame`と同じ -/
def frameData : frames.FrameName → Array (Array Std.U8 20#usize) 12#usize × Nat × Nat
  | .RunA => (frames.RUN_A, 20, 9)
  | .RunB => (frames.RUN_B, 20, 9)
  | .Sleep => (frames.SLEEP, 17, 7)
  | .SitA => (frames.SIT_A, 14, 12)
  | .SitB => (frames.SIT_B, 14, 12)
  | .TailA => (frames.TAIL_A, 7, 4)
  | .TailB => (frames.TAIL_B, 7, 4)
  | .Peek => (frames.PEEK, 7, 6)
  | .PeekBlink => (frames.PEEK_BLINK, 7, 6)
  | .GroomA => (frames.GROOM_A, 14, 12)
  | .GroomB => (frames.GROOM_B, 14, 12)
  | .Loaf => (frames.LOAF, 13, 7)
  | .Stretch => (frames.STRETCH, 20, 10)
  | .RollA => (frames.ROLL_A, 20, 8)
  | .RollB => (frames.ROLL_B, 20, 8)
  | .PounceA => (frames.POUNCE_A, 20, 8)
  | .PounceB => (frames.POUNCE_B, 20, 8)

/-- コマのマス。計算できる形 -/
def frameCell (n : frames.FrameName) (x y : Nat) : sprite.Cell :=
  if x < (frameData n).2.1 ∧ y < (frameData n).2.2
  then fromByte (byteAt (frameData n).1 x y) else .Empty

/-- 輪郭の格子で、`(x, y)`が輪郭か(計算できる形) -/
def edgeIn (n : frames.FrameName) (x y : Nat) : Bool :=
  decide (x < (frameData n).2.1 + 2 ∧ y < (frameData n).2.2 + 2) && edge (frameCell n) x y

/-- `(x, y)`のまわり8マス(斜めを含む)のどこかが`at?`か -/
def nearby (at? : Nat → Nat → Bool) (x y : Nat) : Bool :=
  (x > 0 && y > 0 && at? (x - 1) (y - 1)) || (y > 0 && at? x (y - 1)) ||
    (y > 0 && at? (x + 1) (y - 1)) || (x > 0 && at? (x - 1) y) || at? (x + 1) y ||
    (x > 0 && at? (x - 1) (y + 1)) || at? x (y + 1) || at? (x + 1) (y + 1)

/-- 輪郭が閉じている: 輪郭のどのマスにも、まわり8マスのどこかに輪郭のマスがある(離れ小島がない) -/
def Closed (at? : Nat → Nat → Bool) (w h : Nat) : Prop :=
  ∀ x < w, ∀ y < h, at? x y = true → nearby at? x y = true

/-- `Closed`をBoolで数える。具体的なコマでは、これを計算して確かめる -/
def closedB (at? : Nat → Nat → Bool) (w h : Nat) : Bool :=
  (List.range w).all fun x => (List.range h).all fun y => !at? x y || nearby at? x y

theorem closed_of_closedB (at? : Nat → Nat → Bool) (w h : Nat)
    (hc : closedB at? w h = true) : Closed at? w h := by
  intro x hx y hy hxy
  have := List.all_eq_true.mp (List.all_eq_true.mp hc x (List.mem_range.mpr hx)) y
    (List.mem_range.mpr hy)
  simp_all

theorem edgeIn_closed (n : frames.FrameName) :
    Closed (edgeIn n) ((frameData n).2.1 + 2) ((frameData n).2.2 + 2) := by
  apply closed_of_closedB
  cases n <;> decide +kernel



/-- 名前からコマを作ると、`frameData`の大きさと`frameCell`のマスになる -/
@[step]
theorem frames.frame.spec' (n : frames.FrameName) :
    frames.frame n ⦃ f =>
      f.width.val = (frameData n).2.1 ∧ f.height.val = (frameData n).2.2 ∧
      f.cell = frameCell n ⦄ := by
  cases n <;> unfold frames.frame <;> step* <;>
    (refine ⟨by simp_all [frameData], by simp_all [frameData], funext fun x => funext fun y => ?_⟩
     simp_all [frameCell, frameData])

/-- 輪郭の`(x, y)`。Rustの`Outline::get`と同じ -/
def outlineAt (o : outline.Outline) (x y : Nat) : Bool :=
  decide (x < o.width.val ∧ y < o.height.val) && mark o.cells x y

theorem outline.Outline.get.spec' (o : outline.Outline)
    (hw : o.width.val ≤ 22) (hh : o.height.val ≤ 14) (x y : Std.Usize) :
    outline.Outline.get o x y ⦃ b => b = outlineAt o x.val y.val ⦄ := by
  unfold outline.Outline.get outlineAt mark
  step* <;> simp_all <;> grind

/-- 輪郭が閉じている。どのコマでも、輪郭のどのマスにも、まわり8マスのどこかに輪郭のマスがある -/
theorem outline_closed (n : frames.FrameName) :
    (do let f ← frames.frame n; outline.outline f) ⦃ o =>
      Closed (outlineAt o) o.width.val o.height.val ⦄ := by
  apply WP.spec_bind (frames.frame.spec' n)
  rintro f ⟨hw, hh, hc⟩
  have hb : (frameData n).2.1 ≤ 20 ∧ (frameData n).2.2 ≤ 12 := by cases n <;> decide
  apply WP.spec_mono (outline.outline.spec' f (by omega) (by omega))
  rintro o ⟨how, hoh, hm⟩
  have : outlineAt o = edgeIn n := by
    funext x y
    unfold outlineAt edgeIn
    by_cases hin : x < o.width.val ∧ y < o.height.val
    · rw [hm x y hin.1 hin.2, hc]
      simp_all
    · rw [how, hoh, hw, hh] at hin
      by_cases hx : x < (frameData n).2.1 + 2
      · have hy : ¬y < (frameData n).2.2 + 2 := fun h => hin ⟨hx, h⟩
        simp [how, hoh, hw, hh, hy]
      · simp [how, hw, hx]
  rw [this, how, hoh, hw, hh]
  exact edgeIn_closed n

end pxcat_core
