import { statSync } from "node:fs";
import { expect, it } from "vitest";

// テストはpackages/content-wasmで走る。先にpnpm buildしておく
it("検証のWasmは1.2MBまで", () => {
  // サイズ優先のビルド(Cargo.tomlのprofile.wasm)で1.09MB。管理画面でだけ読む
  const { size } = statSync("dist/content_wasm_bg.wasm");
  expect(size).toBeLessThanOrEqual(1_200_000);
});
