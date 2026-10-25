"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { LineChart, Meter, Sparkline, StackedBars } from "./Charts";
import {
  type Activity,
  activity,
  type Commit,
  contentCommits,
  type OpenPull,
  openPulls,
  perWeek,
  type PostState,
  postStates,
  type QiitaState,
  recentRuns,
  type Run,
  summarize,
  weekStarts,
} from "./dashboard";
import type { View } from "./Shell";
import { Badge, QIITA } from "./Views";

/** グラフの週の数 */
const WEEKS = 12;

type Load<T> = T | "loading" | "error";

function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Load<T> {
  const [state, setState] = useState<Load<T>>("loading");
  useEffect(() => {
    let alive = true;
    load()
      .then((v) => {
        if (alive) setState(v);
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 呼ぶ側が決めた値が変わったときだけ読み直す
  }, deps);
  return state;
}

const ready = <T,>(v: Load<T>): v is T => v !== "loading" && v !== "error";

/** 「10/20」 */
function md(d: Date): string {
  return `${String(d.getMonth() + 1)}/${String(d.getDate())}`;
}

/** 「10/25 14:03」 */
function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${md(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Card({
  title,
  className = s.card,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className} aria-label={title}>
      <h3 className={s.cardTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Pending<T>({
  load,
  children,
}: {
  load: Load<T>;
  children: (v: T) => React.ReactNode;
}) {
  if (load === "loading") return <p className={s.note}>読んでいます…</p>;
  if (load === "error") return <p className={s.error}>読めませんでした。</p>;
  return children(load);
}

/** 数のカード。大きな数と、ひとこと、あれば週ごとの小さな折れ線 */
function Stat({
  label,
  value,
  sub,
  trend,
  onClick,
}: {
  label: string;
  value: number | string;
  sub: string;
  trend?: number[];
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={s.statLabel}>{label}</span>
      <span className={s.statValue}>{value}</span>
      <span className={s.statSub}>{sub}</span>
      {trend && (
        <Sparkline
          values={trend}
          label={`${label}の週ごとの数: ${trend.join("、")}`}
        />
      )}
    </>
  );
  return onClick ? (
    <button type="button" className={s.stat} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={s.stat}>{body}</div>
  );
}

/**
 * 管理画面のホーム。上に数のカード、真ん中にcontent/の変更と公開のグラフ、横にQiitaと最近の動き
 */
export function Home({
  paths,
  drafts,
  onOpen,
  onGo,
}: {
  paths: string[];
  drafts: Set<string>;
  onOpen: (path: string) => void;
  onGo: (view: View) => void;
}) {
  const [starts] = useState(() => weekStarts(new Date(), WEEKS));
  const pulls = useLoad<OpenPull[]>(openPulls, []);
  const runs = useLoad<Run[]>(() => recentRuns(100), []);
  const commits = useLoad<Commit[]>(
    () => contentCommits(starts[0] ?? new Date()),
    [],
  );
  const posts = useLoad<{ posts: PostState[]; qiita: boolean }>(
    () => postStates(paths),
    [paths],
  );

  const blogCount = paths.filter(
    (p) => p.startsWith("content/blog/") && p.endsWith(".md"),
  ).length;
  const photoCount = paths.filter((p) =>
    /^content\/cats\/.+\.jpg$/.test(p),
  ).length;
  const commitWeeks = ready(commits)
    ? perWeek(commits, (c) => c.at, starts).map((w) => w.length)
    : null;
  const runWeeks = ready(runs) ? perWeek(runs, (r) => r.at, starts) : null;
  const failedPulls = ready(pulls)
    ? pulls.filter((p) => summarize(p.checks) === "failed").length
    : 0;

  return (
    <div className={s.home}>
      <div className={s.stats}>
        <Stat
          label="ブログの記事"
          value={blogCount}
          sub={
            ready(posts)
              ? `Qiitaに出した ${String(posts.posts.filter((p) => p.state === "synced").length)}`
              : "Qiitaを見ています…"
          }
          onClick={() => {
            onGo("blog");
          }}
        />
        <Stat
          label="下書き"
          value={drafts.size}
          sub={drafts.size === 0 ? "ありません" : "公開していないもの"}
          onClick={() => {
            onGo("drafts");
          }}
        />
        <Stat
          label="公開待ち"
          value={ready(pulls) ? pulls.length : "…"}
          sub={
            failedPulls > 0
              ? `${String(failedPulls)}件のチェックが落ちました`
              : "PRのチェック"
          }
          onClick={() => {
            onGo("drafts");
          }}
        />
        <Stat
          label="猫の写真"
          value={photoCount}
          sub="サイトに出ているもの"
          onClick={() => {
            onGo("photos");
          }}
        />
        <Stat
          label="今週の変更"
          value={commitWeeks?.at(-1) ?? "…"}
          sub={`content/ のコミット(${String(WEEKS)}週)`}
          {...(commitWeeks ? { trend: commitWeeks } : {})}
        />
      </div>

      <div className={s.homeGrid}>
        <Card title="content/ の変更(週ごと)" className={s.cardWide}>
          <Pending load={commits}>
            {() => (
              <LineChart
                title="content/ の変更(週ごと)"
                unit="件"
                points={starts.map((d, i) => ({
                  label: md(d),
                  long: `${md(d)}の週`,
                  value: commitWeeks?.[i] ?? 0,
                }))}
              />
            )}
          </Pending>
        </Card>

        <Card title="Qiitaへの出し具合" className={s.cardSide}>
          <Pending load={posts}>
            {(p) =>
              p.posts.length === 0 ? (
                <p className={s.note}>記事はまだありません。</p>
              ) : (
                <div className={s.meters}>
                  {(["synced", "ahead", "new", "ignored"] as QiitaState[]).map(
                    (k) => (
                      <Meter
                        key={k}
                        label={QIITA[k]}
                        value={p.posts.filter((x) => x.state === k).length}
                        total={p.posts.length}
                        tone={
                          k === "synced" ? "ok" : k === "ahead" ? "ng" : "muted"
                        }
                      />
                    ),
                  )}
                  {!p.qiita && (
                    <p className={s.note}>
                      Qiitaを見られませんでした。「設定」でトークンを入れてください。
                    </p>
                  )}
                  {p.posts
                    .filter((x) => x.state === "ahead")
                    .map((x) => (
                      <button
                        key={x.path}
                        type="button"
                        className={s.warnItem}
                        onClick={() => {
                          onOpen(x.path);
                        }}
                      >
                        「{x.title}」はQiitaのほうが新しく直されています。
                      </button>
                    ))}
                </div>
              )
            }
          </Pending>
        </Card>

        <Card title="公開(週ごと)" className={s.cardWide}>
          <Pending load={runs}>
            {() => (
              <StackedBars
                title="公開(週ごと)"
                points={starts.map((d, i) => {
                  const week = runWeeks?.[i] ?? [];
                  const ng = week.filter(
                    (r) => summarize([r]) === "failed",
                  ).length;
                  const ok = week.filter(
                    (r) => summarize([r]) === "passed",
                  ).length;
                  return { label: md(d), long: `${md(d)}の週`, ok, ng };
                })}
              />
            )}
          </Pending>
        </Card>

        <Card title="最近の動き" className={s.cardSide}>
          {ready(commits) && ready(runs) ? (
            <Feed items={activity(commits, runs)} />
          ) : commits === "error" && runs === "error" ? (
            <p className={s.error}>読めませんでした。</p>
          ) : (
            <p className={s.note}>読んでいます…</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Feed({ items }: { items: Activity[] }) {
  if (items.length === 0) return <p className={s.note}>まだ何もありません。</p>;
  return (
    <ol className={s.feed}>
      {items.map((a, i) => (
        <li key={`${a.at}-${String(i)}`}>
          <span className={s.feedHead}>
            <span className={s.count}>
              {a.kind === "commit" ? "変更" : "公開"}
            </span>
            <time className={s.count} dateTime={a.at}>
              {when(a.at)}
            </time>
          </span>
          <span className={s.feedTitle}>{a.title}</span>
          {a.summary && a.summary !== "none" && <Badge summary={a.summary} />}
        </li>
      ))}
    </ol>
  );
}
