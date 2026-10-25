/** 行ごとの違い。公開する前に、何が変わるかを見せるのに使う */
export interface Line {
  kind: "same" | "add" | "remove";
  text: string;
}

/** 2つの文字の、行ごとの違い(最長共通部分列)。content/のファイルは小さいので、素直に表を作る */
export function diffLines(before: string, after: string): Line[] {
  const a = before.split("\n");
  const b = after.split("\n");
  // lcs[i][j]: a[i..]とb[j..]の最長共通部分列の長さ
  const lcs = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = lcs[i] ?? [];
      row[j] =
        a[i] === b[j]
          ? (lcs[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(lcs[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  const out: Line[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] ?? "" });
      i++;
      j++;
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) {
      out.push({ kind: "remove", text: a[i] ?? "" });
      i++;
    } else {
      out.push({ kind: "add", text: b[j] ?? "" });
      j++;
    }
  }
  for (; i < a.length; i++) out.push({ kind: "remove", text: a[i] ?? "" });
  for (; j < b.length; j++) out.push({ kind: "add", text: b[j] ?? "" });
  return out;
}

/** 変わった行と、その前後の行だけ残す。離れたところは「…」(null)でつなぐ */
export function around(lines: readonly Line[], context = 2): (Line | null)[] {
  const keep = lines.map((l, i) =>
    lines
      .slice(Math.max(0, i - context), i + context + 1)
      .some((x) => x.kind !== "same"),
  );
  const out: (Line | null)[] = [];
  lines.forEach((l, i) => {
    if (keep[i]) out.push(l);
    else if (out.at(-1) !== null && out.length > 0) out.push(null);
  });
  while (out.at(-1) === null) out.pop();
  return out;
}
