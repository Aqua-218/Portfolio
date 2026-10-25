import type { FileProblem } from "@portfolio/content-wasm";

/** イベントのフォームの欄。間違いの文の先頭の項目名から、どの欄の間違いか決める */
export type Field = "title" | "date" | "end" | "venue" | "tags" | "body";

const FIELDS = ["title", "date", "end", "venue", "tags"] as const;

/** 間違いを欄ごとに分ける。どの欄でもないものは本文(body)に */
export function byField(
  problems: readonly FileProblem[],
): Map<Field, string[]> {
  const out = new Map<Field, string[]>();
  for (const p of problems) {
    const field =
      FIELDS.find((f) => p.message === f || p.message.startsWith(`${f} `)) ??
      "body";
    out.set(field, [...(out.get(field) ?? []), p.message]);
  }
  return out;
}
