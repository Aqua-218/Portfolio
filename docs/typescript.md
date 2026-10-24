# TypeScriptの規約

## 型

- `tsconfig.base.json`の設定を外さない。`strict`・`noUncheckedIndexedAccess`・`exactOptionalPropertyTypes`は全パッケージで有効にする
- `any`は使わない(ESLintで禁止している)。型がわからない値は`unknown`で受けて、絞り込んでから使う
- `as`での型の書き換えと、`!`による非nullの断定はなるべく使わない。使うときは、なぜ安全かをコメントに書く
- 配列やオブジェクトの添字で取った値は`undefined`かもしれないので、確かめてから使う
- 省略できるプロパティに`undefined`を入れたいときは、型に`| undefined`と書く

## 書き方

- 整形はPrettierに任せる。手で揃えない
- ESLintはtypescript-eslintのstrictTypeCheckedを使う。警告を消すための`eslint-disable`は、理由をコメントに書いたうえで、その行だけにかける
- `export default`はNext.jsが求めるところ(`page.tsx`・`layout.tsx`・設定ファイル)だけで使い、ほかは名前付きのexportにする
- `apps/web`の中では`@/`から始まるパスで`src/`の中を指す

## 確かめ方

`pnpm check`が通ってからPRを出す。
