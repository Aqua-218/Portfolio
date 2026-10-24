---------------------------- MODULE Curtain ----------------------------
(***************************************************************************)
(* ページを移るときの幕(apps/web/src/components/curtain/Curtain.tsx)。     *)
(*                                                                         *)
(* リンクを押すたびに、非同期の go() が1つ走る。go() は、幕が動いている     *)
(* 間(busy)なら何もしない。動いていなければ幕を閉じ、黒猫を走らせ、         *)
(* 閉じきったら移り、待ってから開く。                                       *)
(* ここでは、押したクリック1回を1つのプロセスにして、押す時と幕の動きの     *)
(* あらゆる組み合わせを調べる。                                             *)
(***************************************************************************)
EXTENDS Naturals

\* 押すクリックの数
CONSTANT Clicks
\* 幕が動いている間のクリックを無視するか。CurtainBroken.cfgでFALSEにして、検査が落ちることを確かめる
CONSTANT IgnoreWhileBusy

(* --algorithm Curtain
variables
    \* 幕の位置。idle: 画面の外、closing: 閉じている途中、covered: 閉じきった、opening: 開いている途中
    phase = "idle",
    \* 幕が動いているか。動いている間のクリックは何もしない
    busy = FALSE,
    \* 黒猫が走っているか
    running = FALSE,
    \* いま開いている途中の幕の数
    opening = 0,
    \* いまのページ。0は最初のページ、iはi回目のクリックの行き先
    page = 0;

process Click \in 1..Clicks
begin
    Press:
        \* 幕が動いている間は何もしない
        if ~(IgnoreWhileBusy /\ busy) then
            busy := TRUE;
    Close:
            phase := "closing";
            running := TRUE;
    Covered:
            phase := "covered";
    Navigate:
            \* 幕の裏でページを移る
            page := self;
    CatGone:
            \* 黒猫は幕が閉じている間に横切る
            running := FALSE;
    Open:
            phase := "opening";
            opening := opening + 1;
    Opened:
            opening := opening - 1;
            phase := "idle";
            busy := FALSE;
        end if;
end process;
end algorithm; *)
\* BEGIN TRANSLATION
VARIABLES phase, busy, running, opening, page, pc

vars == << phase, busy, running, opening, page, pc >>

ProcSet == (1..Clicks)

Init == (* Global variables *)
        /\ phase = "idle"
        /\ busy = FALSE
        /\ running = FALSE
        /\ opening = 0
        /\ page = 0
        /\ pc = [self \in ProcSet |-> "Press"]

Press(self) == /\ pc[self] = "Press"
               /\ IF ~(IgnoreWhileBusy /\ busy)
                     THEN /\ busy' = TRUE
                          /\ pc' = [pc EXCEPT ![self] = "Close"]
                     ELSE /\ pc' = [pc EXCEPT ![self] = "Done"]
                          /\ busy' = busy
               /\ UNCHANGED << phase, running, opening, page >>

Close(self) == /\ pc[self] = "Close"
               /\ phase' = "closing"
               /\ running' = TRUE
               /\ pc' = [pc EXCEPT ![self] = "Covered"]
               /\ UNCHANGED << busy, opening, page >>

Covered(self) == /\ pc[self] = "Covered"
                 /\ phase' = "covered"
                 /\ pc' = [pc EXCEPT ![self] = "Navigate"]
                 /\ UNCHANGED << busy, running, opening, page >>

Navigate(self) == /\ pc[self] = "Navigate"
                  /\ page' = self
                  /\ pc' = [pc EXCEPT ![self] = "CatGone"]
                  /\ UNCHANGED << phase, busy, running, opening >>

CatGone(self) == /\ pc[self] = "CatGone"
                 /\ running' = FALSE
                 /\ pc' = [pc EXCEPT ![self] = "Open"]
                 /\ UNCHANGED << phase, busy, opening, page >>

Open(self) == /\ pc[self] = "Open"
              /\ phase' = "opening"
              /\ opening' = opening + 1
              /\ pc' = [pc EXCEPT ![self] = "Opened"]
              /\ UNCHANGED << busy, running, page >>

Opened(self) == /\ pc[self] = "Opened"
                /\ opening' = opening - 1
                /\ phase' = "idle"
                /\ busy' = FALSE
                /\ pc' = [pc EXCEPT ![self] = "Done"]
                /\ UNCHANGED << running, page >>

Click(self) == Press(self) \/ Close(self) \/ Covered(self)
                  \/ Navigate(self) \/ CatGone(self) \/ Open(self)
                  \/ Opened(self)

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == /\ \A self \in ProcSet: pc[self] = "Done"
               /\ UNCHANGED vars

Next == (\E self \in 1..Clicks: Click(self))
           \/ Terminating

Spec == Init /\ [][Next]_vars

Termination == <>(\A self \in ProcSet: pc[self] = "Done")

\* END TRANSLATION

\* 型
TypeOK ==
    /\ phase \in {"idle", "closing", "covered", "opening"}
    /\ busy \in BOOLEAN
    /\ running \in BOOLEAN
    /\ opening \in 0..Clicks
    /\ page \in 0..Clicks

\* 幕が二重に開かない
NoDoubleOpen == opening <= 1

\* ページが変わるのは、幕が閉じきっているときだけ
NavigateCovered == \A i \in 1..Clicks : pc[i] = "CatGone" => phase = "covered"

\* 黒猫が走るのは、幕が動いている間だけ
RunWhileBusy == running => busy
=============================================================================
