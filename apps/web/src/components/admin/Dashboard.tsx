"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import {
  type OpenPull,
  openPulls,
  type PostState,
  postStates,
  type QiitaState,
  recentRuns,
  type Run,
  type Summary,
  summarize,
} from "./dashboard";
import type { Group } from "./groups";

/** 読んでいる・読めた・読めなかった */
type Load<T> =
  { kind: "loading" } | { kind: "ready"; value: T } | { kind: "error" };

function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Load<T> {
  const [state, setState] = useState<Load<T>>({ kind: "loading" });
  useEffect(() => {
    let alive = true;
    load()
      .then((value) => {
        if (alive) setState({ kind: "ready", value });
      })
      .catch(() => {
        if (alive) setState({ kind: "error" });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 呼ぶ側が決めた値が変わったときだけ読み直す
  }, deps);
  return state;
}

const SUMMARY: Record<Summary, string> = {
  pending: "チェック中",
  failed: "落ちました",
  passed: "通りました",
  none: "チェックなし",
};

const QIITA: Record<QiitaState, string> = {
  new: "まだ",
  synced: "出した",
  ahead: "Qiitaのほうが新しい",
  ignored: "出さない",
  unknown: "わからない",
};

/** Actionsの1つの様子 */
function runSummary(r: Pick<Run, "status" | "conclusion">): Summary {
  return summarize([{ name: "", ...r }]);
}

function Badge({ summary }: { summary: Summary }) {
  return (
    <span
      className={
        summary === "failed"
          ? s.badgeFailed
          : summary === "passed"
            ? s.badgePassed
            : s.badge
      }
    >
      {SUMMARY[summary]}
    </span>
  );
}

/** ISOの日時を「10/25 14:03」に */
function short(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getMonth() + 1)}/${String(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className={s.card} aria-label={title}>
      <h3 className={s.cardTitle}>
        {title}
        {count !== undefined && <span className={s.cardCount}>{count}</span>}
      </h3>
      {children}
    </section>
  );
}

function Status<T>({
  load,
  empty,
  children,
}: {
  load: Load<T[]>;
  empty: string;
  children: (value: T[]) => React.ReactNode;
}) {
  if (load.kind === "loading") return <p className={s.note}>読んでいます…</p>;
  if (load.kind === "error")
    return <p className={s.error}>読めませんでした。</p>;
  if (load.value.length === 0) return <p className={s.note}>{empty}</p>;
  return children(load.value);
}

/**
 * 管理画面のトップ。下書き・公開待ちのPR・最近の公開・ブログのQiitaへの出し具合・中身の数を、ひと目で見られるようにする
 */
export function Dashboard({
  paths,
  drafts,
  groups,
  onOpen,
  onNewPost,
  onUpload,
}: {
  paths: readonly string[];
  drafts: ReadonlySet<string>;
  /** 絞り込む前の、種類ごとのまとまり */
  groups: readonly Group[];
  onOpen: (path: string) => void;
  onNewPost: () => void;
  onUpload: () => void;
}) {
  const pulls = useLoad<OpenPull[]>(openPulls, []);
  const runs = useLoad<Run[]>(() => recentRuns(), []);
  const posts = useLoad<{ posts: PostState[]; qiita: boolean }>(
    () => postStates(paths),
    [paths],
  );
  const draftList = [...drafts].sort();
  const counts = new Map<QiitaState, number>();
  if (posts.kind === "ready")
    for (const p of posts.value.posts)
      counts.set(p.state, (counts.get(p.state) ?? 0) + 1);

  return (
    <div className={s.dashboard}>
      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={onNewPost}>
          新しい記事を書く
        </button>
        <button type="button" className={s.button} onClick={onUpload}>
          写真を足す
        </button>
      </div>
      <div className={s.cards}>
        <Card title="下書き" count={draftList.length}>
          {draftList.length === 0 ? (
            <p className={s.note}>下書きはありません。</p>
          ) : (
            <ul className={s.cardList}>
              {draftList.slice(0, 6).map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    className={s.item}
                    title={p}
                    onClick={() => {
                      onOpen(p);
                    }}
                  >
                    {p.replace(/^content\//, "")}
                  </button>
                </li>
              ))}
              {draftList.length > 6 && (
                <li className={s.count}>
                  ほか {draftList.length - 6} 件は下の一覧に
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card
          title="公開待ち"
          {...(pulls.kind === "ready" ? { count: pulls.value.length } : {})}
        >
          <Status load={pulls} empty="公開待ちのPRはありません。">
            {(list) => (
              <ul className={s.cardList}>
                {list.map((p) => (
                  <li key={p.number}>
                    <button
                      type="button"
                      className={s.item}
                      title={p.path}
                      onClick={() => {
                        onOpen(p.path);
                      }}
                    >
                      {p.title}
                    </button>
                    <Badge summary={summarize(p.checks)} />
                  </li>
                ))}
              </ul>
            )}
          </Status>
        </Card>

        <Card title="最近の公開">
          <Status load={runs} empty="まだ走っていません。">
            {(list) => (
              <ul className={s.cardList}>
                {list.map((r, i) => (
                  <li key={`${r.name}-${String(i)}`}>
                    <span className={s.cardText} title={r.title}>
                      {r.name}
                      {r.at !== "" && (
                        <span className={s.count}> {short(r.at)}</span>
                      )}
                    </span>
                    <Badge summary={runSummary(r)} />
                  </li>
                ))}
              </ul>
            )}
          </Status>
        </Card>

        <Card
          title="ブログとQiita"
          {...(posts.kind === "ready"
            ? { count: posts.value.posts.length }
            : {})}
        >
          {posts.kind === "loading" && <p className={s.note}>読んでいます…</p>}
          {posts.kind === "error" && (
            <p className={s.error}>読めませんでした。</p>
          )}
          {posts.kind === "ready" && (
            <>
              {posts.value.posts.length === 0 ? (
                <p className={s.note}>記事はまだありません。</p>
              ) : (
                <ul className={s.tally}>
                  {(Object.keys(QIITA) as QiitaState[])
                    .filter((k) => (counts.get(k) ?? 0) > 0)
                    .map((k) => (
                      <li key={k}>
                        <span className={s.tallyNumber}>{counts.get(k)}</span>
                        {QIITA[k]}
                      </li>
                    ))}
                </ul>
              )}
              {!posts.value.qiita && (
                <p className={s.note}>
                  Qiitaを見られませんでした(トークンが入っていないかもしれません)。
                </p>
              )}
              {posts.value.posts
                .filter((p) => p.state === "ahead")
                .map((p) => (
                  <p key={p.path} className={s.error}>
                    「{p.title}」はQiitaのほうが新しく直されています。
                  </p>
                ))}
            </>
          )}
        </Card>

        <Card title="中身" count={paths.length}>
          <ul className={s.tally}>
            {groups.map((g) => (
              <li key={g.key}>
                <span className={s.tallyNumber}>{g.items.length}</span>
                {g.title}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
