/**
 * イベントのMarkdownの先頭(---で囲んだYAML)を読み書きする。
 * 書けるのはcontent/events/*.mdで使う項目だけ。正しいかどうかはcontentの検証(Wasm)で確かめる
 */

export interface EventMeta {
  title: string;
  date: string;
  end: string;
  venue: string;
  tags: string[];
}

export interface EventDoc {
  meta: EventMeta;
  body: string;
}

/** YAMLの1つの値。引用符で囲んであれば外す */
function scalar(raw: string): string {
  const v = raw.trim();
  if (
    v.length >= 2 &&
    (v.startsWith('"') || v.startsWith("'")) &&
    v.endsWith(v[0] ?? "")
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/** [a, b]の形の配列 */
function list(raw: string): string[] {
  const v = raw.trim();
  if (!v.startsWith("[") || !v.endsWith("]"))
    return v === "" ? [] : [scalar(v)];
  // 引用符の中の「,」では区切らない
  const items: string[] = [];
  let cur = "";
  let quoteChar = "";
  for (const ch of v.slice(1, -1)) {
    if (quoteChar !== "") {
      if (ch === quoteChar) quoteChar = "";
      cur += ch;
    } else if (ch === '"' || ch === "'") {
      quoteChar = ch;
      cur += ch;
    } else if (ch === ",") {
      items.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  items.push(cur);
  return items.map((x) => scalar(x)).filter((x) => x !== "");
}

/** 読めなければnull。そのときは、そのままの文字で編集する */
export function parse(src: string): EventDoc | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (m === null) return null;
  const [, head = "", body = ""] = m;
  const meta: EventMeta = { title: "", date: "", end: "", venue: "", tags: [] };
  for (const line of head.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    const i = line.indexOf(":");
    if (i < 0) return null;
    const key = line.slice(0, i).trim();
    const raw = line.slice(i + 1);
    if (key === "tags") meta.tags = list(raw);
    else if (
      key === "title" ||
      key === "date" ||
      key === "end" ||
      key === "venue"
    )
      meta[key] = scalar(raw);
    // 知らない項目があれば、フォームでは扱わない
    else return null;
  }
  return { meta, body: body.replace(/^\r?\n/, "") };
}

/** YAMLで特別な意味を持つ文字が入っていれば、引用符で囲む */
function quote(v: string): string {
  const special =
    // 先頭が記号、途中に「: 」「 #」やカンマ・括弧、前後の空白、空
    /^[\s'"#&*!|>%@`[\]{},-]|: | #|[,[\]{}]|\s$|^$/.test(v) ||
    // 真偽や数、日付として読まれてしまうもの
    /^(true|false|null|yes|no|on|off|~|[\d.:-]+)$/i.test(v);
  return special ? JSON.stringify(v) : v;
}

/** 元の形(title・date・end・venue・tagsの順)に書く。空の項目(end・tags)は書かない */
export function serialize(doc: EventDoc): string {
  const m = doc.meta;
  const lines = [
    `title: ${quote(m.title)}`,
    `date: ${m.date}`,
    ...(m.end === "" ? [] : [`end: ${m.end}`]),
    `venue: ${quote(m.venue)}`,
    ...(m.tags.length === 0 ? [] : [`tags: [${m.tags.map(quote).join(", ")}]`]),
  ];
  return `---\n${lines.join("\n")}\n---\n\n${doc.body.replace(/\s*$/, "")}\n`;
}
