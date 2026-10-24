import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const wipe = keyframes({
  from: { clipPath: "inset(100% 0 0 0)" },
  to: { clipPath: "inset(0 0 0 0)" },
});

const settle = keyframes({
  from: { scale: "1.35" },
});

export const mosaic = style({
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gridAutoRows: "clamp(110px, 13.5vw, 200px)",
  gap: "8px",
  margin: 0,
  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gridAutoRows: "42vw",
      gap: "6px",
    },
  },
});

export const tile = style({
  margin: 0,
  overflow: "hidden",
  borderRadius: vars.radius.lg,
  background: vars.color.tatami,
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${wipe} 0.95s cubic-bezier(0.65, 0, 0.2, 1) backwards`,
      animationDelay: "var(--d, 0s)",
    },
  },
});

globalStyle(`${tile} img`, {
  scale: "var(--s, 1.1)",
  translate: "0 var(--py, 0px)",
  transition: "scale 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)",
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${settle} 1.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards`,
      animationDelay: "var(--d, 0s)",
    },
  },
});

globalStyle(`${tile}:hover img`, {
  vars: { "--s": "1.17" },
});

export const a = style({
  gridColumn: "1 / 6",
  gridRow: "span 3",
  vars: { "--d": "0.05s" },
  "@media": {
    "(max-width: 640px)": { gridColumn: "1 / 3", gridRow: "span 2" },
  },
});

export const b = style({
  gridColumn: "6 / 9",
  gridRow: "span 2",
  vars: { "--d": "0.18s" },
  "@media": {
    "(max-width: 640px)": { gridColumn: "auto", gridRow: "span 1" },
  },
});

export const c = style({
  gridColumn: "9 / 13",
  gridRow: "span 2",
  vars: { "--d": "0.31s" },
  "@media": {
    "(max-width: 640px)": { gridColumn: "auto", gridRow: "span 1" },
  },
});

export const d = style({
  gridColumn: "6 / 13",
  gridRow: "span 1",
  vars: { "--d": "0.44s" },
  "@media": {
    "(max-width: 640px)": { gridColumn: "1 / 3", gridRow: "span 1" },
  },
});

globalStyle(`${d} img`, { objectPosition: "75% 45%" });
globalStyle(`${b} img`, { objectPosition: "50% 55%" });
