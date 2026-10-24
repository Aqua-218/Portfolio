import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as m from "./machine";

// テストはapps/webで走る
const dir = path.join(process.cwd(), "../../specs/traces");

interface Step {
  action: string;
  state: m.CurtainState<number>;
}

/** TLCの値。文字列・真偽・数だけ読む(pcは使わない) */
function value(text: string): unknown {
  if (text.startsWith('"')) return JSON.parse(text);
  if (text === "TRUE") return true;
  if (text === "FALSE") return false;
  return Number(text);
}

/** specs/tlc.shが書き出した実行例を、状態の並びにする */
function parse(text: string): Step[] {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const [head = "", ...lines] = block.split("\n");
      const action = /<(\w+)/.exec(head)?.[1] ?? "";
      const vars = Object.fromEntries(
        lines.flatMap((line) => {
          const found = /^\/\\ (\w+) = (.*)$/.exec(line);
          return found?.[1] && found[2] && found[1] !== "pc"
            ? [[found[1], value(found[2])]]
            : [];
        }),
      );
      return { action, state: vars as unknown as m.CurtainState<number> };
    });
}

/** 1つの動きを実装の関数で進める。行き先は、TLCの次の状態のページから取る */
function apply(
  s: m.CurtainState<number>,
  action: string,
  next: m.CurtainState<number>,
): m.CurtainState<number> {
  switch (action) {
    case "Press":
      return m.press(s, next.page).state;
    case "Close":
      return m.close(s);
    case "Covered":
      return m.cover(s);
    case "Navigate":
      return m.navigate(s, next.page);
    case "Open":
      return m.open(s);
    case "Opened":
      return m.opened(s);
    case "CatGone":
      return m.catGone(s);
    case "Run":
      // 黒猫が走りだすのを待っているだけで、状態は変わらない
      return s;
    default:
      throw new Error(`知らない動き: ${action}`);
  }
}

const traces = readdirSync(dir).filter((f) => f.endsWith(".txt"));

describe("TLCの実行例を幕の実装で再生する", () => {
  it("実行例がある", () => {
    expect(traces.length).toBeGreaterThan(0);
  });

  it.each(traces)("%s", (file) => {
    const steps = parse(readFileSync(path.join(dir, file), "utf8"));
    const [first, ...rest] = steps;
    if (!first) throw new Error("空の実行例");
    let s = m.initial(first.state.page);
    expect(s).toEqual(first.state);
    for (const step of rest) {
      s = apply(s, step.action, step.state);
      expect(s, step.action).toEqual(step.state);
    }
  });
});

describe("幕の状態", () => {
  it("幕が動いている間に押すと、幕を出さずにそのまま移る", () => {
    const first = m.press(m.initial("/"), "/about");
    expect(first.curtain).toBe(true);
    const second = m.press(first.state, "/work");
    expect(second.curtain).toBe(false);
    expect(second.state.page).toBe("/work");
  });

  it("黒猫が走っている間は、幕を止めない", () => {
    const s = m.open(m.close(m.press(m.initial("/"), "/about").state));
    expect(() => m.opened(s)).toThrow();
  });
});
