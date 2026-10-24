import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const pxCat = style({
  display: "inline-block",
  position: "relative",
  lineHeight: 0,
  color: vars.color.pxline,
});

globalStyle(`${pxCat} .px-svg`, {
  display: "block",
});
