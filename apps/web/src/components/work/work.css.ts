import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const companies = style({
  display: "grid",
  gap: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const company = style({
  paddingBlock: "1.5rem 1.75rem",
  borderBottom: `1px solid ${vars.color.line}`,
});

globalStyle(`${company} p`, {
  margin: "0.75rem 0 0",
  fontFamily: vars.font.jp,
  maxWidth: "36em",
  textWrap: "pretty",
});

globalStyle(`${company} q`, {
  display: "block",
  marginTop: "0.75rem",
  fontFamily: vars.font.jp,
  fontWeight: 700,
  quotes: '"「" "」"',
});

export const meta = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.5rem 1.5rem",
  margin: "1.1rem 0 0",
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

globalStyle(`${meta} dt`, {
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

globalStyle(`${meta} dd`, {
  margin: "0.1rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
  overflowWrap: "anywhere",
});

globalStyle(`${meta} a`, {
  textDecorationColor: vars.color.mike,
  textUnderlineOffset: "3px",
});
