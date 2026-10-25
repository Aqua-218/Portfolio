import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const spring = "cubic-bezier(0.3, 1.6, 0.5, 1)";

export const sec = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 4fr) minmax(0, 8fr)",
  gap: "2rem clamp(2rem, 5vw, 4rem)",
  paddingBlock: "clamp(3rem, 7vw, 5rem)",
  borderTop: `1px solid ${vars.color.line}`,
  "@media": {
    "(max-width: 860px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

/** 各ページのいちばん上のセクション。上に線を引かず、少し下げる */
export const page = style({
  borderTop: 0,
  marginTop: "clamp(0.5rem, 2vw, 1.5rem)",
});

/** Homeの抜粋。モックではセクションの上に線を引かない */
export const home = style({
  borderTop: 0,
});

/** 画面に入った。見出しの下線を伸ばす */
export const inView = style({});

export const title = style({
  "@media": {
    "(max-width: 860px)": {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 7.5rem",
      gap: "1rem",
      alignItems: "start",
    },
  },
});

export const heading = style({
  margin: 0,
  fontSize: "clamp(1.375rem, 2vw, 1.625rem)",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  "::after": {
    content: '""',
    display: "block",
    width: 0,
    height: "3px",
    marginTop: "0.6rem",
    background: vars.color.mike,
    borderRadius: vars.radius.sm,
  },
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      selectors: {
        "&::after": {
          transition: "width 0.8s 0.15s cubic-bezier(0.2, 0.7, 0.2, 1)",
        },
      },
    },
  },
  selectors: {
    [`${inView} &::after`]: {
      width: "1.75rem",
    },
  },
});

export const subtitle = style({
  margin: "0.5rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const more = style({
  display: "inline-block",
  marginTop: "1rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  fontWeight: 700,
  textDecoration: "underline",
  textDecorationColor: vars.color.mike,
  textDecorationThickness: "2px",
  textUnderlineOffset: "5px",
  ":hover": {
    color: vars.color.mikeText,
  },
});

export const cat = style({
  margin: "1.75rem 0 0",
  aspectRatio: "3 / 4",
  maxWidth: "17rem",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.tatami,
  ":hover": {
    rotate: "-2.5deg",
    translate: "0 -4px",
  },
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      transition: `rotate 0.5s ${spring}, translate 0.5s ${spring}`,
    },
    "(max-width: 860px)": {
      margin: 0,
      gridColumn: 2,
      gridRow: "1 / span 2",
      width: "100%",
    },
  },
});

globalStyle(`${cat} img`, {
  transition: "scale 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)",
});

globalStyle(`${cat}:hover img`, {
  scale: "1.07",
});

globalStyle(`${cat} img[src*="kijishiro-tatami"]`, {
  objectPosition: "82% 45%",
});

/** 写真の下の余白に、猫が歩いていった足跡。スマホの幅では写真が横に来るので出さない */
export const trail = style({
  margin: "2.5rem 0 0 3rem",
  "@media": {
    "(max-width: 860px)": { display: "none" },
  },
});

export const body = style({
  minWidth: 0,
});

export const lead = style({
  margin: "0 0 2rem",
  fontFamily: vars.font.jp,
  fontSize: "1.0625rem",
  maxWidth: "34em",
  textWrap: "pretty",
});

export const sub = style({
  margin: "clamp(2.5rem, 5vw, 3.5rem) 0 1rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
  color: vars.color.ink,
});

/** まとまりの小さな見出し(モックの h3) */
export const groupHeading = style({
  margin: "0 0 0.85rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  fontWeight: 400,
  color: vars.color.muted,
});
