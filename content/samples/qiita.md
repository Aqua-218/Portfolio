ブログの記事の記法(Qiitaと同じ)の見本。見た目テストの対象にして、記法の見た目が崩れないようにする。

# 見出し1

## 見出し2

### 見出し3

改行は
そのまま改行になる。**太字**・*斜体*・~~打ち消し~~・`インラインのコード`・`#d4762a`。

:::note info
ふつうのメモ
:::

:::note warn
気をつけること
:::

:::note alert
危ないこと
:::

```ruby:app.rb
class Cat
  def meow = puts("にゃー")
end
```

```diff_rust
- fn old() {}
+ fn new() {}
```

文中の数式 $E = mc^2$ と、`` $`a_1 + b_1`$ `` の書き方。

```math
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
```

| 左 | 中央 | 右 |
|:---|:---:|---:|
| 黒 | キジ | 三毛 |

- [x] 済んだこと
- [ ] まだのこと

> 引用

脚注もつけられる[^1]。:cat: :+1: と @Qiita 。

[^1]: 脚注の中身

<details><summary>たたんだ中身</summary>

中は **Markdown** で書ける。

</details>

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube" frameborder="0" allowfullscreen></iframe>

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">猫</p>&mdash; Qiita (@Qiita) <a href="https://twitter.com/Qiita/status/1234567890123456789">2026年10月25日</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
