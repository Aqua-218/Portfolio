import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeAlerts } from "./alerts";
import { getHighlighter, rehypeShikiFromHighlighter } from "./highlight";
import { type OgpCache, rehypeLinkCards } from "./ogp";

export { OgpCache, fetchOgp, parseOgp, type Fetcher, type Ogp } from "./ogp";

/**
 * MarkdownをHTMLにする。本番のページと管理画面のプレビューで同じものを使う。
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
      // 数式はビルド時にMathMLにする。ブラウザが描くので、KaTeXのCSSとフォントはいらない
      .use(rehypeKatex, { output: "mathml" })
      // URLだけの行をリンクカードにする
      .use(rehypeLinkCards)
      // GitHubのアラートを、猫のついた注意書きにする
      .use(rehypeAlerts)
      // 見出しにidをつけ、見出しそのものをそのidへのリンクにする
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, { behavior: "wrap" })
      // コードに猫のテーマで色をつける。知らない言語は色なし
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: "cat",
        fallbackLanguage: "text",
      })
      .use(rehypeStringify)
  );
}

let cached: ReturnType<typeof processor> | undefined;

export interface RenderOptions {
  /** リンクカードのOGPのキャッシュ。なければリンクカードにしない */
  ogp?: OgpCache;
}

/** MarkdownをHTMLの文字列にする。色づけの道具を読んだりOGPを取ったりするので非同期 */
export async function render(
  markdown: string,
  options: RenderOptions = {},
): Promise<string> {
  cached ??= processor();
  const file = await (
    await cached
  ).process({
    value: markdown,
    data: options.ogp ? { ogp: options.ogp } : {},
  });
  return String(file);
}
