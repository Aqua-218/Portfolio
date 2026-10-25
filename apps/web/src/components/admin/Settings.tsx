"use client";

import { useEffect, useState } from "react";
import * as s from "./admin.css";
import { REPO } from "./github";

/** Workerが返す設定の様子。値そのものは来ない */
export interface SettingInfo {
  name: string;
  label: string;
  /** admin: 管理画面で入れた、secret: wrangler secret のもの、null: 入っていない */
  source: "admin" | "secret" | null;
  last4: string | null;
  at: number | null;
  by: string | null;
}

export interface Change {
  name: string;
  action: "set" | "delete";
  at: number;
  by: string;
}

interface Data {
  settings: SettingInfo[];
  changes: Change[];
}

/** Actionsで使うもの。GitHubの画面で入れる(管理画面には権限を持たせない) */
const ACTIONS = [
  { name: "QIITA_TOKEN", use: "公開したときにQiitaへ出す" },
  {
    name: "CONTENT_CACHE_TOKEN",
    use: "図・OGPのキャッシュとQiitaのidを書き戻す",
  },
  { name: "RELEASE_PLEASE_TOKEN", use: "リリースのPRを作る" },
] as const;

function call(method: "GET" | "PUT" | "DELETE", name = "", value?: string) {
  return fetch(`/admin/settings${name === "" ? "" : `?name=${name}`}`, {
    method,
    credentials: "same-origin",
    headers: {
      "X-Admin": "1",
      ...(value === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(value === undefined ? {} : { body: JSON.stringify({ value }) }),
  });
}

/** 秒の時刻を読みやすく */
export function when(at: number): string {
  const d = new Date(at * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getFullYear())}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** いま入っているものの説明 */
export function status(s: SettingInfo): string {
  if (s.source === null) return "入っていません";
  const tail = `…${s.last4 ?? ""}`;
  if (s.source === "secret") return `wrangler secret のもの(${tail})`;
  return `管理画面で入れたもの(${tail}、${s.at === null ? "" : when(s.at)}、${s.by ?? ""})`;
}

/** 失敗したときの文 */
function failure(status: number, error?: string): string {
  if (status === 401) return "ログインが切れました。ログインし直してください。";
  if (status === 422 && error) return `${error}。`;
  return "できませんでした。もう一度押してください。";
}

function One({
  info,
  onChange,
}: {
  info: SettingInfo;
  onChange: (d: Data) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const send = async (method: "PUT" | "DELETE") => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await call(
        method,
        info.name,
        method === "PUT" ? value : undefined,
      );
      const body = (await res.json()) as Data & { error?: string };
      if (!res.ok) {
        setMessage({ ok: false, text: failure(res.status, body.error) });
        return;
      }
      setValue("");
      onChange(body);
      setMessage({
        ok: true,
        text: method === "PUT" ? "入れ替えました。" : "消しました。",
      });
    } catch {
      setMessage({ ok: false, text: failure(0) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={s.setting}>
      <h3 className={s.groupTitle}>{info.label}</h3>
      <p className={s.note}>{status(info)}</p>
      <form
        className={s.row}
        onSubmit={(e) => {
          e.preventDefault();
          if (value !== "") void send("PUT");
        }}
      >
        <label className={s.field}>
          新しい値(入れたあとは、ここにも出しません)
          <input
            className={s.input}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.trim());
            }}
          />
        </label>
        <button
          type="submit"
          className={s.save}
          disabled={busy || value === ""}
        >
          入れ替える
        </button>
        {info.source === "admin" && (
          <button
            type="button"
            className={s.button}
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  `管理画面で入れた${info.label}を消しますか？ wrangler secret のものがあれば、そちらに戻ります。`,
                )
              )
                void send("DELETE");
            }}
          >
            消す
          </button>
        )}
      </form>
      {busy && (
        <p className={s.note} role="status">
          確かめています…
        </p>
      )}
      {message && (
        <p
          className={message.ok ? s.note : s.error}
          role={message.ok ? "status" : "alert"}
        >
          {message.text}
        </p>
      )}
    </li>
  );
}

/**
 * 設定。Workerが使うもの(Qiitaのトークンなど)を入れ替える。
 * 値はWorkerがその鍵で暗号化してKVに置き、この画面にもAPIの返事にも二度と出さない
 */
export function Settings({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    call("GET")
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) {
          setError(failure(res.status));
          return;
        }
        setData((await res.json()) as Data);
      })
      .catch(() => {
        if (alive) setError(failure(0));
      });
    return () => {
      alive = false;
    };
  }, []);

  const label = (name: string) =>
    data?.settings.find((x) => x.name === name)?.label ?? name;

  return (
    <section className={s.editor} aria-label="設定">
      <div className={s.row}>
        <button type="button" className={s.button} onClick={onBack}>
          一覧へ戻る
        </button>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {data === null && error === null && (
        <p className={s.note}>読んでいます…</p>
      )}
      {data && (
        <>
          <h2 className={s.subTitle}>Workerの設定</h2>
          <ul className={s.settings}>
            {data.settings.map((info) => (
              <One key={info.name} info={info} onChange={setData} />
            ))}
          </ul>
          {data.changes.length > 0 && (
            <>
              <h2 className={s.subTitle}>変えた記録</h2>
              <ul className={s.checks}>
                {data.changes.map((c) => (
                  <li key={`${c.name}-${String(c.at)}-${c.action}`}>
                    <span>
                      {label(c.name)}を
                      {c.action === "set" ? "入れ替えた" : "消した"}
                    </span>
                    <span className={s.checkState}>
                      {when(c.at)}・{c.by}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <h2 className={s.subTitle}>Actionsの設定</h2>
      <p className={s.note}>
        Actionsで使うものは、管理画面からは変えられません(管理画面に、CIの秘密を書き換える権限を持たせないため)。GitHubの画面で入れてください。
      </p>
      <ul className={s.checks}>
        {ACTIONS.map((a) => (
          <li key={a.name}>
            <code>{a.name}</code>
            <span className={s.checkState}>{a.use}</span>
          </li>
        ))}
      </ul>
      <p className={s.note}>
        <a
          href={`https://github.com/${REPO}/settings/secrets/actions`}
          target="_blank"
          rel="noopener"
        >
          GitHubでActionsのsecretsを開く
        </a>
      </p>
    </section>
  );
}
