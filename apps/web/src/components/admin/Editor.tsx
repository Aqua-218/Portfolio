"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { type EventDoc, parse, serialize } from "./frontmatter";
import { readFile } from "./github";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** イベントは、先頭の項目をフォームで、本文をMarkdownで */
  | { kind: "event"; doc: EventDoc; original: string }
  /** そのほかは、そのままの文字で */
  | { kind: "text"; text: string; original: string };

/** いまの中身(ファイルに書く文字) */
function current(state: State): string | null {
  if (state.kind === "event") return serialize(state.doc);
  if (state.kind === "text") return state.text;
  return null;
}

/** 1つのファイルを編集する。保存は下書きのブランチへ(#86) */
export function Editor({ path, onBack }: { path: string; onBack: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    readFile(path)
      .then(({ text }) => {
        if (!alive) return;
        const doc = path.startsWith("content/events/") ? parse(text) : null;
        setState(
          doc
            ? { kind: "event", doc, original: text }
            : { kind: "text", text, original: text },
        );
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          kind: "error",
          message:
            e instanceof Error && e.message === "401"
              ? "ログインが切れました。ログインし直してください。"
              : "ファイルを読めませんでした。",
        });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  const text = current(state);
  const dirty =
    (state.kind === "event" || state.kind === "text") &&
    text !== state.original;

  const back = () => {
    if (dirty && !confirm("保存していない変更があります。一覧へ戻りますか？"))
      return;
    onBack();
  };

  const setMeta = <K extends keyof EventDoc["meta"]>(
    key: K,
    value: EventDoc["meta"][K],
  ) => {
    setState((st) =>
      st.kind === "event"
        ? { ...st, doc: { ...st.doc, meta: { ...st.doc.meta, [key]: value } } }
        : st,
    );
  };

  return (
    <section className={s.editor} aria-label={`${path} の編集`}>
      <div className={s.row}>
        <button type="button" className={s.button} onClick={back}>
          一覧へ戻る
        </button>
        <code className={s.path}>{path}</code>
        {dirty && <span className={s.dirty}>変更あり</span>}
      </div>

      {state.kind === "loading" && <p className={s.note}>読んでいます…</p>}
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}

      {state.kind === "event" && (
        <div className={s.fields}>
          <label className={s.field}>
            タイトル
            <input
              className={s.input}
              value={state.doc.meta.title}
              onChange={(e) => {
                setMeta("title", e.target.value);
              }}
            />
          </label>
          <div className={s.pair}>
            <label className={s.field}>
              開始日
              <input
                className={s.input}
                type="date"
                value={state.doc.meta.date}
                onChange={(e) => {
                  setMeta("date", e.target.value);
                }}
              />
            </label>
            <label className={s.field}>
              最終日(1日だけなら空)
              <input
                className={s.input}
                type="date"
                value={state.doc.meta.end}
                onChange={(e) => {
                  setMeta("end", e.target.value);
                }}
              />
            </label>
          </div>
          <label className={s.field}>
            会場(先頭の「@ 」は書かない)
            <input
              className={s.input}
              value={state.doc.meta.venue}
              onChange={(e) => {
                setMeta("venue", e.target.value);
              }}
            />
          </label>
          <label className={s.field}>
            タグ(「受賞」「LT」など。1つまで)
            <input
              className={s.input}
              value={state.doc.meta.tags.join(", ")}
              onChange={(e) => {
                setMeta(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t !== ""),
                );
              }}
            />
          </label>
          <label className={s.field}>
            本文(Markdown)
            <textarea
              className={s.textarea}
              rows={16}
              value={state.doc.body}
              onChange={(e) => {
                const body = e.target.value;
                setState((st) =>
                  st.kind === "event"
                    ? { ...st, doc: { ...st.doc, body } }
                    : st,
                );
              }}
            />
          </label>
        </div>
      )}

      {state.kind === "text" && (
        <label className={s.field}>
          中身
          <textarea
            className={`${s.textarea} ${s.code}`}
            rows={24}
            spellCheck={false}
            value={state.text}
            onChange={(e) => {
              const value = e.target.value;
              setState((st) =>
                st.kind === "text" ? { ...st, text: value } : st,
              );
            }}
          />
        </label>
      )}
    </section>
  );
}
