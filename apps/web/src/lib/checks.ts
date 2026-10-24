import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// リポジトリの直下。ビルドはapps/webで走る
const root = path.join(process.cwd(), "../..");

/** lakefile.tomlのLeanのライブラリの数。ライブラリ1つがドット猫のプログラム1つ */
export function countLeanLibs(lakefile: string): number {
  return lakefile.match(/^\[\[lean_lib\]\]$/gm)?.length ?? 0;
}

/** TLCで検査している仕様の数。壊した設定(*Broken.cfg)と実行例を出す設定(*Trace*.cfg)は数えない */
export function countSpecs(files: readonly string[]): number {
  return files.filter(
    (f) => f.endsWith(".cfg") && !f.includes("Broken") && !f.includes("Trace"),
  ).length;
}

/**
 * Stackの数字。leanとtlcはmainの必須チェックなので、mainにあるものはどれも検査を通っている。
 * 手で書かずに、ビルドのたびにリポジトリから数える。
 */
export function checks(): { cats: number; curtains: number } {
  return {
    cats: countLeanLibs(
      readFileSync(path.join(root, "proofs/lakefile.toml"), "utf8"),
    ),
    curtains: countSpecs(readdirSync(path.join(root, "specs"))),
  };
}
