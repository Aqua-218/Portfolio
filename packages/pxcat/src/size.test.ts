import { statSync } from "node:fs";
import { expect, it } from "vitest";

// テストはpackages/pxcatで走る。先にpnpm buildしておく
it("ドット猫のWasmは30KBまで", () => {
  // サイズ優先のビルド(Cargo.tomlのprofile.wasm)で28KB。大きくなったら、何が増えたかを見る
  const { size } = statSync("dist/pxcat_wasm_bg.wasm");
  expect(size).toBeLessThanOrEqual(30_000);
});
