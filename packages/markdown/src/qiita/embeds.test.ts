import { describe, expect, it } from "vitest";
import { render } from "../index";

const qiita = (md: string) => render(md, { flavor: "qiita" });
/** 出てきたiframeのsrc */
const frames = (html: string) =>
  [...html.matchAll(/<iframe[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);

describe("Qiitaの埋め込み", () => {
  it("YouTubeは、書かれた属性を使わず、決めたsandboxなどをつけたiframeにする", async () => {
    const html = await qiita(
      '<iframe src="https://www.youtube.com/embed/abc" sandbox="allow-top-navigation" allow="camera" srcdoc="<script>alert(1)</script>" onload="alert(1)" width="560" height="315"></iframe>',
    );
    expect(frames(html)).toEqual(["https://www.youtube.com/embed/abc"]);
    expect(html).toContain(
      'sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"',
    );
    expect(html).not.toMatch(/allow-top-navigation|camera|srcdoc|onload/);
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(html).toContain("aspect-ratio: 1 / 0.5625");
  });

  it("Xの投稿は、スクリプトを動かさず、Xの埋め込み用のiframeにする", async () => {
    const html = await qiita(
      '<blockquote class="twitter-tweet"><p>猫</p><a href="https://x.com/Qiita/status/123">日付</a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>',
    );
    expect(frames(html)).toEqual([
      "https://platform.twitter.com/embed/Tweet.html?id=123&#x26;dnt=true",
    ]);
    expect(html).not.toContain("<script");
  });

  it.each([
    ["許可リストにないiframe", '<iframe src="https://evil.example/"></iframe>'],
    ["javascript:のiframe", '<iframe src="javascript:alert(1)"></iframe>'],
    [
      "ホストを似せたiframe",
      '<iframe src="https://www.youtube.com.evil.example/x"></iframe>',
    ],
    [
      "許可リストにないscript",
      '<script src="https://evil.example/x.js"></script>',
    ],
    [
      "Docswellのふりをして、ほかを読ませる",
      '<script class="docswell-embed" src="https://www.docswell.com/assets/libs/docswell-embed/docswell-embed.min.js" data-src="https://evil.example/"></script>',
    ],
    [
      "SpeakerDeckのidに別のものを入れる",
      '<script class="speakerdeck-embed" data-id="../../evil" src="//speakerdeck.com/assets/embed.js"></script>',
    ],
    [
      "CodePenのユーザーに別のものを入れる",
      '<p class="codepen" data-user="a/../../evil" data-slug-hash="x"></p>',
    ],
    [
      "Xのふりをしたほかのサイトへのリンク",
      '<blockquote class="twitter-tweet"><a href="https://evil.example/Qiita/status/1">x</a></blockquote>',
    ],
  ])("%sは出さない", async (_name, md) => {
    const html = await qiita(md);
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<script");
  });

  it("スクリプトの埋め込みも、それぞれのiframeにする", async () => {
    const html = await qiita(
      [
        '<p class="codepen" data-height="400" data-user="qiita" data-slug-hash="abc"></p>',
        '<script class="speakerdeck-embed" data-id="0123abcd" data-ratio="1.333" src="//speakerdeck.com/assets/embed.js"></script>',
        '<script src="https://asciinema.org/a/113463.js" id="asciicast-113463" async></script>',
      ].join("\n\n"),
    );
    expect(frames(html)).toEqual([
      "https://codepen.io/qiita/embed/abc?default-tab=result",
      "https://speakerdeck.com/player/0123abcd",
      "https://asciinema.org/a/113463/iframe",
    ]);
    expect(html).toContain("height: 400px");
  });
});
