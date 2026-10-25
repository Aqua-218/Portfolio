/**
 * Qiitaの埋め込み(qiita-markdownのEmbedとFilterIframe・FilterScript)を、サイトでも出す。
 *
 * Qiitaは各サービスのスクリプト(Xのwidgets.jsなど)をそのまま動かすが、このサイトでは外のスクリプトを一切動かさない。
 * どの埋め込みも、そのサービスが出している埋め込み用のiframeに組み立て直す。
 * - iframeのもの(YouTube・SlideShare・Googleスライドなど): 出どころがQiitaと同じ許可リストにあるものだけ
 * - スクリプトのもの(X・CodePen・SpeakerDeck・Docswell・asciinema): Qiitaが許すものだけ、iframeにする
 * iframeの属性(sandboxなど)は、書かれたものを使わず、ここで決めたものだけにする
 */
import type { Element, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

/** iframeで埋め込んでよい出どころ(qiita-markdownのFilterIframeと同じ) */
const IFRAME_HOSTS = new Set([
  ...["www.youtube-nocookie.com", "www.youtube.com"],
  "www.slideshare.net",
  "docs.google.com",
  ...["docswell.com", "www.docswell.com"],
  ...["www.figma.com", "embed.figma.com"],
  "drive.google.com",
  "stackblitz.com",
  "blueprintue.com",
  "claude.site",
]);

/** 組み立て直したiframeが読む出どころ。CSPのframe-srcはこの中で、ページで使うものだけ許す */
export const EMBED_ORIGINS = [
  ...[...IFRAME_HOSTS].map((h) => `https://${h}`),
  "https://platform.twitter.com",
  "https://codepen.io",
  "https://speakerdeck.com",
  "https://asciinema.org",
];

/** 埋め込みの種類。data-embedに「種類:鍵」で書き、互換テストでQiitaと突き合わせる */
interface Embed {
  kind: string;
  key: string;
  src: string;
  /** 高さ(px)か、縦横の比(高さ/幅) */
  size: { height: number } | { ratio: number };
}

function url(src: unknown): URL | undefined {
  if (typeof src !== "string") return undefined;
  try {
    // //speakerdeck.com/… のようにスキームのないもの
    const u = new URL(src.startsWith("//") ? `https:${src}` : src);
    return u.protocol === "https:" || u.protocol === "http:" ? u : undefined;
  } catch {
    return undefined;
  }
}

const hasClass = (node: Element, name: string) => {
  const c = node.properties.className;
  return Array.isArray(c) && c.includes(name);
};

function number(value: unknown): number | undefined {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** iframeの埋め込み。出どころが許可リストにあるものだけ */
function fromIframe(node: Element): Embed | undefined {
  const u = url(node.properties.src);
  if (!u || !IFRAME_HOSTS.has(u.host)) return undefined;
  u.protocol = "https:";
  const height = number(node.properties.height);
  const width = number(node.properties.width);
  return {
    kind: "iframe",
    key: String(node.properties.src),
    src: u.href,
    size:
      width && height
        ? { ratio: height / width }
        : height
          ? { height }
          : { ratio: 9 / 16 },
  };
}

/** Xの投稿(blockquote.twitter-tweet)。中の投稿へのリンクからidを取る */
function fromTweet(node: Element): Embed | undefined {
  let id: string | undefined;
  visit(node, "element", (a: Element) => {
    if (a.tagName !== "a") return;
    const u = url(a.properties.href);
    const m =
      u && /^(?:www\.|mobile\.)?(?:twitter|x)\.com$/.test(u.host)
        ? /^\/[\w]+\/status(?:es)?\/(\d+)/.exec(u.pathname)
        : null;
    if (m?.[1]) id = m[1];
  });
  if (!id) return undefined;
  return {
    kind: "tweet",
    key: id,
    src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true`,
    // 高さは、読み込んだあとにiframeから知らせてくる(サイトのEmbedsが合わせる)
    size: { height: 300 },
  };
}

/** CodePen(p.codepen) */
function fromCodePen(node: Element): Embed | undefined {
  const user = String(node.properties.dataUser ?? "");
  const slug = String(node.properties.dataSlugHash ?? "");
  if (!/^[\w-]+$/.test(user) || !/^[\w-]+$/.test(slug)) return undefined;
  const tab = String(node.properties.dataDefaultTab ?? "result");
  const query = /^[\w,]+$/.test(tab) ? `?default-tab=${tab}` : "";
  return {
    kind: "codepen",
    key: `${user}/${slug}`,
    src: `https://codepen.io/${user}/embed/${slug}${query}`,
    size: { height: number(node.properties.dataHeight) ?? 300 },
  };
}

/** スクリプトの埋め込み(SpeakerDeck・Docswell・asciinema)。Qiitaが許すスクリプトのものだけ */
function fromScript(node: Element): Embed | undefined {
  const u = url(node.properties.src);
  if (!u) return undefined;
  if (u.host === "speakerdeck.com" && u.pathname === "/assets/embed.js") {
    const id = String(node.properties.dataId ?? "");
    if (!/^[0-9a-f]+$/.test(id)) return undefined;
    const ratio = number(node.properties.dataRatio) ?? 16 / 9;
    return {
      kind: "speakerdeck",
      key: id,
      src: `https://speakerdeck.com/player/${id}`,
      size: { ratio: 1 / ratio },
    };
  }
  if (
    u.host === "www.docswell.com" &&
    u.pathname === "/assets/libs/docswell-embed/docswell-embed.min.js"
  ) {
    const target = url(node.properties.dataSrc);
    if (!target || !IFRAME_HOSTS.has(target.host)) return undefined;
    target.protocol = "https:";
    return {
      kind: "docswell",
      key: String(node.properties.dataSrc),
      src: target.href,
      size: { ratio: number(node.properties.dataAspect) ?? 9 / 16 },
    };
  }
  if (u.host === "asciinema.org") {
    const id = /^\/a\/([\w-]+)\.js$/.exec(u.pathname)?.[1];
    if (!id) return undefined;
    return {
      kind: "asciinema",
      key: id,
      src: `https://asciinema.org/a/${id}/iframe`,
      size: { ratio: 9 / 16 },
    };
  }
  return undefined;
}

/** 組み立て直したiframe。外のページの中身は、このページを動かしたり、上の画面を移したりできない */
function frame(embed: Embed): Element {
  const style =
    "ratio" in embed.size
      ? `aspect-ratio: 1 / ${String(Math.round(embed.size.ratio * 10000) / 10000)}`
      : `height: ${String(Math.round(embed.size.height))}px`;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["embed", `embed-${embed.kind}`], style },
    children: [
      {
        type: "element",
        tagName: "iframe",
        properties: {
          src: embed.src,
          title: "埋め込み",
          loading: "lazy",
          // サイトはリファラーを送らないが、YouTubeなどは送らないと再生しない
          referrerPolicy: "strict-origin-when-cross-origin",
          allow:
            "fullscreen; picture-in-picture; encrypted-media; clipboard-write",
          allowFullScreen: true,
          sandbox: [
            "allow-scripts",
            "allow-same-origin",
            "allow-popups",
            "allow-popups-to-escape-sandbox",
            "allow-presentation",
          ],
          dataEmbed: `${embed.kind}:${embed.key}`,
        },
        children: [],
      },
    ],
  };
}

/**
 * 埋め込みをiframeにする。わからないiframeとscriptは消す。
 * 消毒(sanitize.ts)のすぐあとに走らせる。ここで作ったもののほかに、iframeとscriptは残らない
 */
export function rehypeQiitaEmbeds() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index === undefined) return;
      let embed: Embed | undefined;
      let known = false;
      if (node.tagName === "iframe") {
        known = true;
        embed = fromIframe(node);
      } else if (node.tagName === "script") {
        known = true;
        embed = fromScript(node);
      } else if (
        node.tagName === "blockquote" &&
        hasClass(node, "twitter-tweet")
      ) {
        embed = fromTweet(node);
      } else if (node.tagName === "p" && hasClass(node, "codepen")) {
        embed = fromCodePen(node);
      }
      if (embed) {
        parent.children[index] = frame(embed);
        return SKIP;
      }
      if (known) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return undefined;
    });
    // 念のため、ここで作っていないiframeとscriptが残っていれば消す
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index === undefined) return;
      const ours =
        node.tagName === "iframe" && node.properties.dataEmbed !== undefined;
      if ((node.tagName === "iframe" || node.tagName === "script") && !ours) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return undefined;
    });
  };
}
