import type { ReactNode } from "react";
import { Icon } from "@/components/icon/Icon";
import { PxCat } from "@/components/px-cat/PxCat";
import { Reveal } from "@/components/reveal/Reveal";
import * as sk from "@/components/skills/skills.css";
import * as s from "./stack.css";

const PEEK = ["peek", "peekBlink"] as const;

/** 無駄遣いの流れ。`→`で区切り、`chip:`は文字のチップ */
const WASTE = [
  {
    chain: ["simpleicons:rust", "→", "chip:Aeneas", "→", "local:lean"],
    title: "ドット猫を証明する",
    desc: "動いている Rust のコードを Lean に変換して、輪郭が必ず閉じることを証明。",
  },
  {
    chain: ["chip:TLA+", "→", "chip:TLC", "→", "simpleicons:vitest"],
    title: "幕をモデル検査する",
    desc: "連打しても幕が二重に開かないことを検査して、実装とも照合。",
  },
  {
    chain: ["local:lean", "chip:TLC", "→", "simpleicons:githubactions"],
    title: "証明が落ちたら止まる",
    desc: "証明かモデル検査が通らないと、サイトは更新されない。",
  },
  {
    chain: [
      "simpleicons:markdown",
      "simpleicons:toml",
      "→",
      "simpleicons:rust",
      "→",
      "simpleicons:typescript",
    ],
    title: "データを Rust で検証",
    desc: "日付や ID の間違いはビルドで止める。型は Rust から生成。",
  },
  {
    chain: [
      "simpleicons:rust",
      "→",
      "simpleicons:webassembly",
      "→",
      "simpleicons:github",
    ],
    title: "管理画面も同じ検証",
    desc: "本番と同じチェックをブラウザで走らせてからコミット。",
  },
  {
    chain: ["simpleicons:rust", "→", "chip:WebP・AVIF"],
    title: "写真の変換も自作",
    desc: "猫の写真の変換とサイズ違いの生成を、Rust で自分で書く。",
  },
  {
    chain: [
      "simpleicons:mermaid",
      "→",
      "simpleicons:googlechrome",
      "→",
      "chip:SVG",
    ],
    title: "Mermaid を本物で描く",
    desc: "ビルド時にブラウザで描いて SVG に。色は CSS 変数に置き換え。",
  },
] as const;

/** 使っているもの。アイコンがなければ肉球 */
const TILES = [
  { icon: "simpleicons:nextdotjs", name: "Next.js", role: "フロント" },
  { icon: "simpleicons:react", name: "React", role: "UI" },
  { icon: "simpleicons:typescript", name: "TypeScript", role: "言語" },
  { name: "vanilla-extract", role: "スタイル" },
  { icon: "simpleicons:rust", name: "Rust", role: "検証・変換" },
  { icon: "simpleicons:webassembly", name: "WebAssembly", role: "ドット猫" },
  { icon: "local:lean", name: "Lean 4", role: "証明" },
  { name: "TLA+", role: "仕様" },
  { icon: "simpleicons:vitest", name: "Vitest", role: "テスト" },
  { icon: "local:playwright", name: "Playwright", role: "見た目のテスト" },
  { icon: "simpleicons:eslint", name: "ESLint", role: "Lint" },
  { icon: "simpleicons:prettier", name: "Prettier", role: "整形" },
  { icon: "simpleicons:pnpm", name: "pnpm", role: "モノレポ" },
  { name: "mise", role: "開発環境" },
  { icon: "simpleicons:mermaid", name: "Mermaid", role: "図" },
  { icon: "simpleicons:markdown", name: "Markdown", role: "コンテンツ" },
  { icon: "simpleicons:yaml", name: "YAML", role: "メタ情報" },
  { icon: "simpleicons:toml", name: "TOML", role: "データ" },
  { icon: "simpleicons:githubactions", name: "GitHub Actions", role: "CI" },
  { name: "release-please", role: "リリース" },
  { name: "ロリポップ！", role: "ホスティング" },
] as const;

function Paw() {
  return (
    <svg
      className={s.paw}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <ellipse cx="16" cy="21.5" rx="7.2" ry="6" />
        <ellipse
          cx="6.5"
          cy="13"
          rx="2.9"
          ry="3.6"
          transform="rotate(-18 6.5 13)"
        />
        <ellipse
          cx="12.3"
          cy="7.6"
          rx="2.9"
          ry="3.7"
          transform="rotate(-6 12.3 7.6)"
        />
        <ellipse
          cx="19.7"
          cy="7.6"
          rx="2.9"
          ry="3.7"
          transform="rotate(6 19.7 7.6)"
        />
        <ellipse
          cx="25.5"
          cy="13"
          rx="2.9"
          ry="3.6"
          transform="rotate(18 25.5 13)"
        />
      </g>
    </svg>
  );
}

function Link({ part }: { part: string }) {
  if (part === "→") {
    return (
      <span className={s.arr} aria-hidden="true">
        →
      </span>
    );
  }
  if (part.startsWith("chip:")) {
    return <span className={s.tchip}>{part.slice("chip:".length)}</span>;
  }
  return <Icon icon={part} />;
}

/** 無駄遣いポイント */
export function Waste() {
  return (
    <ul className={s.wcards}>
      {WASTE.map((w, i) => (
        <Reveal
          as="li"
          key={w.title}
          kind="pop"
          delay={0.05 + i * 0.04}
          className={s.wcard}
        >
          <div className={s.chain}>
            {w.chain.map((part, j) => (
              <Link key={j} part={part} />
            ))}
          </div>
          <p className={s.wTitle}>{w.title}</p>
          <p className={s.wDesc}>{w.desc}</p>
        </Reveal>
      ))}
    </ul>
  );
}

/** 使っているもの */
export function Tiles() {
  return (
    <ul className={s.tiles}>
      {TILES.map((t, i) => (
        <Reveal
          as="li"
          key={t.name}
          kind="pop"
          delay={0.05 + i * 0.04}
          className={s.tile}
        >
          {"icon" in t ? <Icon icon={t.icon} /> : <Paw />}
          <span className={s.tName}>{t.name}</span>
          <span className={s.tRole}>{t.role}</span>
        </Reveal>
      ))}
    </ul>
  );
}

/** コードの見本。[色, 文字]の並び。色は k・f・t・c */
const CODE: readonly (readonly [keyof typeof TOKEN | "", string])[] = [
  ["k", "pub fn"],
  ["", " "],
  ["f", "outline"],
  ["", "(grid: "],
  ["t", "&Grid"],
  ["", ") -> "],
  ["t", "Vec"],
  ["", "<"],
  ["t", "Rect"],
  ["", "> {\n    "],
  ["c", "// 輪郭は必ず閉じる（Lean で証明済み）"],
  ["", "\n    "],
  ["k", "let mut"],
  ["", " out = "],
  ["t", "Vec"],
  ["", "::"],
  ["f", "new"],
  ["", "();\n    "],
  ["c", "// …"],
  ["", "\n    out\n}"],
];

/** 数式の見本。React の型に MathML がないので、文字列のまま入れる */
const MATH =
  '<math display="block"><mrow><mo>∀</mo><mi>c</mi><mo>∈</mo><mi mathvariant="normal">Cats</mi><mo>,</mo><mspace width="0.4em"/><mi mathvariant="normal">closed</mi><mo>(</mo><mi mathvariant="normal">outline</mi><mo>(</mo><mi>c</mi><mo>)</mo><mo>)</mo></mrow></math>';

const TOKEN = { k: s.k, f: s.f, t: s.t, c: s.c };

function Sample({
  index,
  caption,
  children,
}: {
  index: number;
  caption: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="figure"
      kind="pop"
      delay={0.05 + index * 0.04}
      className={s.sample}
    >
      <figcaption>{caption}</figcaption>
      {children}
    </Reveal>
  );
}

/** Markdown で書けるもの。いまは見本だけ。本物の処理は #69 */
export function Samples() {
  return (
    <div className={s.samples}>
      <Sample index={0} caption="注意書き">
        <div className={s.callout}>
          <PxCat
            className={s.calloutCat}
            frames={PEEK}
            coat="mike"
            pixel={2}
            motion="blink"
          />
          <div>
            <b>NOTE</b>
            <p>猫は液体です。容器に合わせて形が変わります。</p>
          </div>
        </div>
      </Sample>
      <Sample index={1} caption="コード（Shiki・猫テーマ）">
        <pre className={s.code}>
          <code>
            {CODE.map(([cls, text], i) =>
              cls === "" ? (
                text
              ) : (
                <span key={i} className={TOKEN[cls]}>
                  {text}
                </span>
              ),
            )}
          </code>
        </pre>
      </Sample>
      <Sample index={2} caption="数式">
        <div className={s.math} dangerouslySetInnerHTML={{ __html: MATH }} />
      </Sample>
      <Sample index={3} caption="リンクカード">
        <a
          className={s.lcard}
          href="https://simpleicons.org/"
          target="_blank"
          rel="noopener"
        >
          <span className={s.lcTitle}>Simple Icons</span>
          <span className={s.lcDesc}>Free SVG icons for popular brands</span>
          <span className={s.lcUrl}>simpleicons.org</span>
        </a>
      </Sample>
    </div>
  );
}

const TREE = `apps/web/            Next.js（vanilla-extract）
apps/web/app/admin/  自作の管理画面
packages/markdown/   unified の処理と猫テーマ（本番とプレビューで共通）
crates/content/      データの検証・JSON と TS の型の生成（Wasm にもビルド）
crates/imgpipe/      猫の写真の変換
crates/pxcat-core/   ドット猫の本体（Aeneas の入力）
crates/pxcat-wasm/   Wasm のラッパー
content/             events/*.md、skills.toml、shelf.toml、work.toml など
content/.cache/      リンクカード用の OGP キャッシュ
proofs/              Lean（Aeneas の出力と証明）
specs/               TLA+ の仕様と TLC の設定
.github/workflows/   ci.yml、release-please.yml、deploy.yml
mise.toml`;

const RULES = [
  [
    "TypeScript",
    "strict に加えて noUncheckedIndexedAccess・exactOptionalPropertyTypes。any は禁止",
  ],
  [
    "React",
    "Server Components が基本。use client は動く部分（ドット猫・幕・時計）だけ。export は名前付き（page・layout だけ default）",
  ],
  [
    "ファイル",
    "ファイル名は kebab-case、コンポーネントは PascalCase。スタイルは同じ場所に *.css.ts",
  ],
  [
    "スタイル",
    "色や大きさは theme.css.ts のテーマ契約からだけ。インラインスタイル禁止",
  ],
  ["データの型", "Rust から生成したものだけを使う。手で書き直さない"],
  [
    "Rust",
    "edition 2024。clippy pedantic を警告に。unsafe は pxcat-wasm 以外で禁止。エラーはライブラリで thiserror、ツールで anyhow",
  ],
  [
    "pxcat-core",
    "Aeneas で変換できるように、トレイトオブジェクト・クロージャ・凝ったイテレーター・内部可変性を使わず、素直なループと添字で書く",
  ],
  [
    "Lean",
    "定理名は snake_case（outline_closed など）。ファイルは Rust のモジュールと1対1。sorry が残ったら CI で落とす",
  ],
  [
    "TLA+",
    "PlusCal で書く。不変条件は TypeOK・NoDoubleOpen のように守るものがわかる名前に",
  ],
] as const;

const EVENT = `---
title: セキュリティ・キャンプ全国大会
date: 2026-08-10
end: 2026-08-15
venue: 多摩 LINK FOREST
tags: [Z1ゼミ]
---
いやぁ〜〜楽しかったですよ、ほんとに。`;

const SKILL = `[[skill]]
name     = "Rust"
category = "lang"
level    = "main"   # main / often / can / touched
icon     = "simpleicons:rust"`;

function Acc({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <Reveal as="details" className={s.acc}>
      <summary>{summary}</summary>
      {children}
    </Reveal>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className={s.code}>
      <code>{children}</code>
    </pre>
  );
}

/** もっと細かい話 */
export function More() {
  return (
    <>
      <Acc summary="リポジトリの構成">
        <Code>{TREE}</Code>
      </Acc>
      <Acc summary="コーディング規約">
        <dl className={sk.rows}>
          {RULES.map(([dt, dd], i) => (
            <Reveal
              key={dt}
              kind="left"
              delay={0.1 + i * 0.06}
              className={sk.row}
            >
              <dt>{dt}</dt>
              <dd>
                <span className={s.value}>{dd}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </Acc>
      <Acc summary="コンテンツの書き方">
        <p className={s.para}>
          イベントは Markdown の先頭に YAML でメタ情報を書きます。
        </p>
        <Code>{EVENT}</Code>
        <p className={s.para}>スキルや Shelf などは TOML です。</p>
        <Code>{SKILL}</Code>
      </Acc>
    </>
  );
}
