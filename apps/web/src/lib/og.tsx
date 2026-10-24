import { readFileSync } from "node:fs";
import path from "node:path";
import { light, toHex } from "@portfolio/design";
import { boxSize } from "@portfolio/pxcat";
import { renderSync } from "@portfolio/pxcat/node";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "./meta";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const color = {
  paper: toHex(light.paper),
  ink: toHex(light.ink),
  muted: toHex(light.muted),
  mike: toHex(light.mike),
};

type Weight = 700 | 800;

/** unicode-rangeの1つ分(U+30-39など)に、その文字が入っているか */
function inRange(range: string, cp: number): boolean {
  const [from = "", to = from] = range.trim().slice(2).split("-");
  return cp >= Number.parseInt(from, 16) && cp <= Number.parseInt(to, 16);
}

/**
 * Fontsourceのフォントのうち、文字に要るファイルだけを読む。
 * OGP画像を描くsatoriはwoff2を読めないので、woffを使う。
 * 同じ名前のフォントを何枚も渡すとsatoriが太さを取り違えるので、ファイルごとに名前を変える。
 */
function fonts(pkg: string, name: string, weight: Weight, text: string) {
  const dir = path.join(process.cwd(), "node_modules/@fontsource", pkg);
  const css = readFileSync(path.join(dir, `${String(weight)}.css`), "utf8");
  const cps = [...new Set(text)].map((ch) => ch.codePointAt(0) ?? 0);
  return [
    ...css.matchAll(
      /url\(\.\/(files\/[^)]+\.woff)\)[^;]*;\s*unicode-range: ([^;]+);/g,
    ),
  ]
    .filter(([, , ranges = ""]) =>
      cps.some((cp) => ranges.split(",").some((r) => inRange(r, cp))),
    )
    .map(([, file = ""]) => ({
      // 太さを除いたファイル名。太さが違っても同じ名前になる
      name: `${name} ${path.basename(file).replace(/-\d+-normal\.woff$/, "")}`,
      data: readFileSync(path.join(dir, file)),
      weight,
      style: "normal" as const,
    }));
}

/** 黒猫の画像。satoriは画像の大きさを読まないので、幅と高さも渡す */
function Cat({ frame, pixel }: { frame: "sitA" | "peek"; pixel: number }) {
  const svg = renderSync([frame], "kuro", pixel).replaceAll(
    "currentColor",
    color.ink,
  );
  const { width, height } = boxSize([frame], pixel);
  return (
    <img
      src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
      width={width}
      height={height}
      alt=""
    />
  );
}

/** OGP画像。畳色の地に、ページの名前と一言と、座る黒猫。 */
export function og(title: string, subtitle: string) {
  const text = `${title}${subtitle}${SITE_NAME}`;
  // 英数字はGeist、それ以外はLINE Seed JPで描く
  const loaded = [
    ...fonts("geist", "Geist", 700, text),
    ...fonts("geist", "Geist", 800, text),
    ...fonts("line-seed-jp", "LINE Seed JP", 700, text),
    ...fonts("line-seed-jp", "LINE Seed JP", 800, text),
  ];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 84px",
        background: color.paper,
        color: color.ink,
        fontFamily: [...new Set(loaded.map((f) => f.name))].join(", "),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        <Cat frame="peek" pixel={4} />
        {/* トップは名前が大きく出るので、ここには出さない */}
        {title === SITE_NAME ? null : SITE_NAME}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: 84,
              height: 10,
              marginTop: 30,
              background: color.mike,
              borderRadius: 4,
            }}
          />
          <div
            style={{
              marginTop: 30,
              fontSize: 42,
              fontWeight: 700,
              color: color.muted,
            }}
          >
            {subtitle}
          </div>
        </div>
        <Cat frame="sitA" pixel={16} />
      </div>
    </div>,
    {
      ...size,
      fonts: loaded,
    },
  );
}
