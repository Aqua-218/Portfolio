import { describe, expect, it } from "vitest";
import { toc } from "./toc";

describe("toc", () => {
  it("idのあるh1〜h3を、文字だけにして拾う", () => {
    expect(
      toc(
        '<h1 id="a"><a class="heading-anchor" href="#a"></a>はじめに</h1><h2 id="b"><code>x</code> &amp; &lt;y&gt;</h2><h3>idなし</h3><h4 id="d">深い</h4>',
      ),
    ).toEqual([
      { id: "a", level: 1, text: "はじめに" },
      { id: "b", level: 2, text: "x & <y>" },
    ]);
  });
});
