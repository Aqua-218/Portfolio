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

### いちばん上の.htaccessだけに書くもの

- エラーのページ: 404は`/404.html`、400・401・403・405・408・410・429・500・502・503・504は`/errors/<番号>/`
- GETとHEADのほかのメソッド(POST・DELETEなど)は405にし、`Allow: GET, HEAD`をつける
- HTTPSへ移す(301)。Cloudflareを前に置くので、`X-Forwarded-Proto: https`のときは移さない(Cloudflareとの間がHTTPでもループしない)
- ディレクトリの最後の`/`もHTTPSのまま足す。Apacheに任せると`http://`で返す
- ファイルの一覧は出さない(`Options -Indexes`)
- 古いApacheが知らない種類(wasm・woff2・avif・webp)と、拡張子のないOGPの画像(`image/png`)
- 文字のファイルは縮めて送る(gzip)

本物のApache(Docker、`.htaccess`を読む設定)で`out/`を出して確かめる: `pnpm --filter @portfolio/web apache`(`apps/web/apache/`)。CIの`apache`のジョブでも走る。

### Cloudflareとロリポップの証明書

訪問者に見える証明書はCloudflareのもの。Cloudflareからロリポップへの間は、ロリポップの独自SSL(無料、Let's Encrypt)で暗号化し、CloudflareのSSL/TLSは**Full (strict)**にする(ロリポップには外の証明書を入れられない)。

- 発行するとき: Cloudflareで`komineko.jp`と`www`をいったんDNS only(グレーの雲)にし、ロリポップで独自SSL(無料)を発行してから、プロキシをオンに戻す
- 更新: ロリポップが自動でする。確認のパス(`/.well-known/acme-challenge/`)は、`.htaccess`でHTTPSや`komineko.jp`への転送をしない
- 見張り: 毎日、Actions(`.github/workflows/origin-cert.yml`)がロリポップ側の証明書の期限を見て、残りが14日を切ったらIssueを立てる。つなぎ先は、Actionsの変数`ORIGIN_HOST`(ロリポップの初期ドメイン)に入れる
- 更新がうまくいかないことが続くなら、SSL/TLSをFullにする(切れてもサイトは止まらないが、相手の確かめはしない)

### Cloudflareの設定

ダッシュボード(またはAPI)で変えたもの。リポジトリには入っていないので、ここに控える。

| どこ                 | 中身                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| SSL/TLS              | Full (strict)。TLSは1.2から(1.0・1.1は断る)。HTTPはHTTPSへ移す(Always Use HTTPS)                                           |
| HTMLを書き換えるもの | メールアドレスの難読化・Server Side Excludes・Rocket Loaderは使わない(スクリプトを足してCSPに止められる・中身が変わる)     |
| ブラウザのキャッシュ | ロリポップのヘッダーのまま(Respect Existing Headers)                                                                       |
| Cache Rules          | `komineko.jp`の`/admin/`のほかは、ページもCloudflareに30日置く。300〜599は置かない。ブラウザにはロリポップのヘッダーのまま |
| キャッシュを消す     | デプロイのたびに全部消す(`deploy.yml`、トークンはCache Purgeだけ)                                                          |
| Tiered Cache         | オン。Cloudflareのデータセンターどうしで分け合い、ロリポップへ行く回数を減らす                                             |
| Redirect Rules       | `www.komineko.jp`は`https://komineko.jp`へ301(パスとクエリはそのまま)                                                      |
| CAA                  | `letsencrypt.org`(ロリポップの独自SSL)。Cloudflareが使う認証局は、Cloudflareが自動で足す                                   |
| DNSSEC               | Cloudflareでオン。レジストラにDSレコードを登録して効く                                                                     |
| 0-RTT                | オフ(送り直されても困らないGETだけだが、使わない)                                                                          |

ページをCloudflareに置くので、管理画面の公開やcontent/だけのマージも、デプロイのジョブを通る(キャッシュを消す)ようにしてある。手でロリポップに置いたときは、Cloudflareのキャッシュを消す。

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
- 枠: ブログの記事の埋め込み(YouTube・Xなど)で使う出どころだけ。使っていなければ何も読まない。埋め込みは、どれも各サービスのiframeで、外のスクリプトはページで動かさない([blog.md](blog.md))
- `<base>`・`<object>`: 使わない

ページの中で移ると(幕のあと)、ドキュメントは最初のページのままで、CSPも最初のページのものが効く。移った先の図や画像・埋め込みが止められないよう、図の`<style>`のハッシュと、画像と埋め込みの出どころは、サイト全体の分を全ページに入れる。インラインのスクリプトはページの中で移っても動かさないので、ページごと。

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

## ロリポップへの公開

`.github/workflows/deploy.yml`が、書き出したサイトをロリポップの`~/web/komineko/`へrsyncで送る。

| いつ                           | 何を出すか                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| リリース                       | そのタグでビルドしたもの。ReleaseにZip(`komineko-<タグ>.zip`)もつける                                      |
| `content/`だけが変わったマージ | コードは最新のリリースのまま、`content/`だけmainのものでビルドしたもの(リリースしていないコードは出さない) |
| 手で動かす                     | 最新のリリースを送り直す                                                                                   |

- 入り方: デプロイ専用のed25519の鍵。サーバーの`~/.ssh/authorized_keys`に`restrict`(転送や端末を使わせない)をつけて登録した。パスワードはActionsに置かない
- サーバーの鍵は`known_hosts`として控え、鍵が違うサーバーにはつながない(`StrictHostKeyChecking=yes`)。ロリポップの鍵はRSA `SHA256:1Rt0rvYV+xZGCMAzm6BKjqAIPWXYYDX0bYK5CikAvCE`
- 接続情報はEnvironment `production`のシークレットにだけ置く。`production`は`main`ブランチと`v*`のタグからしか使えない

  | シークレット             | 中身                                                               |
  | ------------------------ | ------------------------------------------------------------------ |
  | `LOLIPOP_SSH_KEY`        | 秘密鍵                                                             |
  | `LOLIPOP_KNOWN_HOSTS`    | サーバーの鍵(`ssh-keyscan -p 2222 -t rsa`)                         |
  | `LOLIPOP_HOST`           | `ssh.lolipop.jp`                                                   |
  | `LOLIPOP_USER`           | アカウント                                                         |
  | `LOLIPOP_PORT`           | `2222`                                                             |
  | `LOLIPOP_PATH`           | `/home/users/…/web/komineko/`                                      |
  | `CLOUDFLARE_PURGE_TOKEN` | Cloudflareのキャッシュを消すトークン(komineko.jpのCache Purgeだけ) |

- ビルドするジョブには秘密を渡さず、キャッシュも使わない。送るジョブはコードを動かさず、rsyncとCloudflareのキャッシュを消すことだけ
- 中身の変わったファイルだけ送り(`--checksum`)、なくなったファイルは消す。`.well-known/`(無料SSLの更新に使う)は消さない。送り先が`~/web/`の下のフォルダでなければ止まる
- 権限はディレクトリ705・ファイル604(ロリポップのおすすめ)
- 送ったあと、Cloudflareのキャッシュを全部消す。ページもCloudflareに置くので、消さないと古いページが残る
- 鍵を替えるときは、新しい鍵を`authorized_keys`に足して`LOLIPOP_SSH_KEY`を差し替え、古い行を消す
