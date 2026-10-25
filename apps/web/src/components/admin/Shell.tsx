"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { Editor } from "./Editor";
import { contentFiles, drafts } from "./github";
import { Home } from "./Home";
import { PhotoDraft } from "./PhotoDraft";
import { Settings } from "./Settings";
import { BlogView, DraftsView, FilesView, PhotosView } from "./Views";

/** 左のメニューで選べる画面 */
export type View = "home" | "drafts" | "blog" | "photos" | "files" | "settings";

const MENU: { view: View; label: string; icon: string }[] = [
  {
    view: "home",
    label: "ホーム",
    icon: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  },
  {
    view: "drafts",
    label: "下書き",
    icon: "M5 3h9l5 5v13H5zM14 3v5h5M8 13h8M8 17h5",
  },
  {
    view: "blog",
    label: "ブログ",
    icon: "M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z",
  },
  {
    view: "photos",
    label: "写真",
    icon: "M3 6h18v13H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01",
  },
  { view: "files", label: "ファイル", icon: "M3 6h6l2 2h10v11H3z" },
  {
    view: "settings",
    label: "設定",
    icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

type Data =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** draftsは、下書きのブランチがあるファイル */
  | { kind: "ready"; paths: string[]; drafts: Set<string> };

/**
 * ログインしたあとの管理画面。左にメニュー、上に検索とログインしている人、真ん中に選んだ画面。
 * ファイルを開くと、真ん中が編集になる
 */
export function Shell({
  login,
  onLogout,
}: {
  login: string;
  onLogout: () => void;
}) {
  const [view, setView] = useState<View>("home");
  /** 開いているファイル。なければ選んだ画面 */
  const [open, setOpen] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Data>({ kind: "loading" });
  /** 増やすと一覧を読み直す(取り込みや保存のあと) */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([contentFiles(), drafts()])
      .then(([paths, draftPaths]) => {
        if (alive) setData({ kind: "ready", paths, drafts: draftPaths });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setData({
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

  const go = (next: View) => {
    setView(next);
    setOpen(undefined);
  };
  const back = () => {
    setOpen(undefined);
    // 保存や公開で下書きが変わっているかもしれない
    setVersion((v) => v + 1);
  };
  const title = MENU.find((m) => m.view === view)?.label ?? "";
  const draftCount = data.kind === "ready" ? data.drafts.size : 0;

  return (
    <div className={s.shell}>
      <nav className={s.side} aria-label="管理画面のメニュー">
        <h1 className={s.brand}>Admin</h1>
        <ul className={s.menu}>
          {MENU.map((m) => (
            <li key={m.view}>
              <button
                type="button"
                className={s.menuItem}
                aria-current={view === m.view && !open ? "page" : undefined}
                onClick={() => {
                  go(m.view);
                }}
              >
                <Icon d={m.icon} />
                {m.label}
                {m.view === "drafts" && draftCount > 0 && (
                  <span className={s.menuCount}>{draftCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={s.mainArea}>
        <header className={s.topbar}>
          <input
            className={s.topSearch}
            type="search"
            placeholder="ファイルを探す"
            aria-label="ファイルを探す"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value !== "") go("files");
            }}
          />
          <div className={s.user}>
            <span className={s.avatar} aria-hidden="true">
              {login.slice(0, 1).toUpperCase()}
            </span>
            <p className={s.note}>{login} でログインしています</p>
            <button type="button" className={s.button} onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </header>

        <p className={s.crumbs}>
          Dashboard <span aria-hidden="true">›</span> {title}
          {open && (
            <>
              {" "}
              <span aria-hidden="true">›</span> {open.replace(/^content\//, "")}
            </>
          )}
        </p>

        <section className={s.view} aria-label={`${title}の画面`}>
          {open !== undefined ? (
            open.endsWith(".jpg") ? (
              // 写真は、足した下書きだけ開ける
              <PhotoDraft path={open} onBack={back} />
            ) : (
              <Editor path={open} onBack={back} />
            )
          ) : view === "settings" ? (
            <Settings
              onBack={() => {
                go("home");
              }}
            />
          ) : data.kind === "loading" ? (
            <p className={s.note}>一覧を読んでいます…</p>
          ) : data.kind === "error" ? (
            <p className={s.error} role="alert">
              {data.message}
            </p>
          ) : view === "home" ? (
            <Home
              paths={data.paths}
              drafts={data.drafts}
              onOpen={setOpen}
              onGo={go}
            />
          ) : view === "drafts" ? (
            <DraftsView
              paths={data.paths}
              drafts={data.drafts}
              onOpen={setOpen}
            />
          ) : view === "blog" ? (
            <BlogView
              paths={data.paths}
              drafts={data.drafts}
              onOpen={setOpen}
              onChanged={() => {
                setVersion((v) => v + 1);
              }}
            />
          ) : view === "photos" ? (
            <PhotosView
              paths={data.paths}
              drafts={data.drafts}
              onOpen={setOpen}
            />
          ) : (
            <FilesView
              paths={data.paths}
              drafts={data.drafts}
              query={query}
              onQuery={setQuery}
              onOpen={setOpen}
            />
          )}
        </section>
      </div>
    </div>
  );
}
