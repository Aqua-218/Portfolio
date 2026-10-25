import { light, toHex } from "@portfolio/design";
import { renderSync } from "@portfolio/pxcat/node";
import { ImageResponse } from "next/og";

/** 地の大きさ(ドット)。のぞく黒猫(9×8)を、下の辺にのせて真ん中に置く */
const GRID = 11;

/**
 * サイトのアイコン。ヘッダーのロゴと同じ、のぞく黒猫。
 * タブが暗くても見えるよう、畳色の角丸の地に置く
 */
export function iconSvg(): string {
  const cat = renderSync(["peek"], "kuro", 1).replace(
    /^<svg [^>]*>/,
    '<svg x="1" y="3" width="9" height="8" viewBox="0 0 9 8">',
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(GRID)} ${String(GRID)}" shape-rendering="crispEdges"><rect width="${String(GRID)}" height="${String(GRID)}" rx="2" fill="${toHex(light.paper)}"/><g color="${toHex(light.ink)}">${cat}</g></svg>`;
}

/** アイコンのPNG。ドットがぼけないよう、GRIDの整数倍の大きさで描く */
export async function iconPng(size: number): Promise<Buffer> {
  const res = new ImageResponse(
    <img
      src={`data:image/svg+xml;base64,${Buffer.from(iconSvg()).toString("base64")}`}
      width={size}
      height={size}
      alt=""
    />,
    { width: size, height: size },
  );
  return Buffer.from(await res.arrayBuffer());
}

/** PNGを1枚入れたICO。いまのブラウザはICOの中のPNGを読める */
export function ico(png: Buffer, size: number): Buffer {
  const head = Buffer.alloc(6 + 16);
  head.writeUInt16LE(0, 0); // 予約
  head.writeUInt16LE(1, 2); // アイコン
  head.writeUInt16LE(1, 4); // 1枚
  head.writeUInt8(size, 6); // 幅
  head.writeUInt8(size, 7); // 高さ
  head.writeUInt8(0, 8); // 色数(パレットなし)
  head.writeUInt8(0, 9); // 予約
  head.writeUInt16LE(1, 10); // プレーン
  head.writeUInt16LE(32, 12); // ビット数
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(head.length, 18); // PNGの位置
  return Buffer.concat([head, png]);
}
