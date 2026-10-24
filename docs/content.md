# コンテンツの形式

サイトの中身は全部`content/`に置く。ビルドの前に`crates/content`が読んで検証し、通ったものだけをJSONにしてページから読む。ページの見出しやリード文など、決まった文言はコードに書き、ここには置かない。

## ファイル

| ファイル                    | 中身                           |
| --------------------------- | ------------------------------ |
| `content/profile.toml`      | 名前・基本情報・経歴           |
| `content/skills.toml`       | スキル                         |
| `content/work.toml`         | 働いている会社                 |
| `content/affiliations.toml` | 所属団体・コンテスト・キャンプ |
| `content/events/*.md`       | イベント(1件1ファイル)         |
| `content/events.toml`       | 年度ごとの添え書き             |
| `content/shelf.toml`        | 見たもの・読んだもの           |
| `content/cats/*.jpg`        | 猫の写真                       |
| `content/cats.toml`         | 写真の説明文と、どこに置くか   |
| `content/licenses.toml`     | ライセンス・クレジット         |

共通の決まり:

- 文字コードはUTF-8。改行はLFでもCRLFでもよい
- 知らない項目は書き間違いとみなしてエラーにする
- 並び順は、ファイルに書いた順がそのままページの順になる(並べ替えるものは各節に書く)
- 文字列は前後に空白を入れない。空の文字列は書かない(省けるものは項目ごと省く)

## profile.toml

```toml
name = "小峯 圭也"
romaji = "Komine Keiya"
location = "Tochigi, JP"
timezone = "Asia/Tokyo"

[[fact]]
label = "名前"
value = "小峯 圭也"
sub = "Komine Keiya"
wide = true

[[fact]]
label = "部活"
value = "研究部"
sub = "6期生・情報科学グループ"
sub_short = "6期生"

[[career]]
year = 2025
title = "U-22 プログラミング・コンテスト 2025"
note = "経済産業省商務情報政策局長賞を受賞"
```

| 項目             | 型       | 必須 | 説明                                         |
| ---------------- | -------- | ---- | -------------------------------------------- |
| `name`           | 文字列   | ○    | 名前。姓と名の間は半角スペース               |
| `romaji`         | 文字列   | ○    | ローマ字の名前                               |
| `location`       | 文字列   | ○    | 時計とフッターに出す場所                     |
| `timezone`       | 文字列   | ○    | 時計のタイムゾーン(IANAの名前)               |
| `fact`           | 表の配列 | ○    | 基本のアレコレ。Homeとaboutで同じ順に出す    |
| `fact.label`     | 文字列   | ○    | 「学校」など                                 |
| `fact.value`     | 文字列   | ○    | 値                                           |
| `fact.sub`       | 文字列   |      | 値の横に小さく添える                         |
| `fact.sub_short` | 文字列   |      | Homeでだけ使う短い`sub`。なければ`sub`を使う |
| `fact.wide`      | 真偽値   |      | 2列ぶんの幅で出す。省くとfalse               |
| `career`         | 表の配列 | ○    | 経歴。古い順に書く                           |
| `career.year`    | 整数     | ○    | 年(4桁)                                      |
| `career.title`   | 文字列   | ○    | できごと                                     |
| `career.note`    | 文字列   |      | 添え書き                                     |

検証: `career`は`year`が古い順に並んでいること。

## skills.toml

```toml
[[skill]]
name = "Rust"
category = "lang"
level = "main"
icons = ["simpleicons:rust"]
coat = "mike"

[[skill]]
name = "TypeScript / JavaScript"
category = "lang"
level = "often"
icons = ["simpleicons:typescript", "simpleicons:javascript"]

[[tool]]
group = "インフラ・クラウド"
name = "Docker"
icons = ["simpleicons:docker"]
```

`skill`は言語と定理証明・形式手法で、レベルを持つ。`tool`はページの「そのほか」に並べるもので、レベルを持たない。

| 項目             | 型                                | 必須 | 説明                                                             |
| ---------------- | --------------------------------- | ---- | ---------------------------------------------------------------- |
| `skill.name`     | 文字列                            | ○    | 名前                                                             |
| `skill.category` | `lang`・`formal`                  | ○    | `lang`は「言語」、`formal`は「定理証明・形式手法」               |
| `skill.level`    | `main`・`often`・`can`・`touched` | ○    | 下の表                                                           |
| `skill.icons`    | 文字列の配列                      |      | アイコン。0〜2個                                                 |
| `skill.coat`     | `kuro`・`kiji`・`mike`            |      | `level = "main"`のとき必須。「メインで使う」で横にのぞく猫の毛色 |
| `tool.group`     | 文字列                            | ○    | 「分野」「低レイヤー」など。グループは最初に出てきた順に並ぶ     |
| `tool.name`      | 文字列                            | ○    | 名前                                                             |
| `tool.icons`     | 文字列の配列                      |      | アイコン。0〜2個                                                 |

| `level`   | 目盛り | 表示         |
| --------- | ------ | ------------ |
| `main`    | 4      | メインで使う |
| `often`   | 3      | よく使う     |
| `can`     | 2      | 使える       |
| `touched` | 1      | 触った程度   |

アイコンの書き方:

- `simpleicons:<slug>`: Simple Iconsのアイコン。slugはSimple Iconsのもの(`rust`・`gnubash`など)
- `local:<名前>`: `content/icons/<名前>.svg`。Simple Iconsにないもの

検証:

- `category`ごとに、`level`の高い順(main→often→can→touched)に並んでいること
- `level = "main"`のものには`coat`があり、それ以外には`coat`がないこと
- `local:`のアイコンのファイルがあり、`licenses.toml`にそのアイコンの項目があること
- 同じ`category`(または`group`)の中で`name`が重ならないこと

「メインで使う」には`level = "main"`の`skill`を、`lang`→`formal`の順に並べる。横の小さい字は、`lang`なら「言語」、`formal`なら「定理証明」。Homeの「そのほか」には、最初のグループだけを出す。

## work.toml

```toml
[[company]]
slug = "transwith"
prefix = "株式会社"
name = "TransWith"
url = "https://transwith.jp/"
description = "中小企業向けに、SES、IT顧問（CIO代行・情シス支援）、システム開発やプロダクト導入の支援をしている会社です。"
tagline = "中小企業のDXを、AIとプロフェッショナル人材で実現する。"
founded = "2022-11"
location = "東京都港区"
```

| 項目          | 型        | 必須 | 説明                                                           |
| ------------- | --------- | ---- | -------------------------------------------------------------- |
| `slug`        | 文字列    | ○    | ページの中のアンカー(`#work-<slug>`)。小文字の英数字とハイフン |
| `prefix`      | 文字列    |      | 「株式会社」など。名前の上に小さく出す                         |
| `name`        | 文字列    | ○    | 会社名                                                         |
| `url`         | URL       | ○    | 会社のサイト。`https://`で始める                               |
| `description` | 文字列    | ○    | 説明                                                           |
| `tagline`     | 文字列    |      | 会社のキャッチコピー                                           |
| `founded`     | `YYYY-MM` | ○    | 設立。ページでは「2022年11月」と出す                           |
| `location`    | 文字列    | ○    | 所在地                                                         |

ページの「サイト」の欄には、`url`のホスト名(`transwith.jp`)を出す。

検証: `slug`が重ならないこと。`founded`が実在する年月であること。

## affiliations.toml

```toml
[[affiliation]]
group = "org"
name = "N高グループ研究部（KdEi研）"
url = "https://nnn.ed.jp/attractiveness/extracurricular/club/kenkyubu/blog/elwq-zu6wfv/"
tag = "6期生・情報科学G"
description = "学術研究を志す中高生のためのコミュニティです。情報科学グループに所属しています。"
```

| 項目          | 型               | 必須 | 説明                                                     |
| ------------- | ---------------- | ---- | -------------------------------------------------------- |
| `group`       | `org`・`contest` | ○    | `org`は「所属団体」、`contest`は「コンテスト・キャンプ」 |
| `name`        | 文字列           | ○    | 名前                                                     |
| `url`         | URL              |      | あれば名前をリンクにする                                 |
| `tag`         | 文字列           | ○    | 立場や結果(「会員」「Z1ゼミ 修了生」など)                |
| `description` | 文字列           | ○    | 説明。Affiliationsのページでだけ出す                     |

## events/*.md

ファイル名は`<開始日>-<短い名前>.md`(`2026-08-10-seccamp.md`など)。

```markdown
---
title: セキュリティ・キャンプ全国大会
date: 2026-08-10
end: 2026-08-15
venue: 多摩 LINK FOREST
tags: [Z1ゼミ]
---

いやぁ〜〜楽しかったですよ、ほんとに。今セキュキャンロスですもん、濃い6日間でした。

（段落は空行で分ける）
```

| 項目    | 型           | 必須 | 説明                                                                                |
| ------- | ------------ | ---- | ----------------------------------------------------------------------------------- |
| `title` | 文字列       | ○    | イベント名                                                                          |
| `date`  | `YYYY-MM-DD` | ○    | 開始日。ページでは「8/10」と出す                                                    |
| `end`   | `YYYY-MM-DD` |      | 何日かにわたるときの最終日。同じ月なら「8/10–15」、月をまたぐなら「8/31–9/2」と出す |
| `venue` | 文字列       | ○    | 会場。ページで先頭に「@ 」を付けるので、ここには書かない                            |
| `tags`  | 文字列の配列 |      | 「受賞」「LT」など。いまは0〜1個                                                    |
| 本文    | Markdown     | ○    | 感想など。段落は空行で分ける                                                        |

検証:

- `date`と`end`が実在する日付で、`end`が`date`より後であること
- ファイル名の日付が`date`と同じであること
- `venue`が「@」で始まっていないこと
- `tags`が2個以上ないこと
- 本文が空でないこと

並び: 年度(4月〜3月)ごとにまとめ、年度の中は`date`の古い順。同じ日はファイル名の順。Homeには新しい順に3件だけ出す。

### events.toml

年度の見出しに添える一言。

```toml
[[year]]
year = 2025
note = "中学生のころ（N中等部ではなかったです）"
```

| 項目   | 型     | 必須 | 説明                   |
| ------ | ------ | ---- | ---------------------- |
| `year` | 整数   | ○    | 年度(4月に始まる年)    |
| `note` | 文字列 | ○    | 見出しの横に小さく出す |

検証: その年度のイベントがあること。

## shelf.toml

```toml
[[work]]
kind = "anime"
title = "夏目友人帳"
note = "今出てるやつは全部"
pick = true
```

| 項目    | 型                       | 必須 | 説明                               |
| ------- | ------------------------ | ---- | ---------------------------------- |
| `kind`  | `drama`・`anime`・`book` | ○    | 「ドラマ」「アニメ」「漫画・小説」 |
| `title` | 文字列                   | ○    | 作品名                             |
| `note`  | 文字列                   |      | ひとこと。いまはページに出さない   |
| `pick`  | 真偽値                   |      | Homeに出す。省くとfalse            |

検証: 同じ`kind`の中で`title`が重ならないこと(`kind`が違えば同じ作品名でもよい)。

## cats.toml と cats/*.jpg

写真は`content/cats/`に置く。**位置情報などのメタデータを消してから置く**(検証でも、EXIF・XMPが残っていたらエラーにする)。ページに出すときは`crates/imgpipe`がWebPとAVIFにする。

```toml
mosaic = ["koneko", "futari", "mike-face", "kijishiro-tatami"]
goodnight = "kijishiro-bed"

[sections]
about = "kijishiro-stand"
skills = "kijishiro-tatami"

[[photo]]
id = "koneko"
alt = "三毛の子猫が黒い子猫の頭をなめている"
coats = ["mike", "kuro"]
```

| 項目          | 型             | 必須 | 説明                                                                                                              |
| ------------- | -------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| `mosaic`      | 写真のidの配列 | ○    | Homeのモザイクの4枚。左上から                                                                                     |
| `goodnight`   | 写真のid       | ○    | Homeのいちばん下の1枚                                                                                             |
| `sections`    | 表             | ○    | 各ページの見出しの横の1枚。キーは`about`・`skills`・`work`・`affiliations`・`events`・`shelf`・`stack`・`license` |
| `photo`       | 表の配列       | ○    | 写真。Catsのギャラリーにはこの順に並ぶ                                                                            |
| `photo.id`    | 文字列         | ○    | ファイル名(拡張子なし)。`content/cats/<id>.jpg`                                                                   |
| `photo.alt`   | 文字列         | ○    | 説明文。画像の代わりに読み上げられる                                                                              |
| `photo.coats` | 毛色の配列     | ○    | 写っている猫の毛色                                                                                                |

検証: 写真のファイルがあり、`cats.toml`にないファイルがないこと。`mosaic`がちょうど4枚で、出てくるidが全部`photo`にあること。メタデータが残っていないこと。

## licenses.toml

```toml
[[license]]
group = "icons"
name = "Simple Icons"
url = "https://simpleicons.org/"
license = "CC0 1.0"
note = "Skills ページの言語・技術のアイコンの多くに使っています。ロゴの形と色は変えていません。"
```

| 項目      | 型                                 | 必須 | 説明                                                                    |
| --------- | ---------------------------------- | ---- | ----------------------------------------------------------------------- |
| `group`   | `icons`・`fonts`・`site`・`others` | ○    | 「アイコン」「フォント」「このサイトのもの」「そのほか」                |
| `name`    | 文字列                             | ○    | 名前                                                                    |
| `url`     | URL                                |      | あれば名前をリンクにする                                                |
| `license` | 文字列                             |      | 「CC BY 3.0」などの表記。SPDXの識別子ではなく、ページにそのまま出す文字 |
| `note`    | 文字列                             | ○    | 説明                                                                    |
| `icons`   | 文字列の配列                       |      | このライセンスで使っている`local:`のアイコン。`skills.toml`の検証で使う |

## エラーの出し方

検証で見つかった間違いは、ファイル名と行番号を付けて、全部まとめて出す。

```
content/events/2026-08-10-seccamp.md:3: date がありません
content/skills.toml:42: level は main・often・can・touched のどれかです
```
