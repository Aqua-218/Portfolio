"use client";

import { useState } from "react";
import * as s from "./admin.css";

/** ファイル名に使える字。content-checkと同じ(URLにそのまま入る) */
const SLUG = /^[A-Za-z0-9_-]+$/;

/** 新しい記事の名前が使えるか。使えなければ理由 */
export function slugProblem(slug: string, taken: ReadonlySet<string>): string {
  if (slug === "") return "";
  if (!SLUG.test(slug)) return "英数字・「-」・「_」だけにしてください。";
  if (slug === "sample") return "sample は記法の見本のページで使っています。";
  if (taken.has(`content/blog/${slug}.md`))
    return "その名前の記事はもうあります。";
  return "";
}

/** 新しいブログの記事を書き始める。ファイル名(URLになる)を決めて、空の記事を開く */
export function NewPost({
  taken,
  onOpen,
}: {
  /** もうあるファイル。mainと下書きの両方 */
  taken: ReadonlySet<string>;
  onOpen: (path: string) => void;
}) {
  const [slug, setSlug] = useState("");
  const problem = slugProblem(slug, taken);
  return (
    <form
      className={s.row}
      onSubmit={(e) => {
        e.preventDefault();
        if (slug !== "" && problem === "") onOpen(`content/blog/${slug}.md`);
      }}
    >
      <label className={s.field}>
        新しい記事のファイル名(URLになる。例: rust-wasm-cat)
        <input
          id="admin-new-post"
          className={s.input}
          value={slug}
          spellCheck={false}
          onChange={(e) => {
            setSlug(e.target.value.trim());
          }}
        />
        {problem !== "" && (
          <span className={s.fieldError} role="alert">
            {problem}
          </span>
        )}
      </label>
      <button
        type="submit"
        className={s.button}
        disabled={slug === "" || problem !== ""}
      >
        書き始める
      </button>
    </form>
  );
}
