import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const sitemap = style({
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: "1.5rem",
  paddingBlock: "1.75rem 2.25rem",
  borderTop: `2px solid ${vars.color.ink}`,
  "@media": {
    "(max-width: 1100px)": {
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    },
    "(max-width: 860px)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
    "(max-width: 640px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
});

export const heading = style({
  gridColumn: "1 / -1",
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  fontWeight: 400,
  color: vars.color.muted,
});

export const smPage = style({
  fontWeight: 700,
  fontSize: "1.125rem",
  letterSpacing: "-0.02em",
  textDecoration: "none",
  selectors: {
    '&[aria-current="page"]': {
      color: vars.color.mike,
    },
    "&:hover": {
      textDecoration: "underline",
      textDecorationColor: vars.color.mike,
      textDecorationThickness: "2px",
      textUnderlineOffset: "5px",
    },
  },
});

export const smList = style({
  listStyle: "none",
  margin: "0.4rem 0 0",
  padding: 0,
  display: "grid",
  gap: "0.15rem",
});

globalStyle(`${smList} a`, {
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
  textDecoration: "none",
});

globalStyle(`${smList} a:hover`, {
  color: vars.color.ink,
});

export const footer = style({
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "0.5rem 1.5rem",
  paddingBlock: "1.25rem 2.5rem",
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const footLink = style({
  color: "inherit",
  textDecorationColor: vars.color.line,
  textUnderlineOffset: "3px",
  selectors: {
    '&:hover, &[aria-current="page"]': {
      color: vars.color.mike,
    },
  },
});

/** 区切りの線の上を、右のほうへ歩いていった足跡。上の中身に重ならないよう、場所を取って置く */
export const trail = style({
  marginLeft: "auto",
  marginRight: "8%",
  maxWidth: "60%",
  height: "auto",
});

/** 遊ぶ猫たち */
export const play = style({
  marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
});
