# 管理画面

`/admin/`から`content/`を編集して、GitHubにコミットする。

## 仕組み

- サイト(`/admin/`の画面を含む)はロリポップの静的なファイル。ロリポップではPHPなどを動かさない
- ログインと、GitHub APIの中継だけをCloudflare Workers(`apps/admin-worker`)でやる。ドメインをCloudflareのDNSに乗せ、`/admin/auth/*`と`/admin/api`だけをWorkerに回す
- GitHubのトークンはWorkerだけが持ち、ブラウザ(JavaScript)には渡さない。ブラウザには`HttpOnly`のCookieだけを渡す

PHPを使わない理由: 2026-10-21に、PHP本体に認証なしで遠隔からコードを実行される脆弱性(php2shell、CVE-2026-109618・CVE-2026-109619)が公開された。アプリのコードより前で刺さるので、こちらのコードでは備えられず、ホスティングの修正を待つしかない。

## 画面の作り

管理画面はページの横いっぱいを使う(`Shell.tsx`)。左にメニュー、上にファイルの検索とログインしている人、真ん中に選んだ画面。狭い画面では、メニューを上に横並びにする。

| メニュー | 出すもの                                                                                     |
| -------- | -------------------------------------------------------------------------------------------- |
| ホーム   | 数のカード、content/ の変更と公開の週ごとのグラフ、Qiitaへの出し具合、最近の動き(`Home.tsx`) |
| 下書き   | 公開待ちのPRとそのチェック、下書きのあるファイル                                             |
| ブログ   | 新しい記事・Qiitaから取り込む・記事の一覧(Qiitaへの出し具合つき)                             |
| 写真     | 写真を足す・足した写真の下書き・いまある写真                                                 |
| ファイル | content/ のすべてのファイル。種類ごとに分け、名前で絞り込める                                |
| 設定     | Workerの設定(Qiitaのトークン)と、Actionsのsecretsの案内                                      |

ホームのグラフは自前のSVGで描く(`Charts.tsx`。外のスクリプトは読まず、CSPを広げない)。

- content/ の変更: content/ を変えたコミットの数を、月曜はじまりの週ごとに12週ぶん、折れ線にする
- 公開: mainで走ったActionsを週ごとに、成功と失敗を積んだ棒にする。色はテーマの`sora`(成功)と`kaki`(失敗)。色の見分けにくい人でも分かれる組で、明るい・暗いの両方で検査を通した。凡例と、ホバーの数、「表で見る」もつけ、色だけに頼らない
- 数のカードを押すと、その画面へ行く

## 下書きと公開

1. ファイルを開いて書き換え、「下書きに保存」を押す。`draft/`に`content/`の中のパスを続けたブランチ(例: `draft/events/2026-08-10-seccamp.md`)にコミットする。ブランチがなければmainの先頭から作る
2. 下書きのあるファイルは、一覧と編集の画面に「下書き」と出る。開くと下書きのほうを読む
3. 「この下書きを公開する」を押すと、mainとの違いと、PRのタイトル(`content: …`)を確かめる画面になる。「PRを作る」で下書きのブランチからmainへのPRを作る
4. PRのチェックの進み具合が出る。すべて通ったら「マージして公開する」でsquashマージする。保存したあとにブランチが変わっていたら、マージしない
5. マージのあとは、mainで走るもの(CIなど)の進み具合が出る。下書きのブランチは、マージのあとGitHubが消す

### ブログを書く

1. 一覧の「新しい記事のファイル名」(ダッシュボードの「新しい記事を書く」でここへ飛ぶ)に、URLになる名前(英数字・`-`・`_`)を入れて「書き始める」。書きかけのものは「書きかけの新しい記事」に出る
2. タイトル・タグ(1〜5個)・限定公開・スライド・「Qiitaには出さない」をフォームで、本文をMarkdown(Qiitaの記法、[blog.md](blog.md))で書く。ファイルの形はQiita CLIと同じ
3. プレビューは、サイトの記事のページと同じもの(`PostView`)を、Qiitaの記法の処理で描く
4. 公開はほかの下書きと同じ。Qiitaへは、公開したときにActionsが出すほか、「Qiitaに出す」でいつでも出せる([blog.md](blog.md))

### 写真を足す

1. 一覧の「写真を足す」に写真をドロップするか、選ぶ
2. 写真はブラウザでCanvasに描き直してJPEGにする。EXIF(位置情報)・XMP・IPTCはこれで全部落ちる。向きはEXIFのとおりに直してから描き、長い辺は2000pxまでにする。書き出したものに残っていないかを、ビルドの検証と同じ関数(`content::cats::metadata_in_jpeg`、Wasm)でもう一度確かめ、残っていれば保存しない
3. ファイル名(英小文字・数字・ハイフン)・説明・毛色を入れて「下書きに保存」。`content/cats/<id>.jpg`と、写真を足した`content/cats.toml`を1つのコミットにして、`draft/cats/<id>.jpg`のブランチに入れる
4. 一覧の「足した写真の下書き」から開くと、写真と`cats.toml`の違いを見て、ほかの下書きと同じように公開できる。WebP・AVIFへの変換は、ビルドでimgpipeがやる

## 開発モード

`pnpm dev`(`apps/web`)のときだけ使える。本番のビルドには入らない(`e2e/dev.spec.ts`で、書き出したファイルに開発モードのものが1つもないことを確かめる)。

- 画面の左下の「開発」から、記法の見本・エラーの画面・管理画面へすぐ行ける
- 管理画面はログインなしで入れる(いつも「dev」でログインしている)。WorkerとGitHubの代わりに、手元の`scripts/dev-admin.mjs`(127.0.0.1でしか待たない)が同じ形で答える
  - mainはディスクの`content/`。下書きは`apps/web/.dev/admin.json`に置く(コミットしない)
  - 「マージして公開する」と、下書きをディスクの`content/`に書く。チェックはすぐ通る
  - 「Qiitaに出す」は本物のQiitaには送らない。出した記事は`apps/web/.dev/admin.json`に置く
  - 「設定」は入れたふりだけをする(値は残さず、最後の4字だけ覚える)
- `pnpm dev`が、Next.jsの開発サーバーとこの相手をいっしょに立てる(`scripts/dev.mjs`)。管理画面のログインと中継(`/admin/auth/*`・`/admin/api`・`/admin/qiita`・`/admin/settings`)だけを、開発サーバーの設定(`next.config.ts`)でこの相手に回す

Workerには手を入れていない。ログインを飛ばす道は、手元の開発サーバーにしかない。

## セキュリティ

| 何から守るか                 | どう守るか                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| トークンを盗まれる           | トークンはWorkerのセッション(KV)だけに置き、暗号化する(AES-GCM)。ブラウザには返さない                                                                                                                                                      |
| 持ち主でない人が入る         | ログインのあと、GitHubのユーザーのidが`OWNER_ID`か確かめる。違えばトークンを取り消す                                                                                                                                                       |
| ログインの横取り             | PKCE(S256)と`state`。ログインの手続きは10分で切れ、1回しか使えない                                                                                                                                                                         |
| CSRF                         | 書き換える操作はPOSTなどで、独自ヘッダー`X-Admin: 1`と`Origin`(GETは`Sec-Fetch-Site`)を確かめる                                                                                                                                            |
| 何でもできる中継になる       | 通すのはこのリポジトリのcontents・git・pulls・commits・branchesと、actions(見るだけ)。パスをずらす書き方(`..`・`%`・`\`)は通さない。書き込みは中身まで見て、`content/`の中を`draft/`のブランチへ書くことと、`draft/`からmainへのPRだけ通す |
| セッションの乗っ取り         | Cookieは`__Host-`・`Secure`・`HttpOnly`。ログインのたびにidを作り直す。1時間さわらなければ切れ、長くても8時間で切れる                                                                                                                      |
| 総当たり                     | ログインを始めるのは、1つのIPで10分に10回まで                                                                                                                                                                                              |
| 覚えた端末のCookieを盗まれる | 中身はランダムな値で、トークンではない。使うたびに値を変え、古い値がもう一度来たら盗まれたとみなして取り消す。30日で切れる                                                                                                                 |
| ログアウトしたのに使える     | ログアウトでGitHubのトークン・セッション・端末の記憶を取り消す                                                                                                                                                                             |
| 公開を壊される               | mainには直接コミットしない。PRを作り、必須チェック(証明・検査・VRTを含む)が通ってからマージする。mainはルールセットで守り(PR必須・例外なし)、Workerも`draft/`にしか書かせない                                                              |

Qiitaへの中継(`/admin/qiita`)も、GitHubへの中継と同じく、このサイトの画面からの呼び出しで、持ち主がログインしているときだけ通す。通すのは自分の記事を読む・投稿する・更新することだけ(消す・ほかの人の記事・設定は通さない)で、送る項目も記事のもの(タイトル・本文・タグ・限定公開・スライド・organization)だけ。Qiitaのトークンは Worker の秘密(または下の「設定」で入れたもの)にだけ置く。

設定(`/admin/settings`)も、同じく持ち主がこのサイトの画面から呼んだときだけ通す。

- 入れられるのは、Workerが使うもの(いまはQiitaのトークン)だけ。知らない名前は断る
- 値は鍵(`KEY`)でAES-GCMにしてKVに置く。中に設定の名前も入れ、別の場所の暗号文(セッションなど)を持ってきても設定としては使わない
- 入れた値は、どの返事にも入れない。返すのは「どこから来たか(管理画面・wrangler secret)」「最後の4字」「入れた日時と人」だけ
- 入れる前に形(16進の40字)を見て、Qiitaに自分を問い合わせ、受けつけられなければ入れない
- 入れ替え・消去は、値を入れずに記録する(新しい20件)
- Actionsのsecretsは管理画面からは変えない。GitHub Appにsecretsの権限を足すと、管理画面を乗っ取られたときにCIの秘密まで書き換えられるため。設定の画面からGitHubの画面へ案内するだけ

前提: GitHubのアカウントで2段階認証を有効にしておく。管理画面の安全はここに乗っている。

## 用意すること

### GitHub App

1. GitHubの Settings → Developer settings → GitHub Apps → New GitHub App
2. 次のとおりにする
   - Homepage URL: サイトのURL
   - Callback URL: `https://komineko.jp/admin/auth/callback`
   - 「Expire user authorization tokens」: オン(トークンは8時間で切れ、リフレッシュトークンで取り直す)
   - 「Request user authorization (OAuth) during installation」: オフ
   - Webhook: オフ
   - Repository permissions: Contents は Read and write、Actions は Read-only、Checks は Read-only(公開の前にPRのチェックを見る)、Pull requests は Read and write、Metadata は Read-only。ほかはNo access
   - Where can this GitHub App be installed?: Only on this account
3. 作ったら、Client IDを控え、Client secretを作る(Generate a new client secret)
4. Install App から、`Aqua-218/Portfolio`だけに入れる(Only select repositories)

### Cloudflare

1. ドメインをCloudflareのDNSに乗せ、ロリポップをオリジンにする(プロキシをオン)
2. `apps/admin-worker/wrangler.toml`の`routes`・`ORIGIN`は`komineko.jp`にしてある
3. KVを作り、idを`wrangler.toml`に書く: `pnpm dlx wrangler kv namespace create ADMIN_KV`
4. `GITHUB_CLIENT_ID`と`OWNER_ID`(`https://api.github.com/users/Aqua-218`のid)を`wrangler.toml`に書く
5. 秘密の値を入れる。リポジトリには書かない
   - `pnpm dlx wrangler secret put GITHUB_CLIENT_SECRET`
   - `openssl rand -base64 32 | pnpm dlx wrangler secret put KEY`
   - `pnpm dlx wrangler secret put QIITA_TOKEN`(管理画面からQiitaに出す・取り込むとき。Qiitaの個人用アクセストークン、`read_qiita`・`write_qiita`。なくてもよい。あとから管理画面の「設定」でも入れ替えられ、そちらが先に使われる)
6. デプロイ: `pnpm dlx wrangler deploy`(`apps/admin-worker`で)

鍵(`KEY`)を変えると、いまのセッションと覚えた端末、管理画面で入れた設定はすべて使えなくなる(設定は入れ直す)。漏れた疑いがあるときは、鍵とClient secretの両方を作り直す。

### 図とリンクカードを作るトークン

管理画面からMermaidの図やリンクカードを足すと、下書きのPRでActions(`.github/workflows/content-cache.yml`)が図を描き、OGPを取って、`content/.cache/`をそのPRにコミットする。使わなくなった図とOGPは消す。

GitHub Actionsの`GITHUB_TOKEN`で押したコミットでは、ほかのワークフロー(必須のチェック)が走らない。そのため、押すのにだけ使うトークンを用意する。

1. GitHubの Settings → Developer settings → Fine-grained personal access tokens → Generate new token
   - Repository access: Only select repositories → `Aqua-218/Portfolio`
   - Repository permissions: Contents は Read and write、Pull requests は Read and write(Qiitaのidの書き戻しのPRに使う、[blog.md](blog.md))。ほかはNo access
   - 期限: 1年まで。切れる前に作り直す
2. リポジトリの Settings → Secrets and variables → Actions に、`CONTENT_CACHE_TOKEN`として入れる

このトークンを渡すのは、下書き(`draft/`)のブランチのPRで、コミットするステップだけ。ビルドのステップやフォークのPRには渡さない。
