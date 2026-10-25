import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

/** 記事の一覧。イベントの一覧と同じ並び */
export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const item = style({
  display: "grid",
  gridTemplateColumns: "6.5rem minmax(0, 1fr)",
  gap: "1rem",
  paddingBlock: "1.2rem 1.35rem",
  borderBottom: `1px solid ${vars.color.line}`,
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: "0.2rem",
    },
  },
});

globalStyle(`${item} time`, {
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: vars.color.mikeText,
  lineHeight: 1.6,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "1.0625rem",
  lineHeight: 1.6,
});

export const titleLink = style({
  textDecoration: "none",
  ":hover": {
    textDecoration: "underline",
    textDecorationColor: vars.color.mike,
    textDecorationThickness: "2px",
    textUnderlineOffset: "5px",
  },
});

/** タグの並び */
export const tags = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  margin: "0.5rem 0 0",
  padding: 0,
  listStyle: "none",
});

export const tag = style({
  display: "inline-block",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1,
  background: vars.color.tatami,
  padding: "0.45rem 0.65rem",
  borderRadius: vars.radius.md,
  textDecoration: "none",
  whiteSpace: "nowrap",
  ":hover": { color: vars.color.mikeText },
  selectors: {
    '&[aria-current="page"]': {
      background: vars.color.ink,
      color: vars.color.paper,
    },
  },
});

/** 記事がまだないとき */
export const empty = style({
  margin: 0,
  paddingBlock: "1.35rem",
  borderTop: `2px solid ${vars.color.ink}`,
  fontFamily: vars.font.jp,
  color: vars.color.muted,
});

/** 記事のページ。本文の横に目次 */
export const article = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 13rem",
  gap: "2.5rem",
  alignItems: "start",
  "@media": {
    "(max-width: 960px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const head = style({
  margin: "0 0 2rem",
  paddingBottom: "1.25rem",
  borderBottom: `2px solid ${vars.color.ink}`,
});

export const postTitle = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
  fontWeight: 800,
  lineHeight: 1.45,
  letterSpacing: "-0.01em",
});

export const meta = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.3rem 1rem",
  margin: "0.75rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const qiita = style({
  color: vars.color.ink,
  fontWeight: 700,
  textDecoration: "underline",
  textDecorationColor: vars.color.mike,
  textDecorationThickness: "2px",
  textUnderlineOffset: "4px",
  ":hover": { color: vars.color.mikeText },
});

/** 目次。広い画面では本文の横についてくる */
export const toc = style({
  position: "sticky",
  top: "1.5rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  "@media": {
    "(max-width: 960px)": { display: "none" },
  },
});

/** 狭い画面の目次(たたんで置く) */
export const tocFold = style({
  display: "none",
  marginTop: "1rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  "@media": {
    "(max-width: 960px)": { display: "block" },
  },
});

globalStyle(`${tocFold} summary`, {
  cursor: "pointer",
  fontWeight: 700,
  marginBottom: "0.5rem",
});

export const tocTitle = style({
  margin: "0 0 0.5rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: vars.color.muted,
});

export const tocList = style({
  listStyle: "none",
  margin: 0,
  padding: "0 0 0 0.75rem",
  borderLeft: `2px solid ${vars.color.line}`,
  display: "grid",
  gap: "0.35rem",
});

export const tocSub = style({ paddingLeft: "0.9rem" });

export const tocSub2 = style({ paddingLeft: "1.8rem" });

globalStyle(`${tocList} a`, {
  textDecoration: "none",
  lineHeight: 1.5,
});

globalStyle(`${tocList} a:hover`, { color: vars.color.mikeText });

/** タグで絞り込んでいるとき */
export const filter = style({
  margin: "1.25rem 0 0.75rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
});
