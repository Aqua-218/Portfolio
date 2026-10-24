import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const lost = style({
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "1rem",
  minHeight: "60vh",
  paddingBlock: "clamp(3rem, 7vw, 5rem)",
  textAlign: "center",
});

export const cat = style({
  marginBottom: "0.5rem",
});

export const code = style({
  margin: 0,
  fontSize: "clamp(4rem, 12vw, 7rem)",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  lineHeight: 1,
});

export const message = style({
  margin: 0,
  maxWidth: "26em",
  fontFamily: vars.font.jp,
  fontSize: "1.0625rem",
  lineHeight: 1.8,
});

export const sentence = style({
  display: "inline-block",
});
