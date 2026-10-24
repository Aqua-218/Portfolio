import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const wrap = style({
  maxWidth: "80rem",
  marginInline: "auto",
  paddingLeft: `max(${vars.space.gutter}, env(safe-area-inset-left, 0px))`,
  paddingRight: `max(${vars.space.gutter}, env(safe-area-inset-right, 0px))`,
});
