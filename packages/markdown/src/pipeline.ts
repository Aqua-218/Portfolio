import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { type CatDrawer, rehypeAlerts } from "./alerts";
import { type OgpSource, rehypeLinkCards } from "./cards";
import { type MermaidSource, rehypeMermaid } from "./diagrams";
import { getHighlighter, rehypeShikiFromHighlighter } from "./highlight";

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

let cached: ReturnType<typeof processor> | undefined;

/** 外から渡すもの。なければ、その記法は素のまま(リンクカードはリンク、図はコード、アラートの猫はなし) */
export interface RenderData {
  ogp?: OgpSource;
  mermaidCache?: MermaidSource;
  cat?: CatDrawer;
}

export async function renderWith(
  markdown: string,
  data: RenderData,
): Promise<string> {
  cached ??= processor();
  const file = await (
    await cached
  ).process({
    value: markdown,
    data: {
      ...(data.ogp ? { ogp: data.ogp } : {}),
      ...(data.mermaidCache ? { mermaidCache: data.mermaidCache } : {}),
      ...(data.cat ? { cat: data.cat } : {}),
    },
  });
  return String(file);
}
