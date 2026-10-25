import { readFileSync } from "node:fs";
import path from "node:path";
import { site } from "./content";

/** コードが使っているライブラリ1つ(scripts/oss.mjs が集めたもの) */
export interface Library {
  name: string;
  version: string;
  /** SPDXの式(MIT OR Apache-2.0 など)。わからなければ Unknown */
  license: string;
  url: string;
  /** 原文のid。見つからなければnull */
  text: string | null;
}

interface Oss {
  npm: Library[];
  cargo: Library[];
  /** パッケージに入っていた原文。キーは oss-<ハッシュ> */
  texts: Record<string, string>;
}

let ossCache: Oss | undefined;

/** ビルドの前に scripts/oss.mjs が .content/oss.json に書き出したもの */
export function oss(): Oss {
  ossCache ??= JSON.parse(
    readFileSync(path.join(process.cwd(), ".content/oss.json"), "utf8"),
  ) as Oss;
  return ossCache;
}

/** 原文1つ。同じ原文を使うものはまとめる */
export interface LicenseText {
  /** content/licenses/<id>.txt か、oss-<ハッシュ>。URL(/license/<id>/)にも使う */
  id: string;
  /** ライセンスの名前 */
  name: string;
  /** この原文で使っているもの */
  users: string[];
}

/** 原文のある、ライセンスの一覧。idの順 */
export function licenseTexts(): LicenseText[] {
  const byId = new Map<string, LicenseText>();
  const add = (id: string, name: string, user: string) => {
    const t = byId.get(id) ?? { id, name, users: [] };
    t.users.push(user);
    byId.set(id, t);
  };
  for (const l of site().licenses)
    if (l.text) add(l.text, l.license ?? l.text, l.name);
  const { npm, cargo } = oss();
  for (const p of [...npm, ...cargo])
    if (p.text) add(p.text, p.license, `${p.name} ${p.version}`);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** 原文。content-check と scripts/oss.mjs が、指すものがあることを確かめている */
export function licenseBody(id: string): string {
  const own = oss().texts[id];
  if (own !== undefined) return own;
  return readFileSync(
    path.join(process.cwd(), "../../content/licenses", `${id}.txt`),
    "utf8",
  );
}
