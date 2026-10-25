import type { Site } from "@portfolio/content-types";
import init, { check as checkWasm, initSync } from "../dist/content_wasm.js";

/** 検証の結果。間違いがなければsiteに中身が入る */
export interface Checked {
  /** `content/events/x.md:3: date がありません`の形の間違い。ビルドのcontent-checkと同じ文 */
  problems: string[];
  site: Site | null;
}

let ready: Promise<unknown> | undefined;

/** Wasmを読む。何度呼んでも1回しか読まない。Nodeではバイト列を渡す */
export function load(module?: BufferSource): Promise<unknown> {
  if (module) {
    ready ??= Promise.resolve(initSync({ module }));
  }
  ready ??= init();
  return ready;
}

/**
 * `content/`のファイルの中身から、ビルドと同じ検証をする。
 * キーは`content/`からの相対パス(`events/2026-08-10-seccamp.md`など)。
 */
export async function check(
  files: ReadonlyMap<string, Uint8Array>,
): Promise<Checked> {
  await load();
  const paths = [...files.keys()];
  const chunks = paths.map((p) => files.get(p) ?? new Uint8Array());
  const data = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    data.set(c, at);
    at += c.length;
  }
  return JSON.parse(
    checkWasm(paths, new Uint32Array(chunks.map((c) => c.length)), data),
  ) as Checked;
}
