"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { Contents } from "./Contents";
import { Editor } from "./Editor";
import { PhotoDraft } from "./PhotoDraft";
import { Settings } from "./Settings";

/**
 * ログインに失敗したときの文。Workerからは記号(?error=owner など)だけが来る。
 * URLの文をそのまま出すと、作ったURLで好きな文を出せてしまうので、決まった文だけを出す
 */
const ERRORS: Readonly<Record<string, string>> = {
  state: "ログインをやり直してください。確認の値が合いませんでした。",
  token: "GitHub からトークンをもらえませんでした。もう一度試してください。",
  owner: "この管理画面に入れるのは持ち主だけです。",
};

type State =
  { kind: "loading" } | { kind: "out" } | { kind: "in"; login: string };

/** Workerへの呼び出し。独自ヘッダーX-Adminで、このサイトの画面からだと伝える */
function call(path: string, method = "GET"): Promise<Response> {
  return fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "X-Admin": "1" },
  });
}

/** 管理画面のログイン。トークンはWorkerが持ち、この画面には来ない */
export function Login() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [error, setError] = useState<string | undefined>();
  /** 開いているファイル。なければ一覧 */
  const [open, setOpen] = useState<string | undefined>();
  /** 設定を開いているか */
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(location.search).get("error");
    if (code !== null) {
      // 再読み込みで同じ文が出続けないよう、URLから消す
      history.replaceState(null, "", "/admin/");
    }
    let alive = true;
    void call("/admin/auth/me").then(async (res) => {
      if (!alive) return;
      if (code !== null) setError(ERRORS[code]);
      if (res.ok) {
        const { login } = (await res.json()) as { login: string };
        setState({ kind: "in", login });
      } else {
        setState({ kind: "out" });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    await call("/admin/auth/logout", "POST");
    setState({ kind: "out" });
  };

  if (state.kind === "loading")
    return <p className={s.note}>確かめています…</p>;

  if (state.kind === "in") {
    return (
      <>
        <div className={s.row}>
          <p className={s.note}>{state.login} でログインしています</p>
          <button
            type="button"
            className={s.button}
            aria-pressed={settings}
            onClick={() => {
              setSettings(true);
              setOpen(undefined);
            }}
          >
            設定
          </button>
          <button
            type="button"
            className={s.button}
            onClick={() => void logout()}
          >
            ログアウト
          </button>
        </div>
        {settings ? (
          <Settings
            onBack={() => {
              setSettings(false);
            }}
          />
        ) : open === undefined ? (
          <Contents onOpen={setOpen} />
        ) : open.endsWith(".jpg") ? (
          // 写真は、足した下書きだけ開ける
          <PhotoDraft
            path={open}
            onBack={() => {
              setOpen(undefined);
            }}
          />
        ) : (
          <Editor
            path={open}
            onBack={() => {
              setOpen(undefined);
            }}
          />
        )}
      </>
    );
  }

  return (
    // リンクにすると幕がページの移動として横取りするので、フォームで送る
    <form className={s.form} method="get" action="/admin/auth/login">
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={s.button}>
        GitHub でログイン
      </button>
      <label className={s.remember}>
        <input type="checkbox" name="remember" value="1" />
        この端末で覚える(30日)
      </label>
    </form>
  );
}
