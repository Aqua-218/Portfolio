# 管理画面

`/admin/`から`content/`を編集して、GitHubにコミットする。

## 仕組み

- サイト(`/admin/`の画面を含む)はロリポップの静的なファイル。ロリポップではPHPなどを動かさない
- ログインと、GitHub APIの中継だけをCloudflare Workers(`apps/admin-worker`)でやる。ドメインをCloudflareのDNSに乗せ、`/admin/auth/*`と`/admin/api`だけをWorkerに回す
- GitHubのトークンはWorkerだけが持ち、ブラウザ(JavaScript)には渡さない。ブラウザには`HttpOnly`のCookieだけを渡す

PHPを使わない理由: 2026-10-21に、PHP本体に認証なしで遠隔からコードを実行される脆弱性(php2shell、CVE-2026-109618・CVE-2026-109619)が公開された。アプリのコードより前で刺さるので、こちらのコードでは備えられず、ホスティングの修正を待つしかない。

## セキュリティ

| 何から守るか                 | どう守るか                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| トークンを盗まれる           | トークンはWorkerのセッション(KV)だけに置き、暗号化する(AES-GCM)。ブラウザには返さない                                              |
| 持ち主でない人が入る         | ログインのあと、GitHubのユーザーのidが`OWNER_ID`か確かめる。違えばトークンを取り消す                                               |
| ログインの横取り             | PKCE(S256)と`state`。ログインの手続きは10分で切れ、1回しか使えない                                                                 |
| CSRF                         | 書き換える操作はPOSTなどで、独自ヘッダー`X-Admin: 1`と`Origin`(GETは`Sec-Fetch-Site`)を確かめる                                    |
| 何でもできる中継になる       | 通すのはこのリポジトリのcontents・git・pulls・commits・branchesと、actions(見るだけ)。パスをずらす書き方(`..`・`%`・`\`)は通さない |
| セッションの乗っ取り         | Cookieは`__Host-`・`Secure`・`HttpOnly`。ログインのたびにidを作り直す。1時間さわらなければ切れ、長くても8時間で切れる              |
| 総当たり                     | ログインを始めるのは、1つのIPで10分に10回まで                                                                                      |
| 覚えた端末のCookieを盗まれる | 中身はランダムな値で、トークンではない。使うたびに値を変え、古い値がもう一度来たら盗まれたとみなして取り消す。30日で切れる         |
| ログアウトしたのに使える     | ログアウトでGitHubのトークン・セッション・端末の記憶を取り消す                                                                     |
| 公開を壊される               | mainには直接コミットしない。PRを作り、必須チェック(証明・検査・VRTを含む)が通ってからマージする                                    |

前提: GitHubのアカウントで2段階認証を有効にしておく。管理画面の安全はここに乗っている。

## 用意すること

### GitHub App

1. GitHubの Settings → Developer settings → GitHub Apps → New GitHub App
2. 次のとおりにする
   - Homepage URL: サイトのURL
   - Callback URL: `https://<ドメイン>/admin/auth/callback`
   - 「Expire user authorization tokens」: オン(トークンは8時間で切れ、リフレッシュトークンで取り直す)
   - 「Request user authorization (OAuth) during installation」: オフ
   - Webhook: オフ
   - Repository permissions: Contents は Read and write、Actions は Read-only、Pull requests は Read and write、Metadata は Read-only。ほかはNo access
   - Where can this GitHub App be installed?: Only on this account
3. 作ったら、Client IDを控え、Client secretを作る(Generate a new client secret)
4. Install App から、`Aqua-218/Portfolio`だけに入れる(Only select repositories)

### Cloudflare

1. ドメインをCloudflareのDNSに乗せ、ロリポップをオリジンにする(プロキシをオン)
2. `apps/admin-worker/wrangler.toml`の`routes`・`ORIGIN`をそのドメインにする
3. KVを作り、idを`wrangler.toml`に書く: `pnpm dlx wrangler kv namespace create ADMIN_KV`
4. `GITHUB_CLIENT_ID`と`OWNER_ID`(`https://api.github.com/users/Aqua-218`のid)を`wrangler.toml`に書く
5. 秘密の値を入れる。リポジトリには書かない
   - `pnpm dlx wrangler secret put GITHUB_CLIENT_SECRET`
   - `openssl rand -base64 32 | pnpm dlx wrangler secret put KEY`
6. デプロイ: `pnpm dlx wrangler deploy`(`apps/admin-worker`で)

鍵(`KEY`)を変えると、いまのセッションと覚えた端末はすべて使えなくなる。漏れた疑いがあるときは、鍵とClient secretの両方を作り直す。
