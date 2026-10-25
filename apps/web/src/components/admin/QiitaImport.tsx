"use client";

import { useState } from "react";
import * as s from "./admin.css";
import { saveDraft } from "./github";
import {
  importedIds,
  myItems,
  problems,
  type QiitaItem,
  suggestSlug,
  toPost,
} from "./importer";
import { serializePost } from "./post";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** 選んでいる。slugsは選んだ記事のidからファイル名 */
  | {
      kind: "ready";
      items: QiitaItem[];
      imported: Set<string>;
      slugs: Map<string, string>;
    }
  | { kind: "saving"; done: number; total: number }
  | { kind: "saved"; paths: string[]; failed: string[] };

function failure(e: unknown): string {
  const status = e instanceof Error ? e.message : "";
  if (status === "401")
    return "ログインが切れました。ログインし直してください。";
  if (status === "503")
    return "Qiitaのトークンが入っていません。「設定」から入れてください。";
  return "Qiitaの記事を読めませんでした。もう一度押してください。";
}

/**
 * もうQiitaにある記事を選んで、ブログの記事の下書きにする。1つの記事が1つの下書き(ブランチ)になり、
 * ほかの下書きと同じように確かめてから公開する
 */
export function QiitaImport({
  paths,
  drafts,
  taken,
  onImported,
}: {
  /** mainのファイル */
  paths: readonly string[];
  /** 下書きのあるファイル */
  drafts: ReadonlySet<string>;
  /** もうあるファイル。mainと下書きの両方 */
  taken: ReadonlySet<string>;
  /** 下書きにしたあと。一覧を読み直す */
  onImported: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([myItems(), importedIds(paths, drafts)])
      .then(([items, imported]) => {
        setState({ kind: "ready", items, imported, slugs: new Map() });
      })
      .catch((e: unknown) => {
        setState({ kind: "error", message: failure(e) });
      });
  };

  const save = async (items: QiitaItem[], slugs: Map<string, string>) => {
    const picked = items.filter((i) => slugs.has(i.id));
    setState({ kind: "saving", done: 0, total: picked.length });
    const paths: string[] = [];
    const failed: string[] = [];
    // 1つずつ。GitHubに同時にたくさん書かない
    for (const item of picked) {
      const path = `content/blog/${slugs.get(item.id) ?? ""}.md`;
      try {
        await saveDraft(path, serializePost(toPost(item)));
        paths.push(path);
      } catch {
        failed.push(item.title);
      }
      setState({
        kind: "saving",
        done: paths.length + failed.length,
        total: picked.length,
      });
    }
    setState({ kind: "saved", paths, failed });
    if (paths.length > 0) onImported();
  };

  return (
    <details
      className={s.upload}
      onToggle={(e) => {
        if (e.currentTarget.open && state.kind === "idle") load();
      }}
    >
      <summary className={s.groupTitle}>Qiitaから取り込む</summary>
      {state.kind === "loading" && (
        <p className={s.note} role="status">
          Qiitaの記事を読んでいます…
        </p>
      )}
      {state.kind === "error" && (
        <>
          <p className={s.error} role="alert">
            {state.message}
          </p>
          <button type="button" className={s.button} onClick={load}>
            もう一度読む
          </button>
        </>
      )}
      {state.kind === "ready" && (
        <Picker state={state} taken={taken} setState={setState} save={save} />
      )}
      {state.kind === "saving" && (
        <p className={s.note} role="status">
          下書きにしています…({state.done}/{state.total})
        </p>
      )}
      {state.kind === "saved" && (
        <>
          {state.paths.length > 0 && (
            <p className={s.note} role="status">
              {state.paths.length}
              件を下書きにしました。「書きかけの新しい記事」から開いて、確かめてから公開してください。
            </p>
          )}
          {state.failed.length > 0 && (
            <p className={s.error} role="alert">
              下書きにできませんでした: {state.failed.join("、")}
            </p>
          )}
          <button type="button" className={s.button} onClick={load}>
            ほかの記事も取り込む
          </button>
        </>
      )}
    </details>
  );
}

function Picker({
  state,
  taken,
  setState,
  save,
}: {
  state: Extract<State, { kind: "ready" }>;
  taken: ReadonlySet<string>;
  setState: (s: State) => void;
  save: (items: QiitaItem[], slugs: Map<string, string>) => Promise<void>;
}) {
  const { items, imported, slugs } = state;
  if (items.length === 0)
    return <p className={s.note}>Qiitaに記事がありません。</p>;
  const errors = problems(
    [...slugs].map(([id, slug]) => ({ id, slug })),
    taken,
  );
  const update = (next: Map<string, string>) => {
    setState({ ...state, slugs: next });
  };
  return (
    <div className={s.importer}>
      <p className={s.note}>
        取り込む記事を選び、ファイル名(URLになる)を決めてください。画像はQiitaのものをそのまま使います。
      </p>
      <ul className={s.importList}>
        {items.map((item) => {
          const done = imported.has(item.id);
          const slug = slugs.get(item.id);
          const error = errors.get(item.id);
          return (
            <li key={item.id}>
              <label className={s.option}>
                <input
                  type="checkbox"
                  disabled={done}
                  checked={slug !== undefined}
                  onChange={(e) => {
                    const next = new Map(slugs);
                    if (e.target.checked) next.set(item.id, suggestSlug(item));
                    else next.delete(item.id);
                    update(next);
                  }}
                />
                {item.title}
                {item.private && <span className={s.count}>限定公開</span>}
                {done && <span className={s.count}>取り込み済み</span>}
              </label>
              {slug !== undefined && (
                <label className={s.field}>
                  ファイル名
                  <input
                    className={s.input}
                    value={slug}
                    spellCheck={false}
                    onChange={(e) => {
                      update(
                        new Map(slugs).set(item.id, e.target.value.trim()),
                      );
                    }}
                  />
                  {error && (
                    <span className={s.fieldError} role="alert">
                      {error}
                    </span>
                  )}
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={s.primary}
        disabled={slugs.size === 0 || errors.size > 0}
        onClick={() => void save(items, slugs)}
      >
        選んだ {slugs.size} 件を下書きにする
      </button>
    </div>
  );
}
