"use client";

import { checkFile, type FileProblem } from "@portfolio/content-wasm";
import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { type EventDoc, parse, serialize } from "./frontmatter";
import { readLatest, saveDraft } from "./github";
import { Preview } from "./Preview";
import { Publish } from "./Publish";
import { byField, type Field } from "./validate";

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

type Saving =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

/** 保存に失敗したときの文 */
function saveError(e: unknown): string {
  const status = e instanceof Error ? e.message : "";
  if (status === "401")
    return "ログインが切れました。ログインし直してください。";
  if (status === "409")
    return "下書きがほかで書き換えられています。一覧へ戻って開き直してください。";
  return "保存できませんでした。もう一度押してください。";
}

/** 1つのファイルを編集する。保存は下書きのブランチへ。mainには書かない */
export function Editor({ path, onBack }: { path: string; onBack: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  /** 下書きのブランチにあるものを開いているか */
  const [draft, setDraft] = useState(false);
  /** 公開した(マージした)か。下書きのブランチは消えるが、公開の進み具合は出し続ける */
  const [merged, setMerged] = useState(false);
  const [saving, setSaving] = useState<Saving>({ kind: "idle" });
  /** プレビューを出しているか */
  const [previewing, setPreviewing] = useState(false);
  const slug = path.replace(/^.*\//, "").replace(/\.md$/, "");
  /** プレビューできるのはMarkdownだけ */
  const canPreview =
    path.endsWith(".md") && (state.kind === "event" || state.kind === "text");

  useEffect(() => {
    let alive = true;
    readLatest(path)
      .then(({ text, draft: fromDraft }) => {
        if (!alive) return;
        setDraft(fromDraft);
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

  /** ビルドと同じ検証の結果。nullは、このファイルは1つだけでは確かめられないとき */
  const [problems, setProblems] = useState<FileProblem[] | null>([]);
  useEffect(() => {
    if (text === null) return;
    let alive = true;
    // 打つたびに走らせないよう、少し待つ
    const timer = setTimeout(() => {
      void checkFile(path.replace(/^content\//, ""), text).then((checked) => {
        if (alive) setProblems(checked.supported ? checked.problems : null);
      });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [path, text]);
  const fieldProblems = byField(problems ?? []);
  const hint = (field: Field) =>
    fieldProblems.get(field)?.map((m) => (
      <span key={m} className={s.fieldError} role="alert">
        {m}
      </span>
    ));

  const save = () => {
    if (text === null) return;
    setSaving({ kind: "saving" });
    saveDraft(path, text)
      .then(() => {
        // 保存したものを、変更の比べる元にする
        setState((st) =>
          st.kind === "event" || st.kind === "text"
            ? { ...st, original: text }
            : st,
        );
        setDraft(true);
        setSaving({ kind: "saved" });
      })
      .catch((e: unknown) => {
        setSaving({ kind: "error", message: saveError(e) });
      });
  };

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
        {draft && !merged && <span className={s.draft}>下書き</span>}
        {dirty && <span className={s.dirty}>変更あり</span>}
        {text !== null && (
          <button
            type="button"
            className={s.save}
            disabled={!dirty || saving.kind === "saving"}
            onClick={save}
          >
            下書きに保存
          </button>
        )}
      </div>

      {saving.kind === "saving" && (
        <p className={s.note} role="status">
          保存しています…
        </p>
      )}
      {saving.kind === "saved" && !dirty && (
        <p className={s.note} role="status">
          下書きに保存しました。まだ公開していません。
        </p>
      )}
      {saving.kind === "error" && (
        <p className={s.error} role="alert">
          {saving.message}
        </p>
      )}
      {draft && saving.kind === "idle" && (
        <p className={s.note}>下書きを開いています。まだ公開していません。</p>
      )}

      {text !== null && (
        <p className={s.note} aria-live="polite">
          {problems === null
            ? "このファイルは、保存したあとに CI で確かめます。"
            : problems.length === 0
              ? "ビルドと同じ検証で、間違いはありません。"
              : `間違いが ${String(problems.length)} 件あります。`}
        </p>
      )}

      {state.kind === "loading" && <p className={s.note}>読んでいます…</p>}
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}

      {canPreview && (
        <div className={s.tabs}>
          <button
            type="button"
            className={s.tab}
            aria-pressed={!previewing}
            onClick={() => {
              setPreviewing(false);
            }}
          >
            編集
          </button>
          <button
            type="button"
            className={s.tab}
            aria-pressed={previewing}
            onClick={() => {
              setPreviewing(true);
            }}
          >
            プレビュー
          </button>
        </div>
      )}

      {previewing && state.kind === "event" && (
        <Preview slug={slug} meta={state.doc.meta} body={state.doc.body} />
      )}
      {previewing && state.kind === "text" && (
        <Preview slug={slug} body={state.text} />
      )}

      {!previewing && state.kind === "event" && (
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
            {hint("title")}
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
              {hint("date")}
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
              {hint("end")}
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
            {hint("venue")}
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
            {hint("tags")}
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
            {hint("body")}
          </label>
        </div>
      )}

      {!previewing && state.kind === "text" && (
        <>
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
          {problems !== null && problems.length > 0 && (
            <ul className={s.problems} role="alert">
              {problems.map((p) => (
                <li key={p.text}>
                  {p.line === null ? "" : `${String(p.line)}行目: `}
                  {p.message}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {draft && dirty && (
        <p className={s.note}>公開するには、先に下書きに保存してください。</p>
      )}
      {(draft || merged) && !dirty && text !== null && (
        <Publish
          path={path}
          text={text}
          defaultTitle={
            state.kind === "event"
              ? `content: イベント「${state.doc.meta.title}」を更新する`
              : `content: ${path.replace(/^content\//, "")}を更新する`
          }
          onMerged={() => {
            setMerged(true);
          }}
        />
      )}
    </section>
  );
}
