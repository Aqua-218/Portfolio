"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { api, draftBranch, readFile, REPO } from "./github";
import { Publish } from "./Publish";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** previewは写真のdata:のURL、tomlは下書きのcats.toml */
  | { kind: "ready"; preview: string; toml: string };

/** 下書きのブランチにある写真を、data:のURLにする。1MBを超える写真もあるので、blobで読む */
async function photoUrl(path: string): Promise<string> {
  const ref = draftBranch(path);
  const meta = await api("GET", `/repos/${REPO}/contents/${path}?ref=${ref}`);
  if (!meta.ok) throw new Error(String(meta.status));
  const { sha } = (await meta.json()) as { sha: string };
  const blob = await api("GET", `/repos/${REPO}/git/blobs/${sha}`);
  if (!blob.ok) throw new Error(String(blob.status));
  const { content } = (await blob.json()) as { content: string };
  return `data:image/jpeg;base64,${content.replace(/\s/g, "")}`;
}

/** 足した写真の下書き。写真と、cats.tomlに足したところを見せて、公開する */
export function PhotoDraft({
  path,
  onBack,
}: {
  path: string;
  onBack: () => void;
}) {
  const id = path.replace(/^content\/cats\//, "").replace(/\.jpg$/, "");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      photoUrl(path),
      readFile("content/cats.toml", draftBranch(path)),
    ])
      .then(([preview, { text }]) => {
        if (alive) setState({ kind: "ready", preview, toml: text });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          kind: "error",
          message:
            e instanceof Error && e.message === "401"
              ? "ログインが切れました。ログインし直してください。"
              : "下書きを読めませんでした。",
        });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  return (
    <section className={s.editor} aria-label={`写真「${id}」の下書き`}>
      <div className={s.row}>
        <button type="button" className={s.button} onClick={onBack}>
          一覧へ戻る
        </button>
        <code className={s.path}>{path}</code>
        {!merged && <span className={s.draft}>下書き</span>}
      </div>
      {state.kind === "loading" && <p className={s.note}>読んでいます…</p>}
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}
      {state.kind === "ready" && (
        <>
          <img className={s.photo} src={state.preview} alt={`写真「${id}」`} />
          <Publish
            path={path}
            text={state.toml}
            diffPath="content/cats.toml"
            added={path}
            defaultTitle={`content: 写真「${id}」を足す`}
            onMerged={() => {
              setMerged(true);
            }}
          />
        </>
      )}
    </section>
  );
}
