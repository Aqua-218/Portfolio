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

生のHTMLは、qiita-markdownと同じ範囲(UserInputSanitizer)だけを許し、ほかは消す。スクリプト・イベントの属性・`javascript:`・`style`の要素は残らない(`src/qiita/security.test.ts`)。表のセルの`style`は`text-align`と`border`だけ残す。埋め込みは #241 で扱う。

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
