import { style } from "@vanilla-extract/css";
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
