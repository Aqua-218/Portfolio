import { statSync } from "node:fs";
import { expect, it } from "vitest";

// テストはpackages/pxcatで走る。先にpnpm buildしておく
it("ドット猫のWasmは32KBまで", () => {
  // サイズ優先のビルド(Cargo.tomlのprofile.wasm)で30.5KB。大きくなったら、何が増えたかを見る。
  // 遊ぶ猫のコマ8つ(1つ20×12バイト)と毛色2つで、28KBから増えた(#274)
  const { size } = statSync("dist/pxcat_wasm_bg.wasm");
  expect(size).toBeLessThanOrEqual(32_000);
});
