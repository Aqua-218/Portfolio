import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const curtain = style({
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "grid",
  placeItems: "center",
  background: vars.color.tatami,
  translate: "-101% 0",
  pointerEvents: "none",
});

export const busy = style({
  pointerEvents: "auto",
});

export const label = style({
  fontWeight: 800,
  fontSize: "clamp(2rem, 6vw, 3.5rem)",
  letterSpacing: "-0.04em",
});

export const runner = style({
  position: "fixed",
  top: "calc(50% + 2.75rem)",
  left: "-120px",
  zIndex: 101,
  color: vars.color.pxline,
  lineHeight: 0,
  pointerEvents: "none",
  visibility: "hidden",
});

const fade = keyframes({
  from: { opacity: 0.4 },
  to: { opacity: 0 },
});

/** 走る猫の足跡。つま先を進む向き(右)に向け、少しずつ薄れる */
export const print = style({
  position: "absolute",
  width: "16px",
  height: "16px",
  margin: "-8px 0 0 -8px",
  color: vars.color.ink,
  lineHeight: 0,
  rotate: "90deg",
  animation: `${fade} 1.8s ease-in forwards`,
});
