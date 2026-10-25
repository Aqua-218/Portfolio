import { jpegMetadata } from "@portfolio/content-wasm";

/** コミットする写真の長い辺。サイトには最大960pxで出す(imgpipe)ので、余裕をもってこれまで */
export const MAX_SIDE = 2000;

/** 写真のid。ファイル名(content/cats/<id>.jpg)とURLに使う */
export const PHOTO_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * 写真を、位置情報などのメタデータのないJPEGにする。
 * Canvasに描き直すので、EXIF(位置情報)・XMP・IPTCはすべて落ちる。向きはEXIFのとおりに直してから描く。
 * 書き出したものに残っていないかを、ビルドの検証と同じ関数でもう一度確かめる。
 */
export async function cleanPhoto(file: Blob): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.9,
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const left = await jpegMetadata(bytes);
  if (left !== null) throw new Error(`metadata:${left}`);
  return bytes;
}

/** TOMLの文字列(基本の文字列)にする。改行などの制御文字は入れない */
function tomlString(text: string): string {
  const escaped = text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"');
  return `"${escaped}"`;
}

/** cats.tomlの最後に、写真を1枚足す */
export function addPhoto(
  toml: string,
  photo: { id: string; alt: string; coats: readonly string[] },
): string {
  const entry = [
    "[[photo]]",
    `id = ${tomlString(photo.id)}`,
    `alt = ${tomlString(photo.alt)}`,
    `coats = [${photo.coats.map(tomlString).join(", ")}]`,
  ].join("\n");
  return `${toml.replace(/\n*$/, "")}\n\n${entry}\n`;
}
