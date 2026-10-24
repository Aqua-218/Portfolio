import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const year = style({
  selectors: {
    "& + &": { marginTop: "clamp(2.5rem, 5vw, 3.5rem)" },
  },
});

export const yearHeading = style({
  display: "flex",
  alignItems: "baseline",
  flexWrap: "wrap",
  gap: "0.25rem 0.9rem",
  margin: "0 0 0.9rem",
  fontFamily: vars.font.sans,
  fontSize: "1.5rem",
  fontWeight: 700,
  color: vars.color.ink,
  letterSpacing: "-0.02em",
});

globalStyle(`${yearHeading} small`, {
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  fontWeight: 400,
  color: vars.color.muted,
  letterSpacing: 0,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const item = style({
  display: "grid",
  gridTemplateColumns: "5.5rem minmax(0, 1fr)",
  gap: "1rem",
  paddingBlock: "1.35rem 1.5rem",
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
  color: vars.color.mike,
  lineHeight: 1.6,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "1.0625rem",
  lineHeight: 1.6,
});

/** 1件のページへのリンク。見た目は文字のまま、ホバーで下線を出す */
export const titleLink = style({
  textDecoration: "none",
  ":hover": {
    textDecoration: "underline",
    textDecorationColor: vars.color.mike,
    textDecorationThickness: "2px",
    textUnderlineOffset: "5px",
  },
});

export const tag = style({
  marginLeft: "0.6rem",
  verticalAlign: "2px",
});

export const venue = style({
  margin: "0.15rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const body = style({
  marginTop: "0.7rem",
  display: "grid",
  gap: "0.35rem",
});

globalStyle(`${body} p`, {
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  lineHeight: 1.85,
  maxWidth: "38em",
});

export const mini = style({});

globalStyle(`${mini} b`, {
  display: "block",
  fontWeight: 700,
});

globalStyle(`${mini} small`, {
  color: vars.color.muted,
  fontSize: "0.8125rem",
});
