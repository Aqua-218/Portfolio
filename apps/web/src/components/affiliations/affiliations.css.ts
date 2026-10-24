import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const groups = style({
  display: "grid",
  gap: "2.75rem",
  // モックでは右の列が写真の列の高さまで伸び、まとまりの間も均等に広がる
  height: "100%",
});

export const name = style({
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "1.125rem",
  lineHeight: 1.5,
  minWidth: 0,
});

export const link = style({
  color: "inherit",
  textDecoration: "underline",
  textDecorationColor: vars.color.line,
  textDecorationThickness: "2px",
  textUnderlineOffset: "6px",
  transition: "text-decoration-color 0.25s",
  ":hover": {
    textDecorationColor: vars.color.mike,
  },
});

/** Homeの行は少し詰める */
export const homeRow = style({
  paddingBlock: "0.9rem",
});

export const orgList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const org = style({
  paddingBlock: "1.1rem 1.2rem",
  borderBottom: `1px solid ${vars.color.line}`,
});

export const orgTop = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
});

globalStyle(`${org} p`, {
  margin: "0.45rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  color: vars.color.muted,
  maxWidth: "36em",
});
