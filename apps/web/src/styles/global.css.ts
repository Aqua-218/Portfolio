import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("body", {
  margin: 0,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.sans,
  fontSize: "1rem",
  lineHeight: 1.8,
  WebkitFontSmoothing: "antialiased",
});

globalStyle("a", {
  color: "inherit",
});

globalStyle("a:focus-visible", {
  outline: `2px solid ${vars.color.mike}`,
  outlineOffset: "4px",
  borderRadius: vars.radius.sm,
});

globalStyle("img", {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
});
