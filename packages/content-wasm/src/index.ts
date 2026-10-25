import type { Site } from "@portfolio/content-types";
import init, {
  check as checkWasm,
  check_file as checkFileWasm,
  initSync,
  jpeg_metadata as jpegMetadataWasm,
} from "../dist/content_wasm.js";

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

/** 1つのファイルの間違い */
export interface FileProblem {
  line: number | null;
  message: string;
  /** `content/events/x.md:3: date がありません`の形。ビルドと同じ文 */
  text: string;
}

export interface FileChecked {
  /** このファイルを1つだけで検証できたか。できないもの(猫の写真の説明など)は、PRのCIで確かめる */
  supported: boolean;
  problems: FileProblem[];
}

/**
 * ファイル1つを、ビルドと同じ関数で検証する。`path`は`content/`からの相対パス。
 * ファイルをまたいだ確かめはしない
 */
export async function checkFile(
  path: string,
  text: string,
): Promise<FileChecked> {
  await load();
  return JSON.parse(checkFileWasm(path, text)) as FileChecked;
}

/**
 * JPEGに残っているメタデータ(EXIF・XMP・IPTC)の種類。なければnull。
 * ビルドの検証と同じ関数。写真をコミットする前に、位置情報などが残っていないか確かめる
 */
export async function jpegMetadata(bytes: Uint8Array): Promise<string | null> {
  await load();
  return jpegMetadataWasm(bytes) || null;
}
