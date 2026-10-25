"use client";

import { useState } from "react";
import * as s from "./admin.css";
import type { PostDoc } from "./post";
import { check, type Item, run, type Step } from "./qiita";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  /** Qiitaの様子を見た。押せば出す */
  | { kind: "confirm"; step: Step }
  | { kind: "sending" }
  | { kind: "done"; item: Item; sent: boolean }
  | { kind: "error"; message: string };

/** 失敗したときの文 */
function failure(e: unknown): string {
  const status = e instanceof Error ? e.message : "";
  if (status === "401")
    return "ログインが切れました。ログインし直してください。";
  if (status === "503")
    return "Qiitaのトークンが入っていません(docs/blog.md)。";
  if (status === "403") return "Qiitaへのこの操作は許していません。";
  if (status !== "" && !/^\d+$/.test(status)) return status;
  return "Qiitaに出せませんでした。もう一度押してください。";
}

/** 日時を読みやすく */
function when(iso: string): string {
  return iso.replace("T", " ").replace(/:\d\d[+-]\d\d:\d\d$/, "");
}

/** 押したあとに出す確かめ */
function confirmText(step: Step, doc: PostDoc): string {
  const scope = doc.meta.private ? "限定公開" : "公開";
  switch (step.action) {
    case "create":
      return `Qiitaに新しく投稿します(${scope})。`;
    case "update":
      return `Qiitaの記事を、この下書きの中身で更新します(${scope})。`;
    case "record":
      return "Qiitaの記事と中身は同じです。送らずに、idと日時だけ下書きに書き戻します。";
    case "conflict":
      return step.item.id === doc.meta.id
        ? `Qiitaのほうが新しく直されています(${when(step.item.updated_at)})。この下書きで上書きすると、Qiitaで直したところは消えます。`
        : `同じタイトルの記事がもうQiitaにあります(${when(step.item.updated_at)})。この下書きで上書きすると、Qiitaの中身は消えます。`;
  }
}

/** 押すボタンの名前 */
function actionLabel(step: Step): string {
  if (step.action === "create") return "投稿する";
  if (step.action === "record") return "書き戻す";
  return step.action === "conflict" ? "上書きする" : "更新する";
}

/**
 * ブログの記事をQiitaに出す。Workerが持つQiitaのトークンで投稿・更新し、もらったidと日時を下書きに書き戻す。
 * 公開(マージ)したときにも、Actionsが同じ決まりで出す(docs/blog.md)
 */
export function QiitaPublish({
  doc,
  dirty,
  onSent,
}: {
  doc: PostDoc;
  /** 保存していない変更があるか。あれば出さない(Qiitaと下書きの中身をそろえるため) */
  dirty: boolean;
  /** 出したあと。idと日時を書き戻した記事を、下書きに保存する */
  onSent: (doc: PostDoc) => Promise<void>;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  if (doc.meta.ignorePublish)
    return (
      <section className={s.publish} aria-label="Qiita">
        <h2 className={s.subTitle}>Qiita</h2>
        <p className={s.note}>
          「Qiitaには出さない」にしてあるので、サイトにだけ出します。
        </p>
      </section>
    );

  const start = () => {
    setState({ kind: "checking" });
    check(doc)
      .then((step) => {
        setState({ kind: "confirm", step });
      })
      .catch((e: unknown) => {
        setState({ kind: "error", message: failure(e) });
      });
  };

  const send = (step: Step) => {
    setState({ kind: "sending" });
    run(doc, step)
      .then(async (item) => {
        await onSent({
          ...doc,
          meta: { ...doc.meta, id: item.id, updatedAt: item.updated_at },
        });
        setState({ kind: "done", item, sent: step.action !== "record" });
      })
      .catch((e: unknown) => {
        setState({ kind: "error", message: failure(e) });
      });
  };

  return (
    <section className={s.publish} aria-label="Qiita">
      <h2 className={s.subTitle}>Qiita</h2>
      {dirty ? (
        <p className={s.note}>
          Qiitaに出すには、先に下書きに保存してください。
        </p>
      ) : (
        (state.kind === "idle" || state.kind === "error") && (
          <div className={s.row}>
            <button type="button" className={s.button} onClick={start}>
              {doc.meta.id === "" ? "Qiitaに出す" : "Qiitaを更新する"}
            </button>
          </div>
        )
      )}
      {state.kind === "checking" && (
        <p className={s.note} role="status">
          Qiitaの記事を見ています…
        </p>
      )}
      {state.kind === "confirm" && !dirty && (
        <>
          <p
            className={state.step.action === "conflict" ? s.error : s.note}
            role="status"
          >
            {confirmText(state.step, doc)}
          </p>
          <div className={s.row}>
            <button
              type="button"
              className={s.save}
              onClick={() => {
                send(state.step);
              }}
            >
              {actionLabel(state.step)}
            </button>
            <button
              type="button"
              className={s.button}
              onClick={() => {
                setState({ kind: "idle" });
              }}
            >
              やめる
            </button>
          </div>
        </>
      )}
      {state.kind === "sending" && (
        <p className={s.note} role="status">
          Qiitaに送っています…
        </p>
      )}
      {state.kind === "done" && (
        <p className={s.note} role="status">
          {state.sent ? "Qiitaに出しました。" : ""}
          idと日時を下書きに書き戻しました。{" "}
          <a href={state.item.url} target="_blank" rel="noopener">
            Qiitaで見る
          </a>
        </p>
      )}
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}
    </section>
  );
}
