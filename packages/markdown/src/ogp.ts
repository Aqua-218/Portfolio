import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { type Fetcher, type Ogp, type OgpSource, parseOgp } from "./cards";

/** 本物のfetchでOGPを取る。10秒で諦める */
export const fetchOgp: Fetcher = async (url) => {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; portfolio-linkcard)" },
    });
    if (!res.ok) return undefined;
    return parseOgp(await res.text(), res.url);
  } catch {
    return undefined;
  }
};

function readEntries(file: string): Record<string, Ogp> {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Record<string, Ogp>;
  } catch {
    return {};
  }
}

/**
 * OGPのキャッシュ。JSONのファイルに保存して、次のビルドでは取りに行かない。
 * 取れなかったURLは保存せず、次のビルドでもう一度取りに行く。
 * usedを渡すと、使ったURLをそのファイルに書き足していく(使わなくなったものを消すのに使う。apps/web/scripts/cache.mjs)
 */
export class OgpCache implements OgpSource {
  private readonly entries: Record<string, Ogp>;

  constructor(
    private readonly file: string,
    private readonly fetcher: Fetcher = fetchOgp,
    private readonly used?: string,
  ) {
    this.entries = readEntries(file);
  }

  async get(url: string): Promise<Ogp | undefined> {
    if (this.used) appendFileSync(this.used, `ogp ${url}\n`);
    const hit = this.entries[url];
    if (hit) return hit;
    const ogp = await this.fetcher(url);
    if (!ogp) return undefined;
    this.entries[url] = ogp;
    this.save();
    return ogp;
  }

  private save(): void {
    mkdirSync(path.dirname(this.file), { recursive: true });
    // ビルドは何個かのプロセスで走るので、ほかのプロセスが書き足したものと合わせてから書く
    const merged = { ...readEntries(this.file), ...this.entries };
    const sorted = Object.fromEntries(
      Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)),
    );
    writeFileSync(this.file, `${JSON.stringify(sorted, null, 2)}\n`);
  }
}
