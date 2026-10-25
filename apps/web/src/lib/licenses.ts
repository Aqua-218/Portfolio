import { readFileSync } from "node:fs";
import path from "node:path";
import { site } from "./content";

/** 原文1つ。同じ原文を使うものはまとめる */
export interface LicenseText {
  /** content/licenses/<id>.txt。URL(/license/<id>/)にも使う */
  id: string;
  /** ライセンスの名前(licenses.toml の license) */
  name: string;
  /** この原文で使っているもの */
  users: string[];
}

/** 原文のある、ライセンスの一覧。idの順 */
export function licenseTexts(): LicenseText[] {
  const byId = new Map<string, LicenseText>();
  for (const l of site().licenses) {
    if (!l.text) continue;
    const t = byId.get(l.text) ?? {
      id: l.text,
      name: l.license ?? l.text,
      users: [],
    };
    t.users.push(l.name);
    byId.set(l.text, t);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** 原文。content-check が、licenses.toml から指すファイルがあることを確かめている */
export function licenseBody(id: string): string {
  return readFileSync(
    path.join(process.cwd(), "../../content/licenses", `${id}.txt`),
    "utf8",
  );
}
