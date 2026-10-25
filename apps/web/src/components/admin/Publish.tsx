"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { around, diffLines } from "./diff";
import {
  type Check,
  checks,
  findPull,
  mergePull,
  openPull,
  type Pull,
  readFile,
  runs,
} from "./github";

type State =
  | { kind: "loading" }
  | { kind: "idle" }
  /** 変わるところとPRのタイトルを確かめる */
  | { kind: "confirm"; before: string; title: string }
  | { kind: "opening" }
  /** PRのチェックを待つ */
  | { kind: "checking"; pull: Pull; checks: Check[] | null }
  | { kind: "merging"; pull: Pull }
  /** マージのあと、mainで走るもの(公開など)を見る */
  | { kind: "merged"; pull: Pull; runs: Check[] | null };

/** PRのタイトル。pr-titleのチェックと同じ形(type(scope): 中身) */
const TITLE = /^(content|docs|fix|feat|chore)(\([a-z]+\))?: \S/;

/** チェックを見に行く間隔 */
const POLL_MS = 10_000;

function label(c: Check): string {
  if (c.status !== "completed")
    return c.status === "queued" ? "待っています" : "動いています";
  if (c.conclusion === "success") return "通りました";
  if (c.conclusion === "skipped" || c.conclusion === "neutral")
    return "飛ばしました";
  return "落ちました";
}

const done = (c: Check) => c.status === "completed";
const failed = (c: Check) =>
  done(c) && !["success", "skipped", "neutral"].includes(c.conclusion ?? "");

function Checks({ list }: { list: Check[] }) {
  return (
    <ul className={s.checks}>
      {list.map((c) => (
        <li key={c.name}>
          <span>{c.name}</span>
          <span className={failed(c) ? s.checkFailed : s.checkState}>
            {label(c)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 下書きを公開する。mainには直接書かず、下書きのブランチからPRを作り、
 * チェックがすべて通ってからマージする。マージのあとは、mainで走るものの進み具合を出す
 */
export function Publish({
  path,
  text,
  diffPath = path,
  added,
  defaultTitle,
  onMerged,
}: {
  /** 下書きのブランチを決めるファイル */
  path: string;
  /** 下書きに保存してある中身。違いを見せるのに使う */
  text: string;
  /** 違いを見せるファイル。写真のときはcats.toml */
  diffPath?: string;
  /** 違いの代わりに、足すことだけ書くファイル(写真) */
  added?: string;
  defaultTitle: string;
  onMerged: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);

  // もうPRがあれば、そのチェックから
  useEffect(() => {
    let alive = true;
    findPull(path)
      .then((pull) => {
        if (!alive) return;
        setState(
          pull ? { kind: "checking", pull, checks: null } : { kind: "idle" },
        );
      })
      .catch(() => {
        if (alive) setState({ kind: "idle" });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  // チェックや、マージのあとに走るものを見に行く
  const watch =
    state.kind === "checking"
      ? { what: "checks" as const, sha: state.pull.sha }
      : state.kind === "merged"
        ? { what: "runs" as const, sha: state.pull.sha }
        : null;
  const what = watch?.what ?? null;
  const sha = watch?.sha ?? null;
  useEffect(() => {
    if (what === null || sha === null) return;
    let alive = true;
    const look = () => {
      (what === "checks" ? checks : runs)(sha)
        .then((list) => {
          if (!alive) return;
          setState((st) =>
            st.kind === "checking" && what === "checks"
              ? { ...st, checks: list }
              : st.kind === "merged" && what === "runs"
                ? { ...st, runs: list }
                : st,
          );
        })
        .catch(() => {
          // 次に見に行くときにまた試す
        });
    };
    look();
    const timer = setInterval(look, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [what, sha]);

  const start = () => {
    setError(null);
    readFile(diffPath)
      .then(({ text: before }) => {
        setState({ kind: "confirm", before, title: defaultTitle });
      })
      .catch((e: unknown) => {
        // mainにまだないファイル(新しく足すもの)
        if (e instanceof Error && e.message === "404")
          setState({ kind: "confirm", before: "", title: defaultTitle });
        else
          setError(
            "mainのファイルを読めませんでした。もう一度押してください。",
          );
      });
  };

  const open = (title: string) => {
    setError(null);
    setState({ kind: "opening" });
    openPull(path, title)
      .then((pull) => {
        setState({ kind: "checking", pull, checks: null });
      })
      .catch(() => {
        setError("PRを作れませんでした。もう一度押してください。");
        setState({ kind: "idle" });
      });
  };

  const merge = (pull: Pull) => {
    setError(null);
    setState({ kind: "merging", pull });
    mergePull(pull)
      .then((sha) => {
        setState({ kind: "merged", pull: { ...pull, sha }, runs: null });
        onMerged();
      })
      .catch((e: unknown) => {
        const status = e instanceof Error ? e.message : "";
        setError(
          status === "405"
            ? "まだ通っていないチェックがあります。少し待ってから押してください。"
            : status === "409"
              ? "下書きが変わりました。一覧へ戻って開き直してください。"
              : "マージできませんでした。もう一度押してください。",
        );
        setState({ kind: "checking", pull, checks: null });
      });
  };

  return (
    <section className={s.publish} aria-label="公開">
      <h3 className={s.groupTitle}>公開</h3>
      {error !== null && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}

      {state.kind === "loading" && <p className={s.note}>読んでいます…</p>}

      {state.kind === "idle" && (
        <>
          <p className={s.note}>
            公開するときは、PRを作って、チェックがすべて通ってからマージします。
          </p>
          <button type="button" className={s.button} onClick={start}>
            この下書きを公開する
          </button>
        </>
      )}

      {state.kind === "confirm" && (
        <>
          <h4 className={s.subTitle}>変わるところ</h4>
          {added !== undefined && (
            <p className={s.note}>
              足すファイル: <code>{added}</code>
            </p>
          )}
          <p className={s.note}>
            <code>{diffPath}</code>
          </p>
          <ol className={s.diff} aria-label="変わるところ">
            {around(diffLines(state.before, text)).map((l, i) =>
              l === null ? (
                <li key={i} className={s.diffGap}>
                  …
                </li>
              ) : (
                <li
                  key={i}
                  className={
                    l.kind === "add"
                      ? s.diffAdd
                      : l.kind === "remove"
                        ? s.diffRemove
                        : undefined
                  }
                >
                  {l.kind === "add" ? "+ " : l.kind === "remove" ? "- " : "  "}
                  {l.text}
                </li>
              ),
            )}
          </ol>
          <label className={s.field}>
            PRのタイトル(マージのコミットのメッセージになります)
            <input
              className={s.input}
              value={state.title}
              onChange={(e) => {
                const title = e.target.value;
                setState((st) =>
                  st.kind === "confirm" ? { ...st, title } : st,
                );
              }}
            />
            {!TITLE.test(state.title) && (
              <span className={s.fieldError} role="alert">
                「content: 」のように、種類から書いてください。
              </span>
            )}
          </label>
          <div className={s.row}>
            <button
              type="button"
              className={s.button}
              onClick={() => {
                setState({ kind: "idle" });
              }}
            >
              やめる
            </button>
            <button
              type="button"
              className={s.save}
              disabled={!TITLE.test(state.title)}
              onClick={() => {
                open(state.title);
              }}
            >
              PRを作る
            </button>
          </div>
        </>
      )}

      {state.kind === "opening" && <p className={s.note}>PRを作っています…</p>}

      {state.kind === "checking" && (
        <>
          <p className={s.note}>
            <a href={state.pull.url} target="_blank" rel="noreferrer">
              PR #{state.pull.number}
            </a>
            のチェック
            {state.checks === null || state.checks.length === 0
              ? "が始まるのを待っています…"
              : state.checks.some(failed)
                ? "で、落ちたものがあります。PRで理由を見てください。"
                : state.checks.every(done)
                  ? "がすべて通りました。"
                  : `を待っています(${String(state.checks.filter(done).length)}/${String(state.checks.length)})`}
          </p>
          {state.checks !== null && <Checks list={state.checks} />}
          <button
            type="button"
            className={s.save}
            disabled={
              state.checks === null ||
              state.checks.length === 0 ||
              !state.checks.every(done) ||
              state.checks.some(failed)
            }
            onClick={() => {
              merge(state.pull);
            }}
          >
            マージして公開する
          </button>
        </>
      )}

      {state.kind === "merging" && <p className={s.note}>マージしています…</p>}

      {state.kind === "merged" && (
        <>
          <p className={s.note} role="status">
            {state.runs !== null &&
            state.runs.length > 0 &&
            state.runs.every(done)
              ? "マージしました。mainで走るものも、すべて終わりました。"
              : "マージしました。mainで走るものを待っています…"}
          </p>
          {state.runs !== null && <Checks list={state.runs} />}
        </>
      )}
    </section>
  );
}
