"use client";

import { useState } from "react";
import * as s from "./dev.css";

/** 開発モードで、すぐ見に行きたいページ */
const LINKS: { title: string; items: [string, string][] }[] = [
  {
    title: "記法の見本",
    items: [
      ["サイトの記法", "/markdown/"],
      ["ブログ(Qiita)の記法", "/blog/sample/"],
    ],
  },
  {
    title: "エラーの画面",
    items: [
      ["404", "/nai/"],
      ...[
        "400",
        "401",
        "403",
        "408",
        "410",
        "429",
        "500",
        "502",
        "503",
        "504",
      ].map((code): [string, string] => [code, `/errors/${code}/`]),
    ],
  },
  {
    title: "管理画面",
    items: [["ログインなしで開く", "/admin/"]],
  },
];

/**
 * 開発モード(pnpm dev)のときだけ出すメニュー。本番のビルドには入らない(layout.tsxで分ける)。
 * 管理画面は、WorkerとGitHubの代わりに手元のcontent/を読み書きする(scripts/dev-admin.mjs)
 */
export function DevMenu() {
  const [open, setOpen] = useState(false);
  return (
    <aside className={s.menu} aria-label="開発メニュー">
      <button
        type="button"
        className={s.toggle}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        開発
      </button>
      {open && (
        <div className={s.panel}>
          <p className={s.note}>開発モード(pnpm dev)だけのメニュー</p>
          {LINKS.map((g) => (
            <section key={g.title}>
              <h2 className={s.title}>{g.title}</h2>
              <ul className={s.list}>
                {g.items.map(([label, href]) => (
                  <li key={href}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
