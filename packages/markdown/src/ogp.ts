import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

/**
 * OGPのキャッシュ。JSONのファイルに保存して、次のビルドでは取りに行かない。
 * 取れなかったURLは保存せず、次のビルドでもう一度取りに行く。
 */
export class OgpCache implements OgpSource {
  private readonly entries: Record<string, Ogp>;

  constructor(
    private readonly file: string,
    private readonly fetcher: Fetcher = fetchOgp,
  ) {
    try {
      this.entries = JSON.parse(readFileSync(file, "utf8")) as Record<
        string,
        Ogp
      >;
    } catch {
      this.entries = {};
    }
  }

  async get(url: string): Promise<Ogp | undefined> {
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
    const sorted = Object.fromEntries(
      Object.entries(this.entries).sort(([a], [b]) => a.localeCompare(b)),
    );
    writeFileSync(this.file, `${JSON.stringify(sorted, null, 2)}\n`);
  }
}
