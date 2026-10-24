# Portfolio

小峯圭也のポートフォリオサイト。Next.jsの静的エクスポートで作り、写真はぜんぶ猫。

## セットアップ

ツールのバージョンは`mise.toml`で決めている。[mise](https://mise.jdx.dev/)を入れてから、次を実行する。

```sh
mise install
pnpm install
```

`mise install`でNode・pnpm・Rust・elan・Javaがそろう。elanは`~/.elan/bin`に`lean`と`lake`のプロキシを作る。

## コマンド

| コマンド                                                | すること                                                |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm build`                                            | 全パッケージをビルドする。サイトは`apps/web/out/`に出る |
| `pnpm check`                                            | 型チェック・ESLint・Prettierの検査をまとめて走らせる    |
| `pnpm format --write`                                   | Prettierで整形する                                      |
| `pnpm test`                                             | TypeScriptのテストを走らせる                            |
| `cargo build`                                           | Rustのクレートをビルドする                              |
| `cargo test`                                            | Rustのテストを走らせる                                  |
| `cargo clippy --workspace --all-targets -- -D warnings` | clippyを警告ゼロで通す                                  |
| `cargo fmt --all`                                       | rustfmtで整形する                                       |

`cd apps/web && pnpm dev`で開発用のサーバーが立つ。

## ディレクトリ

| 場所        | 中身                   |
| ----------- | ---------------------- |
| `apps/web`  | サイト本体(Next.js)    |
| `packages/` | TypeScriptのパッケージ |
| `crates/`   | Rustのクレート         |
| `docs/`     | 規約などのドキュメント |

## 開発の流れ

1. Issueごとにブランチを切る(`chore/1-mise`のように、type・Issue番号・短い名前)
2. コミットは1ファイルずつ分ける
3. PRは`.github/pull_request_template.md`に沿って書き、`Closes #N`でIssueにつなぐ
4. PRのタイトルはConventional Commitsの形にする。typeはfeat・fix・content・docs・chore、scopeはラベルの`area:*`と同じ
5. build・lint・test・pr-titleのチェックが通ったら、Squashでマージする

mainへのマージでrelease-pleaseがRelease PRを作る。依存の更新はRenovateが週1回まとめてPRにする。

## 規約

- [TypeScript](docs/typescript.md)
- [Rust](docs/rust.md)
- [Lean](docs/lean.md)
- [TLA+](docs/tla.md)
