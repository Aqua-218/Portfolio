"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { Dashboard } from "./Dashboard";
import { contentFiles, drafts } from "./github";
import { group } from "./groups";
import { NewPost } from "./NewPost";
import { QiitaImport } from "./QiitaImport";
import { Upload } from "./Upload";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** draftsは、下書きのブランチがあるファイル */
  | { kind: "ready"; paths: string[]; drafts: Set<string> };

/** content/の一覧。種類ごとに分け、名前で絞り込める */
/** 文字のファイルだけ開ける。写真はアップロード(#85)で扱う */
function editable(path: string): boolean {
  return /\.(md|toml|svg)$/.test(path);
}

export function Contents({ onOpen }: { onOpen: (path: string) => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [query, setQuery] = useState("");
  /** 増やすと一覧を読み直す(Qiitaから取り込んだあと) */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([contentFiles(), drafts()])
      .then(([paths, draftPaths]) => {
        if (alive) setState({ kind: "ready", paths, drafts: draftPaths });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          kind: "error",
          message:
            e instanceof Error && e.message === "401"
              ? "ログインが切れました。ログインし直してください。"
              : "一覧を読めませんでした。もう一度開いてください。",
        });
      });
    return () => {
      alive = false;
    };
  }, [version]);

  if (state.kind === "loading")
    return <p className={s.note}>一覧を読んでいます…</p>;
  if (state.kind === "error") {
    return (
      <p className={s.error} role="alert">
        {state.message}
      </p>
    );
  }

  const groups = group(state.paths, query);
  const all = group(state.paths);
  /** もうある写真のid。mainと下書きの両方 */
  const photoIds = new Set(
    [...state.paths, ...state.drafts]
      .map((p) => /^content\/cats\/(.+)\.jpg$/.exec(p)?.[1])
      .filter((id) => id !== undefined),
  );
  /** mainにまだない、足した写真の下書き */
  const newPhotos = [...state.drafts]
    .filter((p) => p.startsWith("content/cats/") && p.endsWith(".jpg"))
    .filter((p) => !state.paths.includes(p))
    .sort();
  /** mainにまだない、書きかけの記事 */
  const newPosts = [...state.drafts]
    .filter((p) => p.startsWith("content/blog/") && p.endsWith(".md"))
    .filter((p) => !state.paths.includes(p))
    .sort();
  return (
    <div className={s.contents}>
      <Dashboard
        paths={state.paths}
        drafts={state.drafts}
        groups={all}
        onOpen={onOpen}
        onNewPost={() => {
          const input = document.getElementById("admin-new-post");
          input?.scrollIntoView({ block: "center" });
          input?.focus();
        }}
        onUpload={() => {
          const box = document.getElementById("admin-upload");
          if (box instanceof HTMLDetailsElement) box.open = true;
          box?.scrollIntoView({ block: "start" });
          box?.querySelector("summary")?.focus();
        }}
      />
      <section className={s.contents} aria-label="content/ の一覧">
        <h2 className={s.subTitle}>ファイル</h2>
        <Upload ids={photoIds} onOpen={onOpen} />
        <NewPost
          taken={new Set([...state.paths, ...state.drafts])}
          onOpen={onOpen}
        />
        <QiitaImport
          paths={state.paths}
          drafts={state.drafts}
          taken={new Set([...state.paths, ...state.drafts])}
          onImported={() => {
            setVersion((v) => v + 1);
          }}
        />
        {newPosts.length > 0 && (
          <div>
            <h3 className={s.groupTitle}>
              書きかけの新しい記事
              <span className={s.count}>{newPosts.length}</span>
            </h3>
            <ul className={s.list}>
              {newPosts.map((p) => (
                <li key={p} title={p}>
                  <button
                    type="button"
                    className={s.item}
                    onClick={() => {
                      onOpen(p);
                    }}
                  >
                    {p.replace(/^content\/blog\//, "")}
                  </button>
                  <span className={s.draft}>下書き</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {newPhotos.length > 0 && (
          <div>
            <h3 className={s.groupTitle}>
              足した写真の下書き
              <span className={s.count}>{newPhotos.length}</span>
            </h3>
            <ul className={s.list}>
              {newPhotos.map((p) => (
                <li key={p} title={p}>
                  <button
                    type="button"
                    className={s.item}
                    onClick={() => {
                      onOpen(p);
                    }}
                  >
                    {p.replace(/^content\/cats\//, "")}
                  </button>
                  <span className={s.draft}>下書き</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <input
          className={s.search}
          type="search"
          placeholder="名前で絞り込む"
          aria-label="名前で絞り込む"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
        {groups.length === 0 && <p className={s.note}>見つかりません</p>}
        {groups.map((g) => (
          <div key={g.key}>
            <h3 className={s.groupTitle}>
              {g.title}
              <span className={s.count}>{g.items.length}</span>
            </h3>
            <ul className={s.list}>
              {g.items.map((item) => (
                <li key={item.path} title={item.path}>
                  {editable(item.path) ? (
                    <button
                      type="button"
                      className={s.item}
                      onClick={() => {
                        onOpen(item.path);
                      }}
                    >
                      {item.label}
                    </button>
                  ) : (
                    item.label
                  )}
                  {state.drafts.has(item.path) && (
                    <span className={s.draft}>下書き</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
