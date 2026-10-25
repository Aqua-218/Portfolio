import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardImages } from "./CardImages";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

/** リンクカード。loadedなら、読み終わって幅のある画像にする */
function card(loaded = true): { a: HTMLAnchorElement; img: HTMLImageElement } {
  const a = document.createElement("a");
  a.className = "lcard lcard-img";
  const img = document.createElement("img");
  img.className = "lc-img";
  if (loaded) Object.defineProperty(img, "naturalWidth", { value: 600 });
  a.append(img);
  document.body.append(a);
  return { a, img };
}

describe("CardImages", () => {
  it("あとで読めなかった画像を外し、画像なしのカードにする", () => {
    const { a, img } = card();
    render(<CardImages />);
    img.dispatchEvent(new Event("error"));
    expect(a.querySelector("img")).toBeNull();
    expect(a.classList).not.toContain("lcard-img");
  });

  it("読み込んだ時点ですでに失敗していた画像も外す", () => {
    const { a } = card(false);
    render(<CardImages />);
    expect(a.querySelector("img")).toBeNull();
  });

  it("読めた画像はそのまま", () => {
    const { a } = card();
    render(<CardImages />);
    expect(a.querySelector("img")).not.toBeNull();
    expect(a.classList).toContain("lcard-img");
  });

  it("ほかの画像の失敗では何もしない", () => {
    const other = document.createElement("img");
    document.body.append(other);
    render(<CardImages />);
    other.dispatchEvent(new Event("error"));
    expect(other.isConnected).toBe(true);
  });
});
