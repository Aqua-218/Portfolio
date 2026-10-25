"use client";

import { useState } from "react";
import * as s from "./admin.css";
import { cleanPhoto, PHOTO_ID } from "./photo";
import { savePhotoDraft } from "./upload";

/** 猫の毛色。cats.tomlのcoatsと同じ */
const COATS = [
  { value: "kuro", label: "黒" },
  { value: "kiji", label: "キジ" },
  { value: "mike", label: "三毛" },
] as const;

type State =
  | { kind: "empty" }
  | { kind: "reading" }
  | { kind: "error"; message: string }
  /** メタデータを消した写真。previewは画面に出すdata:のURL */
  | { kind: "ready"; jpeg: Uint8Array; preview: string }
  | { kind: "saving"; jpeg: Uint8Array; preview: string }
  | { kind: "saved"; id: string };

function dataUrl(jpeg: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      reject(new Error("read"));
    };
    reader.readAsDataURL(new Blob([jpeg as BlobPart], { type: "image/jpeg" }));
  });
}

/**
 * 写真を足す。ドロップか選んだ写真を、位置情報などのメタデータを消したJPEGにして、
 * cats.tomlに載せたうえで下書きのブランチにコミットする。WebPやAVIFへの変換はビルドでやる(imgpipe)
 */
export function Upload({ ids }: { ids: ReadonlySet<string> }) {
  const [state, setState] = useState<State>({ kind: "empty" });
  const [id, setId] = useState("");
  const [alt, setAlt] = useState("");
  const [coats, setCoats] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const read = (file: File) => {
    setError(null);
    setState({ kind: "reading" });
    cleanPhoto(file)
      .then(async (jpeg) => {
        setState({ kind: "ready", jpeg, preview: await dataUrl(jpeg) });
      })
      .catch((e: unknown) => {
        setState({
          kind: "error",
          message:
            e instanceof Error && e.message.startsWith("metadata:")
              ? "位置情報などを消せませんでした。この写真は保存しません。"
              : "この写真は読めませんでした。JPEGかPNGにしてください。",
        });
      });
  };

  const idProblem = !PHOTO_ID.test(id)
    ? "英小文字・数字・ハイフンで書いてください。"
    : ids.has(id)
      ? "同じ名前の写真がもうあります。"
      : null;
  const altProblem = alt.trim() === "" ? "説明を書いてください。" : null;
  const coatsProblem =
    coats.length === 0 ? "毛色を1つ以上選んでください。" : null;
  const valid =
    idProblem === null && altProblem === null && coatsProblem === null;

  const save = () => {
    if (state.kind !== "ready" || !valid) return;
    setError(null);
    setState({ ...state, kind: "saving" });
    savePhotoDraft({ id, alt: alt.trim(), coats, jpeg: state.jpeg })
      .then(() => {
        setState({ kind: "saved", id });
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error && e.message === "401"
            ? "ログインが切れました。ログインし直してください。"
            : "保存できませんでした。もう一度押してください。",
        );
        setState({ ...state, kind: "ready" });
      });
  };

  return (
    <details className={s.upload}>
      <summary className={s.groupTitle}>写真を足す</summary>
      <div
        className={s.drop}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) read(file);
        }}
      >
        <p className={s.note}>
          ここに写真をドロップするか、選んでください。位置情報などは消してから保存します。
        </p>
        <label className={s.button}>
          写真を選ぶ
          <input
            className={s.hidden}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) read(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {state.kind === "reading" && (
        <p className={s.note}>写真を読んでいます…</p>
      )}
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}
      {error !== null && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}

      {(state.kind === "ready" || state.kind === "saving") && (
        <div className={s.fields}>
          <img className={s.photo} src={state.preview} alt="足す写真" />
          <label className={s.field}>
            ファイル名(英小文字・数字・ハイフン)
            <input
              className={s.input}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
              }}
            />
            {id !== "" && idProblem !== null && (
              <span className={s.fieldError} role="alert">
                {idProblem}
              </span>
            )}
          </label>
          <label className={s.field}>
            説明(写真に写っているもの)
            <input
              className={s.input}
              value={alt}
              onChange={(e) => {
                setAlt(e.target.value);
              }}
            />
          </label>
          <fieldset className={s.coats}>
            <legend>猫の毛色</legend>
            {COATS.map((c) => (
              <label key={c.value} className={s.remember}>
                <input
                  type="checkbox"
                  checked={coats.includes(c.value)}
                  onChange={(e) => {
                    setCoats((now) =>
                      e.target.checked
                        ? [...now, c.value]
                        : now.filter((x) => x !== c.value),
                    );
                  }}
                />
                {c.label}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className={s.save}
            disabled={!valid || state.kind === "saving"}
            onClick={save}
          >
            下書きに保存
          </button>
          {!valid && (
            <p className={s.note}>
              {[idProblem, altProblem, coatsProblem]
                .filter((p) => p !== null)
                .join(" ")}
            </p>
          )}
        </div>
      )}

      {state.kind === "saved" && (
        <p className={s.note} role="status">
          写真「{state.id}」を下書きに保存しました。まだ公開していません。
        </p>
      )}
    </details>
  );
}
