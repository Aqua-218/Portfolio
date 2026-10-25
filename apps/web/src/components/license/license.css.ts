import { style } from "@vanilla-extract/css";
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
  ":hover": { color: vars.color.mike },
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
