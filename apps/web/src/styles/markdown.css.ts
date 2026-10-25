import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/** Markdownのアラート(注意書き)。Stackの見本と同じ見た目 */
globalStyle(".callout", {
  display: "flex",
  gap: "0.8rem",
  alignItems: "flex-start",
  margin: "0 0 1rem",
  padding: "0.85rem 0.95rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
});

globalStyle(".callout-cat", {
  flex: "none",
  marginTop: "0.2rem",
  lineHeight: 0,
  color: vars.color.pxline,
});

globalStyle(".callout b", {
  fontFamily: vars.font.sans,
  fontSize: "0.75rem",
  letterSpacing: "0.04em",
  color: vars.color.mike,
});

globalStyle(".callout p", {
  margin: "0.15rem 0 0",
  fontSize: "0.9375rem",
});
