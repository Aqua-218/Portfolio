import { describe, expect, it } from "vitest";
import { boxSize } from "./index";
import { renderSync } from "./node";

describe("renderSync", () => {
  it("待たずにSVGを返し、大きさはboxSizeと同じ", () => {
    const frames = ["sitA", "sitB"] as const;
    const out = renderSync(frames, "kuro", 6);
    const { width, height } = boxSize(frames, 6);
    expect(out).toMatch(/^<svg/);
    expect(out).toContain(`width="${String(width)}"`);
    expect(out).toContain(`height="${String(height)}"`);
  });
});
