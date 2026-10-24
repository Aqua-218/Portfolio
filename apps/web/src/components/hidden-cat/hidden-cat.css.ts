import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const say = keyframes({
  "0%": { opacity: 0, translate: "-50% 0" },
  "15%": { opacity: 1, translate: "-50% -6px" },
  "80%": { opacity: 1 },
  "100%": { opacity: 0, translate: "-50% -12px" },
});

const popout = keyframes({
  from: { translate: "40px 0", opacity: 0 },
});

const hop = keyframes({
  "40%": { translate: "0 -12px" },
});

export const tail = style({
  position: "absolute",
  left: "100%",
  top: "52%",
  marginLeft: "-8px",
  padding: "4px 0",
  border: 0,
  background: "none",
  cursor: "pointer",
  lineHeight: 0,
  ":focus-visible": {
    outline: `2px solid ${vars.color.mike}`,
    outlineOffset: "2px",
  },
});

export const cat = style({
  position: "absolute",
  right: "10px",
  bottom: 0,
  cursor: "pointer",
  padding: 0,
  border: 0,
  background: "none",
  lineHeight: 0,
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${popout} 0.5s cubic-bezier(0.3, 1.5, 0.5, 1)`,
    },
  },
});

globalStyle(`${cat} .px-svg`, {
  scale: "-1 1",
});

export const hopping = style({});

globalStyle(`${hopping} > span:first-child`, {
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      animation: `${hop} 0.45s cubic-bezier(0.3, 1.5, 0.5, 1)`,
    },
  },
});

export const bubble = style({
  position: "absolute",
  bottom: "100%",
  left: "50%",
  translate: "-50% -6px",
  font: `700 11px/1.4 ${vars.font.jp}`,
  whiteSpace: "nowrap",
  background: vars.color.paper,
  color: vars.color.ink,
  border: `2px solid ${vars.color.pxline}`,
  padding: "1px 6px",
  pointerEvents: "none",
  animation: `${say} 1.1s ease-out forwards`,
});
