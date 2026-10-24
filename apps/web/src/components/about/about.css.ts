import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const facts = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0 1.5rem",
  margin: 0,
});

export const fact = style({
  paddingBlock: "0.95rem 1.05rem",
  borderTop: `1px solid ${vars.color.line}`,
  minWidth: 0,
});

export const wide = style({
  gridColumn: "span 2",
});

globalStyle(`${fact} dt`, {
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

globalStyle(`${fact} dd`, {
  margin: "0.15rem 0 0",
  fontWeight: 700,
  fontSize: "1.0625rem",
  lineHeight: 1.5,
});

globalStyle(`${fact} dd span`, {
  fontWeight: 400,
  color: vars.color.muted,
  fontSize: "0.875rem",
  marginLeft: "0.5rem",
});

export const timeline = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const item = style({
  display: "grid",
  gridTemplateColumns: "4.5rem minmax(0, 1fr)",
  gap: "1rem",
  paddingBlock: "0.95rem",
  borderBottom: `1px solid ${vars.color.line}`,
  fontFamily: vars.font.jp,
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "4.25rem minmax(0, 1fr)",
      gap: "0.75rem",
    },
  },
});

globalStyle(`${item} time`, {
  whiteSpace: "nowrap",
  fontFamily: vars.font.sans,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: vars.color.mike,
});

globalStyle(`${item} b`, {
  display: "block",
  fontWeight: 700,
});

globalStyle(`${item} small`, {
  color: vars.color.muted,
  fontSize: "0.8125rem",
});
