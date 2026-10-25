"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { contentFiles, drafts } from "./github";
import { group } from "./groups";

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
  }, []);

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
  return (
    <section className={s.contents} aria-label="content/ の一覧">
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
  );
}
