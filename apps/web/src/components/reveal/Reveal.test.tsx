import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";
import * as s from "./reveal.css";
import { useInView } from "./useInView";

/** IntersectionObserverの代わり。画面に入ったことにする`enter`を持つ。 */
class FakeObserver {
  static last: FakeObserver | undefined;
  readonly observed = new Set<Element>();
  readonly unobserved: Element[] = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeObserver.last = this;
  }

  observe(el: Element) {
    this.observed.add(el);
  }

  unobserve(el: Element) {
    this.observed.delete(el);
    this.unobserved.push(el);
  }

  disconnect() {
    this.observed.clear();
  }

  enter(el: Element) {
    this.callback(
      [{ target: el, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

let reduce = false;

beforeEach(() => {
  reduce = false;
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
  }));
  // 画面の下のほうにあることにする
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 5000,
  } as DOMRect);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("画面の下にあるものは隠しておき、入ったら出して監視をやめる", () => {
    const { getByText } = render(<Reveal kind="left">ねこ</Reveal>);
    const el = getByText("ねこ");
    expect(el.classList).toContain(s.pre);
    expect(el.classList).toContain(s.left);

    const observer = FakeObserver.last;
    expect(observer?.observed.has(el)).toBe(true);
    act(() => {
      observer?.enter(el);
    });
    expect(el.classList).not.toContain(s.pre);
    expect(observer?.observed.has(el)).toBe(false);
    expect(observer?.unobserved).toContain(el);
  });

  it("はじめから見えているものは隠さない", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 10,
    } as DOMRect);
    const { getByText } = render(<Reveal>ねこ</Reveal>);
    expect(getByText("ねこ").classList).not.toContain(s.pre);
  });

  it("動きを減らす設定では隠さない", () => {
    reduce = true;
    const { getByText } = render(<Reveal>ねこ</Reveal>);
    expect(getByText("ねこ").classList).not.toContain(s.pre);
  });

  it("遅れを--rdに入れる", () => {
    const { getByText } = render(<Reveal delay={0.16}>ねこ</Reveal>);
    expect(getByText("ねこ").style.getPropertyValue("--rd")).toBe("0.16s");
  });

  it("asで要素を変えられる", () => {
    const { getByText } = render(
      <ul>
        <Reveal as="li">ねこ</Reveal>
      </ul>,
    );
    expect(getByText("ねこ").tagName).toBe("LI");
  });
});

describe("useInView", () => {
  it("画面に入ったらtrueになり、監視をやめる", () => {
    const el = document.createElement("section");
    // useRefと同じく、描き直しても同じrefを渡す
    const ref = { current: el };
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);

    act(() => {
      FakeObserver.last?.enter(el);
    });
    expect(result.current).toBe(true);
    expect(FakeObserver.last?.observed.has(el)).toBe(false);
  });
});
