import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// 目盛りの肉球の形
const PAW =
  'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cellipse%20cx%3D%2216%22%20cy%3D%2221.5%22%20rx%3D%227.2%22%20ry%3D%226%22/%3E%3Cellipse%20cx%3D%226.5%22%20cy%3D%2213%22%20rx%3D%222.9%22%20ry%3D%223.6%22%20transform%3D%22rotate%28-18%206.5%2013%29%22/%3E%3Cellipse%20cx%3D%2212.3%22%20cy%3D%227.6%22%20rx%3D%222.9%22%20ry%3D%223.7%22%20transform%3D%22rotate%28-6%2012.3%207.6%29%22/%3E%3Cellipse%20cx%3D%2219.7%22%20cy%3D%227.6%22%20rx%3D%222.9%22%20ry%3D%223.7%22%20transform%3D%22rotate%286%2019.7%207.6%29%22/%3E%3Cellipse%20cx%3D%2225.5%22%20cy%3D%2213%22%20rx%3D%222.9%22%20ry%3D%223.6%22%20transform%3D%22rotate%2818%2025.5%2013%29%22/%3E%3C/svg%3E") center / contain no-repeat';

export const meter = style({
  display: "inline-flex",
  gap: "2px",
});

export const pip = style({
  width: "13px",
  height: "13px",
  background: vars.color.line,
  WebkitMask: PAW,
  mask: PAW,
});

export const on = style({
  background: vars.color.mike,
});

export const mains = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  "@media": {
    "(max-width: 560px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export const main = style({
  position: "relative",
  display: "grid",
  gap: "0.35rem",
  padding: "1.1rem 1.15rem 1rem",
  background: vars.color.ink,
  color: vars.color.paper,
  borderRadius: vars.radius.lg,
  minWidth: 0,
  "@media": {
    "(max-width: 560px)": {
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "end",
    },
  },
});

export const mainCat = style({
  position: "absolute",
  top: "0.9rem",
  right: "0.95rem",
  color: vars.color.paper,
});

export const mainKind = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  opacity: 0.7,
  "@media": {
    "(max-width: 560px)": { gridColumn: "1 / -1" },
  },
});

export const mainName = style({
  fontWeight: 700,
  fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
});

export const mainLevel = style({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginTop: "0.4rem",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  "@media": {
    "(max-width: 560px)": { marginTop: 0 },
  },
});

export const lvList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "1.75rem",
  "@media": {
    "(max-width: 860px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export const lvItem = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  paddingBlock: "0.75rem",
  borderBottom: `1px solid ${vars.color.line}`,
  minWidth: 0,
});

export const lvName = style({
  fontWeight: 700,
  fontFamily: vars.font.sans,
  minWidth: 0,
  overflowWrap: "anywhere",
});

export const lvVal = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  flex: "none",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

globalStyle(`${lvVal} > span:last-child`, {
  width: "6.5em",
  whiteSpace: "nowrap",
});

export const legend = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem 1.25rem",
  margin: "1rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

// モックは凡例の中の span 全部(目盛りも)に間を空けている
globalStyle(`${legend} span`, {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
});

export const rows = style({
  margin: 0,
  borderTop: `2px solid ${vars.color.ink}`,
  selectors: {
    [`${mains} + &`]: { marginTop: "1.5rem" },
  },
});

export const row = style({
  display: "grid",
  gridTemplateColumns: "10rem minmax(0, 1fr)",
  gap: "1rem",
  paddingBlock: "0.9rem",
  borderBottom: `1px solid ${vars.color.line}`,
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: "0.5rem",
    },
  },
});

globalStyle(`${row} dt`, {
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
  paddingTop: "0.3rem",
  "@media": {
    "(max-width: 640px)": { paddingTop: 0 },
  },
});

globalStyle(`${row} dd`, {
  margin: 0,
  minWidth: 0,
});

export const chips = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
});

globalStyle(`${chips} li`, {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
  lineHeight: 1,
  padding: "0.5rem 0.7rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.md,
});

globalStyle(`${chips} li > span`, {
  verticalAlign: 0,
});

export const credit = style({
  margin: "1.5rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
  lineHeight: 1.8,
});

globalStyle(`${credit} a`, {
  color: "inherit",
  textDecorationColor: vars.color.line,
  textUnderlineOffset: "3px",
});
