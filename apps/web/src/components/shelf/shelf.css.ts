import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const block = style({
  selectors: {
    "& + &": { marginTop: "2.5rem" },
  },
});

export const heading = style({
  display: "flex",
  alignItems: "baseline",
  gap: "0.6rem",
  margin: "0 0 0.9rem",
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
  color: vars.color.ink,
});

globalStyle(`${heading} small`, {
  fontWeight: 400,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const works = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "1.75rem",
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export const work = style({
  paddingBlock: "0.8rem",
  borderBottom: `1px solid ${vars.color.line}`,
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "1rem",
  lineHeight: 1.5,
  minWidth: 0,
  overflowWrap: "anywhere",
});

export const grr = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0 0.4em",
  margin: "2rem 0 0",
  fontFamily: vars.font.jp,
});

globalStyle(`${grr} p`, {
  margin: 0,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const shout = style({
  fontWeight: 700,
});
