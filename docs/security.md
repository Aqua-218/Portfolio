# セキュリティ

サイトの守りのまとめ。管理画面のログインは[admin.md](admin.md)。

## 守りのヘッダー

ビルドのあとに`apps/web/scripts/headers.mjs`が、ページのディレクトリごとに`.htaccess`を書き出す。ロリポップ(Apache)はこれでヘッダーをつける。e2eのサーバー(`apps/web/e2e/serve.mjs`)も同じ`.htaccess`を読むので、e2eはいつも本番と同じヘッダーの下で走る。

| ヘッダー                     | 中身                                               |
| ---------------------------- | -------------------------------------------------- |
| Content-Security-Policy      | `default-src 'none'`から始め、要るものだけ許す(下) |
| X-Frame-Options              | `DENY`(ほかのサイトの枠に入れさせない)             |
| X-Content-Type-Options       | `nosniff`                                          |
| Referrer-Policy              | `no-referrer`                                      |
| Strict-Transport-Security    | 2年、サブドメインも                                |
| Cross-Origin-Opener-Policy   | `same-origin`                                      |
| Cross-Origin-Resource-Policy | `same-origin`                                      |
| Permissions-Policy           | カメラ・マイク・位置情報・支払い・USBを使わない    |

### キャッシュ

同じ`.htaccess`で`Cache-Control`もつける。

| どこ                                       | 中身                                       |
| ------------------------------------------ | ------------------------------------------ |
| ページ(HTML・ページの中で移るときのデータ) | `no-cache`(毎回、変わっていないか確かめる) |
| `/_next/static/`・`/img/cats/`・`/fonts/`  | 1年、`immutable`                           |
| 管理画面                                   | `no-store`(残さない)                       |
| そのほか(`robots.txt`・アイコンなど)       | `no-cache`                                 |

1年持たせるのは、名前に中身のハッシュが入るファイルだけ。中身が変われば名前も変わるので、古いものが残っても困らない。e2e(`e2e/cache.spec.ts`)で確かめる。

### CSP

- スクリプト: 自分のサイトのファイルと、そのページのインラインのスクリプト(Next.jsが書き出すもの)のハッシュだけ。WebAssembly(ドット猫・検証)の読み込みは許し、`eval`は許さない
- スタイル: 自分のサイトのファイルと、Mermaidの図の`<style>`のハッシュ。要素の`style`属性(ドット猫の大きさなど)だけインラインを許す
- 画像: 自分のサイトと、リンクカードのOGPの画像の出どころ
- 通信: 自分のサイトだけ
- フォームの送り先: 自分のサイトだけ。管理画面だけGitHub(ログイン)も
- 枠・`<base>`・`<object>`: 使わない

ページの中で移ると(幕のあと)、ドキュメントは最初のページのままで、CSPも最初のページのものが効く。移った先の図や画像が止められないよう、図の`<style>`のハッシュと画像の出どころは、サイト全体の分を全ページに入れる。インラインのスクリプトはページの中で移っても動かさないので、ページごと。

e2e(`e2e/csp.spec.ts`)で、全部のページをCSPの下で開き、違反やエラーがないこと、ページの中で移ったあとも違反がないこと、ページにないインラインのスクリプトは動かないことを確かめる。

## 依存とCIの検査

| 何を                   | どうやって                                                                                 | いつ               |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------ |
| npmの依存の脆弱性      | `pnpm audit --audit-level high`(`.github/workflows/audit.yml`)                             | PR・main・毎週月曜 |
| Cargoの依存            | `cargo deny check`。脆弱性・ライセンス(許すものだけ)・出どころ(crates.ioだけ)(`deny.toml`) | PR・main・毎週月曜 |
| GitHub Actionsの書き方 | zizmor(`--persona=pedantic`)。権限・認証情報の残し方・固定していないアクションなど         | PR・main           |
| コード                 | CodeQL(`security-extended`)。JavaScript・TypeScriptと、Actions                             | PR・main・毎週月曜 |
| 依存の更新             | Renovate。出て3日たった版だけ、毎週月曜にまとめてPRにする                                  | 毎週月曜           |

コードが変わらなくても新しい脆弱性は見つかるので、依存の検査とCodeQLは毎週も回す。

- アクションはコミットのハッシュで固定し、`persist-credentials: false`で認証情報を残さない。ワークフローの権限は既定で読むだけ
- 直った版のない脆弱性を連れてくる道具は入れない。たとえばLighthouse CI(`@lhci/cli`)は、古いLighthouseに固定されていて`extract-zip`などを連れてくるので、Lighthouseを直接呼ぶ形にした(#224)
- 出て間もない版は避ける。Renovateは3日待つ。手で入れるときも、しばらく使われた版にする
