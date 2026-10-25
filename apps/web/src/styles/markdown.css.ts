import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/** Markdownのアラート(注意書き)。Stackの見本と同じ見た目 */
globalStyle(".callout", {
  display: "flex",
  gap: "0.8rem",
  alignItems: "flex-start",
  margin: "0 0 1rem",
  padding: "0.85rem 0.95rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
});

globalStyle(".callout-cat", {
  flex: "none",
  marginTop: "0.2rem",
  lineHeight: 0,
  color: vars.color.pxline,
});

globalStyle(".callout b", {
  fontFamily: vars.font.sans,
  fontSize: "0.75rem",
  letterSpacing: "0.04em",
  color: vars.color.mike,
});

globalStyle(".callout p", {
  margin: "0.15rem 0 0",
  fontSize: "0.9375rem",
});

/** リンクカード。Stackの見本と同じ見た目 */
globalStyle(".lcard", {
  display: "grid",
  gap: "0.2rem",
  margin: "0 0 1rem",
  padding: "0.9rem 1rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  textDecoration: "none",
  transition: "border-color 0.25s",
});

globalStyle(".lcard:hover", {
  borderColor: vars.color.mike,
});

globalStyle(".lc-t", {
  fontWeight: 700,
});

globalStyle(".lc-d", {
  fontSize: "0.875rem",
  color: vars.color.muted,
});

globalStyle(".lc-u", {
  fontSize: "0.75rem",
  color: vars.color.muted,
});

/** 画像のあるリンクカード。文字を左、画像を右に置く。スマホの幅では画像を上に */
globalStyle(".lcard-img", {
  gridTemplateColumns: "minmax(0, 1fr) 9rem",
  columnGap: "1rem",
  alignItems: "start",
  "@media": {
    "(max-width: 640px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

globalStyle(".lcard-img > span", {
  gridColumn: 1,
});

globalStyle(".lc-img", {
  gridColumn: 2,
  gridRow: "1 / span 3",
  alignSelf: "start",
  width: "100%",
  height: "auto",
  aspectRatio: "1.91 / 1",
  objectFit: "cover",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  "@media": {
    "(max-width: 640px)": { gridColumn: 1, gridRow: 1 },
  },
});

/** Mermaidの図。図の中のvar(--ink)などに、テーマの色を渡す(Stackの図と同じ) */
globalStyle("figure.mmd", {
  vars: {
    "--paper": vars.color.paper,
    "--ink": vars.color.ink,
    "--muted": vars.color.muted,
    "--line": vars.color.line,
    "--tatami": vars.color.tatami,
    "--mike": vars.color.mike,
    "--mm-note": vars.color.note,
  },
  margin: "0 0 1rem",
  padding: "1.25rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  overflowX: "auto",
});

globalStyle("figure.mmd > svg", {
  display: "block",
  marginInline: "auto",
  maxWidth: "100%",
  height: "auto",
});

/** Markdownの本文の入れ物。見出し・リスト・表・引用の見た目 */
export const md = style({
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

globalStyle(`${md} > :first-child`, { marginTop: 0 });

globalStyle(`${md} h2`, {
  margin: "2.5rem 0 1rem",
  fontSize: "1.125rem",
  fontWeight: 700,
});

globalStyle(`${md} h3`, {
  margin: "1.75rem 0 0.75rem",
  fontSize: "1rem",
  fontWeight: 700,
});

globalStyle(`${md} :is(h2, h3) a`, { textDecoration: "none" });

globalStyle(`${md} p, ${md} ul, ${md} ol, ${md} table`, {
  margin: "0 0 1rem",
});

globalStyle(`${md} :is(ul, ol)`, { paddingLeft: "1.5em" });

globalStyle(`${md} :not(pre) > code`, {
  padding: "0.1em 0.35em",
  fontFamily: vars.font.mono,
  fontSize: "0.875em",
  background: vars.color.tatami,
  borderRadius: vars.radius.sm,
});

globalStyle(`${md} table`, { borderCollapse: "collapse" });

globalStyle(`${md} :is(th, td)`, {
  padding: "0.4rem 0.9rem",
  borderBottom: `1px solid ${vars.color.line}`,
  textAlign: "left",
});

globalStyle(`${md} th`, { borderBottom: `2px solid ${vars.color.ink}` });

globalStyle(`${md} blockquote`, {
  margin: "0 0 1rem",
  paddingLeft: "1rem",
  borderLeft: `3px solid ${vars.color.line}`,
  color: vars.color.muted,
});

/** ブログの記事の埋め込み(YouTube・Xなど)。高さか縦横の比は、要素のstyleで決まる */
globalStyle(".embed", {
  width: "100%",
  maxWidth: "100%",
  margin: "0 0 1rem",
  borderRadius: vars.radius.md,
  overflow: "hidden",
});

globalStyle(".embed > iframe", {
  display: "block",
  width: "100%",
  height: "100%",
  border: 0,
});

/** Xの投稿は、横に広げすぎない */
globalStyle(".embed-tweet", {
  maxWidth: "550px",
});
