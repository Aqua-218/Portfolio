---------------------------- MODULE Curtain ----------------------------
(***************************************************************************)
(* ページを移るときの幕(apps/web/src/components/curtain/Curtain.tsx)。     *)
(*                                                                         *)
(* リンクを押すたびに、非同期の go() が1つ走る。幕が動いている間(busy)の  *)
(* クリックは、幕を出さずにそのまま移る(モックと同じ)。動いていなければ    *)
(* 幕を閉じ、黒猫を走らせ、閉じきったら移り、待ってから開く。               *)
(* ここでは、押したクリック1回を1つのプロセスにして、押す時と幕の動きの     *)
(* あらゆる組み合わせを調べる。                                             *)
(***************************************************************************)
EXTENDS Naturals

\* 押すクリックの数
CONSTANT Clicks
\* 幕が動いている間のクリックで幕を出さないか。CurtainBroken.cfgでFALSEにして、検査が落ちることを確かめる
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
    page = 0,
    \* ページを移った回数
    moves = 0;

process Click \in 1..Clicks
begin
    Press:
        if IgnoreWhileBusy /\ busy then
            \* 幕が動いている間は、幕を出さずにそのまま移る
            page := self;
            moves := moves + 1;
        else
            busy := TRUE;
    Close:
            \* 幕を閉じはじめ、黒猫を走らせる
            phase := "closing";
            running := TRUE;
    Covered:
            phase := "covered";
    Navigate:
            \* 幕の裏でページを移る
            page := self;
            moves := moves + 1;
    Open:
            phase := "opening";
            opening := opening + 1;
    Opened:
            \* 黒猫が走り終わるのを待ってから、幕を止める
            await ~running;
            opening := opening - 1;
            phase := "idle";
            busy := FALSE;
        end if;
end process;

\* 黒猫。幕の動きとは別に走り、いつ走り終わってもよい
process Cat = 0
begin
    Run:
        while TRUE do
            await running;
    CatGone:
            running := FALSE;
        end while;
end process;
end algorithm; *)
\* BEGIN TRANSLATION
VARIABLES phase, busy, running, opening, page, moves, pc

vars == << phase, busy, running, opening, page, moves, pc >>

ProcSet == (1..Clicks) \cup {0}

Init == (* Global variables *)
        /\ phase = "idle"
        /\ busy = FALSE
        /\ running = FALSE
        /\ opening = 0
        /\ page = 0
        /\ moves = 0
        /\ pc = [self \in ProcSet |-> CASE self \in 1..Clicks -> "Press"
                                        [] self = 0 -> "Run"]

Press(self) == /\ pc[self] = "Press"
               /\ IF IgnoreWhileBusy /\ busy
                     THEN /\ page' = self
                          /\ moves' = moves + 1
                          /\ pc' = [pc EXCEPT ![self] = "Done"]
                          /\ busy' = busy
                     ELSE /\ busy' = TRUE
                          /\ pc' = [pc EXCEPT ![self] = "Close"]
                          /\ UNCHANGED << page, moves >>
               /\ UNCHANGED << phase, running, opening >>

Close(self) == /\ pc[self] = "Close"
               /\ phase' = "closing"
               /\ running' = TRUE
               /\ pc' = [pc EXCEPT ![self] = "Covered"]
               /\ UNCHANGED << busy, opening, page, moves >>

Covered(self) == /\ pc[self] = "Covered"
                 /\ phase' = "covered"
                 /\ pc' = [pc EXCEPT ![self] = "Navigate"]
                 /\ UNCHANGED << busy, running, opening, page, moves >>

Navigate(self) == /\ pc[self] = "Navigate"
                  /\ page' = self
                  /\ moves' = moves + 1
                  /\ pc' = [pc EXCEPT ![self] = "Open"]
                  /\ UNCHANGED << phase, busy, running, opening >>

Open(self) == /\ pc[self] = "Open"
              /\ phase' = "opening"
              /\ opening' = opening + 1
              /\ pc' = [pc EXCEPT ![self] = "Opened"]
              /\ UNCHANGED << busy, running, page, moves >>

Opened(self) == /\ pc[self] = "Opened"
                /\ ~running
                /\ opening' = opening - 1
                /\ phase' = "idle"
                /\ busy' = FALSE
                /\ pc' = [pc EXCEPT ![self] = "Done"]
                /\ UNCHANGED << running, page, moves >>

Click(self) == Press(self) \/ Close(self) \/ Covered(self)
                  \/ Navigate(self) \/ Open(self) \/ Opened(self)

Run == /\ pc[0] = "Run"
       /\ running
       /\ pc' = [pc EXCEPT ![0] = "CatGone"]
       /\ UNCHANGED << phase, busy, running, opening, page, moves >>

CatGone == /\ pc[0] = "CatGone"
           /\ running' = FALSE
           /\ pc' = [pc EXCEPT ![0] = "Run"]
           /\ UNCHANGED << phase, busy, opening, page, moves >>

Cat == Run \/ CatGone

Next == Cat
           \/ (\E self \in 1..Clicks: Click(self))

Spec == Init /\ [][Next]_vars

\* END TRANSLATION

\* 型
TypeOK ==
    /\ phase \in {"idle", "closing", "covered", "opening"}
    /\ busy \in BOOLEAN
    /\ running \in BOOLEAN
    /\ opening \in 0..Clicks
    /\ page \in 0..Clicks
    /\ moves \in 0..Clicks

\* 幕が二重に開かない
NoDoubleOpen == opening <= 1

\* 幕を出して移るときは、幕が閉じきっている
NavigateCovered == \A i \in 1..Clicks : pc[i] = "Open" => phase = "covered"

\* 黒猫が走るのは、幕が動いている間だけ
RunWhileBusy == running => busy

(***************************************************************************)
(* 実行例を出すための「わざと破る」条件。CurtainTrace*.cfg で INVARIANT に  *)
(* 置くと、TLCがそこに着くまでの最短の実行例を出す。実行例は                *)
(* specs/traces/ に保存して、幕の実装のテスト(Vitest)で再生する。         *)
(***************************************************************************)

\* 幕が動いている間に押して、幕を出さずに移る
NotIgnored == ~(\E i \in 1..Clicks : pc[i] = "Done" /\ busy)

\* 押したクリックが全部終わる
NotAll == ~(\A i \in 1..Clicks : pc[i] = "Done")

\* 2回ページを移って、幕が止まる
NotTwice == ~(moves = 2 /\ phase = "idle")
=============================================================================
