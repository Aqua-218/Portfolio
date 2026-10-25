/**
 * Qiitaのカスタムブロック(`:::note warn`〜`:::`)を、qiita_markerと同じく
 * `<div data-type="customblock" data-metadata="note warn">`にする。中はMarkdownのまま読む。
 *
 * qiita_markerと同じにするところ(src/qiita/fixtures/note-*.md の正解で確かめる):
 * - `:::`で始まる行がブロックを開く。`note`などがなくても開く(ただのdivになる)
 * - 入れ子にはしない。開いている間の`:::note`は文字のまま。`:::`だけの行で閉じる
 * - ブロックの中でコードの囲み(```)が開いていても、`:::`の行でブロックごと閉じる
 * - ブロックの外のコードの中の`:::`は、そのまま
 * - 閉じていなければ、文の終わりで閉じる
 * - 引用(`>`)の中でも使える
 */
export function customBlocks(markdown: string): string {
  const out: string[] = [];
  /** 開いているコードの囲み。inBlockはブロックの中で開いたか */
  let fence: { char: string; size: number; inBlock: boolean } | null = null;
  /** 開いているブロック。prefixは引用の`>` */
  let block: { prefix: string } | null = null;

  const open = (prefix: string, metadata: string) => {
    out.push(
      `${prefix}<div data-type="customblock" data-metadata="${escape(metadata)}">`,
      prefix,
    );
    block = { prefix };
  };
  const close = (prefix: string) => {
    out.push(prefix, `${prefix}</div>`);
    block = null;
  };

  for (const line of markdown.split("\n")) {
    const [, prefix = "", rest = ""] =
      /^((?: {0,3}> ?)*)(.*)$/.exec(line) ?? [];
    const closer = /^:::\s*$/.test(rest);
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(rest);
    const current = block as { prefix: string } | null;

    if (fence) {
      if (fence.inBlock && current && closer && prefix === current.prefix) {
        // コードの囲みも閉じてから、ブロックを閉じる
        out.push(`${prefix}${fence.char.repeat(fence.size)}`);
        fence = null;
        close(prefix);
        continue;
      }
      const run = f?.[1];
      if (
        run?.[0] === fence.char &&
        run.length >= fence.size &&
        /^ {0,3}(`+|~+)\s*$/.test(rest)
      )
        fence = null;
      out.push(line);
      continue;
    }
    if (f?.[1]) {
      fence = {
        char: f[1][0] ?? "`",
        size: f[1].length,
        inBlock: current !== null,
      };
      out.push(line);
      continue;
    }
    if (current) {
      if (closer && prefix === current.prefix) close(prefix);
      else out.push(line);
      continue;
    }
    const start = /^:::(.*)$/.exec(rest);
    if (start) {
      open(prefix, (start[1] ?? "").trim());
      continue;
    }
    out.push(line);
  }
  // 閉じていないブロックは、文の終わりで閉じる
  const last = block as { prefix: string } | null;
  if (last) {
    const unclosed = fence as { char: string; size: number } | null;
    if (unclosed)
      out.push(`${last.prefix}${unclosed.char.repeat(unclosed.size)}`);
    close(last.prefix);
  }
  return out.join("\n");
}

function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
