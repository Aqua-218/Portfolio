import { style } from "@vanilla-extract/css";
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
