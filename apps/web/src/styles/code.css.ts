import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/**
 * Markdownのコード(Shikiの猫のテーマ)。色は--shiki-*の変数で来るので、テーマの色に結ぶ。
 * キーワードは三毛、関数は墨、型や文字列は葉、コメントは薄墨(Stackの見本と同じ)。
 */
globalStyle("pre.shiki", {
  vars: {
    "--shiki-foreground": vars.color.ink,
    "--shiki-background": vars.color.tatami,
    "--shiki-token-keyword": vars.color.mike,
    "--shiki-token-function": vars.color.ink,
    "--shiki-token-constant": vars.color.leaf,
    "--shiki-token-type": vars.color.leaf,
    "--shiki-token-string": vars.color.leaf,
    "--shiki-token-string-expression": vars.color.leaf,
    "--shiki-token-comment": vars.color.muted,
    "--shiki-token-parameter": vars.color.ink,
    "--shiki-token-punctuation": vars.color.ink,
    "--shiki-token-link": vars.color.mike,
    // 差分の足した行と消した行の文字。行の背景に色をつけるので、文字は墨のまま
    "--shiki-token-inserted": vars.color.ink,
    "--shiki-token-deleted": vars.color.ink,
  },
  margin: "0 0 1rem",
  padding: "1rem 1.15rem",
  borderRadius: vars.radius.lg,
  overflowX: "auto",
  fontSize: "0.8125rem",
  lineHeight: 1.75,
});

globalStyle("pre.shiki code", {
  fontFamily: vars.font.mono,
  whiteSpace: "pre",
});

/** ブログの記事の差分(```diff_rubyなど)の、足した行と消した行 */
globalStyle("pre.shiki .line.diff-add", {
  display: "inline-block",
  minWidth: "100%",
  background: `color-mix(in srgb, ${vars.color.leaf} 18%, transparent)`,
});

globalStyle("pre.shiki .line.diff-del", {
  display: "inline-block",
  minWidth: "100%",
  background: `color-mix(in srgb, ${vars.color.mike} 18%, transparent)`,
});
