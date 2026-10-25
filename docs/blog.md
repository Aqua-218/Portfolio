# ブログの記法(Qiitaと同じ)

ブログの記事(`content/blog/*.md`、形は[content.md](content.md))の本文は、Qiitaと同じ記法で書く。Qiitaに出しても、サイトに出しても、同じ意味になる。

描くのは`packages/markdown`の`qiita`の流れ(`render(md, { flavor: "qiita" })`)。Qiitaの描画([qiita-markdown](https://github.com/increments/qiita-markdown))と同じ順番で同じことをし、見た目だけサイトに合わせる。

## 使える記法

| 記法                               | 書き方                                              | サイトでの見た目                                         |
| ---------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| 改行                               | 改行1つで改行(Qiitaと同じ)                          |                                                          |
| 注意書き                           | `:::note info`・`warn`・`alert`〜`:::`              | 猫つきの注意書き(info=NOTE、warn=WARNING、alert=CAUTION) |
| コードのファイル名                 | ` ```ruby:app.rb `、` ```app.rb `(言語は拡張子から) | 上にファイル名                                           |
| 差分                               | ` ```diff_ruby `                                    | 差分の色                                                 |
| 数式                               | `$…$`・`$$…$$`・` ```math `・``$`…`$``              | MathML                                                   |
| Mermaid                            | ` ```mermaid `                                      | 図                                                       |
| 脚注                               | `[^1]`                                              |                                                          |
| 絵文字                             | `:smile:`                                           | 絵文字                                                   |
| メンション                         | `@ユーザー名`                                       | Qiitaのユーザーのページへのリンク                        |
| 色の見本                           | `` `#ff0000` ``                                     | 色の見本つき                                             |
| チェックリスト・表・打ち消し(`~~`) | GFMと同じ                                           |                                                          |
| HTML                               | Qiitaで許すものだけ(`details`・`kbd`・`ruby`など)   |                                                          |

見出しのidは、Qiitaと同じ作り方(小文字にし、文字・数字・`_`・`-`・空白のほかを消し、空白を`-`に)。Qiitaの記事の中の`#見出し`へのリンクが、サイトでもそのまま効く。

数式はQiitaと同じく、MarkdownをHTMLにしたあとの文字から探す(QiitaではブラウザのMathJaxが探す)。そのため`$$`の中でもMarkdownのエスケープが効く(`\,`は`,`になる)。確実に書くには` ```math `か``$`…`$``を使う。

## 守り

生のHTMLは、qiita-markdownと同じ範囲(UserInputSanitizer)だけを許し、ほかは消す。スクリプト・イベントの属性・`javascript:`・`style`の要素は残らない(`src/qiita/security.test.ts`)。表のセルの`style`は`text-align`と`border`だけ残す。

## 埋め込み

Qiitaで使える埋め込みは、サイトでも出る。ただし、Qiitaのように各サービスのスクリプトを動かすことはせず、どれもそのサービスの埋め込み用のiframeに組み立て直す(`src/qiita/embeds.ts`)。ページで動くのは、このサイトのスクリプトだけ。

| 埋め込み                                                                                              | Qiitaに書くもの                                    | サイトで出すiframe                                      |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| YouTube・SlideShare・Googleスライド・Googleドライブ・Figma・StackBlitz・Docswell・BlueprintUE・Claude | 各サービスの`<iframe>`                             | そのまま(出どころがQiitaと同じ許可リストにあるものだけ) |
| X(Twitter)                                                                                            | `<blockquote class="twitter-tweet">`と`widgets.js` | `platform.twitter.com/embed/Tweet.html`                 |
| CodePen                                                                                               | `<p class="codepen">`と`ei.js`                     | `codepen.io/<ユーザー>/embed/<id>`                      |
| SpeakerDeck                                                                                           | `<script class="speakerdeck-embed">`               | `speakerdeck.com/player/<id>`                           |
| Docswell                                                                                              | `<script class="docswell-embed">`                  | `data-src`のURL(Docswellのものだけ)                     |
| asciinema                                                                                             | `<script src="https://asciinema.org/a/<id>.js">`   | `asciinema.org/a/<id>/iframe`                           |

- iframeの属性は、書かれたもの(`sandbox`・`allow`・`srcdoc`など)を使わず、決めたものだけにする: `sandbox`(スクリプトと、そのサービス自身への通信と、別のタブを開くこと・全画面だけ許す。ページを移したり、このページを動かしたりはできない)、`referrerpolicy="strict-origin-when-cross-origin"`(YouTubeは送らないと再生しない)、`loading="lazy"`
- わからないiframeとscriptは消す(`src/qiita/embeds.test.ts`)
- CSPの`frame-src`には、サイトのどこかで使っている埋め込みの出どころだけを入れる(`apps/web/scripts/headers.mjs`)
- Xの投稿の高さは、iframeから届くメッセージ(`platform.twitter.com`からのものだけ)で合わせる(`apps/web/src/components/markdown/Embeds.tsx`)

## 互換を確かめる

`packages/markdown/src/qiita/fixtures/`の見本(`*.md`)ごとに、本物のqiita-markdownの出力(`*.qiita.html`)と、意味が同じかを比べる(`compat.test.ts`)。見た目の違い(クラス・アイコン・色づけ・猫)は捨てて、注意書きの種類・コードの言語とファイル名と中身・見出しのid・数式のTeX・メンション・絵文字・リンクなどを比べる(`canonical.ts`)。

正解は、DockerのRubyで本物のqiita-markdown(`packages/markdown/qiita/Gemfile.lock`で版を固定)を動かして作る。見本を足したり直したりしたら作り直す:

```sh
sh packages/markdown/qiita/golden.sh
```

見本はPrettierにかけない(`.prettierignore`)。正解と同じ文字でなくなるため。

## わかっている違い

Qiitaの解析はcmark-gfm 0.29、このサイトはmicromark(CommonMark 0.31)。次の2つは解析のしかたそのものが違うので、同じにしていない。

- 句読点(`。`など)で終わる強調のあとに、別の強調が続くとき。`a**太字。**です。b**c**`は、Qiitaでは`太字。です。bc`が1つの太字になり、サイトでは入れ子の太字になる。`**太字。**です`だけなら、どちらも太字にならない(CommonMarkの決まり)
- 空白を含む`<https://example.com/a b>`。QiitaはHTMLのタグとみなして消し、サイトでは`https://example.com/a`だけがリンクになる

## Qiitaに出す

記事をmainに入れる(管理画面から公開する、またはPRをマージする)と、Actions(`.github/workflows/qiita.yml`)がQiitaに出す(`apps/web/scripts/qiita.mjs`)。

| 記事                                                    | すること                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ignorePublish: true`                                   | 何もしない(サイトだけ)                                                                                      |
| `id`がない                                              | 投稿する。ただし、同じタイトルの記事が自分のQiitaにもうあれば、それを自分の記事として扱う(二重に投稿しない) |
| `id`があり、中身が変わった                              | 更新する                                                                                                    |
| Qiitaの記事と中身が同じ                                 | 何もしない                                                                                                  |
| Qiitaのほうが、前に書き戻した日時よりあとで直されている | 上書きしない(警告を出す)。Qiitaで直したものを消さないため                                                   |

- 送るのはタイトル・本文・タグ・限定公開(`private`)・スライド(`slide`)・organization
- もらった`id`と`updated_at`は、記事のfrontmatterに書き戻す(Qiita CLIと同じ)。mainには直接書けないので、書き戻しをPR(`content: Qiitaのidと日時を書き戻す`)にして、チェックが通ったら自動でマージする。そのマージでもう一度走るが、Qiitaと中身が同じなので何もしない
- 記事のファイルを消しても、Qiitaの記事は消さない

### 用意すること

1. Qiitaの 設定 → アプリケーション → 個人用アクセストークン で、`read_qiita`と`write_qiita`のトークンを作る
2. リポジトリの Settings → Secrets and variables → Actions に、`QIITA_TOKEN`として入れる
3. 書き戻しのPRには`CONTENT_CACHE_TOKEN`([admin.md](admin.md))を使う。Contentsに加えて、Pull requests も Read and write にする

`QIITA_TOKEN`を渡すのはQiitaに出すステップだけ、`CONTENT_CACHE_TOKEN`を渡すのは書き戻しのPRを作るステップ(gitとghだけ)だけ。`QIITA_TOKEN`がなければ、Qiitaには出さずに終わる。
