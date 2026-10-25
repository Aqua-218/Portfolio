import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const form = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.9rem",
});

export const row = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1rem",
});

export const button = style({
  padding: "0.6rem 1.1rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
  cursor: "pointer",
  ":hover": { borderColor: vars.color.mike, color: vars.color.mike },
});

export const remember = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
});

export const note = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const error = style({
  margin: 0,
  padding: "0.7rem 0.9rem",
  background: vars.color.tatami,
  borderLeft: `3px solid ${vars.color.mike}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const contents = style({
  display: "grid",
  gap: "1.5rem",
  marginTop: "2rem",
});

export const search = style({
  width: "100%",
  maxWidth: "24rem",
  padding: "0.55rem 0.8rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  ":focus": { outline: `2px solid ${vars.color.mike}`, outlineOffset: "1px" },
});

export const groupTitle = style({
  display: "flex",
  alignItems: "baseline",
  gap: "0.5rem",
  margin: "0 0 0.6rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
});

export const count = style({
  fontSize: "0.75rem",
  fontWeight: 400,
  color: vars.color.muted,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `1px solid ${vars.color.line}`,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

globalStyle(`${list} li`, {
  padding: "0.5rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
  overflowWrap: "anywhere",
});
