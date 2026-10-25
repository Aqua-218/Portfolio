"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import {
  type OpenPull,
  openPulls,
  type PostState,
  postStates,
  type QiitaState,
  type Summary,
  summarize,
} from "./dashboard";
import { group } from "./groups";
import { NewPost } from "./NewPost";
import { QiitaImport } from "./QiitaImport";
import { Upload } from "./Upload";

interface Props {
  /** mainのファイル */
  paths: string[];
  /** 下書きのあるファイル */
  drafts: Set<string>;
  onOpen: (path: string) => void;
}

/** 文字のファイルだけ開ける。写真は足した下書きだけ */
function editable(path: string): boolean {
  return /\.(md|toml|svg)$/.test(path);
}

export const SUMMARY: Record<Summary, string> = {
  pending: "チェック中",
  failed: "落ちました",
  passed: "通りました",
  none: "チェックなし",
};

export function Badge({ summary }: { summary: Summary }) {
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

export const QIITA: Record<QiitaState, string> = {
  synced: "出した",
  ahead: "Qiitaのほうが新しい",
  new: "まだ",
  ignored: "出さない",
  unknown: "わからない",
};

/** ファイルの一覧。押すと開く */
function FileList({
  title,
  items,
  drafts,
  onOpen,
}: {
  title: string;
  items: { path: string; label: string; note?: React.ReactNode }[];
  drafts: ReadonlySet<string>;
  onOpen: (path: string) => void;
}) {
  return (
    <div>
      <h3 className={s.groupTitle}>
        {title}
        <span className={s.count}>{items.length}</span>
      </h3>
      <ul className={s.list}>
        {items.map((item) => (
          <li key={item.path} title={item.path}>
            {editable(item.path) || drafts.has(item.path) ? (
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
            {item.note}
            {drafts.has(item.path) && <span className={s.draft}>下書き</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** mainにまだない下書き(新しい記事・足した写真) */
function fresh(props: Props, dir: string, ext: string): string[] {
  return [...props.drafts]
    .filter((p) => p.startsWith(dir) && p.endsWith(ext))
    .filter((p) => !props.paths.includes(p))
    .sort();
}

/** 下書きと、公開待ちのPR */
export function DraftsView(props: Props) {
  const [pulls, setPulls] = useState<OpenPull[] | null | "error">(null);
  useEffect(() => {
    let alive = true;
    openPulls()
      .then((p) => {
        if (alive) setPulls(p);
      })
      .catch(() => {
        if (alive) setPulls("error");
      });
    return () => {
      alive = false;
    };
  }, []);
  const list = [...props.drafts].sort();
  return (
    <div className={s.stack}>
      <div className={s.panel}>
        <h2 className={s.subTitle}>公開待ち</h2>
        {pulls === null && <p className={s.note}>読んでいます…</p>}
        {pulls === "error" && <p className={s.error}>読めませんでした。</p>}
        {Array.isArray(pulls) && pulls.length === 0 && (
          <p className={s.note}>公開待ちのPRはありません。</p>
        )}
        {Array.isArray(pulls) && pulls.length > 0 && (
          <ul className={s.list}>
            {pulls.map((p) => (
              <li key={p.number}>
                <button
                  type="button"
                  className={s.item}
                  title={p.path}
                  onClick={() => {
                    props.onOpen(p.path);
                  }}
                >
                  {p.title}
                </button>
                <Badge summary={summarize(p.checks)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.panel}>
        {list.length === 0 ? (
          <p className={s.note}>下書きはありません。</p>
        ) : (
          <FileList
            title="下書き"
            items={list.map((p) => ({
              path: p,
              label: p.replace(/^content\//, ""),
            }))}
            drafts={new Set()}
            onOpen={props.onOpen}
          />
        )}
      </div>
    </div>
  );
}

/** ブログ。新しい記事・Qiitaから取り込む・記事の一覧(Qiitaへの出し具合つき) */
export function BlogView(props: Props & { onChanged: () => void }) {
  const [states, setStates] = useState<PostState[] | null>(null);
  useEffect(() => {
    let alive = true;
    postStates(props.paths)
      .then((r) => {
        if (alive) setStates(r.posts);
      })
      .catch(() => {
        if (alive) setStates([]);
      });
    return () => {
      alive = false;
    };
  }, [props.paths]);
  const taken = new Set([...props.paths, ...props.drafts]);
  const posts = props.paths.filter(
    (p) => p.startsWith("content/blog/") && p.endsWith(".md"),
  );
  const newPosts = fresh(props, "content/blog/", ".md");
  return (
    <div className={s.stack}>
      <div className={s.panel}>
        <NewPost taken={taken} onOpen={props.onOpen} />
        <QiitaImport
          paths={props.paths}
          drafts={props.drafts}
          taken={taken}
          onImported={props.onChanged}
        />
      </div>
      {newPosts.length > 0 && (
        <div className={s.panel}>
          <FileList
            title="書きかけの新しい記事"
            items={newPosts.map((p) => ({
              path: p,
              label: p.replace(/^content\/blog\//, ""),
            }))}
            drafts={props.drafts}
            onOpen={props.onOpen}
          />
        </div>
      )}
      <div className={s.panel}>
        <FileList
          title="記事"
          items={posts.map((p) => {
            const st = states?.find((x) => x.path === p);
            return {
              path: p,
              label: st?.title ?? p.replace(/^content\/blog\//, ""),
              note: st && (
                <span
                  className={st.state === "ahead" ? s.badgeFailed : s.badge}
                >
                  Qiita: {QIITA[st.state]}
                </span>
              ),
            };
          })}
          drafts={props.drafts}
          onOpen={props.onOpen}
        />
      </div>
    </div>
  );
}

/** 写真。足す・足した下書き・いまある写真 */
export function PhotosView(props: Props) {
  const ids = new Set(
    [...props.paths, ...props.drafts]
      .map((p) => /^content\/cats\/(.+)\.jpg$/.exec(p)?.[1])
      .filter((id) => id !== undefined),
  );
  const newPhotos = fresh(props, "content/cats/", ".jpg");
  const cats = group(props.paths).find((g) => g.key === "cats")?.items ?? [];
  return (
    <div className={s.stack}>
      <div className={s.panel}>
        <Upload ids={ids} onOpen={props.onOpen} />
      </div>
      {newPhotos.length > 0 && (
        <div className={s.panel}>
          <FileList
            title="足した写真の下書き"
            items={newPhotos.map((p) => ({
              path: p,
              label: p.replace(/^content\/cats\//, ""),
            }))}
            drafts={props.drafts}
            onOpen={props.onOpen}
          />
        </div>
      )}
      <div className={s.panel}>
        <FileList
          title="猫の写真"
          items={cats}
          drafts={props.drafts}
          onOpen={props.onOpen}
        />
      </div>
    </div>
  );
}

/** すべてのファイル。種類ごとに分け、名前で絞り込める */
export function FilesView(
  props: Props & { query: string; onQuery: (q: string) => void },
) {
  const groups = group(props.paths, props.query);
  return (
    <section className={s.panel} aria-label="content/ の一覧">
      <input
        className={s.search}
        type="search"
        placeholder="名前で絞り込む"
        aria-label="名前で絞り込む"
        value={props.query}
        onChange={(e) => {
          props.onQuery(e.target.value);
        }}
      />
      {groups.length === 0 && <p className={s.note}>見つかりません</p>}
      {groups.map((g) => (
        <FileList
          key={g.key}
          title={g.title}
          items={g.items}
          drafts={props.drafts}
          onOpen={props.onOpen}
        />
      ))}
    </section>
  );
}
