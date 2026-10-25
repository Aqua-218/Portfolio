"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { contentFiles } from "./github";
import { group } from "./groups";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; paths: string[] };

/** content/の一覧。種類ごとに分け、名前で絞り込める */
export function Contents() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    contentFiles()
      .then((paths) => {
        if (alive) setState({ kind: "ready", paths });
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
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
