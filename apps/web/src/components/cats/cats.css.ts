import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const section = style({
  marginTop: "clamp(0.5rem, 2vw, 1.5rem)",
});

export const head = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  flexWrap: "wrap",
  gap: "0.5rem 2rem",
  paddingBlock: "clamp(3rem, 7vw, 5rem) 1.75rem",
});

// モックは見出しの中の小見出しにも当てている
globalStyle(`${head} p`, {
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
});

export const gallery = style({
  columns: "3 220px",
  columnGap: "8px",
  marginBottom: "8px",
});

export const figure = style({
  margin: "0 0 8px",
  breakInside: "avoid",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.tatami,
});

export const open = style({
  display: "block",
  width: "100%",
  padding: 0,
  border: 0,
  background: "none",
  cursor: "zoom-in",
});

globalStyle(`${figure} img`, {
  height: "auto",
  transition: "scale 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)",
});

globalStyle(`${figure}:hover img`, {
  scale: "1.05",
});

export const dialog = style({
  maxWidth: "min(92vw, 1100px)",
  maxHeight: "92vh",
  padding: 0,
  border: 0,
  borderRadius: vars.radius.lg,
  background: vars.color.tatami,
  overflow: "hidden",
  cursor: "zoom-out",
  "::backdrop": {
    background: `color-mix(in oklch, ${vars.color.ink} 80%, transparent)`,
  },
});

globalStyle(`${dialog} img`, {
  display: "block",
  width: "auto",
  height: "auto",
  maxWidth: "min(92vw, 1100px)",
  maxHeight: "92vh",
  objectFit: "contain",
});

export const close = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  padding: 0,
  border: 0,
  background: "none",
  cursor: "zoom-out",
});
