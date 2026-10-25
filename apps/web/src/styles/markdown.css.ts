import { globalStyle } from "@vanilla-extract/css";
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
