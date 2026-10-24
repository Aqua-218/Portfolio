import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * MarkdownをHTMLにする。本番のページと管理画面のプレビューで同じものを使う。
 * 生のHTMLは通さない(書いても文字として出る)。
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  // 見出しにidをつけ、見出しそのものをそのidへのリンクにする
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "wrap" })
  .use(rehypeStringify);

/** MarkdownをHTMLの文字列にする。Shikiなど時間のかかる処理も入るので、非同期にしておく */
export async function render(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}
