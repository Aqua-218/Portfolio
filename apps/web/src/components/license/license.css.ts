import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const foot = style({
  margin: "0.75rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

/** ライセンスの名前。原文があれば、原文のページへのリンク */
export const textLink = style({
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  ":hover": { color: vars.color.mikeText },
});

export const textTitle = style({
  margin: "0 0 0.5rem",
  fontSize: "1.25rem",
  fontWeight: 700,
});

export const users = style({
  margin: "0 0 1.5rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
});

/** 原文。元の改行のまま、はみ出す行は折り返す */
export const text = style({
  margin: "0 0 2rem",
  padding: "1.25rem",
  maxHeight: "none",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

// ---- コードが使っているライブラリ ----

export const libs = style({
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

export const libsSummary = style({
  cursor: "pointer",
  padding: "0.6rem 0",
  color: vars.color.muted,
  ":hover": { color: vars.color.ink },
});

/** 名前・版・ライセンスの行。広い画面では2列 */
export const libList = style({
  listStyle: "none",
  margin: "0.5rem 0 0",
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))",
  columnGap: "2rem",
});

globalStyle(`${libList} li`, {
  display: "flex",
  alignItems: "baseline",
  gap: "0.5rem",
  minWidth: 0,
  padding: "0.45rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
});

export const libName = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: vars.color.ink,
  ":hover": { color: vars.color.mikeText },
});

export const libVersion = style({
  flex: 1,
  color: vars.color.muted,
  fontFamily: vars.font.mono,
  fontSize: "0.75rem",
});
