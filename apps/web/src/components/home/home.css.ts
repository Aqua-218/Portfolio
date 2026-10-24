import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const up = keyframes({
  from: { opacity: 0, translate: "0 16px" },
});

const pulse = keyframes({
  "0%": {
    boxShadow: `0 0 0 0 color-mix(in oklch, ${vars.color.mike} 65%, transparent)`,
  },
  "100%": {
    boxShadow: `0 0 0 10px color-mix(in oklch, ${vars.color.mike} 0%, transparent)`,
  },
});

const breathe = keyframes({
  "50%": { scale: "1.035" },
});

export const introRow = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: "1.25rem 2rem",
  paddingBlock: "clamp(1.75rem, 4vw, 2.75rem) clamp(3rem, 7vw, 5rem)",
});

globalStyle(`${introRow} > *`, {
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${up} 0.8s 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards`,
    },
  },
});

export const name = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontWeight: 800,
  fontSize: "1.5rem",
  lineHeight: 1.3,
  letterSpacing: "0.02em",
});

globalStyle(`${name} small`, {
  fontFamily: vars.font.sans,
  fontWeight: 500,
  fontSize: "0.8125rem",
  color: vars.color.muted,
  marginLeft: "0.6rem",
  letterSpacing: 0,
});

export const intro = style({
  margin: "0.5rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "1.0625rem",
  maxWidth: "34em",
  textWrap: "pretty",
});

export const clock = style({
  fontSize: "0.875rem",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animationDelay: "0.75s",
    },
  },
});

export const pip = style({
  display: "inline-block",
  width: "7px",
  height: "7px",
  borderRadius: vars.radius.round,
  background: vars.color.mike,
  marginRight: "0.5rem",
  transform: "translateY(-1px)",
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${pulse} 2.4s ease-out infinite`,
    },
  },
});

export const tz = style({
  color: vars.color.muted,
  marginLeft: "0.35rem",
});

export const gn = style({
  position: "relative",
  marginBottom: "clamp(2.5rem, 6vw, 4rem)",
});

export const goodnight = style({
  position: "relative",
  margin: 0,
  aspectRatio: "21 / 9",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.tatami,
  "@media": {
    "(max-width: 640px)": { aspectRatio: "4 / 3" },
  },
});

export const inView = style({});

globalStyle(`${goodnight} img`, {
  objectPosition: "50% 58%",
});

globalStyle(`${inView} img`, {
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${breathe} 4.8s ease-in-out infinite`,
    },
  },
});
