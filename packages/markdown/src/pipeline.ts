import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { type CatDrawer, rehypeAlerts } from "./alerts";
import { type OgpSource, rehypeLinkCards } from "./cards";
import { type MermaidSource, rehypeMermaid } from "./diagrams";
import { getHighlighter, rehypeShikiFromHighlighter } from "./highlight";
import { customBlocks } from "./qiita/blocks";
import { rehypeQiitaEmbeds } from "./qiita/embeds";
import { remarkQiitaCode } from "./qiita/code";
import {
  rehypeQiitaCode,
  rehypeQiitaCodeColor,
  rehypeQiitaEmoji,
  rehypeQiitaHeadings,
  rehypeQiitaInlineMath,
  rehypeQiitaLinks,
  rehypeQiitaMath,
  rehypeQiitaMentions,
  rehypeQiitaNotes,
} from "./qiita/rehype";
import { qiitaSchema, rehypeQiitaStyle } from "./qiita/sanitize";

/**
 * MarkdownをHTMLにする処理。本番のページ(ビルド)と管理画面のプレビュー(ブラウザ)で同じものを使う。
 * ファイルやChromiumなど、ビルドでしか使えないものは、ここでは使わず外から渡す(RenderData)。
 * 生のHTMLは通さない(書いても文字として出る)。
 */
async function processor() {
  const highlighter = await getHighlighter();
  return (
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      // $...$と$$...$$を数式にする
      .use(remarkMath)
      .use(remarkRehype)
      // 数式はMathMLにする。ブラウザが描くので、KaTeXのCSSとフォントはいらない
      .use(rehypeKatex, { output: "mathml" })
      // URLだけの行をリンクカードにする
      .use(rehypeLinkCards)
      // GitHubのアラートを、猫のついた注意書きにする
      .use(rehypeAlerts)
      // 見出しにidをつけ、見出しそのものをそのidへのリンクにする
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, { behavior: "wrap" })
      // Mermaidの図を描く。コードの色づけより先にやる
      .use(rehypeMermaid)
      // コードに猫のテーマで色をつける。知らない言語は色なし
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: "cat",
        fallbackLanguage: "text",
      })
      .use(rehypeStringify)
  );
}

/**
 * Qiitaの記法(ブログの記事)。qiita-markdownと同じ順番で同じことをする(src/qiita/)。
 * 生のHTMLは、Qiitaと同じ範囲だけ許して、ほかは消す
 */
async function qiitaProcessor() {
  const highlighter = await getHighlighter();
  return (
    unified()
      .use(remarkParse)
      // 打ち消しは~~だけ(Qiitaと同じ)
      .use(remarkGfm, { singleTilde: false })
      // 改行はそのまま改行にする(Qiitaと同じ)
      .use(remarkBreaks)
      .use(remarkQiitaCode)
      .use(remarkRehype, {
        allowDangerousHtml: true,
        // 脚注のidをQiitaと同じ fn-1・fnref-1 にする
        clobberPrefix: "",
        footnoteLabel: "脚注",
        footnoteBackLabel: "本文へ戻る",
      })
      .use(rehypeRaw)
      .use(rehypeSanitize, qiitaSchema)
      .use(rehypeQiitaStyle)
      // 埋め込みは、各サービスのiframeに組み立て直す。外のスクリプトは動かさない
      .use(rehypeQiitaEmbeds)
      .use(rehypeQiitaHeadings)
      .use(rehypeQiitaNotes)
      .use(rehypeQiitaEmoji)
      .use(rehypeQiitaMentions)
      .use(rehypeQiitaLinks)
      .use(rehypeQiitaCodeColor)
      .use(rehypeQiitaInlineMath)
      .use(rehypeQiitaMath)
      .use(rehypeLinkCards)
      // :::noteの猫を描く。引用の[!NOTE]は、Qiitaと同じく文字のまま
      .use(rehypeAlerts, { blockquotes: false })
      .use(rehypeMermaid)
      .use(rehypeQiitaCode)
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: "cat",
        fallbackLanguage: "text",
      })
      .use(rehypeStringify)
  );
}

/** Markdownの書き方。siteはサイトのページ、qiitaはブログの記事(Qiitaと同じ記法) */
export type Flavor = "site" | "qiita";

const cached: Partial<Record<Flavor, ReturnType<typeof processor>>> = {};

/** 外から渡すもの。なければ、その記法は素のまま(リンクカードはリンク、図はコード、アラートの猫はなし) */
export interface RenderData {
  ogp?: OgpSource;
  mermaidCache?: MermaidSource;
  cat?: CatDrawer;
}

export async function renderWith(
  markdown: string,
  data: RenderData,
  flavor: Flavor = "site",
): Promise<string> {
  const make = flavor === "qiita" ? qiitaProcessor : processor;
  const ready = (cached[flavor] ??= make());
  const file = await (
    await ready
  ).process({
    // Qiitaの:::noteは、Markdownとして読む前にdivにする
    value: flavor === "qiita" ? customBlocks(markdown) : markdown,
    data: {
      ...(data.ogp ? { ogp: data.ogp } : {}),
      ...(data.mermaidCache ? { mermaidCache: data.mermaidCache } : {}),
      ...(data.cat ? { cat: data.cat } : {}),
    },
  });
  return String(file);
}
