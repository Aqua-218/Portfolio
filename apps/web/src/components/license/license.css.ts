import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const foot = style({
  margin: "0.75rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});
